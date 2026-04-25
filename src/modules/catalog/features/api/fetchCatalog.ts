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

  if (!data?.trim()) {
    throw new Error("Пустой ответ от сервера");
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
    if (
      axios.isCancel(error) ||
      (error instanceof Error && error.name === "AbortError")
    ) {
      throw new DOMException("Aborted", "AbortError");
    }

    console.warn(
      `Ошибка основного фида (${feedUrl}), берём резервный...`,
      error,
    );
    customToastTemplate(
      `Ошибка основного фида (${feedUrl}), берём резервный...`,
      "warning",
    );

    try {
      const reserveData = await executeRequest(
        RESERVE_FEED_URL,
        signal,
        timeout,
      );
      return parseXmlCatalog(reserveData);
    } catch (reserveError: unknown) {
      throw formatError(
        reserveError,
        timeout,
        "Кэшированный файл также недоступен",
      );
    }
  }
}
