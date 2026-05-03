import { apiService } from "./api";

export interface UserGroupUserModel {
  id: number;
  username: string;
  email: string;
  userGroupId: number | null;
}

export interface UserGroupRoleModel {
  id: number;
  name: string;
}

export interface UserGroupModel {
  id: number;
  groupName: string;
  users: UserGroupUserModel[];
  roles: UserGroupRoleModel[];
}

export interface CreateUserGroupPayload {
  groupName: string;
  roleIds: number[];
}

export interface UpdateUserGroupPayload {
  groupName: string;
  roleIds: number[];
}

export const userGroupService = {
  getAll$: () => apiService.get$<UserGroupModel[]>("/UserGroup"),
  getById$: (id: number) => apiService.get$<UserGroupModel>(`/UserGroup/${id}`),
  create$: (payload: CreateUserGroupPayload) => apiService.post$<UserGroupModel>("/UserGroup", payload),
  update$: (id: number, payload: UpdateUserGroupPayload) => apiService.put$<UserGroupModel>(`/UserGroup/${id}`, payload),
  delete$: (id: number) => apiService.delete$<void>(`/UserGroup/${id}`),
};
