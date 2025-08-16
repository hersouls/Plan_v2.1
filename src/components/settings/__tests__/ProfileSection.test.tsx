import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { ProfileSection } from '../ProfileSection';
import { AuthProvider } from '../../../contexts/AuthContext';
import { DataProvider } from '../../../contexts/DataContext';

// Mock Firebase Storage
vi.mock('../../../lib/storage', () => ({
  uploadAvatarImage: vi.fn(),
  deleteAvatarImage: vi.fn(),
}));

// Mock Firestore
vi.mock('../../../lib/firestore', () => ({
  userService: {
    getUserProfile: vi.fn(),
    createOrUpdateUserProfile: vi.fn(),
  },
}));

// Mock Auth Context
const mockUser = {
  uid: 'test-user-id',
  email: 'test@example.com',
  displayName: 'Test User',
  photoURL: null,
  metadata: {
    creationTime: '2024-01-01T00:00:00.000Z',
  },
};

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <AuthProvider>
      <DataProvider>
        {component}
      </DataProvider>
    </AuthProvider>
  );
};

describe('ProfileSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders profile section with user information', async () => {
    renderWithProviders(<ProfileSection />);
    
    await waitFor(() => {
      expect(screen.getByText('프로필 정보')).toBeInTheDocument();
      expect(screen.getByText('Test User')).toBeInTheDocument();
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
    });
  });

  it('shows edit mode when edit button is clicked', async () => {
    renderWithProviders(<ProfileSection />);
    
    const editButton = screen.getByText('편집');
    fireEvent.click(editButton);
    
    await waitFor(() => {
      expect(screen.getByText('취소')).toBeInTheDocument();
      expect(screen.getByText('저장')).toBeInTheDocument();
    });
  });

  it('allows avatar upload when in edit mode', async () => {
    renderWithProviders(<ProfileSection />);
    
    // Enter edit mode
    const editButton = screen.getByText('편집');
    fireEvent.click(editButton);
    
    await waitFor(() => {
      const fileInput = screen.getByRole('button', { name: /camera/i });
      expect(fileInput).toBeInTheDocument();
    });
  });

  it('displays avatar initials when no avatar is set', async () => {
    renderWithProviders(<ProfileSection />);
    
    await waitFor(() => {
      expect(screen.getByText('TU')).toBeInTheDocument(); // Test User initials
    });
  });

  it('shows profile completion percentage', async () => {
    renderWithProviders(<ProfileSection />);
    
    await waitFor(() => {
      expect(screen.getByText('프로필 완성도')).toBeInTheDocument();
      expect(screen.getByText(/^\d+%$/)).toBeInTheDocument(); // Percentage format
    });
  });
});
