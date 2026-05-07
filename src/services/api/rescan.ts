export async function rescan(endpoint: string): Promise<boolean> {
  try {
    const url = new URL("/rescan", endpoint);
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    })
    return response.ok;
  } catch (e) {
    return false;
  }
};