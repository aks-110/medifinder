import { createContext, useContext, useEffect, useState, useCallback } from "react";
import client from "../api/client.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("mf_access_token");
    if (!token) {
      setLoading(false);
      return;
    }
    client
      .get("/auth/me")
      .then(({ data }) => setUser(data))
      .catch(() => {
        localStorage.removeItem("mf_access_token");
        localStorage.removeItem("mf_refresh_token");
      })
      .finally(() => setLoading(false));
  }, []);

  const persistSession = ({ user, accessToken, refreshToken }) => {
    localStorage.setItem("mf_access_token", accessToken);
    localStorage.setItem("mf_refresh_token", refreshToken);
    setUser(user);
  };

  const login = useCallback(async (email, password) => {
    const { data } = await client.post("/auth/login", { email, password });
    persistSession(data);
    return data.user;
  }, []);

  const register = useCallback(async (payload) => {
    const { data } = await client.post("/auth/register", payload);
    persistSession(data);
    return data.user;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("mf_access_token");
    localStorage.removeItem("mf_refresh_token");
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
