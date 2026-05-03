import { apiService } from "./api";

export interface MenuItemModel {
  id: number;
  name: string;
  route: string;
  icon?: string;
  displayOrder: number;
  children: MenuItemModel[];
}

export interface CreateMenuPayload {
  name: string;
  route: string;
  icon?: string;
  displayOrder: number;
  parentId?: number | null;
}

export interface UpdateMenuPayload {
  name: string;
  route: string;
  icon?: string;
  displayOrder: number;
  parentId?: number | null;
}

export const menuService = {
  getAll$: () => apiService.get$<MenuItemModel[]>("/Menu"),
  getById$: (id: number) => apiService.get$<MenuItemModel>(`/Menu/${id}`),
  create$: (payload: CreateMenuPayload) => apiService.post$<MenuItemModel>("/Menu", payload),
  update$: (id: number, payload: UpdateMenuPayload) => apiService.put$<MenuItemModel>(`/Menu/${id}`, payload),
  delete$: (id: number) => apiService.delete$<void>(`/Menu/${id}`),
};
