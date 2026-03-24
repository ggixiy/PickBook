import api from './client';
import type { AuthResponse, Work, WorkRequest, Comment, Page } from '../types';

// --- AUTH ---
export const register = (data: {
  email: string; username: string; password: string; role: string;
}) => api.post<AuthResponse>('/auth/register', data).then(r => r.data);

export const login = (data: { email: string; password: string }) =>
  api.post<AuthResponse>('/auth/login', data).then(r => r.data);

// --- WORKS ---
export const getWorks = (page = 0, size = 10) =>
  api.get<Page<Work>>(`/works?page=${page}&size=${size}`).then(r => r.data);

export const searchWorks = (query: string, page = 0) =>
  api.get<Page<Work>>(`/works/search?query=${query}&page=${page}`).then(r => r.data);

export const getWork = (id: number) =>
  api.get<Work>(`/works/${id}`).then(r => r.data);

export const getWorksByAuthor = (authorId: number) =>
  api.get<Work[]>(`/works/author/${authorId}`).then(r => r.data);

export const createWork = (data: WorkRequest) =>
  api.post<Work>('/works', data).then(r => r.data);

export const updateWork = (id: number, data: WorkRequest) =>
  api.put<Work>(`/works/${id}`, data).then(r => r.data);

export const deleteWork = (id: number) =>
  api.delete(`/works/${id}`);

// --- COMMENTS & RATINGS ---
export const addComment = (workId: number, text: string) =>
  api.post<Comment>(`/works/${workId}/comments`, { text }).then(r => r.data);

export const rateWork = (workId: number, score: number) =>
  api.post(`/works/${workId}/ratings`, { score });
