import { apiService } from "./api";

export interface RoleModel {
  id: number;
  name: string;
}

export interface CreateRolePayload {
  name: string;
}

export interface UpdateRolePayload {
  name: string;
}

export const roleService = {
  getAll$: () => apiService.get$<RoleModel[]>("/Role"),
  getById$: (id: number) => apiService.get$<RoleModel>(`/Role/${id}`),
  create$: (payload: CreateRolePayload) => apiService.post$<RoleModel>("/Role", payload),
  update$: (id: number, payload: UpdateRolePayload) => apiService.put$<RoleModel>(`/Role/${id}`, payload),
  delete$: (id: number) => apiService.delete$<void>(`/Role/${id}`),
};
