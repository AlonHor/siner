import { createAsyncStorage } from "@react-native-async-storage/async-storage";

const storage = createAsyncStorage("strg");

export async function setStorage(key: string, value: string) {
  await storage.setItem(key, value);
}

export async function getStorage(key: string): Promise<string | null> {
  return await storage.getItem(key);
}

export async function removeStorage(key: string) {
  await storage.removeItem(key);
}
