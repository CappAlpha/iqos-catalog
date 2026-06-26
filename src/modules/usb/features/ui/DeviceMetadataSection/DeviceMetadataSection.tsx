import { observer } from "mobx-react-lite";

import type { IUsbDeviceInfo } from "../../model/types";
import { usbM } from "../../model/usbM";

import s from "./DeviceMetadataSection.module.scss";

type AllowedDeviceKeys = Extract<
  keyof IUsbDeviceInfo,
  "manufacturerName" | "productName" | "vendorId" | "productId"
>;

interface IMetadataField {
  key: AllowedDeviceKeys;
  label: string;
}

const METADATA_FIELDS: IMetadataField[] = [
  { key: "manufacturerName", label: "Производитель" },
  { key: "productName", label: "Продукт" },
  { key: "vendorId", label: "Vendor ID" },
  { key: "productId", label: "Product ID" },
];

interface Props {
  device: IUsbDeviceInfo;
}

export const DeviceMetadataSection = observer(({ device }: Props) => {
  const { batteryLevel } = usbM;

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

        {batteryLevel !== null && (
          <p className={s.row}>
            <b>Заряд батареи:</b> {batteryLevel}%
          </p>
        )}
      </div>
    </section>
  );
});
