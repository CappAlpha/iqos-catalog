import { Preferences } from "@capacitor/preferences";
import { makeAutoObservable, autorun, runInAction } from "mobx";

import type { Product } from "@/modules/catalog/features/model/types";
import { customToastTemplate } from "@/shared/lib/customToastTemplate";

import { CART_STORAGE_KEY, ORDERS_STORAGE_KEY } from "./constants";
import type { CartActionType, CartItem, Order } from "./types";

class CartM {
  items: CartItem[] = [];
  orderHistory: Order[] = [];
  isInitialized = false;

  activeTransitions = new Map<string, CartActionType>();
  readonly #cartItemsTimers = new Map<string, ReturnType<typeof setTimeout>>();

  globalAction: "checkout" | null = null;
  #cartTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    makeAutoObservable(this);

    autorun(async () => {
      if (!this.isInitialized) return;

      await Preferences.set({
        key: CART_STORAGE_KEY,
        value: JSON.stringify(this.items),
      });
      await Preferences.set({
        key: ORDERS_STORAGE_KEY,
        value: JSON.stringify(this.orderHistory),
      });
    });
  }

  private updateItemWithTransition(
    productId: string,
    action: CartActionType,
    updateFn?: () => void,
    delayAction = false,
    ms = 400,
  ) {
    this.activeTransitions.set(productId, action);

    const currentTimer = this.#cartItemsTimers.get(productId);
    if (currentTimer) clearTimeout(currentTimer);

    if (!delayAction && updateFn) updateFn();

    const timer = setTimeout(() => {
      runInAction(() => {
        if (delayAction && updateFn) updateFn();
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

      runInAction(() => {
        this.items = cart ? (JSON.parse(cart) as CartItem[]) : [];
        this.orderHistory = orders ? (JSON.parse(orders) as Order[]) : [];
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
    if (this.globalAction === "checkout") return true;
    return (
      !this.isEmpty &&
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
    this.updateItemWithTransition(product.id, "add", () => {
      this.items.push({ product, quantity: 1 });
    });

    customToastTemplate("Товар добавлен в корзину", "success", product.name);
  };

  private returnItemToCart(productId: string, item: CartItem) {
    if (this.getCartItem(productId)) return;

    this.updateItemWithTransition(
      productId,
      "add",
      () => this.items.push(item),
      false,
      600,
    );
  }

  removeFromCart = (productId: string) => {
    const item = this.getCartItem(productId);
    if (!item) return;

    this.updateItemWithTransition(
      productId,
      "remove",
      () => {
        this.items = this.items.filter((i) => i.product.id !== productId);

        customToastTemplate(
          "Товар убран",
          "success",
          item.product.name,
          "Вернуть",
          () => this.returnItemToCart(productId, item),
        );
      },
      true,
    );
  };

  setQuantity = (productId: string, quantity: number) => {
    if (quantity < 1) {
      this.removeFromCart(productId);
      return;
    }

    const item = this.getCartItem(productId);
    if (!item) return;

    const action = quantity > item.quantity ? "inc" : "dec";
    this.updateItemWithTransition(productId, action, () => {
      item.quantity = quantity;
    });
  };

  clearCart = () => {
    this.items = [];
  };

  checkout = () => {
    if (this.isEmpty) return;

    if (this.#cartTimer) {
      clearTimeout(this.#cartTimer);
      this.globalAction = null;
    }

    this.globalAction = "checkout";

    this.#cartTimer = setTimeout(() => {
      runInAction(() => {
        const id = crypto.randomUUID();

        this.orderHistory.unshift({
          id,
          date: new Date().toISOString(),
          items: [...this.items],
          totalPrice: this.totalPrice,
        });

        this.clearCart();
        this.globalAction = null;

        this.updateItemWithTransition(
          id,
          "add",
          () => {
            customToastTemplate("Заказ успешно оформлен", "success");
          },
          false,
          600,
        );
      });
    }, 400);
  };
}

export const cartM = new CartM();
