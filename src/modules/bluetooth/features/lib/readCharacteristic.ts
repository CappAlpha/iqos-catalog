const decoder = new TextDecoder("utf-8");

const readStringSafely = async (
  readValue: () => Promise<DataView>,
): Promise<string | null> => {
  try {
    const value = await readValue();
    if (value.byteLength === 0) return null;
    return decoder.decode(value);
  } catch {
    return null;
  }
};

export const createCharReader =
  (readRaw: (serviceUuid: string, charUuid: string) => Promise<DataView>) =>
  (serviceUuid: string, charUuid: string): Promise<string | null> =>
    readStringSafely(() => readRaw(serviceUuid, charUuid));
