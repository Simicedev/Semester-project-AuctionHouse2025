import { API_BASE_URL, NOROFF_API_KEY } from "../services/utils.ts";

export class ApiError extends Error {
  status: number;
  details: any;

  constructor(message: string, status: number, details?: any) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

export async function apiClient(
  endpoint: string,
  options: RequestInit & { body?: any } = {}
) {
  // Get tokens from storage

  const accessToken = localStorage.getItem("accessToken");

  const isFormData = options.body instanceof FormData;

  // Build headers
  const headers: Record<string, string> = {
    ...(!isFormData && options.body !== undefined
      ? { "Content-Type": "application/json" }
      : {}),
    ...(NOROFF_API_KEY ? { "X-Noroff-API-Key": NOROFF_API_KEY } : {}),
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    ...((options.headers as Record<string, string>) || {})
  };

  // Build config
  const config: RequestInit = {
    method: options.method || (options.body ? "POST" : "GET"),
    ...options,
    headers,
    body: isFormData
      ? options.body
      : options.body
        ? JSON.stringify(options.body)
        : undefined
  };

  try {
    // Ensure exactly one slash between base and endpoint
    const path = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
    const url = `${API_BASE_URL}${path}`;
    const response = await fetch(url, config);

    if (!response.ok) {
      let errorData: any = {};
      try {
        errorData = await response.json();
      } catch {}
      const message =
        errorData.errors?.[0]?.message ||
        errorData.message ||
        `An API error occurred (status ${response.status})`;
      throw new ApiError(message, response.status, errorData);
    }

    if (response.status === 204) return null;
    return await response.json();
  } catch (error) {
    console.error("API Client Error:", error);
    throw error;
  }
}

export const get = <T = any>(endpoint: string, options?: RequestInit) =>
  apiClient(endpoint, { ...options, method: "GET" }) as Promise<T>;

export const post = <T = any>(
  endpoint: string,
  body: any,
  options?: RequestInit
) => apiClient(endpoint, { ...options, method: "POST", body }) as Promise<T>;

export const put = <T = any>(
  endpoint: string,
  body: any,
  options?: RequestInit
) => apiClient(endpoint, { ...options, method: "PUT", body }) as Promise<T>;

export const del = <T = any>(endpoint: string, options?: RequestInit) =>
  apiClient(endpoint, { ...options, method: "DELETE" }) as Promise<T>;
