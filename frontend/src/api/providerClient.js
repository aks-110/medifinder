import axios from "axios";

const providerClient = axios.create({ baseURL: "/api" });

providerClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("mf_provider_access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default providerClient;
