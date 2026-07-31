import { logsM } from "@/modules/logs/features/model/logsM";

const decoder = new TextDecoder("utf-8");

const readStringSafely = async (
  readValue: () => Promise<DataView>,
  context: string,
): Promise<string | null> => {
  try {
    const value = await readValue();
    if (value.byteLength === 0) return null;
    return decoder.decode(value);
  } catch {
    logsM.warn(`[BLE] Характеристика не прочитана: ${context}.`);
    return null;
  }
};

export const createCharReader =
  (readRaw: (serviceUuid: string, charUuid: string) => Promise<DataView>) =>
  (serviceUuid: string, charUuid: string): Promise<string | null> =>
    readStringSafely(
      () => readRaw(serviceUuid, charUuid),
      `${serviceUuid}/${charUuid}`,
    );
