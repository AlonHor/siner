const IP = "192.168.1.122";
const PORT = 9000;

export async function sendSocket(message: string): Promise<string> {
  console.log(`sending ${message}`);

  try {
    const res = await fetch(`http://${IP}:${PORT}`, {
      method: "POST",
      headers: {
        "Content-Type": "text",
      },
      body: message,
    });
    const text = await res.text();
    return text;
  } catch {
    return "";
  }
}
