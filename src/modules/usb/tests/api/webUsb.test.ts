import { beforeEach, describe, expect, it, vi } from "vitest";

import { WebUsb } from "../../features/api/webUsb";

describe("WebUsb", () => {
  const close = vi.fn(() => Promise.resolve());
  const open = vi.fn(() => Promise.resolve());
  const selectConfiguration = vi.fn(() => Promise.resolve());
  const claimInterface = vi.fn(() => Promise.resolve());
  const controlTransferIn = vi.fn(() =>
    Promise.resolve({
      status: "ok",
      data: new DataView(Uint8Array.from([81]).buffer),
    }),
  );
  const addEventListener = vi.fn();
  const removeEventListener = vi.fn();
  const device = {
    manufacturerName: "Manufacturer",
    productName: "USB device",
    vendorId: 10073,
    productId: 3,
    configuration: null,
    open,
    close,
    selectConfiguration,
    claimInterface,
    controlTransferIn,
  } as unknown as USBDevice;
  const requestDevice = vi.fn(() => Promise.resolve(device));

  beforeEach(() => {
    vi.clearAllMocks();

    Object.defineProperty(globalThis, "navigator", {
      configurable: true,
      value: {
        usb: {
          requestDevice,
          addEventListener,
          removeEventListener,
        },
      },
    });
  });

  it("selects, configures and reads the battery", async () => {
    const strategy = new WebUsb();

    const result = await strategy.connect(
      { vendorId: 10073, productId: 3 },
      vi.fn(),
    );

    expect(result.device.productName).toBe("USB device");
    expect(result.batteryAvailable).toBe(true);
    expect(result.batteryLevel).toBe(81);
    expect(open).toHaveBeenCalledTimes(1);
    expect(selectConfiguration).toHaveBeenCalledWith(1);
    expect(claimInterface).toHaveBeenCalledWith(0);
    expect(requestDevice).toHaveBeenCalledWith({ filters: [] });
  });

  it("keeps the connection when the battery interface is unavailable", async () => {
    claimInterface.mockRejectedValueOnce(new Error("Interface is busy"));
    const strategy = new WebUsb();

    const result = await strategy.connect(
      { vendorId: 10073, productId: 3 },
      vi.fn(),
    );

    expect(result.batteryAvailable).toBe(false);
    expect(result.batteryLevel).toBeNull();
    expect(open).toHaveBeenCalledTimes(1);
    expect(close).not.toHaveBeenCalled();
  });

  it("marks the battery unavailable when its transfer fails", async () => {
    controlTransferIn.mockRejectedValueOnce(new Error("Transfer failed"));
    const strategy = new WebUsb();

    const result = await strategy.connect(
      { vendorId: 10073, productId: 3 },
      vi.fn(),
    );

    expect(result.batteryAvailable).toBe(false);
    expect(result.batteryLevel).toBeNull();
  });

  it("keeps the connection when the battery response is empty", async () => {
    controlTransferIn.mockResolvedValueOnce({
      status: "ok",
      data: new DataView(new ArrayBuffer(0)),
    });
    const strategy = new WebUsb();

    const result = await strategy.connect(
      { vendorId: 10073, productId: 3 },
      vi.fn(),
    );

    expect(result.device.productName).toBe("USB device");
    expect(result.batteryAvailable).toBe(false);
    expect(result.batteryLevel).toBeNull();
    expect(close).not.toHaveBeenCalled();
  });

  it("closes the device when configuration fails", async () => {
    selectConfiguration.mockRejectedValueOnce(
      new Error("Configuration failed"),
    );
    const strategy = new WebUsb();

    await expect(
      strategy.connect({ vendorId: 10073, productId: 3 }, vi.fn()),
    ).rejects.toThrow("Configuration failed");

    expect(close).toHaveBeenCalled();
    expect(addEventListener).not.toHaveBeenCalled();
  });

  it("removes listeners and closes the device", async () => {
    const strategy = new WebUsb();

    await strategy.connect({ vendorId: 10073, productId: 3 }, vi.fn());
    await strategy.disconnect();

    expect(removeEventListener).toHaveBeenCalledWith(
      "disconnect",
      expect.any(Function),
    );
    expect(close).toHaveBeenCalledTimes(1);
  });
});
