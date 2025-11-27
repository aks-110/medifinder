import { createContext, useContext, useEffect, useState, useCallback } from "react";
import providerClient from "../api/providerClient.js";

const Ctx = createContext(null);

export function ProviderAuthProvider({ children }) {
  const [account, setAccount] = useState(() => {
    const raw = localStorage.getItem("mf_provider_account");
    return raw ? JSON.parse(raw) : null;
  });
  const [loading, setLoading] = useState(false);

  const login = useCallback(async (email, password) => {
    const { data } = await providerClient.post("/provider-auth/login", { email, password });
    localStorage.setItem("mf_provider_access_token", data.accessToken);
    localStorage.setItem("mf_provider_account", JSON.stringify(data.account));
    setAccount(data.account);
    return data.account;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("mf_provider_access_token");
    localStorage.removeItem("mf_provider_account");
    setAccount(null);
  }, []);

  return <Ctx.Provider value={{ account, loading, login, logout }}>{children}</Ctx.Provider>;
}

export function useProviderAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useProviderAuth must be used within ProviderAuthProvider");
  return ctx;
}
