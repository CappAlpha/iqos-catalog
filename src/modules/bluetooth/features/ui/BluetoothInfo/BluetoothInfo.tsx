import { observer } from "mobx-react-lite";

import { bluetoothM } from "../../model/bluetoothM";

import s from "./BluetoothInfo.module.scss";

const LABELS: Record<string, string> = {
  manufacturerName: "Производитель",
  modelNumber: "Модель",
  serialNumber: "Серийный номер",
  hardwareRevision: "Аппаратная ревизия",
  firmwareRevision: "Прошивка",
  softwareRevision: "ПО",
};

export const BluetoothInfo = observer(() => {
  const { batteryLevel, device, deviceInfo } = bluetoothM;
  if (!device) return null;

  const { id, name } = device;

  return (
    <section className={s.root}>
      <h3 className={s.title}>Информация об устройстве:</h3>
      <div className={s.wrap}>
        <p className={s.row}>
          <b>Имя устройства:</b> {name ?? "Неизвестное устройство"}
        </p>
        <p className={s.row}>
          <b>ID устройства:</b> {id}
        </p>
        {batteryLevel != null && (
          <p className={s.row}>
            <b>Заряд батареи:</b> {batteryLevel}%
          </p>
        )}
        {Object.entries(deviceInfo)
          .filter(([, v]) => v != null)
          .map(([key, value]) => (
            <p key={key} className={s.row}>
              <b>{LABELS[key]}:</b> {value}
            </p>
          ))}
      </div>
    </section>
  );
});
