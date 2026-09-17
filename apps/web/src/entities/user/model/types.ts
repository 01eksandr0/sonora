export interface User {
  id: string
  email: string
  createdAt: string
  updatedAt: string
}

export interface UserProfile {
  userId: string
  displayName: string | null
  avatarUrl: string | null
  createdAt: string
  updatedAt: string
}
