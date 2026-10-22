export type TDeviceUnavailableReason =
  | "native-platform-unsupported"
  | "native-plugin-unavailable"
  | "web-api-unavailable";

export type TDeviceSupport =
  | {
      readonly transport: "native" | "web";
      readonly unavailableReason: null;
    }
  | {
      readonly transport: null;
      readonly unavailableReason: TDeviceUnavailableReason;
    };
