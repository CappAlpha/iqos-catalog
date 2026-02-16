import axios from "axios";
import type { FeedResult } from "../model/types";
import { parseXmlCatalog } from "./feedParser";
import { DEFAULT_FEED_URL } from "../model/constants";

interface FetchParams {
  signal?: AbortSignal;
  feedUrl?: string;
}

export async function fetchCatalog({
  signal,
  feedUrl = DEFAULT_FEED_URL,
}: FetchParams = {}): Promise<FeedResult> {
  try {
    const { data } = await axios.get<string>(feedUrl, {
      signal,
      responseType: "text",
      headers: {
        Accept: "application/xml, text/xml, */*",
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
      },
    });

    if (!data || !data.trim()) {
      throw new Error("Сервер вернул пустой ответ.");
    }

    return parseXmlCatalog(data);
  } catch (error) {
    if (axios.isCancel(error)) {
      throw new DOMException("Aborted", "AbortError");
    }

    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const url = error.config?.url;

      if (status) {
        throw new Error(`Ошибка загрузки (${status}): Не удалось получить данные с ${url}`);
      }
      throw new Error("Сетевая ошибка: сервер недоступен.");
    }

    if (error instanceof Error) {
      throw error;
    }

    throw new Error("Неизвестная ошибка при загрузке каталога.");
  }
}