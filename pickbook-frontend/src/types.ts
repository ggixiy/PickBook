// Всі типи даних які приходять з API

export interface User {
  username: string;
  role: 'AUTHOR' | 'READER';
}

export interface AuthResponse {
  accessToken: string;
  username: string;
  role: string;
}

export interface MusicMarker {
  id?: number;
  charPosition: number;  // Позиція в тексті де починається музика
  musicUrl: string;      // YouTube або SoundCloud посилання
  trackTitle?: string;
}

export interface Comment {
  id: number;
  text: string;
  username: string;
  createdAt: string;
}

export interface Work {
  id: number;
  title: string;
  content: string;       // Може бути превью або повний текст
  description?: string;
  genre?: 'STORY' | 'POEM' | 'ESSAY';
  authorUsername: string;
  authorId: number;
  createdAt: string;
  averageRating?: number;
  ratingsCount?: number;
  musicMarkers?: MusicMarker[];
  comments?: Comment[];
}

export interface WorkRequest {
  title: string;
  content: string;
  description?: string;
  genre?: string;
  musicMarkers?: MusicMarker[];
}

export interface Page<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  number: number;  // Поточна сторінка
}
