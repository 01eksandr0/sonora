export interface User {
  id: string
  email: string
  onboardingCompleted: boolean
  createdAt: string
  updatedAt: string
}

export interface UserProfile {
  id: string
  userId: string
  displayName: string | null
  avatarUrl: string | null
  createdAt: string
  updatedAt: string
}

export interface UserWithProfile extends User {
  profile: UserProfile | null
}

export interface AuthResponse {
  user: UserWithProfile
  accessToken: string
}

export interface RegisterRequest {
  email: string
  password: string
  displayName?: string
}

export interface LoginRequest {
  email: string
  password: string
}
