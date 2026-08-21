import { observer } from "mobx-react-lite";
import { useState } from "react";

import { Button } from "@/shared/ui/Button";

import type { IUsbDeviceInfo } from "../../model/types";
import { usbM } from "../../model/usbM";

import s from "./DeviceMetadataSection.module.scss";

type TAllowedDeviceKeys = Extract<
  keyof IUsbDeviceInfo,
  "manufacturerName" | "productName" | "vendorId" | "productId"
>;

interface IMetadataField {
  key: TAllowedDeviceKeys;
  label: string;
}

const METADATA_FIELDS: IMetadataField[] = [
  { key: "manufacturerName", label: "Имя производителя" },
  { key: "productName", label: "Имя продукта" },
  { key: "vendorId", label: "Vendor ID" },
  { key: "productId", label: "Product ID" },
];

interface IProps {
  device: IUsbDeviceInfo;
}

export const DeviceMetadataSection = observer(({ device }: IProps) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { batteryAvailable, batteryLevel } = usbM;

  const refreshBattery = async () => {
    setIsRefreshing(true);
    try {
      await usbM.refreshBattery();
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <section className={s.root}>
      <h3 className={s.title}>Информация об устройстве:</h3>
      <div className={s.wrap}>
        {METADATA_FIELDS.map(({ key, label }) => {
          const value = device[key];
          if (value == null) return null;

          return (
            <p key={key} className={s.row}>
              <b>{label}:</b> {String(value)}
            </p>
          );
        })}

        <div className={s.batteryRow}>
          <p className={s.row}>
            <b>Заряд батареи:</b>{" "}
            {batteryLevel !== null ? `${batteryLevel}%` : "Недоступен"}
          </p>
          {batteryAvailable && (
            <Button
              color="outline"
              onClick={refreshBattery}
              loading={isRefreshing}
              aria-label="Обновить заряд батареи"
            >
              Обновить
            </Button>
          )}
        </div>
      </div>
    </section>
  );
});
