import { observer } from "mobx-react-lite";

import { usbM } from "../../model/usbM";
import { DeviceMetadataSection } from "../DeviceMetadataSection";
import { EndpointsSection } from "../EndpointsSection";
import { InterfacesSection } from "../InterfacesSection";

import s from "./UsbInfo.module.scss";

export const UsbInfo = observer(() => {
  const {
    device,
    batteryAvailable,
    batteryLevel,
    isRefreshingBattery,
    refreshBattery,
  } = usbM;
  if (!device) return null;

  const interfaces = device.configuration?.interfaces ?? [];
  return (
    <div className={s.root}>
      <DeviceMetadataSection
        device={device}
        batteryAvailable={batteryAvailable}
        batteryLevel={batteryLevel}
        isRefreshingBattery={isRefreshingBattery}
        onRefreshBattery={() => void refreshBattery()}
      />
      <InterfacesSection interfaces={interfaces} />
      <EndpointsSection interfaces={interfaces} />
    </div>
  );
});
