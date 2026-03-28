import currency from "currency.js";

import { UNCAT_TITLE, UNCAT_ID } from "../model/constants";
import type { FeedResult, Category, Product } from "../model/types";

const SELECTORS = {
  categories: "shop > categories > category",
  offers: "shop > offers > offer",
} as const;

const getText = (text: Element | null) => text?.textContent?.trim() || null;

const getAttr = (el: Element, name: string) =>
  el.getAttribute(name)?.trim() || null;

const getNum = (el: Element | null) => {
  const v = getText(el);
  return v ? currency(v).value : null;
};

export const parseXmlCatalog = (xmlText: string): FeedResult => {
  const doc = new DOMParser().parseFromString(xmlText, "application/xml");

  if (doc.querySelector("parsererror")) {
    throw new Error("Некорректный XML (ошибка парсинга).");
  }

  const categories: Category[] = [];
  const catTitleById = new Map<string, string>();

  for (const category of doc.querySelectorAll(SELECTORS.categories)) {
    const id = getAttr(category, "id");
    const title = getText(category);

    if (!id || !title) {
      console.error("Некорректная категория:", category);
      continue;
    }

    categories.push({ id, title, parentId: getAttr(category, "parentId") });
    catTitleById.set(id, title);
  }

  const products: Product[] = [];
  let hasNoCategory = false;

  for (const offer of doc.querySelectorAll(SELECTORS.offers)) {
    const id = getAttr(offer, "id");
    const name = getText(offer.querySelector("name"));

    if (!id || !name) {
      console.error("Некорректный товар:", offer);
      continue;
    }

    let categoryId = getText(offer.querySelector("categoryId"));
    let categoryTitle: string | null;

    if (categoryId) {
      categoryTitle = catTitleById.get(categoryId) ?? null;
    } else {
      hasNoCategory = true;
      categoryId = UNCAT_ID;
      categoryTitle = UNCAT_TITLE;
    }

    products.push({
      id,
      available:
        (getAttr(offer, "available") ?? "true").toLowerCase() === "true",
      name,
      description: getText(offer.querySelector("description")),
      price: getNum(offer.querySelector("price")),
      currencyId: getText(offer.querySelector("currencyId")),
      categoryId,
      categoryTitle,
      pictureUrl: getText(offer.querySelector("picture")),
      url: getText(offer.querySelector("url")),
    });
  }

  if (hasNoCategory && !catTitleById.has(UNCAT_ID)) {
    categories.push({ id: UNCAT_ID, title: UNCAT_TITLE, parentId: null });
  }

  return { categories, products };
};
