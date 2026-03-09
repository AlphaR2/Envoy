// Re-export all backend entity types
export * from './api';

// Local UI alias — maps to backend UserType
export type UserRole = 'client' | 'owner' | null;
