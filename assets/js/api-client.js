import { getAccessToken } from "/assets/js/supabase-browser.js";

async function parseResponse(response) {
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return response.json();
  }

  return response.text();
}

export async function fetchJson(url, options = {}) {
  const {
    method = "GET",
    body,
    authenticated = false,
    headers = {},
  } = options;

  const requestHeaders = {
    Accept: "application/json",
    ...headers,
  };

  if (body !== undefined) {
    requestHeaders["Content-Type"] = "application/json";
  }

  if (authenticated) {
    const token = await getAccessToken();
    if (!token) {
      throw new Error("You need to log in first.");
    }

    requestHeaders.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    method,
    headers: requestHeaders,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const payload = await parseResponse(response);

  if (!response.ok) {
    const message =
      typeof payload === "string"
        ? payload
        : payload?.error || payload?.message || `Request failed with ${response.status}`;

    throw new Error(message);
  }

  return payload;
}
