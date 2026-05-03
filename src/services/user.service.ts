import { apiService } from "./api";
import { UserGroupModel } from "./usergroup.service";

export type { UserGroupModel };

export interface UserModel {
  id: number;
  username: string;
  email: string;
  userGroupIds: number[];
}

export interface CreateUserPayload {
  username: string;
  email: string;
  userGroupIds: number[];
}

export interface KeycloakLookupResult {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
}

export const userService = {
  getAll$: () => apiService.get$<UserModel[]>("/User"),
  getGroups$: () => apiService.get$<UserGroupModel[]>("/UserGroup"),
  create$: (payload: CreateUserPayload) => apiService.post$<UserModel>("/User", payload),
  lookupKeycloakUser$: (email: string) =>
    apiService.get$<KeycloakLookupResult>(`/User/keycloak/lookup?email=${encodeURIComponent(email)}`),
};
