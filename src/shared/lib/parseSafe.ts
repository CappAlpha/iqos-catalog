export const parseSafe = <T>(data: string | null, fallback: T): T => {
  if (!data) return fallback;
  try {
    return JSON.parse(data) as T;
  } catch (e) {
    console.error(`Ошибка парсинга данных: ${data}`, e);
    return fallback;
  }
};
