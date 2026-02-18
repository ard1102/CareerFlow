import axios from 'axios';
import { getAuthHeader } from '../context/AuthContext';

const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const headers = getAuthHeader();
  config.headers = { ...config.headers, ...headers };
  return config;
});

// Jobs API
export const jobsApi = {
  getAll: () => api.get('/jobs'),
  get: (id) => api.get(`/jobs/${id}`),
  create: (data) => api.post('/jobs', data),
  update: (id, data) => api.put(`/jobs/${id}`, data),
  delete: (id) => api.delete(`/jobs/${id}`),
};

// Companies API
export const companiesApi = {
  getAll: () => api.get('/companies'),
  get: (id) => api.get(`/companies/${id}`),
  create: (data) => api.post('/companies', data),
  delete: (id) => api.delete(`/companies/${id}`),
};

// Contacts API
export const contactsApi = {
  getAll: () => api.get('/contacts'),
  create: (data) => api.post('/contacts', data),
  delete: (id) => api.delete(`/contacts/${id}`),
};

// Chat API
export const chatApi = {
  send: (message, session_id) => api.post('/chat/send', { message, session_id }),
  getHistory: (session_id) => api.get('/chat/history', { params: { session_id } }),
};

// LLM Config API
export const llmConfigApi = {
  get: () => api.get('/llm-config'),
  create: (data) => api.post('/llm-config', data),
};

// Todos API
export const todosApi = {
  getAll: () => api.get('/todos'),
  create: (data) => api.post('/todos', data),
  toggle: (id) => api.put(`/todos/${id}`),
  delete: (id) => api.delete(`/todos/${id}`),
};

// Knowledge API
export const knowledgeApi = {
  getAll: () => api.get('/knowledge'),
  create: (data) => api.post('/knowledge', data),
  delete: (id) => api.delete(`/knowledge/${id}`),
};

// Prompts API
export const promptsApi = {
  getAll: () => api.get('/prompts'),
  create: (data) => api.post('/prompts', data),
  delete: (id) => api.delete(`/prompts/${id}`),
};

// Analytics API
export const analyticsApi = {
  getDashboard: () => api.get('/analytics/dashboard'),
};

export default api;