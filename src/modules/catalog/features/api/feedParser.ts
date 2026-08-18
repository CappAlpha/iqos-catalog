import { logsM, type IAppLogger } from "@/shared/lib/logger";

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

const getChildPrice = (parent: Element, tagName: string): number | null => {
  const text = getChildText(parent, tagName);
  if (!text || !/^[0-9]+(?:[.,][0-9]+)?$/.test(text)) return null;

  const price = Number(text.replace(",", "."));
  return Number.isFinite(price) ? price : null;
};

const getAvailable = (offer: Element): boolean | null => {
  const rawValue = getAttr(offer, "available");
  if (rawValue === null) return true;

  const value = rawValue.toLowerCase();

  if (value === "true") return true;
  if (value === "false") return false;
  return null;
};

const logInvalidProduct = (
  issues: string[],
  offer: Element,
  logger: IAppLogger = logsM,
): void => {
  const id = getAttr(offer, "id") ?? "без ID";
  const name = getChildText(offer, "name") ?? "без названия";
  logger.warn(
    `[FEED] Пропущен некорректный товар (id: ${id}, name: "${name}", проблемы: ${issues.join(", ")})`,
  );
};

let decodeTextarea: HTMLTextAreaElement | null = null;

const decodeHtml = (
  html: string,
  sanitize: (val: string) => string,
): string => {
  if (!html) return "";
  if (typeof document === "undefined") return html;

  decodeTextarea ??= document.createElement("textarea");
  decodeTextarea.innerHTML = html;
  return sanitize(decodeTextarea.value);
};

export const parseXmlCatalog = async (
  xmlText: string,
  logger: IAppLogger = logsM,
): Promise<FeedResult> => {
  const { default: DOMPurify } = await import("dompurify");

  const doc = new DOMParser().parseFromString(xmlText, "application/xml");

  if (doc.querySelector("parsererror")) {
    logger.error("[FEED] Некорректный XML (ошибка парсинга).");
    throw new Error("Некорректный XML (ошибка парсинга).");
  }

  const shop = doc.querySelector("shop");
  const offerElements = doc.querySelectorAll(SELECTORS.offers);

  if (!shop?.querySelector("offers")) {
    logger.error("[FEED] В XML отсутствует обязательная секция offers.");
    throw new Error("В XML отсутствует обязательная секция offers.");
  }

  if (offerElements.length === 0) {
    logger.error("[FEED] В XML отсутствуют товары.");
    throw new Error("В XML отсутствуют товары.");
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

  for (const offer of offerElements) {
    const id = getAttr(offer, "id");
    const name = getChildText(offer, "name");
    const available = getAvailable(offer);
    const price = getChildPrice(offer, "price");

    if (!id || !name || available === null || price === null) {
      logInvalidProduct(
        [
          !id && "id",
          !name && "name",
          available === null && "available",
          price === null && "price",
        ].filter((issue): issue is string => Boolean(issue)),
        offer,
        logger,
      );
      continue;
    }

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
      available,
      description: decodeHtml(
        getChildText(offer, "description") ?? "",
        (dirty) => DOMPurify.sanitize(dirty),
      ),
      price,
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

  if (products.length === 0) {
    logger.error("[FEED] В XML не найдено ни одного корректного товара.");
    throw new Error("В XML не найдено ни одного корректного товара.");
  }

  return { categories, products };
};
