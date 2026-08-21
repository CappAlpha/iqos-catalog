import type { TCartItem, TOrder } from "../model/types";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isNullableNumber = (value: unknown): value is number | null =>
  value === null || (typeof value === "number" && Number.isFinite(value));

const isProduct = (value: unknown): value is TCartItem["product"] =>
  isRecord(value) &&
  typeof value.id === "string" &&
  typeof value.name === "string" &&
  isNullableNumber(value.price);

const isCartItem = (value: unknown): value is TCartItem =>
  isRecord(value) &&
  isProduct(value.product) &&
  typeof value.quantity === "number" &&
  Number.isInteger(value.quantity) &&
  value.quantity > 0;

const isOrder = (value: unknown): value is TOrder =>
  isRecord(value) &&
  typeof value.id === "string" &&
  typeof value.date === "string" &&
  Array.isArray(value.items) &&
  value.items.every(isCartItem) &&
  typeof value.totalPrice === "number" &&
  Number.isFinite(value.totalPrice);

export const parseCartItems = (value: unknown): TCartItem[] =>
  Array.isArray(value) ? value.filter(isCartItem) : [];

export const parseOrders = (value: unknown): TOrder[] =>
  Array.isArray(value) ? value.filter(isOrder) : [];
