import axios from "axios";

import { customToastTemplate } from "./customToastTemplate";

export function formatError(
  error: unknown,
  timeout: number,
  prefix?: string,
): Error {
  const messagePrefix = prefix ? `${prefix}: ` : "";

  if (axios.isAxiosError(error)) {
    if (error.code === "ECONNABORTED") {
      customToastTemplate(`${messagePrefix}Таймаут (${timeout}мс)`, "error");
      return new Error(`${messagePrefix}Таймаут (${timeout}мс)`);
    }
    if (error.response) {
      customToastTemplate(
        `${messagePrefix}Ошибка сервера (${error.response.status})`,
        "error",
      );
      return new Error(
        `${messagePrefix}Ошибка сервера (${error.response.status})`,
      );
    }
    if (error.request) {
      customToastTemplate(
        `${messagePrefix}Сетевая ошибка (CORS или соединение)`,
        "error",
      );
      return new Error(`${messagePrefix}Сетевая ошибка (CORS или соединение)`);
    }
  }

  customToastTemplate(`${messagePrefix}Неизвестная ошибка`, "error");
  return error instanceof Error ? error : new Error("Неизвестная ошибка");
}
