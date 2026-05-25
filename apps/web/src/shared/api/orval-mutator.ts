import { apiRequest } from "./http";

type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

type WorkPlannerApiOptions = {
  method: Method;
  params?: Record<string, unknown>;
  body?: BodyType<unknown>;
  headers?: HeadersInit;
  signal?: AbortSignal | null;
};

export type BodyType<BodyData> = BodyData;

export async function workPlannerApi<T>(url: string, options: WorkPlannerApiOptions): Promise<T> {
  const response = await apiRequest(withQueryParams(url, options.params), {
    method: options.method,
    headers: options.headers,
    signal: options.signal,
    body: encodeBody(options.body)
  });

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

function withQueryParams(url: string, params?: Record<string, unknown>): string {
  if (!params) {
    return url;
  }

  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) {
      return;
    }

    if (Array.isArray(value)) {
      value.forEach((item) => searchParams.append(key, String(item)));
      return;
    }

    searchParams.set(key, String(value));
  });

  const queryString = searchParams.toString();
  return queryString ? `${url}?${queryString}` : url;
}

function encodeBody(body: BodyType<unknown> | undefined): BodyInit | undefined {
  if (body === undefined || body === null) {
    return undefined;
  }

  if (typeof body === "string" || body instanceof FormData || body instanceof URLSearchParams || body instanceof Blob) {
    return body;
  }

  return JSON.stringify(body);
}
