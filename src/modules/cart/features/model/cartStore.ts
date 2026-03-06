import { makeAutoObservable, autorun, runInAction } from "mobx";

import type { Product } from "../../../catalog/features/model/types";
import { CART_STORAGE_KEY, ORDERS_STORAGE_KEY } from "./constants";
import type { CartActionType, CartItem, Order } from "./types";

class CartStore {
  items: CartItem[] = [];
  orderHistory: Order[] = [];

  activeTransitions = new Map<string, CartActionType>();
  #transitionTimers = new Map<string, ReturnType<typeof setTimeout>>();

  globalAction: "checkout" | null = null;
  #globalTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });

    this.loadFromStorage();
    globalThis.window.addEventListener("storage", this.syncStorage);

    autorun(() => {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(this.items));
      localStorage.setItem(
        ORDERS_STORAGE_KEY,
        JSON.stringify(this.orderHistory),
      );
    });
  }

  private syncStorage({ key, newValue }: StorageEvent) {
    if (key !== CART_STORAGE_KEY && key !== ORDERS_STORAGE_KEY) return;

    try {
      const parsedData = newValue ? JSON.parse(newValue) : [];

      runInAction(() => {
        if (key === CART_STORAGE_KEY) {
          this.items = parsedData;
        } else {
          this.orderHistory = parsedData;
        }
      });
    } catch (e) {
      console.error("Ошибка синхронизации localStorage", e);
    }
  }

  getItemAction(productId: string): CartActionType | null {
    return this.activeTransitions.get(productId) ?? null;
  }

  get isCartUpdating() {
    return this.activeTransitions.size > 0 || this.globalAction !== null;
  }

  get isCartClearing() {
    return (
      this.globalAction === "checkout" ||
      (this.items.length > 0 &&
        this.items.every((i) => this.activeTransitions.get(i.product.id) === "remove"))
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

    const currentTimer = this.#transitionTimers.get(productId);
    if (currentTimer) clearTimeout(currentTimer);

    if (!delayAction && updateFn) updateFn();

    const timer = setTimeout(() => {
      runInAction(() => {
        if (delayAction && updateFn) updateFn();
        this.activeTransitions.delete(productId);
        this.#transitionTimers.delete(productId);
      });
    }, ms);

    this.#transitionTimers.set(productId, timer);
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
    this.updateItemWithTransition(product.id, "add", () => {
      const existingItem = this.items.find((i) => i.product.id === product.id);
      if (existingItem) {
        existingItem.quantity += 1;
      } else {
        this.items.push({ product, quantity: 1 });
      }
    });
  }

  removeFromCart(productId: string) {
    this.updateItemWithTransition(
      productId,
      "remove",
      () => {
        this.items = this.items.filter((i) => i.product.id !== productId);
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
    if (this.#globalTimer) clearTimeout(this.#globalTimer);

    this.#globalTimer = setTimeout(() => {
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

        this.updateItemWithTransition(newOrderId, "add", undefined, false, 600);
      });
    }, 400);
  }

  private loadFromStorage() {
    try {
      const savedCart = localStorage.getItem(CART_STORAGE_KEY);
      const savedOrders = localStorage.getItem(ORDERS_STORAGE_KEY);

      const parsedCart = savedCart ? JSON.parse(savedCart) : null;
      const parsedOrders = savedOrders ? JSON.parse(savedOrders) : null;

      runInAction(() => {
        if (parsedCart) this.items = parsedCart;
        if (parsedOrders) this.orderHistory = parsedOrders;
      });
    } catch (e) {
      console.error("Ошибка загрузки корзины из localStorage", e);
    }
  }
}

export const cartStore = new CartStore();
