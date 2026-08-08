import { storage } from "@/src/utils/storage";

const BASE = process.env.EXPO_PUBLIC_BACKEND_URL || "https://api.ruedalo.app";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function getToken(): Promise<string | null> {
  return await storage.secureGet<string>("rideve_token", "" as string);
}

export async function setToken(token: string | null) {
  if (token) await storage.secureSet("rideve_token", token);
  else await storage.secureRemove("rideve_token");
}

export async function api<T = any>(
  path: string,
  opts: { method?: string; body?: any; auth?: boolean } = {}
): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (opts.auth !== false) {
    const token = await getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }
  const res = await fetch(`${BASE}/api${path}`, {
    method: opts.method ?? "GET",
    headers,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  const text = await res.text();
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  if (!res.ok) {
    const msg =
      typeof data === "object" && data?.detail
        ? typeof data.detail === "string"
          ? data.detail
          : JSON.stringify(data.detail)
        : `Error ${res.status}`;
    throw new ApiError(msg, res.status);
  }
  return data as T;
}
