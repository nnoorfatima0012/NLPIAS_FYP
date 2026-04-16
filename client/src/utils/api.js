
// // //src/utils/api.js
// // import axios from 'axios';

// // export const api = axios.create({
// //   baseURL: 'http://127.0.0.1:5000/api',
// //   withCredentials: true,
// // });

// // api.interceptors.request.use(
// //   (config) => {
// //     const token = localStorage.getItem('token');
// //     if (token) {
// //       config.headers.Authorization = `Bearer ${token}`;
// //     }
// //     return config;
// //   },
// //   (error) => Promise.reject(error)
// // );

// // api.interceptors.response.use(
// //   (res) => res,
// //   async (error) => {
// //     const originalRequest = error.config;

// //     if (
// //       error.response?.status === 401 &&
// //       !originalRequest._retry &&
// //       !originalRequest.url?.includes('/auth/login') &&
// //       !originalRequest.url?.includes('/auth/signup') &&
// //       !originalRequest.url?.includes('/auth/refresh')
// //     ) {
// //       originalRequest._retry = true;

// //       try {
// //         const res = await api.post('/auth/refresh');
// //         const newToken = res.data.accessToken;

// //         localStorage.setItem('token', newToken);

// //         originalRequest.headers.Authorization = `Bearer ${newToken}`;
// //         return api(originalRequest);
// //       } catch {
// //         localStorage.clear();
// //         window.location.href = '/login';
// //       }
// //     }

// //     return Promise.reject(error);
// //   }
// // );

// // client/src/utils/api.js
// import axios from "axios";

// export const api = axios.create({
//   baseURL: "http://127.0.0.1:5000/api",
//   withCredentials: true,
// });

// api.interceptors.response.use(
//   (res) => res,
//   async (error) => {
//     const originalRequest = error.config;

//     if (
//       error.response?.status === 401 &&
//       !originalRequest._retry &&
//       !originalRequest.url?.includes("/auth/login") &&
//       !originalRequest.url?.includes("/auth/signup") &&
//       !originalRequest.url?.includes("/auth/refresh")
//     ) {
//       originalRequest._retry = true;

//       try {
//         await api.post("/auth/refresh");
//         return api(originalRequest);
//       } catch (refreshError) {
//         localStorage.removeItem("role");
//         localStorage.removeItem("name");
//         localStorage.removeItem("userId");
//         localStorage.removeItem("status");
//         localStorage.removeItem("emailVerified");
//         localStorage.removeItem("onboardingStep");
//         window.location.href = "/login";
//         return Promise.reject(refreshError);
//       }
//     }

//     return Promise.reject(error);
//   }
// );

//client/src/utils/api.js
import axios from "axios";

export const api = axios.create({
  baseURL: "http://localhost:5000/api",
  withCredentials: true,
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config;

    if (!originalRequest) {
      return Promise.reject(error);
    }

    const url = originalRequest.url || "";
    const isAuthRoute =
      url.includes("/auth/login") ||
      url.includes("/auth/signup") ||
      url.includes("/auth/refresh") ||
      url.includes("/auth/me");

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !isAuthRoute
    ) {
      originalRequest._retry = true;

      try {
        await api.post("/auth/refresh");
        return api(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem("role");
        localStorage.removeItem("name");
        localStorage.removeItem("userId");
        localStorage.removeItem("status");
        localStorage.removeItem("emailVerified");
        localStorage.removeItem("onboardingStep");

        if (window.location.pathname !== "/login") {
          window.location.href = "/login";
        }

        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);