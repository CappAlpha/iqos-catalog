import currency from "currency.js";

const RUB = (value: number) =>
  currency(value, {
    symbol: "",
    separator: " ",
    precision: 0,
  });

export const formatPrice = (price: number, quantity?: number) => {
  return RUB(price * (quantity ?? 1)).format() + " ₽";
};
