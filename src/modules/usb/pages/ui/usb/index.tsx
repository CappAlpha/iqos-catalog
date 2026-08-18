import { Navigate } from "react-router";

import { UsbConnect } from "@/modules/usb/features/ui/UsbConnect";
import { UsbInfo } from "@/modules/usb/features/ui/UsbInfo";
import { IS_IOS } from "@/shared/config/platform";

import s from "./UsbPage.module.scss";

const UsbPage = () => {
  if (IS_IOS) {
    return <Navigate to="/bluetooth" replace />;
  }

  return (
    <main className={s.root}>
      <div className={s.header}>
        <h1 className={s.title}>USB подключение</h1>
        <p className={s.description}>Подключение IQOS DUO через USB</p>
      </div>

      <div className={s.content}>
        <UsbConnect />
        <UsbInfo />
      </div>
    </main>
  );
};

export default UsbPage;
