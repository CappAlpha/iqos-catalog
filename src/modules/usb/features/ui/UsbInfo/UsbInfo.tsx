import { DeviceMetadataSection } from "../DeviceMetadataSection";
import { EndpointsSection } from "../EndpointSection";
import { InterfacesSection } from "../InterfaceSection";

import s from "./UsbInfo.module.scss";

export interface Props {
  device: USBDevice;
}

export const UsbInfo = ({ device }: Props) => {
  const interfaces = device.configuration?.interfaces ?? [];
  return (
    <div className={s.root}>
      <DeviceMetadataSection device={device} />
      <InterfacesSection interfaces={interfaces} />
      <EndpointsSection interfaces={interfaces} />
    </div>
  );
};
