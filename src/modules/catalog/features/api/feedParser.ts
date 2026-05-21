import currency from "currency.js";
import DOMPurify from "dompurify";

import { UNCAT_TITLE, UNCAT_ID } from "../model/constants";
import type { FeedResult, Category, Product } from "../model/types";

const SELECTORS = {
  categories: "shop > categories > category",
  offers: "shop > offers > offer",
} as const;

const getText = (el: Element | null | undefined): string | null =>
  el?.textContent?.trim() || null;

const getAttr = (el: Element, name: string): string | null =>
  el.getAttribute(name)?.trim() || null;

const getChildText = (parent: Element, tagName: string): string | null =>
  getText(parent.querySelector(tagName));

const getChildNum = (parent: Element, tagName: string): number | null => {
  const text = getChildText(parent, tagName);
  return text ? currency(text).value : null;
};

let decodeTextarea: HTMLTextAreaElement | null = null;

const decodeHtml = (html: string): string => {
  if (!html) return "";
  if (typeof document === "undefined") return html;

  decodeTextarea ??= document.createElement("textarea");
  decodeTextarea.innerHTML = html;
  return DOMPurify.sanitize(decodeTextarea.value);
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

    if (!id || !title) continue;

    categories.push({
      id,
      title,
      parentId: getAttr(category, "parentId"),
    });
    catTitleById.set(id, title);
  }

  const products: Product[] = [];
  let hasNoCategory = false;

  for (const offer of doc.querySelectorAll(SELECTORS.offers)) {
    const id = getAttr(offer, "id");
    const name = getChildText(offer, "name");

    if (!id || !name) continue;

    let categoryId = getChildText(offer, "categoryId");
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
      name,
      available: getAttr(offer, "available")?.toLowerCase() !== "false",
      description: decodeHtml(getChildText(offer, "description") ?? ""),
      price: getChildNum(offer, "price"),
      currencyId: getChildText(offer, "currencyId"),
      categoryId,
      categoryTitle,
      pictureUrl: getChildText(offer, "picture"),
      url: getChildText(offer, "url"),
    });
  }

  if (hasNoCategory && !catTitleById.has(UNCAT_ID)) {
    categories.push({ id: UNCAT_ID, title: UNCAT_TITLE, parentId: null });
  }

  return { categories, products };
};
