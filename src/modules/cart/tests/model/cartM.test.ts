import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type {
  TCatalogResult,
  TProduct,
} from "@/modules/catalog/features/model/types";

import {
  CART_STORAGE_KEY,
  ORDERS_STORAGE_KEY,
} from "../../features/model/constants";
import type { TCartItem, TOrder } from "../../features/model/types";

const mocks = vi.hoisted(() => ({
  get: vi.fn<(key: string) => Promise<{ value: string | null }>>(),
  set: vi.fn<(key: string, value: string) => Promise<void>>(),
  fetchCatalog: vi.fn<() => Promise<TCatalogResult>>(),
  setQueryData: vi.fn(),
  toast: vi.fn(),
}));

vi.mock("../../features/lib/getStorage", () => ({ storage: mocks }));
vi.mock("@/modules/catalog/features/api/fetchCatalog", () => ({
  fetchCatalog: mocks.fetchCatalog,
}));
vi.mock("@/modules/catalog/features/model/constants", () => ({
  CATALOG_QUERY_KEY: ["catalog"],
}));
vi.mock("mobx-tanstack-query/preset", () => ({
  queryClient: { setQueryData: mocks.setQueryData },
}));
vi.mock("@/shared/lib/customToastTemplate", () => ({
  customToastTemplate: mocks.toast,
}));

const product: TProduct = {
  id: "product-1",
  name: "Товар",
  description: null,
  price: 100,
  currencyId: "RUB",
  categoryId: null,
  categoryTitle: null,
  pictureUrl: null,
  url: null,
  available: true,
};
const items: TCartItem[] = [{ product, quantity: 2 }];
const orders: TOrder[] = [
  { id: "order-1", date: "2026-01-01", items, totalPrice: 200 },
];
const primaryCatalog: TCatalogResult = {
  products: [product],
  categories: [],
  source: "primary",
  fetchedAt: 1,
};

const readStoredData = (key: string) =>
  Promise.resolve({
    value: JSON.stringify(key === CART_STORAGE_KEY ? items : orders),
  });

const loadCart = async () => {
  const { cartM } = await import("../../features/model/cartM");
  await vi.waitFor(() => expect(cartM.isLoadingStorage).toBe(false));
  return cartM;
};

describe("cart storage and catalog availability", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.resetAllMocks();
    vi.useFakeTimers();
    vi.spyOn(console, "error").mockImplementation(() => {});
    mocks.get.mockImplementation(readStoredData);
    mocks.set.mockResolvedValue(undefined);
    mocks.fetchCatalog.mockResolvedValue(primaryCatalog);
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it.each([CART_STORAGE_KEY, ORDERS_STORAGE_KEY])(
    "preserves storage when reading %s fails, then restores both on retry",
    async (failedKey) => {
      mocks.get.mockImplementation((key) =>
        key === failedKey
          ? Promise.reject(new Error("Storage unavailable"))
          : readStoredData(key),
      );
      const cart = await loadCart();

      cart.addToCart(product);
      cart.checkout();
      await vi.runAllTimersAsync();

      expect(cart.isInitialized).toBe(false);
      expect(cart.storageError).not.toBeNull();
      expect(cart.canModify).toBe(false);
      expect(cart.items).toEqual([]);
      expect(mocks.set).not.toHaveBeenCalled();
      expect(mocks.fetchCatalog).not.toHaveBeenCalled();

      mocks.get.mockImplementation(readStoredData);
      await cart.loadStore();
      await vi.waitFor(() => expect(mocks.set).toHaveBeenCalledTimes(2));

      expect(cart.isInitialized).toBe(true);
      expect(cart.storageError).toBeNull();
      expect(cart.items).toEqual(items);
      expect(cart.orderHistory).toEqual(orders);
      expect(mocks.set).toHaveBeenCalledWith(
        CART_STORAGE_KEY,
        JSON.stringify(items),
      );
      expect(mocks.set).toHaveBeenCalledWith(
        ORDERS_STORAGE_KEY,
        JSON.stringify(orders),
      );
    },
  );

  it("ignores duplicate hydration while loading and after initialization", async () => {
    const pendingRead = Promise.withResolvers<{ value: string | null }>();
    mocks.get.mockImplementation((key) =>
      key === CART_STORAGE_KEY ? pendingRead.promise : readStoredData(key),
    );
    const { cartM: cart } = await import("../../features/model/cartM");

    await cart.loadStore();
    expect(cart.isLoadingStorage).toBe(true);
    expect(mocks.get).toHaveBeenCalledTimes(2);
    expect(mocks.set).not.toHaveBeenCalled();

    pendingRead.resolve({ value: JSON.stringify(items) });
    await vi.waitFor(() => expect(cart.isInitialized).toBe(true));
    await cart.loadStore();
    expect(mocks.get).toHaveBeenCalledTimes(2);
    expect(cart.items).toEqual(items);
  });

  it("does not overwrite cart data or create an order from the reserve feed", async () => {
    const cart = await loadCart();
    await vi.waitFor(() => expect(mocks.set).toHaveBeenCalledTimes(2));
    mocks.set.mockClear();
    const reserveCatalog: TCatalogResult = {
      ...primaryCatalog,
      source: "reserve",
      products: [{ ...product, price: 1, available: false }],
    };

    cart.syncCatalogAndNotify(reserveCatalog);
    mocks.fetchCatalog.mockResolvedValue(reserveCatalog);
    cart.checkout();
    await vi.runAllTimersAsync();

    expect(cart.isReserveCatalog).toBe(true);
    expect(cart.items).toEqual(items);
    expect(cart.orderHistory).toEqual(orders);
    expect(cart.globalAction).toBeNull();
    expect(mocks.set).not.toHaveBeenCalled();
    expect(mocks.toast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Не удалось проверить наличие товаров",
        type: "warning",
      }),
    );
  });

  it("allows checkout after the primary feed recovers and uses its prices", async () => {
    const cart = await loadCart();
    cart.syncCatalogAndNotify({ ...primaryCatalog, source: "reserve" });
    mocks.fetchCatalog.mockResolvedValue({
      ...primaryCatalog,
      products: [{ ...product, price: 150 }],
    });

    cart.checkout();
    await vi.runAllTimersAsync();

    expect(cart.isReserveCatalog).toBe(false);
    expect(cart.items).toEqual([]);
    expect(cart.orderHistory).toHaveLength(2);
    expect(cart.orderHistory[0]?.totalPrice).toBe(300);
    expect(cart.orderHistory[0]?.items[0]?.product.price).toBe(150);
  });
});
