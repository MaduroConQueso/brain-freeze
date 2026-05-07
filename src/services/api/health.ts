export async function getApiVersion(endpoint: string): Promise<string> {
  try {
    const url = new URL("/health", endpoint);
    const response = await fetch(url, {
      signal: AbortSignal.timeout(500),
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })
    const data = await response.json();
    return data.version ? data.version : "1.0";
  } catch (e) {
    return "-1";
  }
};