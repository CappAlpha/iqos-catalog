import { Preferences } from "@capacitor/preferences";
import { makeAutoObservable, autorun, runInAction, toJS } from "mobx";

import type { Product } from "@/modules/catalog/features/model/types";
import { customToastTemplate } from "@/shared/lib/customToastTemplate";

import { CART_STORAGE_KEY, ORDERS_STORAGE_KEY } from "./constants";
import type { CartItem, Order } from "./types";

type GlobalActionType = "checkout" | "clear" | null;
type CartActionType = "add" | "inc" | "dec" | "remove";

class CartM {
  items: CartItem[] = [];
  orderHistory: Order[] = [];
  isInitialized = false;

  activeTransitions = new Map<string, CartActionType>();
  globalAction: GlobalActionType = null;

  #globalTimer: ReturnType<typeof setTimeout> | null = null;
  readonly #cartItemsTimers = new Map<string, ReturnType<typeof setTimeout>>();

  constructor() {
    makeAutoObservable(this);

    autorun(async () => {
      if (!this.isInitialized) return;
      const value = JSON.stringify(toJS(this.items));
      await Preferences.set({ key: CART_STORAGE_KEY, value });
    });

    autorun(async () => {
      if (!this.isInitialized) return;
      const value = JSON.stringify(toJS(this.orderHistory));
      await Preferences.set({ key: ORDERS_STORAGE_KEY, value });
    });
  }

  private runGlobalTransition(
    action: GlobalActionType,
    updateFn: () => void,
    ms = 400,
  ) {
    if (this.#globalTimer) clearTimeout(this.#globalTimer);

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

    if (callbacks.onStart) callbacks.onStart();

    const timer = setTimeout(() => {
      runInAction(() => {
        if (callbacks.onEnd) callbacks.onEnd();
        this.activeTransitions.delete(productId);
        this.#cartItemsTimers.delete(productId);
      });
    }, ms);

    this.#cartItemsTimers.set(productId, timer);
  }

  initStore = async () => {
    try {
      const [{ value: cart }, { value: orders }] = await Promise.all([
        Preferences.get({ key: CART_STORAGE_KEY }),
        Preferences.get({ key: ORDERS_STORAGE_KEY }),
      ]);

      const parseSafe = <T>(data: string | null): T | [] => {
        if (!data) return [];
        try {
          return JSON.parse(data) as T;
        } catch (e) {
          console.error(`Ошибка парсинга данных хранилища - ${data}`, e);
          return [];
        }
      };

      runInAction(() => {
        this.items = parseSafe<CartItem[]>(cart);
        this.orderHistory = parseSafe<Order[]>(orders);
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

  getItemStatus = (productId: string) => {
    const action = this.activeTransitions.get(productId);
    return {
      isAddLoading: action === "add",
      isIncLoading: action === "inc",
      isDecLoading: action === "dec",
      isRemoveLoading: action === "remove",
      isCountChanged: action === "inc" || action === "dec",
    };
  };

  get isCartUpdating() {
    return this.activeTransitions.size > 0 || this.globalAction !== null;
  }

  get isCartClearing() {
    if (this.globalAction === "checkout" || this.globalAction === "clear") {
      return true;
    }
    return (
      this.items.length > 0 &&
      this.items.every(
        (i) => this.activeTransitions.get(i.product.id) === "remove",
      )
    );
  }

  get totalItems() {
    return this.items.reduce((sum, item) => sum + item.quantity, 0);
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

  addToCart = (product: Product) => {
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

  private returnItemToCart(productId: string, item: CartItem) {
    if (this.getCartItem(productId)) return;

    this.updateItemWithTransition(
      productId,
      "add",
      { onStart: () => this.items.push(item) },
      600,
    );
  }

  removeFromCart = (productId: string) => {
    const item = this.getCartItem(productId);
    if (!item) return;

    this.updateItemWithTransition(productId, "remove", {
      onEnd: () => {
        this.items = this.items.filter((i) => i.product.id !== productId);

        customToastTemplate({
          title: "Товар убран",
          type: "success",
          description: item.product.name,
          buttonLabel: "Вернуть",
          action: () => this.returnItemToCart(productId, item),
        });
      },
    });
  };

  setQuantity = (productId: string, quantity: number) => {
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
    if (this.isEmpty) return;

    this.runGlobalTransition("clear", () => {
      this.items = [];
      customToastTemplate({ title: "Корзина очищена", type: "success" });
    });
  };

  checkout = () => {
    if (this.isEmpty) return;

    this.runGlobalTransition(
      "checkout",
      () => {
        const orderId = crypto.randomUUID();

        this.orderHistory.unshift({
          id: orderId,
          date: new Date().toISOString(),
          items: toJS(this.items),
          totalPrice: this.totalPrice,
        });

        this.items = [];

        this.updateItemWithTransition(
          orderId,
          "add",
          {
            onStart: () =>
              customToastTemplate({
                title: "Заказ успешно оформлен",
                type: "success",
              }),
          },
          600,
        );
      },
      400,
    );
  };
}

export const cartM = new CartM();
