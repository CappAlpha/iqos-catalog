import { observer } from "mobx-react-lite";

import { Button } from "@/shared/ui/Button";

import { bluetoothM } from "../../model/bluetoothM";
import type { IBluetoothDeviceInfo } from "../../model/types";

import s from "./BluetoothInfo.module.scss";

interface IDeviceInfoField {
  key: keyof IBluetoothDeviceInfo;
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
  const { batteryLevel, device, deviceInfo, isRefreshingBattery } = bluetoothM;
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

        <div className={s.batteryRow}>
          {batteryLevel != null && (
            <p className={s.row} aria-live="polite">
              <b>Заряд батареи:</b> {batteryLevel}%
            </p>
          )}
          <Button
            color="outline"
            onClick={() => void bluetoothM.refreshBattery()}
            loading={isRefreshingBattery}
            aria-label={
              batteryLevel != null
                ? "Обновить заряд батареи"
                : "Проверить заряд батареи"
            }
          >
            {batteryLevel != null ? "Обновить" : "Проверить заряд"}
          </Button>
        </div>

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
