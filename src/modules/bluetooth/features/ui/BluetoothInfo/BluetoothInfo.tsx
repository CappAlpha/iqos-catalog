import { observer } from "mobx-react-lite";

import { bluetoothM } from "../../model/bluetoothM";

import s from "./BluetoothInfo.module.scss";

export const BluetoothInfo = observer(() => {
  const { batteryLevel, device } = bluetoothM;
  if (!device) return null;

  const { id, name } = device;
  return (
    <div className={s.root}>
      <section className={s.section}>
        <h3 className={s.title}>Информация об устройстве:</h3>
        <div className={s.wrap}>
          <p className={s.name}>
            <b>Имя устройства:</b> {name ?? "Неизвестное устройство"}
          </p>
          <p className={s.id}>
            <b>ID устройства:</b> {id}
          </p>
          {batteryLevel !== null && (
            <p className={s.battery}>
              <b>Заряд батареи:</b> <strong>{batteryLevel}%</strong>
            </p>
          )}
        </div>
      </section>
    </div>
  );
});
