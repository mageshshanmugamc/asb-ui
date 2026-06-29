import { Observable, from, defer } from "rxjs";
import { switchMap } from "rxjs/operators";
import { userManager } from "../auth/oidc";

const API_BASE = (window as any).__ENV__?.REACT_APP_BASE_URL  || "http://localhost:5057";
const API_VERSION = (window as any).__ENV__?.BACKEND_API_VERSION ||  "/api/v1";

export interface MenuModel {
  id: number;
  name: string;
  route: string;
  icon?: string;
  displayOrder: number;
  children: MenuModel[];
}

export interface AppTokenResponse {
  access_token: string;
  token_type: string;
  expires_at: string;
  roles: string[];
  menus: MenuModel[];
}

interface TokenApiResponse {
  access_token: string;
  token_type: string;
  expires_at: string;
}

function decodeJwtPayload(token: string): Record<string, unknown> {
  const base64Url = token.split(".")[1];
  const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  const jsonPayload = decodeURIComponent(
    atob(base64)
      .split("")
      .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
      .join("")
  );
  return JSON.parse(jsonPayload);
}

export const authService = {
  /**
   * Exchange the Keycloak token for an app token.
   * Sends as application/x-www-form-urlencoded per standard token exchange protocol.
   */
  exchangeToken$(): Observable<AppTokenResponse> {
    return defer(() =>
      from(userManager.getUser()).pipe(
        switchMap((user) => {
          if (!user?.access_token) {
            throw new Error("No Keycloak token available.");
          }

          const body = new URLSearchParams();
          body.append("grant_type", "urn:ietf:params:oauth:grant-type:token-exchange");
          body.append("subject_token", user.access_token);

          return from(
            fetch(`${API_BASE}${API_VERSION}/Auth/token`, {
              method: "POST",
              headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                Authorization: `Bearer ${user.access_token}`,
              },
              body: body.toString(),
            }).then((response) => {
              if (response.status === 404) {
                throw new Error("You don't have access. Please contact administrator.");
              }
              if (!response.ok) {
                throw new Error(`Token exchange failed: ${response.status}`);
              }
              return response.json() as Promise<TokenApiResponse>;
            }).then((data) => {
              const payload = decodeJwtPayload(data.access_token);

              const menus: MenuModel[] = payload.menus
                ? JSON.parse(payload.menus as string)
                : [];

              const roles: string[] = payload.roles
                ? (payload.roles as string).split(",").map((r) => r.trim())
                : [];

              return {
                access_token: data.access_token,
                token_type: data.token_type,
                expires_at: data.expires_at,
                roles,
                menus,
              } as AppTokenResponse;
            })
          );
        })
      )
    );
  },
};
