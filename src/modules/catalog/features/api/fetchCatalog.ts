import axios from "axios";
import type { FeedResult } from "../model/types";
import { parseXmlCatalog } from "./feedParser";

export async function fetchCatalog(params?: {
  signal?: AbortSignal;
  feedUrl?: string;
}): Promise<FeedResult> {
  const feedUrl = params?.feedUrl ?? "/mindbox_feed.xml";

  let xmlText: string;

  try {
    const res = await axios.get<string>(feedUrl, {
      signal: params?.signal,
      headers: {
        Accept: "application/xml,text/xml,*/*",
        "Cache-Control": "no-store",
        Pragma: "no-cache",
      },
      responseType: "text",
    });

    if (res.status < 200 || res.status >= 300) {
      throw new Error(`Ошибка загрузки фида: HTTP ${res.status}`);
    }

    xmlText = (res.data ?? "").toString();
  } catch (e: any) {
    if (e?.code === "ERR_CANCELED" || e?.name === "CanceledError") {
      throw new DOMException("Aborted", "AbortError");
    }

    if (axios.isAxiosError(e) && !e.response) {
      throw new Error("Сеть недоступна или запрос не был выполнен.");
    }

    if (e instanceof Error) throw e;

    throw new Error("Сеть недоступна или запрос не был выполнен.");
  }

  if (!xmlText.trim()) {
    throw new Error("Фид пустой (получен пустой ответ).");
  }

  try {
    return parseXmlCatalog(xmlText);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Не удалось распарсить XML.";
    throw new Error(msg);
  }
}
