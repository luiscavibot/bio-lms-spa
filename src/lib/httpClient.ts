import { useAuthStore } from "@/store/authStore";

interface RequestConfig extends RequestInit {
  requiresAuth?: boolean;
}

class HttpClient {
  private readonly baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private resolveUrl(path: string): string {
    if (/^https?:\/\//.test(path)) return path;
    const base = this.baseURL.replace(/\/$/, "");
    const normalized = path.startsWith("/") ? path : `/${path}`;
    if (base.endsWith("/api/v1") && normalized.startsWith("/api/v1")) {
      return `${base}${normalized.slice("/api/v1".length)}`;
    }
    return `${base}${normalized}`;
  }

  private async request<T>(
    method: string,
    url: string,
    body?: unknown,
    config: RequestConfig = {},
    retried = false,
  ): Promise<T> {
    const { requiresAuth = true, headers: customHeaders, ...rest } = config;
    const headers = new Headers(customHeaders);
    if (requiresAuth) {
      const accessToken = useAuthStore.getState().tokens?.accessToken;
      if (!accessToken) throw new Error("No hay una sesión activa");
      headers.set("Authorization", `Bearer ${accessToken}`);
    }
    if (body !== undefined && !(body instanceof FormData)) {
      headers.set("Content-Type", "application/json");
    }

    const response = await fetch(this.resolveUrl(url), {
      ...rest,
      method,
      headers,
      body:
        body === undefined
          ? undefined
          : body instanceof FormData
            ? body
            : JSON.stringify(body),
    });

    if (response.status === 401 && requiresAuth && !retried) {
      await useAuthStore.getState().checkAuth();
      if (useAuthStore.getState().tokens?.accessToken) {
        return this.request<T>(method, url, body, config, true);
      }
    }

    if (!response.ok) {
      let message = `Error HTTP ${response.status}`;
      try {
        const payload = await response.json();
        message = Array.isArray(payload.message)
          ? payload.message.join(". ")
          : payload.message || payload.error || message;
      } catch {
        const text = await response.text();
        if (text) message = text;
      }
      if (response.status === 401) {
        await useAuthStore.getState().logout();
        message = "Tu sesión expiró. Inicia sesión nuevamente.";
      }
      if (response.status === 403)
        message = "No tienes permisos para realizar esta acción.";
      throw new Error(message);
    }

    if (response.status === 204) return undefined as T;
    const contentType = response.headers.get("content-type");
    return (
      contentType?.includes("application/json")
        ? await response.json()
        : await response.text()
    ) as T;
  }

  get<T>(url: string, config?: RequestConfig): Promise<T> {
    return this.request<T>("GET", url, undefined, config);
  }

  post<T>(url: string, data?: unknown, config?: RequestConfig): Promise<T> {
    return this.request<T>("POST", url, data, config);
  }

  put<T>(url: string, data?: unknown, config?: RequestConfig): Promise<T> {
    return this.request<T>("PUT", url, data, config);
  }

  patch<T>(url: string, data?: unknown, config?: RequestConfig): Promise<T> {
    return this.request<T>("PATCH", url, data, config);
  }

  delete<T>(url: string, config?: RequestConfig): Promise<T> {
    return this.request<T>("DELETE", url, undefined, config);
  }

  upload<T>(url: string, file: File, config?: RequestConfig): Promise<T> {
    const form = new FormData();
    form.append("file", file);
    return this.request<T>("POST", url, form, config);
  }

  uploadForm<T>(
    url: string,
    form: FormData,
    config?: RequestConfig,
  ): Promise<T> {
    return this.request<T>("POST", url, form, config);
  }
}

export const httpClient = new HttpClient(
  import.meta.env.VITE_API_URL || "http://127.0.0.1:3000",
);

export function useHttpClient() {
  return httpClient;
}
