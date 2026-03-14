import { getStorage, removeStorage } from "./storage";

const IP = "192.168.1.122";
const PORT = 9000;

export async function sendSocket(
  endpoint: string,
  method: string,
  data?: object,
): Promise<Response | null> {
  const token = await getStorage("token");

  const headers: any = { "Content-Type": "application/json" };
  if (token != null) headers["Authorization"] = "Bearer " + token;

  const init: RequestInit = {
    method: method,
    headers: headers,
  };
  if (data) init["body"] = JSON.stringify(data);

  try {
    const res = await fetch(`http://${IP}:${PORT}/${endpoint}`, init);

    if (res.status === 403) await removeStorage("token");

    return res;
  } catch {
    return null;
  }
}
