import { observer } from "mobx-react-lite";
import { useState } from "react";

import { Button } from "@/shared/ui/Button";

import type { TUsbStatus } from "../../model/types";
import { usbM } from "../../model/usbM";

import s from "./UsbConnect.module.scss";

const BUTTON_TEXT: Record<TUsbStatus, string> = {
  disconnected: "Подключить устройство",
  connecting: "Подключение...",
  connected: "Подключить устройство",
  disconnecting: "Отключение...",
};

const STATUS_TEXT: Record<TUsbStatus, string> = {
  disconnected: "Устройство не подключено",
  connecting: "Поиск и подключение",
  connected: "Устройство подключено",
  disconnecting: "Отключение",
};

export const UsbConnect = observer(() => {
  const [isHideError, setIsHideError] = useState(false);
  const {
    isConnected,
    isConnecting,
    isDisconnecting,
    isSupported,
    error,
    status,
    connect,
    disconnect,
  } = usbM;

  const isDisabled = isConnecting || isDisconnecting || !isSupported;

  return (
    <section className={s.root}>
      <div className={s.subtitle}>
        <h3>Подключение</h3>
        <div className={s.status} data-status={status}>
          <span className={s.statusDot} />
          {STATUS_TEXT[status]}
        </div>
      </div>
      <div className={s.infoBlock}>
        <div className={s.controls}>
          <Button
            onClick={() => {
              void connect();
              setIsHideError(false);
            }}
            disabled={isDisabled}
            className={s.btnConnect}
          >
            {BUTTON_TEXT[status]}
          </Button>
          {isConnected && (
            <Button
              onClick={() => {
                void disconnect();
                setIsHideError(false);
              }}
              disabled={isDisconnecting}
              className={s.btnDisconnect}
              color="error"
            >
              Отключить
            </Button>
          )}
        </div>
        {error && !isHideError && (
          <div className={s.errorWrap}>
            <div className={s.error}>
              <p>Ошибка: {error}</p>
            </div>
            <Button
              className={s.closeIconBtn}
              onClick={() => setIsHideError(true)}
              color="transparent"
            >
              &#10006;
            </Button>
          </div>
        )}
        {!isSupported && (
          <div className={s.errorWrap}>
            <p>USB недоступен на этой платформе или в текущей среде.</p>
          </div>
        )}
      </div>
    </section>
  );
});
