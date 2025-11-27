import { createContext, useContext, useState, useCallback } from "react";
import adminClient from "../api/adminClient.js";

const Ctx = createContext(null);

export function AdminAuthProvider({ children }) {
  const [account, setAccount] = useState(() => {
    const raw = localStorage.getItem("mf_admin_account");
    return raw ? JSON.parse(raw) : null;
  });

  const login = useCallback(async (email, password) => {
    const { data } = await adminClient.post("/admin-auth/login", { email, password });
    localStorage.setItem("mf_admin_access_token", data.accessToken);
    localStorage.setItem("mf_admin_account", JSON.stringify(data.account));
    setAccount(data.account);
    return data.account;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("mf_admin_access_token");
    localStorage.removeItem("mf_admin_account");
    setAccount(null);
  }, []);

  return <Ctx.Provider value={{ account, login, logout }}>{children}</Ctx.Provider>;
}

export function useAdminAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAdminAuth must be used within AdminAuthProvider");
  return ctx;
}
