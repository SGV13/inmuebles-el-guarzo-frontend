import { api } from "./axios";

export const getCurrentUser = async (token: string) => {
  const response = await api.get("/v1/me", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
};
