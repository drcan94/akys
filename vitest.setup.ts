import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
  })),
  useSearchParams: vi.fn(() => ({
    get: vi.fn(),
  })),
  usePathname: vi.fn(),
}));

// Mock next-auth
vi.mock('next-auth', () => ({
  getServerSession: vi.fn(() => null),
}));

// Mock environment variables
process.env = {
  ...process.env,
  NEXT_PUBLIC_PUSHER_KEY: 'test-key',
  NEXT_PUBLIC_PUSHER_CLUSTER: 'test-cluster',
};

// Suppress console errors during tests
console.error = vi.fn();