import { observer } from "mobx-react-lite";

import { bluetoothM } from "../../model/bluetoothM";
import type { IBluetoothDeviceInfo } from "../../model/types";

import s from "./BluetoothInfo.module.scss";

type AllowedDeviceKeys = Extract<
  keyof IBluetoothDeviceInfo,
  | "manufacturerName"
  | "modelNumber"
  | "serialNumber"
  | "hardwareRevision"
  | "firmwareRevision"
  | "softwareRevision"
>;

interface IDeviceInfoField {
  key: AllowedDeviceKeys;
  label: string;
}

const DEVICE_INFO_FIELDS: IDeviceInfoField[] = [
  { key: "manufacturerName", label: "Имя производителя" },
  { key: "modelNumber", label: "Номер модели" },
  { key: "serialNumber", label: "Серийный номер" },
  { key: "hardwareRevision", label: "Версия оборудования" },
  { key: "firmwareRevision", label: "Версия прошивки" },
  { key: "softwareRevision", label: "Версия ПО" },
];

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

        {DEVICE_INFO_FIELDS.map(({ key, label }) => {
          const value = deviceInfo[key];
          if (value == null) return null;

          return (
            <p key={key} className={s.row}>
              <b>{label}:</b> {String(value)}
            </p>
          );
        })}
      </div>
    </section>
  );
});
