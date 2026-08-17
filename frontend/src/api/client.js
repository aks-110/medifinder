import axios from "axios";

const envURL = import.meta.env.VITE_API_URL || "/api";
const baseURL = envURL.startsWith("http") && !envURL.endsWith("/api") 
  ? envURL.replace(/\/$/, "") + "/api" 
  : envURL;
const client = axios.create({ baseURL });

client.interceptors.request.use((config) => {
  const token = localStorage.getItem("mf_access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

client.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refreshToken = localStorage.getItem("mf_refresh_token");
      if (refreshToken) {
        try {
          const { data } = await axios.post(`${baseURL}/auth/refresh`, { refreshToken });
          localStorage.setItem("mf_access_token", data.accessToken);
          original.headers.Authorization = `Bearer ${data.accessToken}`;
          return client(original);
        } catch {
          localStorage.removeItem("mf_access_token");
          localStorage.removeItem("mf_refresh_token");
        }
      }
    }
    return Promise.reject(error);
  }
);

export default client;
