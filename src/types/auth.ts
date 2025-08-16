import { User as FirebaseUser } from 'firebase/auth';
import { User } from './user';

// 확장된 User 타입
export interface ExtendedUser extends FirebaseUser {
  name?: string;
  joinDate?: string;
}

export interface AuthState {
  user: ExtendedUser | null;
  userProfile: User | null;
  loading: boolean;
  error: string | null;
}

export interface AuthContextType {
  user: ExtendedUser | null;
  userProfile: User | null;
  loading: boolean;
  error: string | null;
  signInAnonymously: () => Promise<void>;
  signInWithEmailAndPassword: (email: string, password: string) => Promise<void>;
  signUpWithEmailAndPassword: (email: string, password: string, displayName?: string) => Promise<any>;
  signInWithGoogle: () => Promise<void>;
  signInWithGithub: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
  signOut: () => Promise<{ success: boolean; error?: string }>;
  updateUserProfile: (updates: Partial<User>) => Promise<void>;
  refreshUserProfile: () => Promise<void>;
}