import axios from "axios";

const adminClient = axios.create({ baseURL: import.meta.env.VITE_API_URL || "/api" });

adminClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("mf_admin_access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default adminClient;
