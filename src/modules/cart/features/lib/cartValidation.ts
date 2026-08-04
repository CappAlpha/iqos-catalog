import type { CartItem, Order } from "../model/types";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isNullableNumber = (value: unknown): value is number | null =>
  value === null || (typeof value === "number" && Number.isFinite(value));

const isProduct = (value: unknown): value is CartItem["product"] =>
  isRecord(value) &&
  typeof value.id === "string" &&
  typeof value.name === "string" &&
  isNullableNumber(value.price);

const isCartItem = (value: unknown): value is CartItem =>
  isRecord(value) &&
  isProduct(value.product) &&
  typeof value.quantity === "number" &&
  Number.isInteger(value.quantity) &&
  value.quantity > 0;

const isOrder = (value: unknown): value is Order =>
  isRecord(value) &&
  typeof value.id === "string" &&
  typeof value.date === "string" &&
  Array.isArray(value.items) &&
  value.items.every(isCartItem) &&
  typeof value.totalPrice === "number" &&
  Number.isFinite(value.totalPrice);

export const parseCartItems = (value: unknown): CartItem[] =>
  Array.isArray(value) ? value.filter(isCartItem) : [];

export const parseOrders = (value: unknown): Order[] =>
  Array.isArray(value) ? value.filter(isOrder) : [];
