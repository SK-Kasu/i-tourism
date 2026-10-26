import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "/api",
  withCredentials: true, // sends the httpOnly auth cookie on every request
});

// Surfaces a consistent { code, message } shape to callers regardless of
// whether the error came from the network or from the API's error handler.
api.interceptors.response.use(
  (res) => res,
  (error) => {
    const code = error.response?.data?.code || "NETWORK_ERROR";
    const message = error.response?.data?.message || "Something went wrong. Please try again.";
    return Promise.reject({ code, message, status: error.response?.status });
  }
);
