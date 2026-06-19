export const pluralize = (
  count: number,
  one: string,
  few: string,
  many: string,
): string => {
  const mod10 = count % 10;
  const mod100 = count % 100;

  if (mod10 >= 2 && mod10 <= 4) return few;
  if (mod10 === 1) return one;
  if (mod100 >= 11 && mod100 <= 19) return many;
  return many;
};
