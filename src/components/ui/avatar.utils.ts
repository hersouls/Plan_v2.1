export const getAvatarInitials = (name?: string, email?: string): string => {
  if (!name && !email) return 'U';

  const displayName = name || email || '';
  const parts = displayName.trim().split(' ');

  if (parts.length > 1) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }

  return displayName.substring(0, 2).toUpperCase();
};

export default getAvatarInitials;
