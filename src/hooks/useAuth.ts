import { supabase } from "../lib/supabase";

export const logout = async () => {
  await supabase.auth.signOut();

  localStorage.removeItem("token");
  localStorage.removeItem("user");

  window.location.href = "/admin/login";
};
