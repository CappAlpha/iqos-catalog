import { observer } from "mobx-react-lite";

import { Button } from "@/shared/ui/Button";

import { bluetoothM } from "../../model/bluetoothM";

import s from "./BluetoothInfo.module.scss";

interface Props {
  device: BluetoothDevice;
}

export const BluetoothInfo = observer(({ device }: Props) => {
  const { name, id } = device;
  const { batteryLevel, services, refreshBattery } = bluetoothM;

  return (
    <div className={s.infoBlock}>
      <section>
        <h3>Информация об устройстве:</h3>
        <p>Имя устройства: {name ?? "Неизвестное устройство"}</p>
        <p>ID устройства: {id}</p>

        {batteryLevel !== null && (
          <div className={s.batteryInfo}>
            <p>
              Заряд батареи: <strong>{batteryLevel}%</strong>
            </p>
            <Button onClick={refreshBattery} className={s.refreshBtn}>
              Обновить заряд
            </Button>
          </div>
        )}
      </section>

      {services.length > 0 && (
        <section>
          <h3>Доступные GATT-сервисы (UUID):</h3>
          <ul>
            {services.map((uuid) => (
              <li key={uuid}>{uuid}</li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
});
