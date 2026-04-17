import currency from "currency.js";
import DOMPurify from "dompurify";

import { UNCAT_TITLE, UNCAT_ID } from "../model/constants";
import type { FeedResult, Category, Product } from "../model/types";

const SELECTORS = {
  categories: "shop > categories > category",
  offers: "shop > offers > offer",
} as const;

const getText = (text: Element | null | undefined): string | null =>
  text?.textContent?.trim() || null;

const getAttr = (el: Element, name: string): string | null =>
  el.getAttribute(name)?.trim() || null;

const getNum = (el: Element | null | undefined): number | null => {
  const v = getText(el);
  if (!v) return null;
  return currency(v).value;
};

let decodeTextarea: HTMLTextAreaElement | null = null;

const decodeHtml = (html: string): string => {
  if (!html) return "";

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

    categories.push({ id, title, parentId: getAttr(category, "parentId") });
    catTitleById.set(id, title);
  }

  const products: Product[] = [];
  let hasNoCategory = false;

  const offers = doc.querySelectorAll(SELECTORS.offers);

  for (const offer of offers) {
    const id = getAttr(offer, "id");

    const name = getText(offer.getElementsByTagName("name")[0]);

    if (!id || !name) continue;

    let categoryId = getText(offer.getElementsByTagName("categoryId")[0]);
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
      description: decodeHtml(
        getText(offer.getElementsByTagName("description")[0]) ?? "",
      ),
      price: getNum(offer.getElementsByTagName("price")[0]),
      currencyId: getText(offer.getElementsByTagName("currencyId")[0]),
      categoryId,
      categoryTitle,
      pictureUrl: getText(offer.getElementsByTagName("picture")[0]),
      url: getText(offer.getElementsByTagName("url")[0]),
    });
  }

  if (hasNoCategory && !catTitleById.has(UNCAT_ID)) {
    categories.push({ id: UNCAT_ID, title: UNCAT_TITLE, parentId: null });
  }

  return { categories, products };
};
