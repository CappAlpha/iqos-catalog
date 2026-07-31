import { logsM } from "@/modules/logs/features/model/logsM";
import { getErrorMessage } from "@/shared/lib/getErrorMessage";

import type {
  IBluetoothConnectionResult,
  IBluetoothDeviceConfig,
  IBluetoothStrategy,
} from "../model/types";

/**
 * Общий скелет для BLE-стратегий (native / web).
 *
 * Берёт на себя:
 *  - хранение и обнуление колбэка отключения;
 *  - гарантированный вызов onDisconnect через finally (раньше терялся при ошибке в cleanup);
 *  - try/catch вокруг физического разрыва GATT (ошибки логируются, но не валят поток);
 *  - единый префикс логов.
 *
 * Конкретная стратегия реализует только doConnect / doDisconnect / getBatteryLevel
 * и доступ к "системному" событию разрыва через notifyDisconnected().
 */
export abstract class BaseBluetoothStrategy implements IBluetoothStrategy {
  protected abstract readonly logPrefix: string;

  private onDisconnectCallback: (() => void) | null = null;

  /**
   * Вызывается стратегией, когда GATT-соединение разорвано самой системой/плагином
   * (устройство вышло из зоны действия, выключилось, платформа порвала канал).
   *
   * Контракт: колбэк onDisconnect вызывается ТОЛЬКО здесь, при системном разрыве.
   * Ручной disconnect() НЕ дёргает колбэк — стор сам сбрасывает состояние в disconnect().
   *
   * Колбэк захватываем в локальную переменную ДО runCleanup(), потому что runCleanup()
   * обнуляет this.onDisconnectCallback — иначе вызов ниже получит null.
   */
  protected notifyDisconnected(): void {
    const cb = this.onDisconnectCallback;
    void this.runCleanup().finally(() => cb?.());
  }

  /** Физический разрыв соединения. Реализация не должна выбрасывать — ошибки логируются здесь. */
  protected abstract doDisconnect(): void | Promise<void>;

  /** Регистрирует колбэк и запускает подключение. */
  protected async withDisconnectCallback<T>(
    onDisconnect: () => void,
    action: () => Promise<T>,
  ): Promise<T> {
    this.onDisconnectCallback = onDisconnect;
    try {
      return await action();
    } catch (err) {
      await this.runCleanup();
      throw err;
    }
  }

  /** Единая безопасная очистка: снимает колбэк и физически рвёт GATT в try/catch. */
  private async runCleanup(): Promise<void> {
    const cb = this.onDisconnectCallback;
    this.onDisconnectCallback = null;
    if (cb === null) return;

    this.beforeDisconnect?.();

    try {
      await this.doDisconnect();
    } catch (err: unknown) {
      logsM.warn(
        `${this.logPrefix} Ошибка при разрыве GATT-соединения: ${getErrorMessage(err, "неизвестная")}`,
      );
    }
  }

  /** Хук для стратегии: снять слушатели/обнулить ссылки ПЕРЕД физическим disconnect. */
  protected beforeDisconnect?(): void;

  abstract connect(
    config: IBluetoothDeviceConfig,
    onDisconnect: () => void,
    signal?: AbortSignal,
  ): Promise<IBluetoothConnectionResult>;

  disconnect(): Promise<void> {
    logsM.info(`${this.logPrefix} Ручной disconnect.`);
    return this.runCleanup();
  }

  abstract getBatteryLevel(): Promise<number | null>;
}
