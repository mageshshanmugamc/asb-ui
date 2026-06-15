import { apiService } from "./api";

export interface CountryModel {
  id: number;
  code: string;
  name: string;
  market: string;
}

export interface CreateCountryPayload {
  code: string;
  name: string;
  market: string;
}

export interface UpdateCountryPayload {
  code: string;
  name: string;
  market: string;
}

export const countryService = {
  getAll$: () => apiService.get$<CountryModel[]>("/countries"),
  getById$: (id: number) => apiService.get$<CountryModel>(`/countries/${id}`),
  create$: (payload: CreateCountryPayload) => apiService.post$<CountryModel>("/countries", payload),
  update$: (id: number, payload: UpdateCountryPayload) => apiService.put$<CountryModel>(`/countries/${id}`, payload),
  delete$: (id: number) => apiService.delete$<void>(`/countries/${id}`),
};
