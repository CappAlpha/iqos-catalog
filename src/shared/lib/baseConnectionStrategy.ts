import type { IAppLogger } from "@/modules/logs/features/model/types";

import { getErrorMessage } from "./getErrorMessage";

/**
 * Общая реализация lifecycle для стратегий подключения к физическому устройству.
 *
 * Класс не знает деталей BLE или USB: конкретная стратегия предоставляет типы
 * конфигурации/результата и реализацию физического отключения.
 */
export abstract class BaseConnectionStrategy<TConfig, TResult> {
  protected abstract readonly logPrefix: string;
  protected abstract readonly disconnectErrorMessage: string;
  protected abstract readonly manualDisconnectMessage: string;

  private onDisconnectCallback: (() => void) | null = null;
  private isConnectionActive = false;
  private readonly logger: IAppLogger;

  /**
   * Создаёт lifecycle-объект с переданным logger.
   *
   * @param logger logger транспорта, используемый для ошибок cleanup;
   */
  protected constructor(logger: IAppLogger) {
    this.logger = logger;
  }

  /**
   * Уведомляет владельца стратегии о системном отключении устройства.
   *
   * Callback вызывается после завершения cleanup, чтобы store не начал новую
   * операцию до снятия слушателей и закрытия физического соединения.
   */
  protected notifyDisconnected(): void {
    const callback = this.onDisconnectCallback;
    void this.runCleanup().finally(() => callback?.());
  }

  /**
   * Выполняет физическое отключение устройства.
   *
   * Реализация может быть синхронной или асинхронной. Ошибки перехватываются
   * базовым классом и записываются в logger, поэтому наружу они не выбрасываются.
   */
  protected abstract doDisconnect(): void | Promise<void>;

  /**
   * Выполняет модульную очистку перед физическим отключением.
   *
   * Используется для снятия event listeners и обнуления platform-specific ссылок.
   */
  protected beforeDisconnect?(): void | Promise<void>;

  /**
   * Регистрирует callback отключения и выполняет операцию подключения.
   *
   * При любой ошибке операции cleanup выполняется до повторного выброса исходной
   * ошибки, чтобы не оставлять открытый порт или GATT-соединение.
   *
   * @param onDisconnect callback системного отключения устройства;
   * @param action platform-specific операция подключения;
   * @returns результат операции подключения;
   */
  protected async withDisconnectCallback<TActionResult>(
    onDisconnect: () => void,
    action: () => Promise<TActionResult>,
  ): Promise<TActionResult> {
    this.onDisconnectCallback = onDisconnect;
    this.isConnectionActive = true;

    try {
      return await action();
    } catch (error) {
      await this.runCleanup();
      throw error;
    }
  }

  /** Возвращает `true`, пока текущая попытка не была отменена или очищена. */
  protected isOperationActive(): boolean {
    return this.isConnectionActive;
  }

  /** Принудительно очищает transport state после позднего результата операции. */
  protected cleanupTransport(): Promise<void> {
    return this.runCleanup(true);
  }

  /**
   * Снимает callback, выполняет модульную очистку и закрывает физическое соединение.
   *
   * Повторный вызов безопасен: после первой очистки callback уже обнулён.
   */
  private async runCleanup(force = false): Promise<void> {
    const callback = this.onDisconnectCallback;
    this.onDisconnectCallback = null;
    this.isConnectionActive = false;
    if (callback === null && !force) return;

    try {
      await this.beforeDisconnect?.();
      await this.doDisconnect();
    } catch (error: unknown) {
      this.logger.warn(
        `${this.logPrefix} ${this.disconnectErrorMessage}: ${getErrorMessage(error, "неизвестная")}`,
      );
    }
  }

  /**
   * Выполняет ручное отключение и дожидается завершения cleanup.
   *
   * Ручное отключение не вызывает callback системного отключения.
   *
   * @returns Promise, завершающийся после физического отключения;
   */
  disconnect(): Promise<void> {
    this.logger.info(`${this.logPrefix} ${this.manualDisconnectMessage}`);
    return this.runCleanup();
  }

  /**
   * Подключает устройство через конкретную platform-specific стратегию.
   *
   * @param config конфигурация подключения;
   * @param onDisconnect callback системного отключения;
   * @returns данные подключённого устройства;
   */
  abstract connect(config: TConfig, onDisconnect: () => void): Promise<TResult>;

  /**
   * Читает текущий уровень батареи подключённого устройства.
   *
   * @returns уровень батареи в процентах или `null`, если значение недоступно;
   */
  abstract getBatteryLevel(): Promise<number | null>;
}
