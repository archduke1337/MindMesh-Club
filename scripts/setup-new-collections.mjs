// scripts/setup-new-collections.mjs
// Creates the 5 new collections: judges, judging_criteria, judge_scores, coupons, coupon_usage

const ENDPOINT = "https://fra.cloud.appwrite.io/v1";
const PROJECT_ID = "6911bb9d001849421443";
const DATABASE_ID = "68ee09da002cce9f7e39";
const API_KEY = "standard_c3d3492c486e5d71f15d33932745f6364ce5835fa808b2d43895658ffaf15666c166fd5b05e7a0ee2dc4c653b0496d3baaebe680501278efd8394115f24cbd3874ce371e5c4e11d8c9bd2f23e615c2ac3f794ebe9f874b7460dc0268565d4800911a6829b0bdf78d27e89dfeb9774fc95d5bc311f600d3059422e030d59f7459";

const headers = {
  "Content-Type": "application/json",
  "X-Appwrite-Project": PROJECT_ID,
  "X-Appwrite-Key": API_KEY,
};

async function apiCall(method, path, body = null) {
  const opts = { method, headers };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${ENDPOINT}${path}`, opts);
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = text; }
  return { ok: res.ok, status: res.status, data };
}

async function createCollection(id, name) {
  console.log(`\n📦 Creating collection: ${name} (${id})`);
  const res = await apiCall("POST", `/databases/${DATABASE_ID}/collections`, {
    collectionId: id,
    name,
    documentSecurity: false,
    permissions: ['read("any")', 'create("users")', 'update("users")', 'delete("users")'],
  });
  if (res.ok) {
    console.log(`   ✅ Created`);
  } else if (res.status === 409) {
    console.log(`   ⚠️  Already exists — skipping`);
  } else {
    console.log(`   ❌ Error: ${JSON.stringify(res.data)}`);
    return false;
  }
  return true;
}

async function addAttr(collectionId, type, key, opts = {}) {
  const path = `/databases/${DATABASE_ID}/collections/${collectionId}/attributes/${type}`;

  let body = { key, required: opts.required ?? false };

  if (type === "string") {
    body.size = opts.size || 255;
    body.default = opts.default ?? null;
  } else if (type === "integer") {
    body.min = opts.min ?? null;
    body.max = opts.max ?? null;
    body.default = opts.default ?? null;
  } else if (type === "float") {
    body.min = opts.min ?? null;
    body.max = opts.max ?? null;
    body.default = opts.default ?? null;
  } else if (type === "boolean") {
    body.default = opts.default ?? null;
  } else if (type === "enum") {
    body.elements = opts.elements || [];
    body.default = opts.default ?? null;
  }

  // Arrays
  if (opts.array) {
    body.array = true;
  }

  const res = await apiCall("POST", path, body);
  const symbol = res.ok ? "✓" : res.status === 409 ? "~" : "✗";
  const detail = !res.ok && res.status !== 409 ? ` (${typeof res.data === 'object' ? res.data.message : res.data})` : "";
  process.stdout.write(`   ${symbol} ${key}${detail}\n`);
}

// Wait for attributes to be processed
async function waitForAttrs(collectionId, expectedCount) {
  process.stdout.write(`   ⏳ Waiting for attributes to process...`);
  for (let i = 0; i < 30; i++) {
    await new Promise(r => setTimeout(r, 2000));
    const res = await apiCall("GET", `/databases/${DATABASE_ID}/collections/${collectionId}/attributes`);
    if (res.ok) {
      const attrs = res.data.attributes || [];
      const available = attrs.filter(a => a.status === "available").length;
      if (available >= expectedCount) {
        console.log(` done (${available} ready)`);
        return true;
      }
    }
  }
  console.log(" timeout");
  return false;
}

async function addIndex(collectionId, key, type, attributes, orders) {
  const res = await apiCall("POST", `/databases/${DATABASE_ID}/collections/${collectionId}/indexes`, {
    key,
    type,
    attributes,
    orders: orders || attributes.map(() => "ASC"),
  });
  const symbol = res.ok ? "✓" : res.status === 409 ? "~" : "✗";
  process.stdout.write(`   ${symbol} index: ${key}\n`);
}

// ═══════════════════════════════════════════
// COLLECTION DEFINITIONS
// ═══════════════════════════════════════════

async function setupJudges() {
  await createCollection("judges", "Judges");
  console.log("   Adding attributes...");
  await addAttr("judges", "string", "eventId", { required: true });
  await addAttr("judges", "string", "userId");
  await addAttr("judges", "string", "name", { required: true });
  await addAttr("judges", "string", "email", { required: true });
  await addAttr("judges", "string", "avatar", { size: 1024 });
  await addAttr("judges", "string", "bio", { size: 2000 });
  await addAttr("judges", "string", "expertise", { size: 255, array: true });
  await addAttr("judges", "string", "organization");
  await addAttr("judges", "string", "designation");
  await addAttr("judges", "string", "linkedin", { size: 512 });
  await addAttr("judges", "enum", "status", { elements: ["invited", "accepted", "declined"], default: "invited" });
  await addAttr("judges", "string", "inviteCode", { required: true });
  await addAttr("judges", "string", "assignedTeams", { size: 255, array: true });
  await addAttr("judges", "boolean", "isLead", { default: false });
  await addAttr("judges", "integer", "order", { default: 0 });

  await waitForAttrs("judges", 15);

  console.log("   Adding indexes...");
  await addIndex("judges", "idx_eventId", "key", ["eventId"]);
  await addIndex("judges", "idx_inviteCode", "unique", ["inviteCode"]);
  await addIndex("judges", "idx_email_event", "key", ["email", "eventId"]);
}

async function setupJudgingCriteria() {
  await createCollection("judging_criteria", "Judging Criteria");
  console.log("   Adding attributes...");
  await addAttr("judging_criteria", "string", "eventId", { required: true });
  await addAttr("judging_criteria", "string", "name", { required: true });
  await addAttr("judging_criteria", "string", "description", { size: 2000 });
  await addAttr("judging_criteria", "integer", "maxScore", { required: true, min: 1, max: 100 });
  await addAttr("judging_criteria", "float", "weight", { required: true, min: 0, max: 1 });
  await addAttr("judging_criteria", "integer", "order", { default: 0 });

  await waitForAttrs("judging_criteria", 6);

  console.log("   Adding indexes...");
  await addIndex("judging_criteria", "idx_eventId", "key", ["eventId"]);
}

async function setupJudgeScores() {
  await createCollection("judge_scores", "Judge Scores");
  console.log("   Adding attributes...");
  await addAttr("judge_scores", "string", "eventId", { required: true });
  await addAttr("judge_scores", "string", "judgeId", { required: true });
  await addAttr("judge_scores", "string", "judgeName");
  await addAttr("judge_scores", "string", "submissionId", { required: true });
  await addAttr("judge_scores", "string", "teamId");
  await addAttr("judge_scores", "string", "criteriaId", { required: true });
  await addAttr("judge_scores", "string", "criteriaName");
  await addAttr("judge_scores", "integer", "score", { required: true, min: 0, max: 100 });
  await addAttr("judge_scores", "string", "comment", { size: 2000 });
  await addAttr("judge_scores", "string", "scoredAt");

  await waitForAttrs("judge_scores", 10);

  console.log("   Adding indexes...");
  await addIndex("judge_scores", "idx_eventId", "key", ["eventId"]);
  await addIndex("judge_scores", "idx_judge_sub", "key", ["judgeId", "submissionId"]);
  await addIndex("judge_scores", "idx_submission", "key", ["submissionId"]);
}

async function setupCoupons() {
  await createCollection("coupons", "Coupons");
  console.log("   Adding attributes...");
  await addAttr("coupons", "string", "code", { required: true });
  await addAttr("coupons", "string", "description", { size: 500 });
  await addAttr("coupons", "enum", "type", { elements: ["percentage", "fixed"], required: true });
  await addAttr("coupons", "float", "value", { required: true, min: 0 });
  await addAttr("coupons", "float", "minPurchase", { default: 0 });
  await addAttr("coupons", "float", "maxDiscount");
  await addAttr("coupons", "enum", "scope", { elements: ["global", "event"], default: "global" });
  await addAttr("coupons", "string", "eventId");
  await addAttr("coupons", "string", "eventName");
  await addAttr("coupons", "integer", "usageLimit", { default: 0 });
  await addAttr("coupons", "integer", "usedCount", { default: 0 });
  await addAttr("coupons", "integer", "perUserLimit", { default: 0 });
  await addAttr("coupons", "string", "validFrom", { required: true });
  await addAttr("coupons", "string", "validUntil", { required: true });
  await addAttr("coupons", "boolean", "isActive", { default: true });
  await addAttr("coupons", "string", "createdBy");

  await waitForAttrs("coupons", 16);

  console.log("   Adding indexes...");
  await addIndex("coupons", "idx_code", "unique", ["code"]);
  await addIndex("coupons", "idx_scope", "key", ["scope"]);
  await addIndex("coupons", "idx_eventId", "key", ["eventId"]);
  await addIndex("coupons", "idx_active", "key", ["isActive"]);
}

async function setupCouponUsage() {
  await createCollection("coupon_usage", "Coupon Usage");
  console.log("   Adding attributes...");
  await addAttr("coupon_usage", "string", "couponId", { required: true });
  await addAttr("coupon_usage", "string", "couponCode", { required: true });
  await addAttr("coupon_usage", "string", "userId", { required: true });
  await addAttr("coupon_usage", "string", "userName");
  await addAttr("coupon_usage", "string", "userEmail");
  await addAttr("coupon_usage", "string", "eventId", { required: true });
  await addAttr("coupon_usage", "float", "originalPrice", { required: true });
  await addAttr("coupon_usage", "float", "discountAmount", { required: true });
  await addAttr("coupon_usage", "float", "finalPrice", { required: true });
  await addAttr("coupon_usage", "string", "usedAt");

  await waitForAttrs("coupon_usage", 10);

  console.log("   Adding indexes...");
  await addIndex("coupon_usage", "idx_couponId", "key", ["couponId"]);
  await addIndex("coupon_usage", "idx_userId", "key", ["userId"]);
  await addIndex("coupon_usage", "idx_coupon_user", "key", ["couponId", "userId"]);
}

// ═══════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════

async function main() {
  console.log("═══════════════════════════════════════════");
  console.log("  MindMesh — New Collections Setup");
  console.log("  Database:", DATABASE_ID);
  console.log("═══════════════════════════════════════════");

  await setupJudges();
  await setupJudgingCriteria();
  await setupJudgeScores();
  await setupCoupons();
  await setupCouponUsage();

  console.log("\n═══════════════════════════════════════════");
  console.log("  ✅ All 5 collections setup complete!");
  console.log("═══════════════════════════════════════════\n");
}

main().catch(console.error);
