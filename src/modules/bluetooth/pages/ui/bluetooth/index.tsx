import { BluetoothConnect } from "@/modules/bluetooth/features/ui/BluetoothConnect";
import { BluetoothInfo } from "@/modules/bluetooth/features/ui/BluetoothInfo";

import s from "./BluetoothPage.module.scss";

const BluetoothPage = () => {
  return (
    <main className={s.root}>
      <div className={s.header}>
        <h1 className={s.title}>Bluetooth подключение</h1>
        <p className={s.description}>Подключение IQOS DUO через Bluetooth</p>
      </div>

      <div className={s.content}>
        <BluetoothConnect />
        <BluetoothInfo />
      </div>
    </main>
  );
};

export default BluetoothPage;
