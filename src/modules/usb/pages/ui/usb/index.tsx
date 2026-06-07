import { observer } from "mobx-react-lite";

import { usbM } from "@/modules/usb/features/model/usbM";
import { UsbConnect } from "@/modules/usb/features/ui/UsbConnect";
import { UsbInfo } from "@/modules/usb/features/ui/UsbInfo";

import s from "./UsbPage.module.scss";

export const UsbPage = observer(() => {
  const { device } = usbM;

  return (
    <div className={s.root}>
      <div className={s.header}>
        <h1 className={s.title}>USB подключение</h1>
        <p className={s.description}>Подключение IQOS DUO через USB</p>
      </div>

      <div className={s.content}>
        <UsbConnect />
        {device && <UsbInfo device={device} />}
      </div>
    </div>
  );
});
