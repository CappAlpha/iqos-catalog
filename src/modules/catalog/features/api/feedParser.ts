import currency from "currency.js";

import { UNCAT_ID, UNCAT_TITLE } from "../model/constants";
import type { Category, FeedResult, Product } from "../model/types";

const SELECTORS = {
  categories: "shop > categories > category",
  offers: "shop > offers > offer",
} as const;

const getText = (text: Element | null): string | null => {
  const v = text?.textContent?.trim() ?? "";
  return v.length ? v : null;
};

const getAttr = (el: Element, name: string): string | null => {
  const v = el.getAttribute(name)?.trim() ?? "";
  return v.length ? v : null;
};

const getNum = (el: Element | null): number | null => {
  const v = getText(el);
  if (!v) return null;
  return currency(v).value;
};

export const parseXmlCatalog = (xmlText: string): FeedResult => {
  const doc = new DOMParser().parseFromString(xmlText, "application/xml");

  if (doc.querySelector("parsererror")) {
    throw new Error("Некорректный XML (ошибка парсинга).");
  }

  const categories: Category[] = [];
  const catTitleById = new Map<string, string>();

  for (const category of Array.from(
    doc.querySelectorAll(SELECTORS.categories),
  )) {
    const id = getAttr(category, "id");
    const title = getText(category);
    if (!id || !title) {
      console.error("Некорректная категория:", category);
      continue;
    }

    const parentId = getAttr(category, "parentId");
    const cat: Category = { id, title, parentId };

    categories.push(cat);
    catTitleById.set(id, title);
  }

  const products: Product[] = [];
  let hasNoCategory = false;

  for (const offer of Array.from(doc.querySelectorAll(SELECTORS.offers))) {
    const id = getAttr(offer, "id");
    const name = getText(offer.querySelector("name"));
    if (!id || !name) {
      console.error("Некорректный товар:", offer);
      continue;
    }

    const available =
      (getAttr(offer, "available") ?? "true").toLowerCase() === "true";

    const categoryId = getText(offer.querySelector("categoryId"));
    if (!categoryId) hasNoCategory = true;

    const titleFromMap = categoryId ? catTitleById.get(categoryId) : undefined;

    products.push({
      id,
      available,
      name,

      price: getNum(offer.querySelector("price")),
      currencyId: getText(offer.querySelector("currencyId")),

      categoryId: categoryId ?? null,
      categoryTitle: titleFromMap ?? (categoryId ? null : UNCAT_TITLE),

      pictureUrl: getText(offer.querySelector("picture")),
      url: getText(offer.querySelector("url")),
    });
  }

  const hasRootCategoryAlready = categories.some(
    (category) => category.id === UNCAT_ID,
  );

  const finalCategories =
    hasNoCategory && !hasRootCategoryAlready
      ? [...categories, { id: UNCAT_ID, title: UNCAT_TITLE, parentId: null }]
      : categories;

  const normalizedProducts = hasNoCategory
    ? products.map((product) =>
        product.categoryId
          ? product
          : { ...product, categoryId: UNCAT_ID, categoryTitle: UNCAT_TITLE },
      )
    : products;

  return { categories: finalCategories, products: normalizedProducts };
};
