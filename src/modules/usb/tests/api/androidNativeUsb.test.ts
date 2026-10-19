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
    removeDetachListener.mockResolvedValue(undefined);
    usbSerial.close.mockReset();
    usbSerial.close.mockResolvedValue(undefined);
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
    expect(result.batteryAvailable).toBe(false);
    expect(result.batteryLevel).toBeNull();
    expect(usbSerial.requestPermission).toHaveBeenCalledWith({
      deviceId: "device-id",
    });
    expect(usbSerial.open).toHaveBeenCalledWith({ deviceId: "device-id" });

    await strategy.disconnect();
    expect(removeDetachListener).toHaveBeenCalledTimes(1);
  });

  it("cleans up when permission is denied", async () => {
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
    usbSerial.requestPermission.mockResolvedValueOnce({ granted: false });
    const strategy = new AndroidNativeUsb();

    await expect(
      strategy.connect({ vendorId: 10073, productId: 3 }, vi.fn()),
    ).rejects.toThrow("Доступ к USB-устройству отклонён.");

    expect(usbSerial.open).not.toHaveBeenCalled();
    expect(usbSerial.close).not.toHaveBeenCalled();
  });

  it("forwards a system detach event after cleanup", async () => {
    let resolveRemoveListener: (() => void) | undefined;
    let resolveClose: (() => void) | undefined;
    removeDetachListener.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          resolveRemoveListener = resolve;
        }),
    );
    usbSerial.close.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          resolveClose = resolve;
        }),
    );
    usbSerial.listDevices.mockResolvedValueOnce({
      devices: [
        {
          deviceId: "device-id",
          vendorId: 10073,
          productId: 3,
          hasPermission: true,
        },
      ],
    });
    usbSerial.open.mockResolvedValueOnce({ portId: "port-id" });
    const strategy = new AndroidNativeUsb();
    const onDisconnect = vi.fn();

    await strategy.connect({ vendorId: 10073, productId: 3 }, onDisconnect);
    expect(usbSerial.addListener).toHaveBeenCalledWith(
      "detached",
      expect.any(Function),
    );
    const detachedHandler = usbSerial.addListener.mock.calls[0]?.[1] as
      ((event: { deviceId: string }) => void) | undefined;
    expect(detachedHandler).toBeTypeOf("function");

    detachedHandler?.({ deviceId: "device-id" });
    expect(removeDetachListener).toHaveBeenCalledTimes(1);
    expect(usbSerial.close).not.toHaveBeenCalled();
    expect(onDisconnect).not.toHaveBeenCalled();

    resolveRemoveListener?.();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(usbSerial.close).toHaveBeenCalledWith({ portId: "port-id" });
    expect(onDisconnect).not.toHaveBeenCalled();

    resolveClose?.();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(onDisconnect).toHaveBeenCalledTimes(1);
  });

  it("ignores detach events for other devices", async () => {
    usbSerial.listDevices.mockResolvedValueOnce({
      devices: [
        {
          deviceId: "device-id",
          vendorId: 10073,
          productId: 3,
          hasPermission: true,
        },
      ],
    });
    usbSerial.open.mockResolvedValueOnce({ portId: "port-id" });
    const strategy = new AndroidNativeUsb();
    const onDisconnect = vi.fn();

    await strategy.connect({ vendorId: 10073, productId: 3 }, onDisconnect);
    expect(usbSerial.addListener).toHaveBeenCalledWith(
      "detached",
      expect.any(Function),
    );
    const detachedHandler = usbSerial.addListener.mock.calls[0]?.[1] as
      ((event: { deviceId: string }) => void) | undefined;
    expect(detachedHandler).toBeTypeOf("function");

    detachedHandler?.({ deviceId: "another-device" });
    await Promise.resolve();
    expect(onDisconnect).not.toHaveBeenCalled();
    expect(removeDetachListener).not.toHaveBeenCalled();
    expect(usbSerial.close).not.toHaveBeenCalled();
  });
});
