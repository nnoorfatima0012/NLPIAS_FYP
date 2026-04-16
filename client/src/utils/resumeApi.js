// // client/src/utils/resumeApi.js
// import axios from "axios";

// // 🔧 Base API URL (use Vite env if available, fallback to localhost)
// const API_BASE = import.meta?.env?.VITE_API_BASE || "http://127.0.0.1:5000";

// // 🔐 Attach Authorization header if token exists
// function authHeaders() {
//   const token = localStorage.getItem("token");
//   return token ? { Authorization: `Bearer ${token}` } : {};
// }

// // Axios instance for all resume-related endpoints
// const API = axios.create({
//   baseURL: `${API_BASE}/api/resume`,
// });

// // ✅ Save resume form data (JSON resume)
// export const saveResumeToDB = (userId, data) =>
//   API.post(
//     "/submit",
//     { userId, ...data },
//     {
//       headers: {
//         ...authHeaders(),
//       },
//     }
//   );

// // ✅ Fetch resume + uploaded files for a user
// export const fetchResumeFromDB = (userId) =>
//   API.get(`/get/${userId}`, {
//     headers: {
//       ...authHeaders(),
//     },
//   });

// // ✅ Upload a resume file (manual upload)
// export const uploadResumeFile = (formData) =>
//   API.post("/upload", formData, {
//     headers: {
//       "Content-Type": "multipart/form-data",
//       ...authHeaders(),
//     },
//   });

// // ✅ Delete a specific uploaded resume file by fileId
// export const deleteUploadedFile = (userId, fileId) =>
//   API.delete(`/delete/${userId}/${fileId}`, {
//     headers: {
//       ...authHeaders(),
//     },
//   });

// // 🆕 Delete the default JSON resume + generated PDF for this user
// export const deleteDefaultResume = (userId) =>
//   API.delete(`/${userId}`, {
//     headers: {
//       ...authHeaders(),
//     },
//   });

// // client/src/utils/resumeApi.js
import { api } from "./api";

export const getApplicationResumeBlob = (appId) =>
  api.get(`/applications/${appId}/resume`, {
    responseType: "blob",
  });

// Save self resume
export const saveResumeToDB = (data) => api.post("/resume/me", data);

// Fetch self resume
export const fetchResumeFromDB = () => api.get("/resume/me");

// Get self resume PDF
export const getResumePdf = (templateId = "classic") =>
  api.get(`/resume/me/pdf?templateId=${encodeURIComponent(templateId)}`, {
    responseType: "blob",
  });

// Upload self resume file
export const uploadResumeFile = (formData) =>
  api.post("/resume/me/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

// Delete uploaded self resume file
export const deleteUploadedFile = (fileId) =>
  api.delete(`/resume/me/upload/${fileId}`);

// Delete self default resume
export const deleteDefaultResume = () => api.delete("/resume/me");

// Optional AI render route
export const renderResume = (payload) => api.post("/resume/render", payload);
