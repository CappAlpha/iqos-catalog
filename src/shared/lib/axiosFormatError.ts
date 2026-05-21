import axios from "axios";

import { customToastTemplate } from "./customToastTemplate";

interface FormatErrorOptions {
  prefix?: string;
  showToast?: boolean;
}

export function formatError(
  error: unknown,
  timeout: number,
  options: FormatErrorOptions | string = {},
): Error {
  const opts = typeof options === "string" ? { prefix: options } : options;
  const { prefix, showToast = true } = opts;

  const messagePrefix = prefix ? `${prefix}: ` : "";
  let errorMessage = "Неизвестная ошибка";

  if (axios.isAxiosError(error)) {
    if (error.code === "ECONNABORTED" || error.message.includes("timeout")) {
      errorMessage = `Таймаут (${timeout}мс)`;
    } else if (error.response) {
      const serverData = error.response.data as unknown;
      let serverMessage: string | null = null;

      if (typeof serverData === "string") {
        serverMessage = serverData;
      } else if (serverData && typeof serverData === "object") {
        const dataObj = serverData as Record<string, unknown>;
        const rawMessage = dataObj.message ?? dataObj.error;

        if (typeof rawMessage === "string") {
          serverMessage = rawMessage;
        }
      }

      errorMessage = serverMessage
        ? `Ошибка сервера: ${serverMessage}`
        : `Ошибка сервера (${error.response.status})`;
    } else if (error.request) {
      errorMessage = "Сетевая ошибка (CORS или проблемы с соединением)";
    } else {
      errorMessage = error.message;
    }
  } else if (error instanceof Error) {
    errorMessage = error.message;
  }

  const fullMessage = `${messagePrefix}${errorMessage}`;

  if (showToast) {
    customToastTemplate(fullMessage, "error");
  }

  return error instanceof Error
    ? new Error(fullMessage, { cause: error })
    : new Error(fullMessage);
}
