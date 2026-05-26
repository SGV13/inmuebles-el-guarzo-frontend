import { api } from './axios';

export interface FeatureFlags {
  showOwnerContact: boolean;
  showExpectedPrice: boolean;
}

export async function getFeatureFlags(): Promise<FeatureFlags> {
  const response = await api.get<FeatureFlags>('/feature-flags');
  return response.data;
}