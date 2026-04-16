// // client/src/utils/mockApi.js
// import { api } from "./api";

// // Start session
// export const mockStart = (payload) => api.post("/mock/start", payload);

// // Load a session
// export const mockGetSession = (sessionId) => api.get(`/mock/session/${sessionId}`);

// // Submit an answer
// export const mockSubmitAnswer = (payload) => api.post("/mock/answer", payload);

// // Finish session
// export const mockFinish = (sessionId) => api.post("/mock/finish", { sessionId });

// // Analytics
// export const mockAnalytics = (userId) => api.get(`/mock/analytics?userId=${encodeURIComponent(userId)}`);

// // client/src/utils/mockApi.js
import { api } from "./api";

export const mockStart = (payload) => api.post("/mock/start", payload);

export const mockGetSession = (sessionId) => api.get(`/mock/session/${sessionId}`);

export const mockSubmitAnswer = (payload) => api.post("/mock/answer", payload);

export const mockFinish = (sessionId) => api.post("/mock/finish", { sessionId });

export const mockAnalytics = () => api.get("/mock/analytics");