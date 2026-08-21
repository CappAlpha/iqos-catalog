import type { TProduct } from "@/modules/catalog/features/model/types";

export type TCartItem = {
  product: TProduct;
  quantity: number;
};

export type TOrder = {
  id: string;
  date: string;
  items: TCartItem[];
  totalPrice: number;
};
