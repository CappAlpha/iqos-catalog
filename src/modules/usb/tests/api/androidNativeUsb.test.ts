import { beforeEach, describe, expect, it, vi } from "vitest";

import { AndroidNativeUsb } from "../../features/api/androidNativeUsb";

const { usbSerial } = vi.hoisted(() => ({
  usbSerial: {
    listDevices: vi.fn(),
    requestPermission: vi.fn(),
    open: vi.fn(),
    close: vi.fn(),
    addListener: vi.fn(),
  },
}));

vi.mock("@leeskies/capacitor-usb-serial", () => ({
  UsbSerial: usbSerial,
}));

describe("AndroidNativeUsb", () => {
  const removeDetachListener = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    removeDetachListener.mockReset();
    usbSerial.addListener.mockResolvedValue({
      remove: removeDetachListener,
    });
  });

  it("fails with a clear error when the configured device is absent", async () => {
    usbSerial.listDevices.mockResolvedValueOnce({ devices: [] });
    const strategy = new AndroidNativeUsb();

    await expect(
      strategy.connect({ vendorId: 10073, productId: 3 }, vi.fn()),
    ).rejects.toThrow("USB-устройство не найдено.");
  });

  it("requests permission and opens the matching device", async () => {
    usbSerial.listDevices.mockResolvedValueOnce({
      devices: [
        {
          deviceId: "device-id",
          vendorId: 10073,
          productId: 3,
          hasPermission: false,
          deviceName: "IQOS",
        },
      ],
    });
    usbSerial.requestPermission.mockResolvedValueOnce({ granted: true });
    usbSerial.open.mockResolvedValueOnce({ portId: "port-id" });
    const strategy = new AndroidNativeUsb();

    const result = await strategy.connect(
      { vendorId: 10073, productId: 3 },
      vi.fn(),
    );

    expect(result.device.productName).toBe("IQOS");
    expect(usbSerial.requestPermission).toHaveBeenCalledWith({
      deviceId: "device-id",
    });
    expect(usbSerial.open).toHaveBeenCalledWith({ deviceId: "device-id" });

    await strategy.disconnect();
    expect(removeDetachListener).toHaveBeenCalledTimes(1);
  });
});
