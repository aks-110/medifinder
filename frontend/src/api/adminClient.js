import axios from "axios";

const adminClient = axios.create({ baseURL: "/api" });

adminClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("mf_admin_access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default adminClient;
