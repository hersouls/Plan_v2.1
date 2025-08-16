import { User } from 'firebase/auth';
import { Trip } from './trip';

export interface AppState {
  user: User | null;
  trips: Trip[];
  currentTrip: Trip | null;
  isLoading: boolean;
  error: string | null;
}

export interface AppContextType extends AppState {
  setCurrentTrip: (trip: Trip | null) => void;
  refreshTrips: () => Promise<void>;
  clearError: () => void;
}