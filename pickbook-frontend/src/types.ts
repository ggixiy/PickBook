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
  charPosition: number;      // початок виділеного фрагменту
  charPositionEnd?: number;  // кінець виділеного фрагменту
  musicUrl: string;
  trackTitle?: string;
  startTime?: number;        // секунда відео з якої починати
  endTime?: number;          // секунда відео до якої грати
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
  content: string;
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
  number: number;
}
