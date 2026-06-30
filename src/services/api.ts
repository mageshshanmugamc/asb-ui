import { Observable, from, defer } from "rxjs";
import { switchMap } from "rxjs/operators";
import { userManager } from "../auth/oidc";

const BASE_URL = (window as any).__ENV__?.REACT_APP_BASE_URL || "http://localhost:5057";
const API_BASE = `${BASE_URL}/api/v1`;

function getAuthHeaders(): HeadersInit {
  const headers: HeadersInit = { "Content-Type": "application/json" };
  const appToken = sessionStorage.getItem("app_token");
  if (appToken) {
    headers["Authorization"] = `Bearer ${appToken}`;
  }
  return headers;
}

function request$<T>(path: string, init?: RequestInit): Observable<T> {
  return defer(() =>
    from(
      fetch(`${API_BASE}${path}`, {
        ...init,
        headers: { ...getAuthHeaders(), ...init?.headers },
      }).then((response) => {
        if (!response.ok) {
          throw new Error(`API error ${response.status}: ${response.statusText}`);
        }
        if (response.status === 204) {
          return undefined as T;
        }
        return response.json() as Promise<T>;
      })
    )
  );
}

export const apiService = {
  get$<T>(path: string): Observable<T> {
    return request$<T>(path, { method: "GET" });
  },

  post$<T>(path: string, body: unknown): Observable<T> {
    return request$<T>(path, { method: "POST", body: JSON.stringify(body) });
  },

  put$<T>(path: string, body: unknown): Observable<T> {
    return request$<T>(path, { method: "PUT", body: JSON.stringify(body) });
  },

  delete$<T>(path: string): Observable<T> {
    return request$<T>(path, { method: "DELETE" });
  },
};
