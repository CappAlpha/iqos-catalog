import axios from "axios";

import { FEED_URL } from "@/shared/config";
import { formatError } from "@/shared/lib/axiosFormatError";
import { customToastTemplate } from "@/shared/lib/customToastTemplate";
import { logsM, type IAppLogger } from "@/shared/lib/logger";

import { RESERVE_FEED_URL } from "../model/constants";
import type { TFeedResult } from "../model/types";
import { parseXmlCatalog } from "./feedParser";

interface IFetchParams {
  feedUrl?: string;
  signal?: AbortSignal;
  timeout?: number;
  logger?: IAppLogger;
}

const LOG_PREFIX = "[CATALOG_FEED]";

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
  logger: IAppLogger = logsM,
): Promise<string> {
  const startTime = Date.now();

  const { data } = await axios.get<string>(url, {
    signal,
    timeout,
    responseType: "text",
    headers: {
      Accept: "application/xml, text/xml, */*",
      "Cache-Control": "no-cache",
    },
  });

  const duration = Date.now() - startTime;

  if (typeof data !== "string" || !data.trim()) {
    logger.error(
      `${LOG_PREFIX} Получен пустой или некорректный ответ от ${url} (${duration}мс).`,
    );
    throw new Error("Пустой или некорректный ответ от сервера");
  }

  const sizeKb = (new Blob([data]).size / 1024).toFixed(1);
  logger.info(
    `${LOG_PREFIX} Ответ получен: ${url} (${sizeKb} КБ, ${duration}мс).`,
  );

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
  logger: IAppLogger = logsM,
): Promise<TFeedResult> => {
  const xmlData = await executeRequest(url, signal, timeout, logger);
  const result = parseXmlCatalog(xmlData, logger);

  logger.success(
    `${LOG_PREFIX} Фид успешно загружен и обработан (${url}): ${result.products.length} товаров, ${result.categories.length} категорий.`,
  );

  return result;
};

const notifyFallback = (
  feedUrl: string,
  error: unknown,
  logger: IAppLogger = logsM,
): void => {
  const errorMsg = error instanceof Error ? error.message : String(error);
  logger.warn(
    `${LOG_PREFIX} Ошибка основного фида (${feedUrl}): ${errorMsg}. Переключение на резервный...`,
  );

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
  logger = logsM,
}: IFetchParams = {}): Promise<TFeedResult> {
  logger.info(`${LOG_PREFIX} Начало загрузки каталога...`);

  try {
    logger.info(`${LOG_PREFIX} Запрос фида: ${feedUrl}`);

    return await loadFeed(feedUrl, signal, timeout, logger);
  } catch (error: unknown) {
    throwIfAborted(error, signal);
    notifyFallback(feedUrl, error, logger);

    try {
      logger.info(
        `${LOG_PREFIX} Запрос резервного фида: ${RESERVE_FEED_URL}...`,
      );

      return await loadFeed(RESERVE_FEED_URL, signal, timeout, logger);
    } catch (reserveError: unknown) {
      throwIfAborted(reserveError, signal);

      logger.error(
        `${LOG_PREFIX} Ошибка: не удалось загрузить резервный каталог (${RESERVE_FEED_URL})`,
        reserveError,
      );

      throw formatError(reserveError, timeout, "Не удалось загрузить каталог");
    }
  }
}
