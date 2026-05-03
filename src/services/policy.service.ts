import { apiService } from "./api";

export interface PolicyModel {
  id: number;
  name: string;
  description: string;
  resource: string;
  action: string;
}

export interface CreatePolicyPayload {
  name: string;
  description: string;
  resource: string;
  action: string;
}

export interface UpdatePolicyPayload {
  name: string;
  description: string;
  resource: string;
  action: string;
}

export const policyService = {
  getAll$: () => apiService.get$<PolicyModel[]>("/Policy"),
  getById$: (id: number) => apiService.get$<PolicyModel>(`/Policy/${id}`),
  create$: (payload: CreatePolicyPayload) => apiService.post$<PolicyModel>("/Policy", payload),
  update$: (id: number, payload: UpdatePolicyPayload) => apiService.put$<PolicyModel>(`/Policy/${id}`, payload),
  delete$: (id: number) => apiService.delete$<void>(`/Policy/${id}`),
};
