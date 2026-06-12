import { observer } from "mobx-react-lite";

import { BluetoothConnect } from "@/modules/bluetooth/features/ui/BluetoothConnect";

import s from "./BluetoothPage.module.scss";

export const BluetoothPage = observer(() => {
  // const { device } = bluetoothM;

  return (
    <div className={s.root}>
      <div className={s.header}>
        <h1 className={s.title}>Bluetooth подключение</h1>
        <p className={s.description}>Универсальное подключение по Bluetooth</p>
      </div>

      <div className={s.content}>
        <BluetoothConnect />
        {/* {device && <BluetoothInfo device={device} />} */}
      </div>
    </div>
  );
});
