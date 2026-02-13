const collator = new Intl.Collator("ru", { sensitivity: "base" });
export const compareText = (a: string, b: string) => collator.compare(a, b);

export const cmpNumNullLastAsc = (a: number | null, b: number | null) => {
  if (a == null) return b == null ? 0 : 1;
  if (b == null) return -1;
  return a - b;
}; 