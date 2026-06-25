const decoder = new TextDecoder("utf-8");

export const readStringSafely = async (
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
