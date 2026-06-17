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

export async function fetchCatalog({
  feedUrl = FEED_URL,
  signal,
  timeout = 30000,
}: FetchParams = {}): Promise<FeedResult> {
  try {
    const xmlData = await executeRequest(feedUrl, signal, timeout);
    return parseXmlCatalog(xmlData);
  } catch (error: unknown) {
    if (isAbortError(error)) {
      throwAbortException();
    }

    if (signal?.aborted) {
      throwAbortException();
    }

    console.warn(
      `Ошибка основного фида (${feedUrl}), берём резервный...`,
      error,
    );

    if (globalThis.window !== undefined) {
      customToastTemplate({
        title: `Ошибка основного фида (${feedUrl}), берём резервный...`,
        type: "warning",
      });
    }

    try {
      const reserveData = await executeRequest(
        RESERVE_FEED_URL,
        signal,
        timeout,
      );
      return parseXmlCatalog(reserveData);
    } catch (reserveError: unknown) {
      if (isAbortError(reserveError)) {
        throwAbortException();
      }

      throw formatError(reserveError, timeout, "Не удалось загрузить каталог");
    }
  }
}
