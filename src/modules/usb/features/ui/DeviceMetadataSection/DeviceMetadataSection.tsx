import { observer } from "mobx-react-lite";

import { usbM } from "../../model/usbM";

import s from "./DeviceMetadataSection.module.scss";

export interface Props {
  device: USBDevice;
}

export const DeviceMetadataSection = observer(({ device }: Props) => {
  const { manufacturerName, productName, vendorId, productId } = device;
  const battery = usbM.batteryLevel;

  return (
    <section className={s.root}>
      <h3 className={s.title}>Информация об устройстве:</h3>
      <div className={s.wrap}>
        <p className={s.manufacturer}>
          <b>Производитель:</b> {manufacturerName ?? "Неизвестно"}
        </p>
        <p className={s.product}>
          <b>Продукт:</b> {productName ?? "Неизвестно"}
        </p>
        <p className={s.vendorId}>
          <b>Vendor ID:</b> {vendorId}
        </p>
        <p className={s.productId}>
          <b>Product ID:</b> {productId}
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
