import { getStorage } from "./storage";

const IP = "192.168.1.122";
const PORT = 9000;

export async function sendSocket(
  endpoint: string,
  message: string,
): Promise<string> {
  console.log(`sending ${message}`);
  const token = await getStorage("token");

  const headers: any = { "Content-Type": "application/json" };
  if (token != null) headers["Authorization"] = "Bearer " + token;

  try {
    const res = await fetch(`http://${IP}:${PORT}/${endpoint}`, {
      method: "POST",
      headers: headers,
      body: message,
    });

    const text = await res.text();
    return text;
  } catch {
    return "";
  }
}
