# Database Index Configuration

This document provides the recommended database indexes for optimal query performance.

## 📊 Why Indexes Matter

Without proper indexes, Appwrite performs full collection scans for queries, which:
- Slows down as data grows
- Increases API costs
- Degrades user experience
- Limits scalability

## 🎯 Recommended Indexes

### Events Collection

```
Index Name: date_asc
Type: Key
Attributes: date (ASC)
Purpose: Fast retrieval of upcoming events

Index Name: date_desc
Type: Key
Attributes: date (DESC)
Purpose: Fast retrieval of past events

Index Name: featured_date
Type: Key
Attributes: isFeatured (DESC), date (DESC)
Purpose: Featured events listing

Index Name: type_date
Type: Key
Attributes: eventType (ASC), date (DESC)
Purpose: Filter events by type

Index Name: status_date
Type: Key
Attributes: status (ASC), date (DESC)
Purpose: Filter by status (published, draft, etc.)
```

### Blog Collection

```
Index Name: status_created
Type: Key
Attributes: status (ASC), $createdAt (DESC)
Purpose: Admin dashboard - pending blogs

Index Name: status_updated
Type: Key
Attributes: status (ASC), $updatedAt (DESC)
Purpose: Public blog listing

Index Name: author_created
Type: Key
Attributes: authorId (ASC), $createdAt (DESC)
Purpose: User's blog list

Index Name: slug_unique
Type: Unique
Attributes: slug (ASC)
Purpose: Fast slug lookup, prevent duplicates

Index Name: category_status
Type: Key
Attributes: category (ASC), status (ASC), $updatedAt (DESC)
Purpose: Category filtering

Index Name: featured_status
Type: Key
Attributes: featured (DESC), status (ASC), $updatedAt (DESC)
Purpose: Featured blogs
```

### Registrations Collection

```
Index Name: user_event_unique
Type: Unique
Attributes: userId (ASC), eventId (ASC)
Purpose: Prevent duplicate registrations, fast lookup

Index Name: event_registered
Type: Key
Attributes: eventId (ASC), registeredAt (DESC)
Purpose: Event attendee list

Index Name: user_registered
Type: Key
Attributes: userId (ASC), registeredAt (DESC)
Purpose: User's registration history

Index Name: event_status
Type: Key
Attributes: eventId (ASC), status (ASC)
Purpose: Filter by registration status
```

### Hackathon Teams Collection

```
Index Name: event_created
Type: Key
Attributes: eventId (ASC), $createdAt (DESC)
Purpose: List teams for an event

Index Name: invite_code_unique
Type: Unique
Attributes: inviteCode (ASC)
Purpose: Fast invite code lookup

Index Name: leader_event
Type: Key
Attributes: leaderId (ASC), eventId (ASC)
Purpose: Find user's team in event

Index Name: event_status
Type: Key
Attributes: eventId (ASC), status (ASC)
Purpose: Filter teams by status
```

### Team Members Collection

```
Index Name: team_joined
Type: Key
Attributes: teamId (ASC), joinedAt (ASC)
Purpose: List team members

Index Name: user_event_status
Type: Key
Attributes: userId (ASC), eventId (ASC), status (ASC)
Purpose: Find user's team membership

Index Name: event_user
Type: Key
Attributes: eventId (ASC), userId (ASC)
Purpose: Check if user is in any team
```

### Submissions Collection

```
Index Name: event_submitted
Type: Key
Attributes: eventId (ASC), submittedAt (DESC)
Purpose: List submissions for event

Index Name: team_event_unique
Type: Unique
Attributes: teamId (ASC), eventId (ASC)
Purpose: One submission per team per event

Index Name: user_event
Type: Key
Attributes: userId (ASC), eventId (ASC)
Purpose: User's submissions

Index Name: event_status
Type: Key
Attributes: eventId (ASC), status (ASC)
Purpose: Filter by submission status
```

### Gallery Collection

```
Index Name: approved_date
Type: Key
Attributes: isApproved (DESC), date (DESC)
Purpose: Public gallery listing

Index Name: category_approved
Type: Key
Attributes: category (ASC), isApproved (DESC), date (DESC)
Purpose: Category filtering

Index Name: featured_approved
Type: Key
Attributes: isFeatured (DESC), isApproved (DESC), date (DESC)
Purpose: Featured images

Index Name: event_approved
Type: Key
Attributes: eventId (ASC), isApproved (DESC)
Purpose: Event gallery

Index Name: uploader_created
Type: Key
Attributes: uploadedBy (ASC), $createdAt (DESC)
Purpose: User's uploads
```

### Member Profiles Collection

```
Index Name: user_id_unique
Type: Unique
Attributes: userId (ASC)
Purpose: One profile per user, fast lookup

Index Name: email_unique
Type: Unique
Attributes: email (ASC)
Purpose: Email lookup

Index Name: status_created
Type: Key
Attributes: memberStatus (ASC), $createdAt (DESC)
Purpose: Filter by status

Index Name: year_branch
Type: Key
Attributes: year (ASC), branch (ASC)
Purpose: Filter by year and branch
```

### Projects Collection

```
Index Name: featured_created
Type: Key
Attributes: isFeatured (DESC), $createdAt (DESC)
Purpose: Featured projects

Index Name: category_created
Type: Key
Attributes: category (ASC), $createdAt (DESC)
Purpose: Category filtering

Index Name: event_created
Type: Key
Attributes: eventId (ASC), $createdAt (DESC)
Purpose: Event projects

Index Name: submitter_created
Type: Key
Attributes: submittedBy (ASC), $createdAt (DESC)
Purpose: User's projects
```

### Announcements Collection

```
Index Name: active_priority
Type: Key
Attributes: isActive (DESC), priority (DESC), $createdAt (DESC)
Purpose: Active announcements by priority

Index Name: pinned_active
Type: Key
Attributes: isPinned (DESC), isActive (DESC), $createdAt (DESC)
Purpose: Pinned announcements first

Index Name: event_active
Type: Key
Attributes: eventId (ASC), isActive (DESC)
Purpose: Event-specific announcements
```

### Resources Collection

```
Index Name: approved_created
Type: Key
Attributes: isApproved (DESC), $createdAt (DESC)
Purpose: Public resources listing

Index Name: category_approved
Type: Key
Attributes: category (ASC), isApproved (DESC)
Purpose: Category filtering

Index Name: type_approved
Type: Key
Attributes: type (ASC), isApproved (DESC)
Purpose: Type filtering

Index Name: featured_approved
Type: Key
Attributes: isFeatured (DESC), isApproved (DESC)
Purpose: Featured resources

Index Name: event_approved
Type: Key
Attributes: eventId (ASC), isApproved (DESC)
Purpose: Event resources
```

### Feedback Collection

```
Index Name: event_created
Type: Key
Attributes: eventId (ASC), $createdAt (DESC)
Purpose: Event feedback list

Index Name: user_event_unique
Type: Unique
Attributes: userId (ASC), eventId (ASC)
Purpose: One feedback per user per event

Index Name: event_public
Type: Key
Attributes: eventId (ASC), isPublic (DESC), overallRating (DESC)
Purpose: Public testimonials
```

### Judges Collection

```
Index Name: event_order
Type: Key
Attributes: eventId (ASC), order (ASC)
Purpose: List judges for event

Index Name: event_status
Type: Key
Attributes: eventId (ASC), status (ASC)
Purpose: Filter by status

Index Name: invite_code_unique
Type: Unique
Attributes: inviteCode (ASC)
Purpose: Judge invite lookup
```

### Judge Scores Collection

```
Index Name: submission_judge
Type: Key
Attributes: submissionId (ASC), judgeId (ASC)
Purpose: Scores for a submission

Index Name: judge_event
Type: Key
Attributes: judgeId (ASC), eventId (ASC)
Purpose: Judge's scores

Index Name: event_submission
Type: Key
Attributes: eventId (ASC), submissionId (ASC)
Purpose: All scores for event
```

### Coupons Collection

```
Index Name: code_unique
Type: Unique
Attributes: code (ASC)
Purpose: Fast coupon lookup

Index Name: active_valid
Type: Key
Attributes: isActive (DESC), validFrom (ASC), validUntil (DESC)
Purpose: Active coupons

Index Name: event_active
Type: Key
Attributes: eventId (ASC), isActive (DESC)
Purpose: Event-specific coupons

Index Name: scope_active
Type: Key
Attributes: scope (ASC), isActive (DESC)
Purpose: Global vs event coupons
```

### Coupon Usage Collection

```
Index Name: coupon_used
Type: Key
Attributes: couponId (ASC), usedAt (DESC)
Purpose: Coupon usage history

Index Name: user_coupon
Type: Key
Attributes: userId (ASC), couponId (ASC)
Purpose: User's coupon usage

Index Name: event_coupon
Type: Key
Attributes: eventId (ASC), couponId (ASC)
Purpose: Event coupon usage
```

## 🚀 How to Create Indexes

### Via Appwrite Console

1. Go to Appwrite Console → Databases
2. Select your database
3. Select the collection
4. Go to "Indexes" tab
5. Click "Create Index"
6. Fill in:
   - **Index Key**: Name from above (e.g., `date_asc`)
   - **Type**: Key or Unique as specified
   - **Attributes**: Add attributes in order with ASC/DESC
7. Click "Create"

### Via Appwrite CLI

```bash
# Example: Create date_asc index on events collection
appwrite databases createIndex \
  --databaseId YOUR_DATABASE_ID \
  --collectionId events \
  --key date_asc \
  --type key \
  --attributes date \
  --orders ASC
```

### Via Appwrite SDK (Programmatic)

```typescript
import { Client, Databases } from 'node-appwrite';

const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
  .setKey(process.env.APPWRITE_API_KEY!);

const databases = new Databases(client);

// Create index
await databases.createIndex(
  'YOUR_DATABASE_ID',
  'events',
  'date_asc',
  'key',
  ['date'],
  ['ASC']
);
```

## 📈 Performance Impact

### Before Indexes
- Query time: 500ms - 2000ms (grows with data)
- Full collection scans
- High API costs

### After Indexes
- Query time: 10ms - 50ms (constant)
- Index lookups
- Reduced API costs by 90%+

## ⚠️ Important Notes

1. **Index Limits**: Appwrite has limits on number of indexes per collection (check your plan)
2. **Write Performance**: Indexes slightly slow down writes (negligible for most use cases)
3. **Storage**: Indexes consume storage space
4. **Maintenance**: Indexes are automatically maintained by Appwrite

## 🔍 Monitoring Index Usage

After creating indexes, monitor query performance:

```typescript
// Add timing to queries
const start = Date.now();
const results = await databases.listDocuments(...);
const duration = Date.now() - start;
console.log(`Query took ${duration}ms`);
```

Expected times with indexes:
- Simple queries: < 50ms
- Complex queries: < 200ms
- Aggregations: < 500ms

If queries are slower, check:
1. Index exists and is correct
2. Query uses indexed fields
3. Query order matches index order

## 📋 Index Creation Checklist

- [ ] Events: 5 indexes
- [ ] Blog: 6 indexes
- [ ] Registrations: 4 indexes
- [ ] Hackathon Teams: 4 indexes
- [ ] Team Members: 3 indexes
- [ ] Submissions: 4 indexes
- [ ] Gallery: 5 indexes
- [ ] Member Profiles: 4 indexes
- [ ] Projects: 4 indexes
- [ ] Announcements: 3 indexes
- [ ] Resources: 5 indexes
- [ ] Feedback: 3 indexes
- [ ] Judges: 3 indexes
- [ ] Judge Scores: 3 indexes
- [ ] Coupons: 4 indexes
- [ ] Coupon Usage: 3 indexes

**Total: 63 indexes across 16 collections**

## 🎯 Priority Order

If you can't create all indexes at once, prioritize:

1. **Critical** (do first):
   - Events: `date_asc`, `date_desc`
   - Blog: `status_created`, `slug_unique`
   - Registrations: `user_event_unique`, `event_registered`
   - Member Profiles: `user_id_unique`

2. **High** (do soon):
   - All featured/approved indexes
   - All unique indexes
   - Hackathon team indexes

3. **Medium** (do when scaling):
   - Category/type filters
   - Status filters
   - Event-specific indexes

4. **Low** (nice to have):
   - Order/priority indexes
   - Analytics indexes

---

**Remember:** Creating indexes is a one-time setup that dramatically improves performance. Budget 1-2 hours to create all indexes.
