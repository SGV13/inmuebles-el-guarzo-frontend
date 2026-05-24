import { api } from "./axios";

export const getCurrentUser = async (token: string) => {
  const response = await api.get("/me", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
};
