# Testing Setup Guide

This guide will help you set up comprehensive testing for the application.

## 📦 Install Testing Dependencies

```bash
npm install --save-dev \
  vitest \
  @testing-library/react \
  @testing-library/jest-dom \
  @testing-library/user-event \
  @vitejs/plugin-react \
  jsdom \
  msw
```

## ⚙️ Configuration Files

### 1. Vitest Config

Create `vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        '.next/',
        'vitest.config.ts',
        'vitest.setup.ts',
        '**/*.d.ts',
        '**/*.config.js',
        '**/types/**',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
});
```

### 2. Vitest Setup

Create `vitest.setup.ts`:

```typescript
import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock environment variables
process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT = 'https://cloud.appwrite.io/v1';
process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID = 'test-project';
process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID = 'test-database';
```

### 3. Update package.json

Add test scripts:

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "test:run": "vitest run"
  }
}
```

## 📁 Test Structure

```
__tests__/
├── unit/
│   ├── lib/
│   │   ├── blog.test.ts
│   │   ├── errorHandler.test.ts
│   │   └── validation/
│   │       └── schemas.test.ts
│   ├── services/
│   │   ├── events.service.test.ts
│   │   └── blog.service.test.ts
│   └── utils/
│       └── errorHandling.test.ts
├── integration/
│   ├── api/
│   │   ├── blog.test.ts
│   │   ├── events.test.ts
│   │   └── auth.test.ts
│   └── components/
│       ├── AuthContext.test.tsx
│       └── AdminAuthGuard.test.tsx
└── e2e/
    ├── auth.spec.ts
    ├── events.spec.ts
    └── blog.spec.ts
```

## 🧪 Example Tests

### Unit Test: Blog Service

Create `__tests__/unit/lib/blog.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { blogService } from '@/lib/blog';

describe('blogService', () => {
  describe('generateSlug', () => {
    it('converts title to lowercase slug', () => {
      expect(blogService.generateSlug('Hello World')).toBe('hello-world');
    });
    
    it('removes special characters', () => {
      expect(blogService.generateSlug('Hello @#$ World!')).toBe('hello-world');
    });
    
    it('handles multiple spaces', () => {
      expect(blogService.generateSlug('Hello    World')).toBe('hello-world');
    });
    
    it('removes leading/trailing hyphens', () => {
      expect(blogService.generateSlug('  Hello World  ')).toBe('hello-world');
    });
  });
  
  describe('calculateReadTime', () => {
    it('calculates read time correctly', () => {
      const content = 'word '.repeat(200); // 200 words
      expect(blogService.calculateReadTime(content)).toBe(1);
    });
    
    it('rounds up partial minutes', () => {
      const content = 'word '.repeat(250); // 250 words = 1.25 minutes
      expect(blogService.calculateReadTime(content)).toBe(2);
    });
    
    it('handles empty content', () => {
      expect(blogService.calculateReadTime('')).toBe(0);
    });
  });
});
```

### Unit Test: Validation Schemas

Create `__tests__/unit/lib/validation/schemas.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { blogPostSchema, eventSchema } from '@/lib/validation/schemas';
import { ZodError } from 'zod';

describe('Validation Schemas', () => {
  describe('blogPostSchema', () => {
    it('validates correct blog post', () => {
      const validBlog = {
        title: 'Valid Blog Title',
        slug: 'valid-blog-title',
        excerpt: 'This is a valid excerpt',
        content: 'This is valid content that is long enough to pass validation requirements.',
        coverImage: 'https://example.com/image.jpg',
        category: 'technology',
        tags: ['tech', 'coding'],
      };
      
      expect(() => blogPostSchema.parse(validBlog)).not.toThrow();
    });
    
    it('rejects title that is too short', () => {
      const invalidBlog = {
        title: 'Hi',
        slug: 'hi',
        excerpt: 'Valid excerpt',
        content: 'Valid content that is long enough',
        coverImage: 'https://example.com/image.jpg',
        category: 'technology',
        tags: ['tech'],
      };
      
      expect(() => blogPostSchema.parse(invalidBlog)).toThrow(ZodError);
    });
    
    it('rejects invalid URL for coverImage', () => {
      const invalidBlog = {
        title: 'Valid Title',
        slug: 'valid-title',
        excerpt: 'Valid excerpt',
        content: 'Valid content that is long enough',
        coverImage: 'not-a-url',
        category: 'technology',
        tags: ['tech'],
      };
      
      expect(() => blogPostSchema.parse(invalidBlog)).toThrow(ZodError);
    });
  });
});
```

### Integration Test: API Route

Create `__tests__/integration/api/blog.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST, GET } from '@/app/api/blog/route';
import { NextRequest } from 'next/server';

// Mock dependencies
vi.mock('@/lib/apiAuth', () => ({
  verifyAuth: vi.fn(),
}));

vi.mock('@/lib/appwrite/server', () => ({
  adminDb: {
    createDocument: vi.fn(),
    listDocuments: vi.fn(),
  },
  DATABASE_ID: 'test-db',
  COLLECTIONS: { BLOG: 'blog' },
  ID: { unique: () => 'test-id' },
}));

vi.mock('@/lib/rateLimiter', () => ({
  checkBlogRateLimit: vi.fn(() => Promise.resolve(true)),
  getRemainingSubmissions: vi.fn(() => Promise.resolve(5)),
}));

describe('POST /api/blog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  it('requires authentication', async () => {
    const { verifyAuth } = await import('@/lib/apiAuth');
    (verifyAuth as any).mockResolvedValue({ authenticated: false });
    
    const request = new NextRequest('http://localhost/api/blog', {
      method: 'POST',
      body: JSON.stringify({ title: 'Test', content: 'Test content' }),
    });
    
    const response = await POST(request);
    expect(response.status).toBe(401);
  });
  
  it('validates input', async () => {
    const { verifyAuth } = await import('@/lib/apiAuth');
    (verifyAuth as any).mockResolvedValue({
      authenticated: true,
      user: { $id: 'user-1', email: 'test@example.com', name: 'Test User' },
    });
    
    const request = new NextRequest('http://localhost/api/blog', {
      method: 'POST',
      body: JSON.stringify({ title: 'Hi' }), // Too short
    });
    
    const response = await POST(request);
    expect(response.status).toBe(400);
  });
  
  it('creates blog successfully', async () => {
    const { verifyAuth } = await import('@/lib/apiAuth');
    const { adminDb } = await import('@/lib/appwrite/server');
    
    (verifyAuth as any).mockResolvedValue({
      authenticated: true,
      user: { $id: 'user-1', email: 'test@example.com', name: 'Test User' },
    });
    
    (adminDb.createDocument as any).mockResolvedValue({
      $id: 'blog-1',
      title: 'Test Blog',
      content: 'Test content that is long enough to pass validation',
    });
    
    const request = new NextRequest('http://localhost/api/blog', {
      method: 'POST',
      body: JSON.stringify({
        title: 'Test Blog',
        content: 'Test content that is long enough to pass validation requirements and more text to make it even longer.',
        category: 'technology',
      }),
    });
    
    const response = await POST(request);
    expect(response.status).toBe(201);
    
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data).toBeDefined();
  });
});
```

### Component Test: AuthContext

Create `__tests__/integration/components/AuthContext.test.tsx`:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '@/context/AuthContext';

// Mock Appwrite
vi.mock('@/lib/appwrite', () => ({
  authService: {
    getCurrentUser: vi.fn(),
    login: vi.fn(),
    logout: vi.fn(),
  },
}));

// Test component that uses auth
function TestComponent() {
  const { user, loading, isAdmin } = useAuth();
  
  if (loading) return <div>Loading...</div>;
  if (!user) return <div>Not logged in</div>;
  
  return (
    <div>
      <div>User: {user.name}</div>
      <div>Admin: {isAdmin ? 'Yes' : 'No'}</div>
    </div>
  );
}

describe('AuthContext', () => {
  it('shows loading state initially', () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });
  
  it('shows not logged in when no user', async () => {
    const { authService } = await import('@/lib/appwrite');
    (authService.getCurrentUser as any).mockResolvedValue(null);
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    await waitFor(() => {
      expect(screen.getByText('Not logged in')).toBeInTheDocument();
    });
  });
  
  it('shows user info when logged in', async () => {
    const { authService } = await import('@/lib/appwrite');
    (authService.getCurrentUser as any).mockResolvedValue({
      $id: 'user-1',
      name: 'Test User',
      email: 'test@example.com',
      labels: [],
    });
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    await waitFor(() => {
      expect(screen.getByText('User: Test User')).toBeInTheDocument();
      expect(screen.getByText('Admin: No')).toBeInTheDocument();
    });
  });
  
  it('detects admin users', async () => {
    const { authService } = await import('@/lib/appwrite');
    (authService.getCurrentUser as any).mockResolvedValue({
      $id: 'user-1',
      name: 'Admin User',
      email: 'admin@example.com',
      labels: ['admin'],
    });
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    await waitFor(() => {
      expect(screen.getByText('Admin: Yes')).toBeInTheDocument();
    });
  });
});
```

## 🎯 Testing Best Practices

### 1. Test Organization
- **Unit tests**: Test individual functions/utilities
- **Integration tests**: Test API routes and components
- **E2E tests**: Test complete user flows

### 2. What to Test
- ✅ Business logic (services, utilities)
- ✅ Validation schemas
- ✅ API routes (authentication, authorization, validation)
- ✅ Critical user flows (auth, registration, payments)
- ❌ Don't test: Third-party libraries, trivial getters/setters

### 3. Test Coverage Goals
- **Critical paths**: 90%+ (auth, payments, data mutations)
- **Business logic**: 80%+
- **UI components**: 60%+
- **Overall**: 70%+

### 4. Mocking Strategy
- Mock external services (Appwrite, email, etc.)
- Mock Next.js router
- Don't mock code you own (test it instead)

## 🚀 Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm run test:coverage

# Run tests with UI
npm run test:ui

# Run specific test file
npm test blog.test.ts

# Run tests matching pattern
npm test -- --grep "blogService"
```

## 📊 Coverage Reports

After running `npm run test:coverage`, open `coverage/index.html` in your browser to see detailed coverage reports.

## 🔄 CI/CD Integration

Add to `.github/workflows/test.yml`:

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run tests
        run: npm run test:run
        
      - name: Generate coverage
        run: npm run test:coverage
        
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json
```

## 📋 Testing Checklist

- [ ] Install testing dependencies
- [ ] Create vitest.config.ts
- [ ] Create vitest.setup.ts
- [ ] Update package.json scripts
- [ ] Create test directory structure
- [ ] Write unit tests for utilities
- [ ] Write unit tests for services
- [ ] Write integration tests for API routes
- [ ] Write component tests
- [ ] Set up CI/CD pipeline
- [ ] Achieve 70%+ code coverage
- [ ] Document testing patterns

## 🆘 Troubleshooting

### Issue: "Cannot find module '@/...'"
**Solution:** Check `vitest.config.ts` alias configuration

### Issue: "window is not defined"
**Solution:** Ensure `environment: 'jsdom'` in vitest.config.ts

### Issue: "useRouter is not a function"
**Solution:** Check Next.js router mock in vitest.setup.ts

### Issue: Tests are slow
**Solution:** 
- Use `vi.mock()` for external services
- Avoid actual API calls
- Use `--no-coverage` during development

---

**Remember:** Good tests are your safety net for refactoring and scaling. Invest time in testing now to save debugging time later.
