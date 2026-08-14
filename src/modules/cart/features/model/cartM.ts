import { makeAutoObservable, autorun, runInAction, toJS } from "mobx";
import { queryClient } from "mobx-tanstack-query/preset";

import { fetchCatalog } from "@/modules/catalog/features/api/fetchCatalog";
import { CATALOG_QUERY_KEY } from "@/modules/catalog/features/model/constants";
import type { Product } from "@/modules/catalog/features/model/types";
import { customToastTemplate } from "@/shared/lib/customToastTemplate";
import { parseSafe } from "@/shared/lib/parseSafe";

import { parseCartItems, parseOrders } from "../lib/cartValidation";
import { storage } from "../lib/getStorage";
import { CART_STORAGE_KEY, ORDERS_STORAGE_KEY } from "./constants";
import type { CartItem, Order } from "./types";

type GlobalActionType = "checkout" | "clear" | null;
type CartActionType = "add" | "inc" | "dec" | "remove";

const getProductKey = (product: Product): string =>
  `${product.originalId ?? product.id}:::${product.name.trim()}`;

class CartM {
  items: CartItem[] = [];
  orderHistory: Order[] = [];
  isInitialized = false;
  isCheckingAvailability = false;
  recentOrderId: string | null = null;

  activeTransitions = new Map<string, CartActionType>();
  globalAction: GlobalActionType = null;

  #globalTimer: ReturnType<typeof setTimeout> | null = null;
  readonly #cartItemsTimers = new Map<string, ReturnType<typeof setTimeout>>();
  #recentOrderTimer: ReturnType<typeof setTimeout> | null = null;
  #storageWriteQueue: Promise<void> = Promise.resolve();
  #undoGeneration = 0;
  #catalogProducts = new Map<string, Product>();

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });

    autorun(() => {
      if (!this.isInitialized) return;
      const value = JSON.stringify(toJS(this.items));
      this.persist(CART_STORAGE_KEY, value);
    });

    autorun(() => {
      if (!this.isInitialized) return;
      const value = JSON.stringify(toJS(this.orderHistory));
      this.persist(ORDERS_STORAGE_KEY, value);
    });
  }

  private readonly persist = (key: string, value: string) => {
    this.#storageWriteQueue = this.#storageWriteQueue
      .catch(() => {})
      .then(() => storage.set(key, value))
      .catch((error: unknown) => {
        console.error(`Ошибка сохранения данных (${key})`, error);
      });
  };

  private runGlobalTransition(
    action: GlobalActionType,
    updateFn: () => void,
    ms = 400,
  ) {
    if (this.#globalTimer) clearTimeout(this.#globalTimer);

    this.#undoGeneration += 1;

    this.globalAction = action;

    this.#globalTimer = setTimeout(() => {
      runInAction(() => {
        updateFn();
        this.globalAction = null;
        this.#globalTimer = null;
      });
    }, ms);
  }

  private updateItemWithTransition(
    productId: string,
    action: CartActionType,
    callbacks: { onStart?: () => void; onEnd?: () => void } = {},
    ms = 400,
  ) {
    this.activeTransitions.set(productId, action);

    const currentTimer = this.#cartItemsTimers.get(productId);
    if (currentTimer) clearTimeout(currentTimer);

    callbacks.onStart?.();

    const timer = setTimeout(() => {
      runInAction(() => {
        callbacks.onEnd?.();
        this.activeTransitions.delete(productId);
        this.#cartItemsTimers.delete(productId);
      });
    }, ms);

    this.#cartItemsTimers.set(productId, timer);
  }

  initStore = () => {
    return this.loadStore();
  };

  private loadStore = async () => {
    try {
      const [{ value: cart }, { value: orders }] = await Promise.all([
        storage.get(CART_STORAGE_KEY),
        storage.get(ORDERS_STORAGE_KEY),
      ]);

      runInAction(() => {
        this.items = parseCartItems(parseSafe<unknown>(cart, []));
        this.syncItemsWithCatalog();
        this.orderHistory = parseOrders(parseSafe<unknown>(orders, []));
        this.isInitialized = true;
      });

      if (this.#catalogProducts.size > 0) this.notifyUnavailableItems();
    } catch (e) {
      console.error("Ошибка загрузки хранилища", e);
      runInAction(() => (this.isInitialized = true));
    }
  };

  syncCatalogAndNotify = (products: Product[]) => {
    this.#catalogProducts = new Map(
      products.map((product) => [getProductKey(product), product]),
    );
    this.syncItemsWithCatalog();
    if (this.isInitialized && !this.isCheckingAvailability) {
      this.notifyUnavailableItems();
    }
  };

  private notifyUnavailableItems = () => {
    const unavailableItems = this.items.filter(
      ({ product }) => !product.available,
    );

    if (unavailableItems.length === 0) return;

    customToastTemplate({
      title: "Товар недоступен",
      type: "warning",
      description: unavailableItems
        .map(({ product }) => product.name)
        .join(", "),
    });
  };

  private refreshAvailability = async () => {
    runInAction(() => {
      this.isCheckingAvailability = true;
    });

    try {
      const catalog = await fetchCatalog();
      queryClient.setQueryData(CATALOG_QUERY_KEY, catalog);
      this.syncCatalogAndNotify(catalog.products);

      return true;
    } catch (error: unknown) {
      console.error("Ошибка проверки доступности товаров", error);
      customToastTemplate({
        title: "Не удалось проверить наличие товаров",
        type: "error",
        description: "Оформление заказа временно недоступно",
      });
      return false;
    } finally {
      runInAction(() => {
        this.isCheckingAvailability = false;
      });
    }
  };

  private syncItemsWithCatalog = () => {
    if (this.#catalogProducts.size === 0) return;

    this.items = this.items.map((item) => {
      const catalogProduct = this.#catalogProducts.get(
        getProductKey(item.product),
      );

      return {
        ...item,
        product: catalogProduct
          ? {
              ...catalogProduct,
              id: item.product.id,
              originalId: catalogProduct.originalId ?? catalogProduct.id,
            }
          : { ...item.product, available: false },
      };
    });
  };

  isProductAvailable = (product: Product) => {
    return (
      this.#catalogProducts.get(getProductKey(product))?.available ??
      product.available
    );
  };

  getCartItem = (productId: string) => {
    return this.items.find((i) => i.product.id === productId);
  };

  getItemState = (productId: string) => {
    const action = this.activeTransitions.get(productId);
    const isBusy = action !== undefined || this.isCartBusy;

    return {
      isAddLoading: action === "add",
      isIncLoading: action === "inc",
      isDecLoading: action === "dec",
      isRemoveLoading: action === "remove",
      isCountChanged: action === "inc" || action === "dec",
      canChangeQuantity: this.isInitialized && !isBusy,
    };
  };

  get isCartUpdating() {
    return this.activeTransitions.size > 0 || this.isCartBusy;
  }

  private get isCartBusy() {
    return this.isCheckingAvailability || this.globalAction !== null;
  }

  get canModify() {
    return this.isInitialized && !this.isCartBusy;
  }

  get isClearing() {
    return this.globalAction === "clear";
  }

  get isRemovingAll() {
    return (
      this.items.length > 0 &&
      this.items.every(
        (i) => this.activeTransitions.get(i.product.id) === "remove",
      )
    );
  }

  get isCartTransitioningToEmpty() {
    return (
      this.isClearing || this.globalAction === "checkout" || this.isRemovingAll
    );
  }

  get totalItems() {
    return this.availableItems.reduce((sum, item) => sum + item.quantity, 0);
  }

  get uniqueItemsCount() {
    return this.availableItems.length;
  }

  get totalPrice() {
    return this.availableItems.reduce(
      (sum, item) => sum + (item.product.price ?? 0) * item.quantity,
      0,
    );
  }

  private get availableItems() {
    return this.items.filter(({ product }) => product.available);
  }

  get isEmpty() {
    return this.items.length === 0;
  }

  get hasAvailableItems() {
    return this.availableItems.length > 0;
  }

  addToCart = (product: Product) => {
    if (!this.canModify || !this.isProductAvailable(product)) return;

    const existingItem = this.getCartItem(product.id);

    if (existingItem) {
      this.setQuantity(product.id, existingItem.quantity + 1);
      return;
    }

    this.updateItemWithTransition(product.id, "add", {
      onStart: () => this.items.push({ product, quantity: 1 }),
    });

    customToastTemplate({
      title: "Товар добавлен в корзину",
      type: "success",
      description: product.name,
    });
  };

  private returnItemToCart(
    productId: string,
    item: CartItem,
    undoGeneration: number,
  ) {
    if (
      !this.canModify ||
      undoGeneration !== this.#undoGeneration ||
      this.getCartItem(productId) ||
      !this.isProductAvailable(item.product)
    ) {
      return;
    }

    this.updateItemWithTransition(
      productId,
      "add",
      { onStart: () => this.items.push(item) },
      600,
    );
  }

  removeFromCart = (productId: string) => {
    if (!this.canModify) return;

    const item = this.getCartItem(productId);
    if (!item) return;

    const undoGeneration = this.#undoGeneration;

    this.updateItemWithTransition(productId, "remove", {
      onEnd: () => {
        this.items = this.items.filter((i) => i.product.id !== productId);

        customToastTemplate({
          title: "Товар убран",
          type: "success",
          description: item.product.name,
          buttonLabel: "Вернуть",
          action: () => this.returnItemToCart(productId, item, undoGeneration),
        });
      },
    });
  };

  setQuantity = (productId: string, quantity: number) => {
    if (!this.canModify) return;

    if (quantity < 1) {
      this.removeFromCart(productId);
      return;
    }

    const item = this.getCartItem(productId);
    if (!item || !this.isProductAvailable(item.product)) return;

    const action = quantity > item.quantity ? "inc" : "dec";
    this.updateItemWithTransition(productId, action, {
      onStart: () => (item.quantity = quantity),
    });
  };

  clearCart = () => {
    if (!this.canModify || this.isEmpty) return;

    this.runGlobalTransition("clear", () => {
      this.items = [];
      customToastTemplate({ title: "Корзина очищена", type: "success" });
    });
  };

  removeUnavailableItems = () => {
    if (!this.canModify) return;

    const unavailableCount = this.items.filter(
      ({ product }) => !product.available,
    ).length;
    if (unavailableCount === 0) return;

    this.items = this.items.filter(({ product }) => product.available);
    customToastTemplate({
      title:
        unavailableCount === 1
          ? "Недоступный товар удален"
          : "Недоступные товары удалены",
      type: "success",
    });
  };

  checkout = () => {
    if (!this.canModify || this.isEmpty) return;

    void this.checkAvailabilityAndCheckout();
  };

  private checkAvailabilityAndCheckout = async () => {
    const previouslyAvailable = new Set(
      this.availableItems.map(({ product }) => getProductKey(product)),
    );

    const isAvailabilityCheckSuccessful = await this.refreshAvailability();
    if (!isAvailabilityCheckSuccessful) return;

    const newlyUnavailable = this.items.filter(
      (item) =>
        previouslyAvailable.has(getProductKey(item.product)) &&
        !item.product.available,
    );
    const newlyAvailable = this.items.filter(
      (item) =>
        !previouslyAvailable.has(getProductKey(item.product)) &&
        item.product.available,
    );

    if (newlyUnavailable.length > 0 || newlyAvailable.length > 0) {
      this.notifyAvailabilityDiff(newlyUnavailable, newlyAvailable);
      return;
    }

    if (!this.hasAvailableItems) {
      customToastTemplate({
        title: "Нет доступных товаров",
        type: "warning",
        description: "Добавьте доступный товар, чтобы оформить заказ",
      });
      return;
    }

    this.executeCheckout();
  };

  private notifyAvailabilityDiff = (
    newlyUnavailable: CartItem[],
    newlyAvailable: CartItem[],
  ) => {
    const formatNames = (items: CartItem[]) =>
      items.map(({ product }) => product.name).join(", ");

    if (newlyUnavailable.length > 0 && newlyAvailable.length === 0) {
      const isSingle = newlyUnavailable.length === 1;
      customToastTemplate({
        title: isSingle ? "Товар стал недоступен" : "Товары стали недоступны",
        type: "warning",
        description: `${formatNames(newlyUnavailable)}. Проверьте заказ перед оформлением`,
        buttonLabel: "Удалить",
        action: this.removeUnavailableItems,
      });
    } else if (newlyAvailable.length > 0 && newlyUnavailable.length === 0) {
      const isSingle = newlyAvailable.length === 1;
      customToastTemplate({
        title: isSingle ? "Товар стал доступен" : "Товары стали доступны",
        type: "warning",
        description: `${formatNames(newlyAvailable)}. Проверьте заказ перед оформлением`,
      });
    } else {
      customToastTemplate({
        title: "Статус товаров изменился",
        type: "warning",
        description: `Недоступны: ${formatNames(newlyUnavailable)}. Доступны: ${formatNames(newlyAvailable)}. Проверьте заказ перед оформлением`,
        buttonLabel: "Удалить недоступные",
        action: this.removeUnavailableItems,
      });
    }
  };

  private executeCheckout = () => {
    const orderItems = toJS(this.availableItems);
    const orderTotalPrice = this.totalPrice;

    this.runGlobalTransition(
      "checkout",
      () => {
        const orderId = crypto.randomUUID();

        this.orderHistory.unshift({
          id: orderId,
          date: new Date().toISOString(),
          items: orderItems,
          totalPrice: orderTotalPrice,
        });

        this.items = this.items.filter(({ product }) => !product.available);

        this.recentOrderId = orderId;
        if (this.#recentOrderTimer) clearTimeout(this.#recentOrderTimer);
        this.#recentOrderTimer = setTimeout(() => {
          runInAction(() => {
            this.recentOrderId = null;
            this.#recentOrderTimer = null;
          });
        }, 600);

        customToastTemplate({
          title: "Заказ успешно оформлен",
          type: "success",
        });
      },
      400,
    );
  };
}

export const cartM = new CartM();
