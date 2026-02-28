# Quick Reference Card

## 🚀 Common Tasks

### Grant Admin Access
```
1. Appwrite Console → Authentication → Users
2. Select user → Labels tab
3. Add label: "admin"
4. Save
```

### Create API Route with Validation
```typescript
import { handleApiError, validateRequestBody, successResponse } from "@/lib/apiErrorHandler";
import { verifyAuth } from "@/lib/apiAuth";
import { z } from "zod";

const schema = z.object({
  field: z.string().min(1).max(100),
});

export async function POST(request: NextRequest) {
  try {
    const { authenticated, user } = await verifyAuth(request);
    if (!authenticated) throw new ApiError(401, "Authentication required");
    
    const data = await validateRequestBody(request, schema);
    const result = await service.create(data);
    
    return successResponse(result, 201);
  } catch (error) {
    return handleApiError(error, "POST /api/my-route");
  }
}
```

### Create Database Index
```
Appwrite Console → Databases → Select DB → Select Collection → Indexes → Create Index

Name: field_asc
Type: Key
Attributes: field (ASC)
```

### Check Admin Status (Client)
```typescript
import { useAuth } from "@/context/AuthContext";

function MyComponent() {
  const { isAdmin } = useAuth();
  
  if (!isAdmin) return <div>Access Denied</div>;
  return <div>Admin Content</div>;
}
```

### Check Admin Status (Server)
```typescript
import { verifyAdminAuth } from "@/lib/apiAuth";

export async function POST(request: NextRequest) {
  const { isAdmin, error } = await verifyAdminAuth(request);
  if (!isAdmin) {
    return NextResponse.json({ error }, { status: 403 });
  }
  // Admin-only logic
}
```

---

## 🔒 Security Checklist

### Before Deploying
- [ ] All admins have "admin" label in Appwrite
- [ ] No `ADMIN_EMAILS` in environment variables
- [ ] HTTPS enabled everywhere
- [ ] Session cookies configured correctly
- [ ] Input validation on all API routes
- [ ] Rate limiting enabled
- [ ] Error monitoring configured

### After Deploying
- [ ] Test admin access
- [ ] Test session cookies (DevTools → Application → Cookies)
- [ ] Test API routes
- [ ] Monitor error logs
- [ ] Check performance metrics

---

## 🐛 Troubleshooting

### Admin Can't Access /admin
```
1. Check Appwrite Console → User → Labels
2. Verify "admin" label exists (case-sensitive)
3. Clear cookies and log in again
4. Check browser console for errors
```

### Session Not Working
```
1. Verify HTTPS is enabled
2. Check cookie in DevTools (Secure, SameSite: Strict)
3. Clear cookies and try again
4. Check middleware logs
```

### API Validation Errors
```
1. Check request body format (valid JSON)
2. Verify all required fields present
3. Check field types match schema
4. Review lib/validation/schemas.ts
```

### Slow Queries
```
1. Check if indexes exist (Appwrite Console)
2. Verify query uses indexed fields
3. Check query order matches index order
4. See DATABASE_INDEXES.md
```

---

## 📊 Performance Tips

### Avoid N+1 Queries
```typescript
// ❌ Bad: N+1 queries
const items = await getItems();
for (const item of items) {
  const detail = await getDetail(item.id); // N queries
}

// ✅ Good: Batch fetch
const items = await getItems();
const ids = items.map(i => i.id);
const details = await batchGetDetails(ids); // 1 query
const detailMap = new Map(details.map(d => [d.id, d]));
```

### Use Pagination
```typescript
// ❌ Bad: Load all
const all = await databases.listDocuments(DB, COLLECTION);

// ✅ Good: Paginate
const page1 = await databases.listDocuments(DB, COLLECTION, [
  Query.limit(20),
  Query.offset(0)
]);
```

### Cache Static Data
```typescript
// app/api/route.ts
export const revalidate = 300; // Cache for 5 minutes
```

---

## 🧪 Testing Commands

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test
npm test blog.test.ts

# Run in watch mode
npm test -- --watch

# Run in UI mode
npm run test:ui
```

---

## 📦 Useful Commands

```bash
# Install dependencies
npm install

# Clean install
rm -rf node_modules package-lock.json && npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint

# Type check
npm run type-check

# Check for vulnerabilities
npm audit

# Fix vulnerabilities
npm audit fix
```

---

## 🔗 Quick Links

### Documentation
- [SECURITY_FIXES.md](./SECURITY_FIXES.md) - Security details
- [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) - Migration steps
- [DATABASE_INDEXES.md](./DATABASE_INDEXES.md) - Index setup
- [TESTING_SETUP.md](./TESTING_SETUP.md) - Testing guide
- [FIXES_SUMMARY.md](./FIXES_SUMMARY.md) - Overview

### External Resources
- [Appwrite Docs](https://appwrite.io/docs)
- [Next.js Docs](https://nextjs.org/docs)
- [Zod Docs](https://zod.dev)
- [Vitest Docs](https://vitest.dev)

---

## 🎯 Priority Tasks

### This Week
1. Grant admin labels to all admins
2. Deploy security fixes
3. Create critical database indexes
4. Test thoroughly

### This Sprint
1. Apply input validation to all API routes
2. Implement global rate limiting
3. Add CSRF protection
4. Set up testing infrastructure

### This Month
1. Achieve 70% test coverage
2. Set up monitoring (Sentry)
3. Add security headers
4. Performance optimization

---

## 💡 Pro Tips

### Development
- Use HTTPS locally (mkcert or ngrok)
- Check browser console for errors
- Use React DevTools for debugging
- Monitor Network tab for API calls

### Security
- Never commit secrets to git
- Use environment variables
- Validate all user input
- Sanitize HTML content
- Use HTTPS everywhere

### Performance
- Create database indexes
- Use pagination
- Batch fetch related data
- Cache static content
- Optimize images

### Testing
- Write tests for critical paths
- Mock external services
- Test error cases
- Aim for 70%+ coverage

---

## 🆘 Emergency Contacts

### Rollback
```bash
git revert HEAD
git push origin main
vercel --prod
```

### Check Logs
```bash
# Vercel logs
vercel logs

# Or in Vercel Dashboard:
# Project → Deployments → Select deployment → Logs
```

### Appwrite Status
- Check: https://status.appwrite.io
- Console: https://cloud.appwrite.io

---

**Keep this file handy for quick reference during development!**
