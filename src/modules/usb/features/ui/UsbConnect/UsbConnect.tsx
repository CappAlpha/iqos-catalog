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
    error,
    connect,
    disconnect,
  } = usbM;

  const isPending = isConnecting || isDisconnecting;

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

  return (
    <section className={s.root}>
      <h3 className={s.subtitle}>Подключение</h3>
      <div className={s.infoBlock}>
        <div className={s.controls}>
          <Button
            onClick={handleConnect}
            disabled={isPending}
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
      </div>
    </section>
  );
});
