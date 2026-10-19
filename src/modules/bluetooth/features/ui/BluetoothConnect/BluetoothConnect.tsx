import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";

import { Button } from "@/shared/ui/Button";

import { bluetoothM } from "../../model/bluetoothM";
import type { TBluetoothStatus } from "../../model/types";

import s from "./BluetoothConnect.module.scss";

const BUTTON_TEXT: Record<TBluetoothStatus, string> = {
  disconnected: "Подключить устройство",
  connecting: "Подключение...",
  connected: "Подключить устройство",
  disconnecting: "Отключение...",
};

const STATUS_TEXT: Record<TBluetoothStatus, string> = {
  disconnected: "Устройство не подключено",
  connecting: "Поиск и подключение",
  connected: "Устройство подключено",
  disconnecting: "Отключение",
};

export const BluetoothConnect = observer(() => {
  const [dismissedError, setDismissedError] = useState<string | null>(null);
  const {
    isConnected,
    isConnecting,
    isDisconnecting,
    isSupported,
    error,
    status,
    disconnect,
    connect,
    cancelIfConnecting,
  } = bluetoothM;

  const isDisabled = isConnecting || isDisconnecting || !isSupported;

  const handleConnect = () => {
    setDismissedError(null);
    void connect();
  };

  const handleDisconnect = () => {
    setDismissedError(null);
    void disconnect();
  };

  useEffect(() => {
    return () => {
      cancelIfConnecting();
    };
  }, [cancelIfConnecting]);

  return (
    <section className={s.root}>
      <div className={s.subtitle}>
        <h3>Подключение</h3>
        <div className={s.status} data-status={status}>
          <span className={s.statusDot} />
          {STATUS_TEXT[status]}
        </div>
      </div>
      <div className={s.controls}>
        <Button
          onClick={handleConnect}
          disabled={isDisabled}
          className={s.btnConnect}
        >
          {BUTTON_TEXT[status]}
        </Button>
        {isConnected && (
          <Button
            onClick={handleDisconnect}
            disabled={isDisconnecting}
            className={s.btnDisconnect}
            color="error"
          >
            Отключить
          </Button>
        )}
      </div>
      {error && error !== dismissedError && (
        <div className={s.errorWrap}>
          <div className={s.error}>
            <p>Ошибка: {error}</p>
          </div>
          <Button
            className={s.closeIconBtn}
            onClick={() => setDismissedError(error)}
            color="transparent"
          >
            &#10006;
          </Button>
        </div>
      )}
      {!isSupported && (
        <div className={s.errorWrap}>
          <p>Bluetooth недоступен на этой платформе или в текущей среде.</p>
        </div>
      )}
    </section>
  );
});
