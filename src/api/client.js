import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
});

export const topicsAPI = {
  getAll: () => api.get('/topics').then((r) => r.data),
  getOne: (id) => api.get(`/topics/${id}`).then((r) => r.data),
  delete: (id) => api.delete(`/topics/${id}`).then((r) => r.data),
};

export const uploadAPI = {
  upload: (formData) => api.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then((r) => r.data),
};

export const studyAPI = {
  getDueCards: () => api.get('/study/due').then((r) => r.data),
  reviewCard: (cardId, quality) => api.post(`/study/review/${cardId}`, { quality }).then((r) => r.data),
  getFlashcards: (topicId) => api.get(`/study/flashcards/${topicId}`).then((r) => r.data),
  getQuiz: (topicId) => api.get(`/study/quiz/${topicId}`).then((r) => r.data),
  sendMessage: (topicId, message) => api.post(`/study/discuss/${topicId}`, { message }).then((r) => r.data),
  getHistory: (topicId) => api.get(`/study/discuss/${topicId}/history`).then((r) => r.data),
  clearHistory: (topicId) => api.delete(`/study/discuss/${topicId}/history`).then((r) => r.data),
};
