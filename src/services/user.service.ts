import { apiService } from "./api";
import { UserGroupModel } from "./usergroup.service";

export type { UserGroupModel };

export interface UserModel {
  id: number;
  username: string;
  email: string;
  userGroupIds: number[];
}

export interface PaginatedResponse<T> {
  items: T[];
  totalCount: number;
  skip: number;
  take: number;
  hasMore: boolean;
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
  getAll$: (params?: { skip?: number; take?: number; sortBy?: string; isDescending?: boolean }) => {
    const query = new URLSearchParams();
    if (params?.skip != null) query.set("skip", String(params.skip));
    if (params?.take != null) query.set("take", String(params.take));
    if (params?.sortBy) query.set("sortBy", params.sortBy);
    if (params?.isDescending != null) query.set("IsDescending", String(params.isDescending));
    const qs = query.toString();
    return apiService.get$<PaginatedResponse<UserModel>>(`/User${qs ? `?${qs}` : ""}`);
  },
  getGroups$: () => apiService.get$<UserGroupModel[]>("/UserGroup"),
  create$: (payload: CreateUserPayload) => apiService.post$<UserModel>("/User", payload),
  lookupKeycloakUser$: (email: string) =>
    apiService.get$<KeycloakLookupResult>(`/User/keycloak/lookup?email=${encodeURIComponent(email)}`),
};
