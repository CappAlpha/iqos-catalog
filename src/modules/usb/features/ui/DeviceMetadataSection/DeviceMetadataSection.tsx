import { observer } from "mobx-react-lite";

import { usbM } from "../../model/usbM";

import s from "./DeviceMetadataSection.module.scss";

export interface Props {
  device: USBDevice;
}

export const DeviceMetadataSection = observer(({ device }: Props) => {
  const battery = usbM.batteryLevel;

  return (
    <section className={s.root}>
      <h3 className={s.title}>Информация об устройстве:</h3>
      <div className={s.wrap}>
        <p className={s.manufacturer}>
          <b>Производитель:</b> {device.manufacturerName ?? "Неизвестно"}
        </p>
        <p className={s.product}>
          <b>Продукт:</b> {device.productName ?? "Неизвестно"}
        </p>
        <p className={s.vendorId}>
          <b>Vendor ID:</b> {device.vendorId}
        </p>
        <p className={s.productId}>
          <b>Product ID:</b> {device.productId}
        </p>
        {battery && (
          <p className={s.battery}>
            <b>Заряд батареи:</b> {battery}%
          </p>
        )}
      </div>
    </section>
  );
});
