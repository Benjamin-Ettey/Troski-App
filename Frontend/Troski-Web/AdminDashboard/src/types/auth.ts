export interface AdminUser {
  id: string;
  name: string;
  email: string;
}

export interface Session {
  token: string;
  expiresAt: number; // timestamp in ms
  admin: AdminUser;
}