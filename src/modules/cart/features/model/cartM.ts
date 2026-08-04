import { makeAutoObservable, autorun, runInAction, toJS } from "mobx";

import type { Product } from "@/modules/catalog/features/model/types";
import { customToastTemplate } from "@/shared/lib/customToastTemplate";
import { parseSafe } from "@/shared/lib/parseSafe";

import { parseCartItems, parseOrders } from "../lib/cartValidation";
import { storage } from "../lib/getStorage";
import { CART_STORAGE_KEY, ORDERS_STORAGE_KEY } from "./constants";
import type { CartItem, Order } from "./types";

type GlobalActionType = "checkout" | "clear" | null;
type CartActionType = "add" | "inc" | "dec" | "remove";

class CartM {
  items: CartItem[] = [];
  orderHistory: Order[] = [];
  isInitialized = false;
  recentOrderId: string | null = null;

  activeTransitions = new Map<string, CartActionType>();
  globalAction: GlobalActionType = null;

  #globalTimer: ReturnType<typeof setTimeout> | null = null;
  readonly #cartItemsTimers = new Map<string, ReturnType<typeof setTimeout>>();
  #recentOrderTimer: ReturnType<typeof setTimeout> | null = null;
  #storageWriteQueue: Promise<void> = Promise.resolve();
  #initializationPromise: Promise<void> | null = null;
  #undoGeneration = 0;

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
    if (this.#initializationPromise) return this.#initializationPromise;

    this.#initializationPromise = this.loadStore();
    return this.#initializationPromise;
  };

  private loadStore = async () => {
    try {
      const [{ value: cart }, { value: orders }] = await Promise.all([
        storage.get(CART_STORAGE_KEY),
        storage.get(ORDERS_STORAGE_KEY),
      ]);

      runInAction(() => {
        this.items = parseCartItems(parseSafe<unknown>(cart, []));
        this.orderHistory = parseOrders(parseSafe<unknown>(orders, []));
        this.isInitialized = true;
      });
    } catch (e) {
      console.error("Ошибка загрузки хранилища", e);
      runInAction(() => (this.isInitialized = true));
    }
  };

  getCartItem = (productId: string) => {
    return this.items.find((i) => i.product.id === productId);
  };

  getItemState = (productId: string) => {
    const action = this.activeTransitions.get(productId);
    const isBusy = action !== undefined || this.globalAction !== null;

    return {
      isAddLoading: action === "add",
      isIncLoading: action === "inc",
      isDecLoading: action === "dec",
      isRemoveLoading: action === "remove",
      isCountChanged: action === "inc" || action === "dec",
      isUpdating: isBusy,
      canChangeQuantity: this.isInitialized && !isBusy,
      canRemove: this.isInitialized && !isBusy,
    };
  };

  get isCartUpdating() {
    return this.activeTransitions.size > 0 || this.globalAction !== null;
  }

  get isClearing() {
    return this.globalAction === "clear";
  }

  get isCheckingOut() {
    return this.globalAction === "checkout";
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
    return this.isClearing || this.isCheckingOut || this.isRemovingAll;
  }

  get totalItems() {
    return this.items.reduce((sum, item) => sum + item.quantity, 0);
  }

  get uniqueItemsCount() {
    return this.items.length;
  }

  get totalPrice() {
    return this.items.reduce(
      (sum, item) => sum + (item.product.price ?? 0) * item.quantity,
      0,
    );
  }

  get isEmpty() {
    return this.items.length === 0;
  }

  get canAdd() {
    return this.isInitialized && this.globalAction === null;
  }

  addToCart = (product: Product) => {
    if (!this.canAdd) return;

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
      !this.isInitialized ||
      this.globalAction !== null ||
      undoGeneration !== this.#undoGeneration ||
      this.getCartItem(productId)
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
    if (!this.isInitialized || this.globalAction !== null) return;

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
    if (!this.isInitialized || this.globalAction !== null) return;

    if (quantity < 1) {
      this.removeFromCart(productId);
      return;
    }

    const item = this.getCartItem(productId);
    if (!item) return;

    const action = quantity > item.quantity ? "inc" : "dec";
    this.updateItemWithTransition(productId, action, {
      onStart: () => (item.quantity = quantity),
    });
  };

  clearCart = () => {
    if (!this.isInitialized || this.isEmpty) return;

    this.runGlobalTransition("clear", () => {
      this.items = [];
      customToastTemplate({ title: "Корзина очищена", type: "success" });
    });
  };

  checkout = () => {
    if (!this.isInitialized || this.isEmpty) return;

    const orderItems = toJS(this.items);
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

        this.items = [];

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
