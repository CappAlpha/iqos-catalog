import currency from "currency.js";

const RUB = (value: number) =>
  currency(value, {
    symbol: "",
    separator: " ",
    precision: 0,
  });

export const formatPrice = (price: number | null, quantity?: number) => {
  return RUB((price ?? 0) * (quantity ?? 1)).format() + " ₽";
};
