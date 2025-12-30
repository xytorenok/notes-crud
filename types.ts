
export interface User {
  id: string;
  email: string;
  password?: string;
}

export interface Note {
  id: string;
  userId: string;
  content: string;
  createdAt: number;
  updatedAt: number;
}

export type AuthState = 'login' | 'signup' | 'authenticated';
