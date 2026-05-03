import { Observable, from, defer } from "rxjs";
import { map, switchMap } from "rxjs/operators";
import { userManager } from "../auth/oidc";

const API_BASE = process.env.REACT_APP_API_BASE_URL || "http://localhost:5000/api/v1";

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
          body.append("subject_token", user.access_token); // <-- add this line

          return from(
            fetch(`${API_BASE}/Auth/token`, {
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
              return response.json() as Promise<AppTokenResponse>;
            })
          );
        })
      )
    );
  },
};
