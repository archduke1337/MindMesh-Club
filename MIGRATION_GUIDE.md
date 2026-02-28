# Migration Guide

This guide will help you migrate your existing deployment to use the security fixes and improvements.

## 🚨 Breaking Changes

### 1. Admin Authorization (CRITICAL)

**What Changed:**
- Email-based admin checks removed
- Admin access now ONLY via Appwrite user labels

**Action Required:**

```bash
# 1. Remove from .env and .env.local
ADMIN_EMAILS=...
NEXT_PUBLIC_ADMIN_EMAILS=...

# 2. Grant admin access via Appwrite Console:
# - Go to Authentication → Users
# - Select each admin user
# - Go to Labels tab
# - Add label: "admin"
# - Click Save
```

**Impact:** Existing admins will lose access until you add the "admin" label.

**Timeline:** Do this BEFORE deploying the new code.

---

### 2. Session Cookies (CRITICAL)

**What Changed:**
- Cookies now require HTTPS (`secure: true`)
- `sameSite` changed from `lax` to `strict`

**Action Required:**

```bash
# Development: Use HTTPS locally
# Option 1: Use mkcert for local HTTPS
brew install mkcert
mkcert -install
mkcert localhost

# Option 2: Use ngrok
ngrok http 3000

# Production: Ensure HTTPS is enabled (Vercel does this automatically)
```

**Impact:** 
- Development: Must use HTTPS or sessions won't work
- Production: No impact if already using HTTPS

**Timeline:** Set up before testing locally.

---

### 3. Dependencies (HIGH)

**What Changed:**
- `zod`: `^4.3.6` → `^3.22.4`
- `jspdf`: `^4.2.0` → `^2.5.1`

**Action Required:**

```bash
# 1. Update package.json (already done)
# 2. Remove node_modules and package-lock.json
rm -rf node_modules package-lock.json

# 3. Reinstall
npm install

# 4. Fix any breaking changes
npm audit fix

# 5. Test the application
npm run dev
```

**Impact:** May have breaking changes in Zod validation or jsPDF usage.

**Timeline:** Do this during deployment.

---

## 📋 Step-by-Step Migration

### Phase 1: Pre-Deployment (Do First)

#### Step 1: Backup Everything
```bash
# 1. Backup database (export from Appwrite Console)
# 2. Backup environment variables
cp .env .env.backup

# 3. Backup code
git tag pre-security-fixes
git push --tags
```

#### Step 2: Grant Admin Access via Labels
```
1. Go to Appwrite Console
2. Authentication → Users
3. For each admin user:
   - Click on user
   - Go to "Labels" tab
   - Add label: "admin"
   - Click "Update"
4. Verify: User should now have "admin" in labels array
```

#### Step 3: Update Environment Variables
```bash
# Remove from .env:
ADMIN_EMAILS=...
NEXT_PUBLIC_ADMIN_EMAILS=...

# Keep these:
NEXT_PUBLIC_APPWRITE_ENDPOINT=...
NEXT_PUBLIC_APPWRITE_PROJECT_ID=...
NEXT_PUBLIC_APPWRITE_DATABASE_ID=...
APPWRITE_API_KEY=...
# ... all other variables
```

#### Step 4: Set Up Local HTTPS (Development)
```bash
# Option 1: mkcert
brew install mkcert
mkcert -install
mkcert localhost

# Update package.json:
"dev": "next dev --experimental-https"

# Option 2: ngrok (easier)
ngrok http 3000
# Use the HTTPS URL provided
```

---

### Phase 2: Deployment

#### Step 1: Pull Latest Code
```bash
git pull origin main
```

#### Step 2: Install Dependencies
```bash
rm -rf node_modules package-lock.json
npm install
```

#### Step 3: Run Tests (if available)
```bash
npm run test:run
```

#### Step 4: Build
```bash
npm run build
```

#### Step 5: Deploy
```bash
# Vercel
vercel --prod

# Or push to main branch (if auto-deploy is enabled)
git push origin main
```

---

### Phase 3: Post-Deployment

#### Step 1: Verify Admin Access
```
1. Log in as admin user
2. Try to access /admin
3. Should work if "admin" label is set
4. If not working:
   - Check Appwrite Console → User → Labels
   - Verify "admin" label exists
   - Check browser console for errors
```

#### Step 2: Test Session Security
```bash
# Open browser DevTools → Application → Cookies
# Verify appwrite-session cookie has:
# - Secure: ✓
# - SameSite: Strict
# - HttpOnly: ✓
```

#### Step 3: Test API Routes
```bash
# Test blog creation
curl -X POST https://yourdomain.com/api/blog \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","content":"Test content that is long enough"}'

# Should return 401 (authentication required)

# Test with session (in browser console):
fetch('/api/blog', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: 'Test Blog',
    content: 'Test content that is long enough to pass validation'
  })
})
```

#### Step 4: Monitor Errors
```
1. Check Vercel logs
2. Check Appwrite logs
3. Check browser console
4. Monitor for 401/403 errors
```

---

## 🔧 Troubleshooting

### Issue: Admin can't access /admin

**Symptoms:**
- Redirected to /unauthorized
- Or redirected to /login

**Solutions:**
```
1. Check Appwrite Console → User → Labels
   - Verify "admin" label exists
   - Label is case-sensitive

2. Check browser console for errors

3. Clear cookies and log in again

4. Verify middleware is working:
   - Check Network tab
   - Look for /admin request
   - Check response headers
```

---

### Issue: Session cookies not working

**Symptoms:**
- Logged out immediately after login
- "Not authenticated" errors

**Solutions:**
```
1. Development:
   - Ensure using HTTPS (localhost with mkcert or ngrok)
   - Check cookie settings in DevTools

2. Production:
   - Verify HTTPS is enabled
   - Check cookie domain settings
   - Clear browser cookies

3. Check cookie in DevTools:
   - Application → Cookies
   - Look for "appwrite-session"
   - Verify Secure and SameSite flags
```

---

### Issue: Validation errors on API routes

**Symptoms:**
- 400 errors with validation messages
- "Validation failed" errors

**Solutions:**
```
1. Check request body format:
   - Must be valid JSON
   - All required fields present
   - Field types correct

2. Check validation schema:
   - lib/validation/schemas.ts
   - Verify field requirements

3. Example valid request:
   {
     "title": "Valid Title (5+ chars)",
     "content": "Valid content (100+ chars)...",
     "category": "technology"
   }
```

---

### Issue: Dependencies not installing

**Symptoms:**
- npm install fails
- Peer dependency errors

**Solutions:**
```bash
# 1. Clear npm cache
npm cache clean --force

# 2. Remove node_modules and lock file
rm -rf node_modules package-lock.json

# 3. Use legacy peer deps flag
npm install --legacy-peer-deps

# 4. If still failing, check Node version
node --version  # Should be 18.x or 20.x

# 5. Update npm
npm install -g npm@latest
```

---

## 📊 Verification Checklist

After migration, verify:

### Security
- [ ] Admin access works via labels only
- [ ] Session cookies have Secure flag
- [ ] Session cookies have SameSite: Strict
- [ ] No ADMIN_EMAILS in environment variables
- [ ] HTTPS enabled everywhere

### Functionality
- [ ] Login/logout works
- [ ] Admin pages accessible to admins
- [ ] Non-admins redirected from admin pages
- [ ] Blog creation works
- [ ] Event registration works
- [ ] API routes return proper errors

### Performance
- [ ] Pages load quickly
- [ ] No console errors
- [ ] Database queries fast (if indexes created)

### Monitoring
- [ ] Error tracking configured (Sentry, etc.)
- [ ] Logs accessible (Vercel, Appwrite)
- [ ] Alerts set up for critical errors

---

## 🚀 Next Steps

After successful migration:

1. **Create Database Indexes**
   - Follow `DATABASE_INDEXES.md`
   - Improves query performance 10-100x

2. **Set Up Testing**
   - Follow `TESTING_SETUP.md`
   - Prevents regressions

3. **Apply Remaining Fixes**
   - Input validation on all API routes
   - Rate limiting on all endpoints
   - CSRF protection
   - HTML sanitization

4. **Set Up Monitoring**
   - Sentry for error tracking
   - Uptime monitoring
   - Performance monitoring

5. **Documentation**
   - Update README
   - Document API endpoints
   - Create runbooks for common issues

---

## 📞 Support

If you encounter issues during migration:

1. Check this guide's troubleshooting section
2. Check `SECURITY_FIXES.md` for detailed explanations
3. Review Appwrite documentation
4. Check application logs (Vercel, Appwrite)
5. Open an issue with:
   - Error messages
   - Steps to reproduce
   - Environment details
   - Screenshots if applicable

---

## 🔄 Rollback Plan

If migration fails and you need to rollback:

```bash
# 1. Revert code
git revert HEAD
git push origin main

# 2. Restore environment variables
cp .env.backup .env

# 3. Redeploy
vercel --prod

# 4. Re-enable email-based admin (temporary)
# Add back ADMIN_EMAILS to .env
# Revert adminAuth.ts changes

# 5. Investigate issues before trying again
```

---

## ⏱️ Estimated Timeline

- **Pre-deployment**: 30 minutes
  - Backup: 5 minutes
  - Grant admin labels: 10 minutes
  - Update env vars: 5 minutes
  - Set up local HTTPS: 10 minutes

- **Deployment**: 15 minutes
  - Pull code: 1 minute
  - Install deps: 5 minutes
  - Build: 5 minutes
  - Deploy: 4 minutes

- **Post-deployment**: 30 minutes
  - Verify admin access: 10 minutes
  - Test functionality: 15 minutes
  - Monitor errors: 5 minutes

**Total: ~75 minutes**

---

**Remember:** Take your time, follow the steps carefully, and test thoroughly. It's better to catch issues in staging than in production.
