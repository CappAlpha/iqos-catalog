import { observer } from "mobx-react-lite";
import { useState } from "react";

import { Button } from "@/shared/ui/Button";

import { usbM } from "../../model/usbM";

import s from "./UsbConnect.module.scss";

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

  const handleConnect = () => {
    void connect();
    setIsHideError(false);
  };

  const handleDisconnect = () => {
    void disconnect();
    setIsHideError(false);
  };

  const buttonText = isConnecting
    ? "Подключение..."
    : isDisconnecting
      ? "Отключение..."
      : "Подключить устройство";

  const statusText = isConnected
    ? "Устройство подключено"
    : isConnecting
      ? "Поиск и подключение"
      : isDisconnecting
        ? "Отключение"
        : "Устройство не подключено";

  return (
    <section className={s.root}>
      <div className={s.subtitle}>
        <h3>Подключение</h3>
        <div className={s.status} data-status={status}>
          <span className={s.statusDot} />
          {statusText}
        </div>
      </div>
      <div className={s.infoBlock}>
        <div className={s.controls}>
          <Button
            onClick={handleConnect}
            disabled={isDisabled}
            className={s.btnConnect}
          >
            {buttonText}
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
