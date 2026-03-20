import { Preferences } from "@capacitor/preferences";
import { makeAutoObservable, autorun, runInAction } from "mobx";

import type { Product } from "@/modules/catalog/features/model/types";
import { customToastTemplate } from "@/shared/lib/customToastTemplate";

import { CART_STORAGE_KEY, ORDERS_STORAGE_KEY } from "./constants";
import type { CartActionType, CartItem, Order } from "./types";

class CartStore {
  items: CartItem[] = [];
  orderHistory: Order[] = [];
  isInitialized = false;

  activeTransitions = new Map<string, CartActionType>();
  readonly #cartItemsTimers = new Map<string, ReturnType<typeof setTimeout>>();

  globalAction: "checkout" | null = null;
  #cartTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });

    autorun(() => {
      if (!this.isInitialized) return;

      Preferences.set({
        key: CART_STORAGE_KEY,
        value: JSON.stringify(this.items),
      });
      Preferences.set({
        key: ORDERS_STORAGE_KEY,
        value: JSON.stringify(this.orderHistory),
      });
    });
  }

  async initStore() {
    try {
      const [cart, orders] = await Promise.all([
        Preferences.get({ key: CART_STORAGE_KEY }),
        Preferences.get({ key: ORDERS_STORAGE_KEY }),
      ]);

      runInAction(() => {
        if (cart.value) this.items = JSON.parse(cart.value);
        if (orders.value) this.orderHistory = JSON.parse(orders.value);
      });
    } catch (e) {
      console.error("Ошибка загрузки хранилища корзины", e);
    } finally {
      runInAction(() => {
        this.isInitialized = true;
      });
    }
  }

  getCartItem(productId: string): CartItem | undefined {
    return this.items.find((i) => i.product.id === productId);
  }

  getItemStatus(productId: string) {
    const action = this.activeTransitions.get(productId);
    return {
      isAddLoading: action === "add",
      isIncLoading: action === "inc",
      isDecLoading: action === "dec",
      isRemoveLoading: action === "remove",
      isCountChanged: action === "inc" || action === "dec",
    };
  }

  get isCartUpdating() {
    return this.activeTransitions.size > 0 || this.globalAction !== null;
  }

  get isCartClearing() {
    return (
      this.globalAction === "checkout" ||
      (this.items.length > 0 &&
        this.items.every(
          (i) => this.activeTransitions.get(i.product.id) === "remove",
        ))
    );
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

  get totalItems() {
    return this.items.reduce((sum, item) => sum + item.quantity, 0);
  }

  get totalPrice() {
    return this.items.reduce((sum, item) => {
      const price = item.product.price ?? 0;
      return sum + price * item.quantity;
    }, 0);
  }

  get isEmpty() {
    return this.items.length === 0;
  }

  addToCart(product: Product) {
    customToastTemplate("Товар добавлен в корзину", "success", product.name);

    this.updateItemWithTransition(product.id, "add", () => {
      this.items.push({ product, quantity: 1 });
    });
  }

  private returnItemToCart(productId: string, itemToRestore: CartItem) {
    if (!this.items.some((i) => i.product.id === productId)) {
      this.updateItemWithTransition(
        productId,
        "add",
        () => {
          this.items.push(itemToRestore);
        },
        false,
        600,
      );
    }
  }

  removeFromCart(productId: string) {
    const itemToRestore = this.items.find((i) => i.product.id === productId);

    if (!itemToRestore) return;

    this.updateItemWithTransition(
      productId,
      "remove",
      () => {
        this.items = this.items.filter((i) => i.product.id !== productId);

        customToastTemplate(
          "Товар убран из корзины",
          "success",
          itemToRestore.product.name,
          "Вернуть",
          () => {
            runInAction(() => {
              this.returnItemToCart(productId, itemToRestore);
            });
          },
        );
      },
      true,
    );
  }

  setQuantity(productId: string, quantity: number) {
    if (quantity < 1) return;

    const item = this.items.find((i) => i.product.id === productId);
    if (!item) return;

    const action: CartActionType = quantity > item.quantity ? "inc" : "dec";

    this.updateItemWithTransition(productId, action, () => {
      item.quantity = quantity;
    });
  }

  clearCart() {
    this.items = [];
  }

  checkout() {
    if (this.isEmpty) return;

    this.globalAction = "checkout";
    if (this.#cartTimer) clearTimeout(this.#cartTimer);

    this.#cartTimer = setTimeout(() => {
      runInAction(() => {
        const newOrderId = crypto.randomUUID();

        const newOrder: Order = {
          id: newOrderId,
          date: new Date().toISOString(),
          items: [...this.items],
          totalPrice: this.totalPrice,
        };

        this.orderHistory.unshift(newOrder);
        this.clearCart();
        this.globalAction = null;

        this.updateItemWithTransition(
          newOrderId,
          "add",
          () => {
            customToastTemplate("Заказ успешно оформлен", "success");
          },
          false,
          600,
        );
      });
    }, 400);
  }
}

export const cartStore = new CartStore();
