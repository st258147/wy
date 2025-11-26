export interface User {
  id: number;
  uid: string; // 8-digit unique identifier
  username: string;
  email: string;
  avatar_url?: string;
  bio?: string;
  role: 'user' | 'admin' | 'manager';
  created_at: string;
}

export interface Article {
  id: number;
  user_id: number;
  title: string;
  content: string;
  tags: string[]; // Simplification for frontend: storing tags as array of strings
  views: number;
  created_at: string;
  author?: User; // Populated on fetch
  likes_count?: number;
  comments_count?: number;
  is_liked?: boolean;
}

export interface Comment {
  id: number;
  article_id: number;
  user_id: number;
  content: string;
  parent_id: number | null;
  created_at: string;
  author?: User;
}

export interface Like {
  id: number;
  user_id: number;
  article_id: number;
}

export interface Follow {
  id: number;
  follower_id: number; // Who is following
  following_id: number; // Who is being followed
  created_at: string;
}