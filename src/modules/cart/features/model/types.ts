import type { Product } from "../../../catalog/features/model/types";

export type CartActionType = "add" | "inc" | "dec" | "remove";

export type CartItem = {
  product: Product;
  quantity: number;
};

export type Order = {
  id: string;
  date: string;
  items: CartItem[];
  totalPrice: number;
};
