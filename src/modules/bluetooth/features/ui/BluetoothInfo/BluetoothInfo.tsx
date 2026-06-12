import { observer } from "mobx-react-lite";

import { bluetoothM } from "../../model/bluetoothM";

import s from "./BluetoothInfo.module.scss";

interface Props {
  device: BluetoothDevice;
}

export const BluetoothInfo = observer(({ device }: Props) => {
  const { name, id, gatt } = device;
  const battery = bluetoothM.batteryLevel;

  return (
    <div className={s.infoBlock}>
      <section>
        <h3>Информация об устройстве:</h3>
        <p>Имя устройства: {name ?? "Неизвестное устройство"}</p>

        <p>ID устройства: {id}</p>

        {battery === null ? (
          <p>
            Заряд батареи: информация недоступна (или не поддерживается
            устройством)
          </p>
        ) : (
          <div className={s.batteryInfo}>
            <p>
              Заряд батареи: <strong>{battery}%</strong>
            </p>
            <button
              onClick={() => bluetoothM.refreshBattery()}
              className={s.refreshBtn}
            >
              Обновить заряд
            </button>
          </div>
        )}
      </section>

      {gatt && (
        <section>
          <h3>Доступные GATT-сервисы (UUID):</h3>
          <ul>
            {/* {gatt.map((uuid) => (
              <li key={uuid}>{uuid}</li>
            ))} */}
          </ul>
        </section>
      )}
    </div>
  );
});
