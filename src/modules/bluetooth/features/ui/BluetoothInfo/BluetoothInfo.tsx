import { observer } from "mobx-react-lite";

import { bluetoothM } from "../../model/bluetoothM";

import s from "./BluetoothInfo.module.scss";

export const BluetoothInfo = observer(() => {
  const { batteryLevel, services, device } = bluetoothM;
  if (!device) return null;

  const { name, id } = device;
  return (
    <div className={s.root}>
      <section>
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

      {services.length > 0 && (
        <section>
          <h3 className={s.title}>Доступные GATT-сервисы (UUID):</h3>
          <ul className={s.list}>
            {services.map((uuid) => (
              <li key={uuid}>{uuid}</li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
});
