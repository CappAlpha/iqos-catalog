import axios from "axios";

import { formatError } from "@/shared/lib/axiosFormatError";
import { customToastTemplate } from "@/shared/lib/customToastTemplate";

import { FEED_URL, RESERVE_FEED_URL } from "../model/constants";
import type { FeedResult } from "../model/types";
import { parseXmlCatalog } from "./feedParser";

interface FetchParams {
  feedUrl?: string;
  signal?: AbortSignal;
  timeout?: number;
}

const isAbortError = (error: unknown): boolean =>
  axios.isCancel(error) ||
  (error instanceof Error && error.name === "AbortError");

const throwAbortException = (): never => {
  throw new DOMException("Aborted", "AbortError");
};

async function executeRequest(
  url: string,
  signal?: AbortSignal,
  timeout?: number,
): Promise<string> {
  const { data } = await axios.get<string>(url, {
    signal,
    timeout,
    responseType: "text",
    headers: {
      Accept: "application/xml, text/xml, */*",
      "Cache-Control": "no-cache",
    },
  });

  if (typeof data !== "string" || !data.trim()) {
    throw new Error("Пустой или некорректный ответ от сервера");
  }

  return data;
}

const throwIfAborted = (error: unknown, signal?: AbortSignal): void => {
  if (isAbortError(error) || signal?.aborted) {
    throwAbortException();
  }
};

const loadFeed = async (
  url: string,
  signal: AbortSignal | undefined,
  timeout: number,
): Promise<FeedResult> => {
  const xmlData = await executeRequest(url, signal, timeout);
  return await parseXmlCatalog(xmlData);
};

const notifyFallback = (feedUrl: string, error: unknown): void => {
  console.warn(`Ошибка основного фида (${feedUrl}), берём резервный...`, error);

  if (globalThis.window !== undefined) {
    customToastTemplate({
      title: `Ошибка основного фида (${feedUrl}), берём резервный...`,
      type: "warning",
    });
  }
};

export async function fetchCatalog({
  feedUrl = FEED_URL,
  signal,
  timeout = 30_000,
}: FetchParams = {}): Promise<FeedResult> {
  try {
    return await loadFeed(feedUrl, signal, timeout);
  } catch (error: unknown) {
    throwIfAborted(error, signal);
    notifyFallback(feedUrl, error);

    try {
      return await loadFeed(RESERVE_FEED_URL, signal, timeout);
    } catch (reserveError: unknown) {
      throwIfAborted(reserveError, signal);

      throw formatError(reserveError, timeout, "Не удалось загрузить каталог");
    }
  }
}
