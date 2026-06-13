import { useEffect } from "react";
import { useNavigate } from "react-router";

import { UsbConnect } from "@/modules/usb/features/ui/UsbConnect";
import { UsbInfo } from "@/modules/usb/features/ui/UsbInfo";
import { isIOS } from "@/shared/lib/isIOS";

import s from "./UsbPage.module.scss";

export const UsbPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    if (isIOS()) {
      void navigate("/bluetooth", { replace: true });
    }
  }, [navigate]);

  if (isIOS()) return null;

  return (
    <div className={s.root}>
      <div className={s.header}>
        <h1 className={s.title}>USB подключение</h1>
        <p className={s.description}>Подключение IQOS DUO через USB</p>
      </div>

      <div className={s.content}>
        <UsbConnect />
        <UsbInfo />
      </div>
    </div>
  );
};
