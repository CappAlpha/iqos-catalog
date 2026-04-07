import axios from "axios";

import { DEFAULT_FEED_URL } from "../model/constants";
import type { FeedResult } from "../model/types";
import { parseXmlCatalog } from "./feedParser";

interface FetchParams {
  signal?: AbortSignal;
  feedUrl?: string;
  timeout?: number;
}

export async function fetchCatalog({
  signal,
  feedUrl = DEFAULT_FEED_URL,
  timeout = 30000,
}: FetchParams = {}): Promise<FeedResult> {
  try {
    const { data } = await axios.get<string>(feedUrl, {
      signal,
      timeout,
      responseType: "text",
      headers: {
        Accept: "application/xml, text/xml, */*",
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
      },
    });

    if (!data?.trim()) {
      throw new Error("Сервер вернул пустой ответ.");
    }

    return parseXmlCatalog(data);
  } catch (error: unknown) {
    if (axios.isCancel(error)) {
      throw new DOMException("Aborted", "AbortError");
    }

    if (axios.isAxiosError(error)) {
      if (error.code === "ECONNABORTED") {
        throw new Error(`Превышено время ожидания ответа (${timeout}мс)`, {
          cause: error,
        });
      }

      if (error.response) {
        throw new Error(
          `Ошибка загрузки (${error.response.status}): Сервер вернул ошибку.`,
          { cause: error },
        );
      }

      if (error.request) {
        throw new Error(
          "Сетевая ошибка: сервер недоступен или блокирован CORS.",
          { cause: error },
        );
      }
    }

    if (error instanceof Error) {
      throw error;
    }

    throw new Error("Неизвестная ошибка при загрузке каталога.", {
      cause: error,
    });
  }
}
