# YoRewards — V2 Product Requirements Document

### Your Loyalty. Tracked. Rewarded.

> **Version:** 2.0 Final · **Date:** 2026 · **Market:** Nepal 🇳🇵
> **Phase 1 Status:** Complete — Web PWA live
> **Phase 2 Goal:** Full native platform with spending insights, QR stamp flow, merchant CRM, subscription monetisation, and a wholesome experience for every stakeholder

---

## Table of Contents

1. [What Changed from V1](#1-what-changed-from-v1)
2. [Core Fix — QR Stamp Flow + Spend Tracking](#2-core-fix--qr-stamp-flow--spend-tracking)
3. [Customer Experience](#3-customer-experience)
4. [Merchant Experience](#4-merchant-experience)
5. [Merchant Subscription Plans](#5-merchant-subscription-plans)
6. [Smart Promotions & Push Campaigns](#6-smart-promotions--push-campaigns)
7. [Super Admin](#7-super-admin)
8. [Platform & Scale](#8-platform--scale)
9. [Critical Missing Features — Added](#9-critical-missing-features--added)
10. [Tech Stack — V2 Additions](#10-tech-stack--v2-additions)
11. [V2 Build Order — 16 Weeks](#11-v2-build-order--16-weeks)
12. [Complete Feature Summary](#12-complete-feature-summary)
13. [The V2 Promise](#13-the-v2-promise)

---

## 1. What Changed from V1

### V1 Problems

| Problem                  | Impact                                          |
| ------------------------ | ----------------------------------------------- |
| Stamp flow has 7 steps   | Cashiers hate it. Customers give up.            |
| No spend tracking        | No data on customer value                       |
| Web PWA only             | iOS camera unreliable for QR scanning           |
| Manual merchant approval | Bottleneck for onboarding                       |
| No revenue model         | Unsustainable                                   |
| No merchant CRM          | Merchants have no customer intelligence         |
| No promotions engine     | No way to drive repeat visits                   |
| No dispute resolution    | Customers lose stamps unfairly with no recourse |
| No offline handling      | App breaks when internet is slow                |
| No customer feedback     | Merchants can't measure experience quality      |

### V2 Fixes Everything

- QR-based stamp flow — 2 steps, under 10 seconds
- Spend tracked on every stamp — customer and merchant both benefit
- Native iOS + Android apps via Expo
- Self-serve merchant onboarding with verification — no manual bottleneck
- Subscription billing via eSewa + Khalti
- Full merchant CRM with customer profiles and segments
- Smart promotions engine with automated and manual push campaigns
- Stamp dispute resolution flow
- Offline mode for merchant app
- Customer ratings after reward redemption

---

## 2. Core Fix — QR Stamp Flow + Spend Tracking

> 🔴 **Priority 1. Nothing else gets built until this works perfectly.**

### 2.1 New Stamp Flow

**Before (V1) — 7 steps:**

1. Customer pays
2. Customer gives phone number to merchant
3. Merchant triggers OTP
4. Customer receives OTP
5. Customer reads OTP to merchant
6. Merchant enters OTP
7. Stamp collected

**After (V2) — 2 steps:**

1. Customer opens YoRewards app → scans merchant QR at counter
2. Merchant taps Approve + enters spend amount → stamp confirmed

**Total time: under 10 seconds.**

### 2.2 Technical Flow

```
Customer scans QR
       ↓
Stamp request created (pending) — one-time session token
       ↓
Merchant sees request instantly (Supabase Realtime)
       ↓
Merchant taps Approve + enters spend amount (e.g. NPR 450)
       ↓
Stamp added to customer card
Spend amount logged to transaction record
       ↓
Customer sees: "Stamp added at Brew & Co! You spent NPR 450. 3 more for your reward! ☕"
```

### 2.3 Offline / Poor Connection Handling

> 🆕 Critical addition — Nepal has inconsistent connectivity

**Merchant side (poor internet):**

- Merchant app detects offline state
- Stamp approvals queued locally (WatermelonDB)
- Visual indicator: "Offline — approvals will sync when connected"
- On reconnect: all queued approvals sync to Supabase automatically
- Customer's app polls for approval — shows "Pending sync" state

**Customer side (poor internet):**

- QR scan cached locally
- "Your stamp request is pending — we'll notify you when it's confirmed"
- Push notification when stamp syncs and confirms

### 2.4 Spend Amount Entry — Merchant UI

- Single approval screen: customer name, card name, timestamp
- One required field: **Amount Spent (NPR)**
- Minimum spend rule enforced: warning if entered amount is below threshold
- Two buttons: **Approve ✓** | **Reject ✗**
- Optional rejection reason (dropdown: "Min spend not met" / "Item not eligible" / "Other")
- Optimised for one-handed mobile use — large tap targets

### 2.5 Data Stored Per Stamp Transaction

| Field             | Value                               |
| ----------------- | ----------------------------------- |
| `customer_id`     | Who earned it                       |
| `merchant_id`     | Where it was earned                 |
| `loyalty_card_id` | Which card                          |
| `amount_spent`    | NPR amount entered by merchant      |
| `stamped_at`      | Timestamp                           |
| `approved_by`     | Staff member ID                     |
| `session_token`   | Fraud prevention — one-time use     |
| `device_info`     | Customer device for fraud detection |

---

## 3. Customer Experience

### 3.1 Native Mobile App (Expo — iOS + Android)

**Why native over PWA:**

- iOS Safari camera unreliable — breaks QR scanning
- Push notifications work natively
- Home screen icon, splash screen, premium feel
- Faster animations, instant response
- Background sync for offline stamps

**App Structure:**

```
Bottom Navigation:
  🏠 Wallet       → All loyalty cards
  📷 Scan         → QR scanner
  📊 Insights     → Spending analytics
  🗺️ Nearby       → Discover merchants
  👤 Profile      → Account + settings
```

### 3.2 Customer Onboarding — First Time Experience

> 🆕 Critical addition — first-time users must understand the app instantly

**Onboarding flow (new install):**

1. Welcome screen — "Collect stamps. Track spending. Earn rewards."
2. Phone number entry + name
3. Quick tutorial (3 swipeable cards):
   - "Scan a merchant's QR code to earn a stamp"
   - "Watch your stamps fill up — hit the target for a reward"
   - "Track everything you spend across all your favourite places"
4. "Find a merchant near you" CTA → opens nearby map
5. Or "Scan your first QR" CTA → opens scanner

**Return user — no onboarding shown again.**

### 3.3 Wallet — Redesigned

- Visual card grid — each card uniquely branded per merchant
- Sort: Most Recent / Reward Ready / Most Stamps / Most Spent
- Search by merchant name
- Filter: All / Reward Ready / Nearby / New Campaigns
- Swipe card left → spending history at that merchant
- Swipe card right → quick scan shortcut
- **Reward Ready** cards pinned to top with green glow
- **Expiring rewards** shown with orange warning badge
- Empty state: animated QR scan prompt with tutorial hint

### 3.4 Card Detail View

- Full branded card (merchant colors + logo)
- Stamp grid: filled ✓ vs empty ○ — animated pop-in on change
- Progress bar with shimmer animation
- **"X more stamps for [reward]!"** — prominent counter
- Spend summary at this merchant:
  - Total spent all time
  - Average spend per visit
  - Last visit date + amount
- Reward info: type, description, expiry date
- Full visit history: scrollable — date + amount per visit
- Merchant info: name, category, address, phone, hours (tap to call/map)
- Deep link share button: "Share this merchant's card"

### 3.5 Spending Insights

**Monthly Dashboard:**

- Total spent across all YoRewards merchants this month
- Breakdown by merchant — bar chart
- vs last month comparison: "NPR 800 more than last month"
- Favourite merchant: most visits + most spent
- Stamps earned this month
- Rewards redeemed vs expired (missed)

**Weekly Digest Notification:**

> "This week you visited 3 places and spent NPR 1,850. 2 stamps away from a free coffee at Brew & Co! ☕"

**Yearly Summary (Spotify Wrapped style):**

> "In 2026 you visited YoRewards merchants 47 times, spent NPR 38,400, and earned 12 rewards. Your most loyal spot: Brew & Co ☕"

**Spending History Feed:**

- Full scrollable transaction timeline
- Filter: by merchant / date range / amount
- Each entry: merchant name, amount, stamps earned, date

### 3.6 Reward History

> 🆕 Critical addition — customers need full reward visibility

- All rewards ever earned — across all merchants, all time
- Status per reward: Redeemed ✅ / Expired ❌ / Active 🟢
- Date earned, date redeemed or expired
- Which card and merchant
- Summary stats: total redeemed, total expired (missed), total active
- Motivation: "You've saved an estimated NPR 4,200 in rewards!"

### 3.7 Customer Feedback After Redemption

> 🆕 Critical addition — gold data for merchants

After a reward is redeemed:

- Simple rating prompt appears: ⭐⭐⭐⭐⭐
- Optional short text: "What did you enjoy?" (max 120 chars)
- Completely optional — dismissable in one tap
- Data goes to merchant dashboard as customer satisfaction score
- Merchant can respond to feedback (shown to customer in reward history)
- Not public — private between customer and merchant

### 3.8 Stamp Dispute Resolution

> 🆕 Critical addition — customers need recourse when things go wrong

**Scenarios:**

- Customer scanned QR but merchant never approved (expired session)
- Merchant entered wrong spend amount
- Stamp session timed out due to connectivity

**Resolution flow:**

1. Customer taps "Missing stamp?" on card detail
2. Fills form: date of visit, approximate spend, description
3. Merchant receives dispute notification in dashboard
4. Merchant reviews + responds: Approve stamp / Reject with reason
5. Customer notified of outcome
6. If merchant doesn't respond in 48hrs → Super Admin auto-notified
7. Super Admin can manually resolve

**Limits:** Max 2 disputes per customer per merchant per month (prevents abuse)

### 3.9 Smart Notifications — Customer

| Trigger          | Message                                                            | Timing           |
| ---------------- | ------------------------------------------------------------------ | ---------------- |
| Stamp approved   | "Stamp added at [Merchant]! 3 more for your reward 🎯"             | Immediately      |
| Reward unlocked  | "🎉 Free coffee earned at Brew & Co! Claim before Jan 31."         | Immediately      |
| Reward expiring  | "⏰ Your reward at Brew & Co expires in 3 days!"                   | 3 days before    |
| Win-back         | "Miss us? 6 stamps waiting at Brew & Co — 4 more for free coffee!" | 30 days inactive |
| Streak           | "3 weeks in a row at Momo House! 🔥 Keep the streak alive!"        | Weekly           |
| Nearby           | "You're near Brew & Co — 2 stamps away from your reward ☕"        | Location-based   |
| Spending insight | "You've spent NPR 5,000 at YoRewards merchants this month 📊"      | Monthly          |
| Campaign launch  | "🎁 New campaign at [Merchant]: 5 stamps = free dessert!"          | On launch        |
| Birthday         | "🎂 Happy Birthday! [Merchant] has a surprise for you today!"      | On birthday      |
| Dispute resolved | "Your stamp dispute at [Merchant] has been resolved ✅"            | On resolution    |
| Weekly digest    | "This week: 3 visits, NPR 1,850 spent, 2 stamps away from reward"  | Weekly Sunday    |

**Notification Preferences:**

> 🆕 Customer can opt in/out per notification type per merchant

- Toggle per category: Stamp updates / Reward alerts / Spending insights / Promotions / Nearby
- Toggle per merchant: mute all notifications from a specific merchant
- Global quiet hours setting

### 3.10 Nearby Merchants

- Map view of all YoRewards merchants near customer
- Filter: All / Café / Salon / Restaurant / Bakery / Pharmacy
- Shows: merchant name, category, distance, rating
- For merchants customer already visits: shows stamp progress overlay
- Business hours shown — "Open now" / "Closes at 8pm" / "Closed"
- Discovery: "New near you" — merchants customer hasn't tried
- Tap merchant → card preview, reward, minimum spend, deep link to join

### 3.11 Reward Enhancements

- **Reward expiry:** merchant sets validity after unlock (e.g. 30 days)
- **Partial milestones:** stamp 5 = 10% off, stamp 10 = free item
- **Streak rewards:** visit 3 weeks in a row → bonus stamp
- **Birthday reward:** auto bonus stamp or reward on birthday
- **Surprise stamp:** merchant randomly awards bonus stamp
- **Double stamp events:** merchant declares time window — 2x stamps

### 3.12 Deep Linking

> 🆕 Critical for growth and sharing

- Every merchant card has a shareable deep link
- Link opens YoRewards app directly to that merchant's card
- If app not installed → opens App Store / Play Store first, then card on install
- Use cases:
  - Merchant shares their card link on Instagram / WhatsApp / Facebook
  - Customer shares "Join [Merchant]'s loyalty program!" with friends
  - QR code on receipts, menus, table cards — scans open the card directly

### 3.13 Accessibility

> 🆕 Critical — often forgotten, legally important

- Full VoiceOver (iOS) and TalkBack (Android) support
- Minimum tap target 44×44px everywhere
- WCAG AA colour contrast ratios throughout
- Dynamic font size support (respects system font size)
- Haptic feedback on stamp confirm and reward unlock
- Screen reader labels on all interactive elements
- High contrast mode option in settings

### 3.14 Customer Profile

- Name, phone, birthday
- Member since date
- Notification preferences
- **Lifetime stats:**
  - Total stamps collected (all merchants)
  - Total rewards redeemed
  - Total spend tracked
  - Favourite merchant badge
  - Longest visit streak
- Data export — full spending history as PDF
- Account deletion — GDPR-compliant, clears all data
- App version + force update prompt when critical update available

---

## 4. Merchant Experience

### 4.1 Merchant Onboarding — Redesigned

**Self-serve. Under 5 minutes. Auto-approved for Free tier.**

**Step-by-step wizard:**

```
Step 1 → Business details (name, category, phone, address, hours)
Step 2 → Business verification (see Section 4.2)
Step 3 → Logo upload + brand color picker
Step 4 → Card design + live preview
Step 5 → Stamp rules (target, min spend, reward type + value)
Step 6 → QR code ready — display or print
```

**Post-onboarding:**

- Welcome email: QR code PNG + setup guide + video walkthrough link
- In-app checklist: "Complete your setup" — tracks progress
- First stamp celebration: "🎉 Your first stamp was just approved!"

### 4.2 Merchant Verification

> 🆕 Critical addition — prevents fake businesses, builds customer trust

**Free tier:** Basic verification

- Phone number OTP verified
- Business name + category confirmed
- Live immediately — no waiting

**Paid tiers:** Enhanced verification

- Upload one document: business registration / PAN card / trade license
- Super Admin reviews within 24 hours
- Verified badge shown on merchant card in customer wallet
- Verified merchants ranked higher in nearby discovery

**Verification badge:**

- ✅ Verified — shown on merchant card
- Builds customer trust — they know the business is legitimate
- Required for Growth+ tier

### 4.3 Merchant Dashboard — Redesigned

**Cashier view (primary — what staff sees at counter):**

- Stamp approval queue — full screen, always visible
- Each request: customer name, card, time
- Approve + spend entry in one action
- Quick redeem button
- Active customers right now

**Owner view (business intelligence):**

- Daily snapshot: stamps today, loyalty revenue, new customers, redemptions
- Weekly trend sparkline chart
- Top 5 customers this week (visits + spend)
- Alerts panel: at-risk customers, expiring rewards, pending disputes
- Campaign performance if active

### 4.4 Merchant Mobile App

- Dedicated iOS + Android app (Expo)
- Stamp queue as primary screen — always on top
- Lock screen notification: approve without opening app
- Face ID / fingerprint login
- Offline mode — queues approvals, syncs on reconnect
- Quick staff account switch
- Business hours toggle: "Open for stamps" / "Closed"

### 4.5 Merchant Business Profile

> 🆕 Customers see this — must be complete

- Business name, category, description (max 200 chars)
- Logo + cover photo
- Address (shown on nearby map)
- Phone number (tap to call from customer app)
- Business hours — per day of week
- Website / Instagram link (optional)
- All publicly visible in customer nearby view and card detail

### 4.6 Customer CRM — Full

**Customer list view:**

- Search by name or phone
- Sort by: total spend / total visits / last visit / stamp count
- Filter by segment: VIP / Regular / At Risk / New / Lapsed
- Export as CSV (Starter+)

**Individual customer profile (merchant view):**

- Name + masked phone (+977 98XX XXX 890)
- Segment tag: 🌟 VIP / 🔄 Regular / ⚠️ At Risk / 🆕 New
- Total visits to this merchant
- Total spend at this merchant
- Average spend per visit
- Last visit: date + amount
- Full stamp history: date + amount per visit
- Full reward history: earned / redeemed / expired
- Feedback ratings left by this customer
- Private notes: "Prefers oat milk" / "Birthday in March"
- Dispute history

**Customer Segments (auto-calculated):**
| Segment | Definition |
|---|---|
| 🌟 VIP | Top 10% by total spend at this merchant |
| 🔄 Regular | 3+ visits in last 30 days |
| ⚠️ At Risk | No visit in 30–60 days |
| 🆕 New | First visit in last 7 days |
| 💤 Lapsed | No visit in 60+ days |

### 4.7 Merchant Analytics — Full

**Visit Analytics:**

- Total visits: today / week / month / all time
- Unique customers: active / new / returning / lapsed
- Peak hours heatmap — busiest times of day and week
- Average visits per customer per month

**Spend Analytics:**

- Total revenue from loyalty customers
- Average spend per visit (all + by segment)
- Revenue trend over time
- High value customers ranked by spend
- Revenue estimate from loyalty program ROI

**Loyalty Analytics:**

- Stamps issued: today / week / month
- Redemption rate: % of completed cycles claimed
- Reward expiry rate: % of rewards that expire unclaimed
- Most popular reward type

**Customer Satisfaction:**

- Average rating from post-redemption feedback
- Rating trend over time
- Recent feedback feed with merchant response option

**Dispute Analytics:**

- Total disputes filed
- Resolution rate
- Average resolution time

### 4.8 Multi-Staff

- Owner + unlimited staff (tier-dependent)
- Staff roles:
  - **Cashier:** approve stamps, enter spend, redeem rewards
  - **Manager:** cashier + view analytics, manage customers, send campaigns
  - **Owner:** full access including billing, card management, staff management
- PIN-based quick switch on shared device
- Per-staff performance: stamps approved, redemptions processed
- Staff activity log: full history of who did what

### 4.9 Multiple Cards

- Free: 1 card
- Starter: 3 cards
- Growth+: unlimited
- Card types:
  - **Standard:** permanent loyalty card
  - **Campaign:** time-limited (Section 6.3)
  - **VIP:** invite-only, merchant manually adds customers
- Each card has own QR code
- Customer holds all merchant cards simultaneously

### 4.10 Merchant Response to Customer Feedback

> 🆕 Closes the feedback loop

- Merchant sees customer ratings in dashboard
- Can reply to any rating (reply visible to that customer only)
- Reply shown in customer's reward history for that merchant
- Builds relationship and shows merchant cares

---

## 5. Merchant Subscription Plans

### 5.1 Plan Overview

| Feature                     | Free        | Starter       | Growth          | Enterprise |
| --------------------------- | ----------- | ------------- | --------------- | ---------- |
| **Price**                   | NPR 0/month | NPR 999/month | NPR 2,499/month | Custom     |
| **Active customers**        | 50          | Unlimited     | Unlimited       | Unlimited  |
| **Loyalty cards**           | 1           | 3             | Unlimited       | Unlimited  |
| **Staff accounts**          | 1           | 3             | 10              | Unlimited  |
| **QR stamp flow**           | ✅          | ✅            | ✅              | ✅         |
| **Spend tracking**          | ✅          | ✅            | ✅              | ✅         |
| **Basic analytics**         | ✅          | ✅            | ✅              | ✅         |
| **Advanced analytics**      | ❌          | ✅            | ✅              | ✅         |
| **Customer CRM**            | ❌          | ✅            | ✅              | ✅         |
| **CSV export**              | ❌          | ✅            | ✅              | ✅         |
| **Campaign cards**          | ❌          | ✅            | ✅              | ✅         |
| **Smart promotions (auto)** | ❌          | ✅            | ✅              | ✅         |
| **Push campaigns (manual)** | ❌          | ❌            | ✅              | ✅         |
| **Campaigns per month**     | 0           | 0             | 4               | Unlimited  |
| **Nearby discovery**        | ❌          | ✅            | ✅              | ✅         |
| **Verified badge**          | ❌          | ✅            | ✅              | ✅         |
| **Customer feedback**       | ❌          | ✅            | ✅              | ✅         |
| **API access**              | ❌          | ❌            | ✅              | ✅         |
| **White label**             | ❌          | ❌            | ❌              | ✅         |
| **Dedicated support**       | —           | Email         | Priority        | Dedicated  |
| **Free trial**              | —           | 30 days       | 30 days         | POC        |

### 5.2 Plan Details

#### 🆓 Free

- Perfect for: merchants testing YoRewards for the first time
- 1 card, 50 active customers
- Basic stamp flow + spend tracking
- Basic dashboard
- Auto-approved — live in 5 minutes
- Upgrade prompt when approaching 50 customer limit
- No verified badge — basic trust level

#### 🚀 Starter — NPR 999/month

- Perfect for: small cafes, salons, single-location businesses
- 3 loyalty cards
- 3 staff accounts
- Full customer CRM with segments and profiles
- Advanced analytics with spend breakdown
- Campaign cards — run time-limited promotions
- Smart automated promotions ("X more stamps" notifications)
- Featured in nearby discovery
- Verified badge after document check
- Customer feedback + merchant response
- CSV export

#### 📈 Growth — NPR 2,499/month

- Perfect for: established businesses wanting marketing tools
- Unlimited loyalty cards
- 10 staff accounts
- Everything in Starter
- Manual push campaigns (4/month) with audience targeting
- Double stamp events
- API access + webhooks for POS integration
- Priority support (24hr response)
- Detailed cohort analytics + ROI reporting

#### 🏢 Enterprise — Custom pricing

- Perfect for: chains, franchises, large businesses
- Unlimited everything
- White label — your own branding on customer-facing experience
- Dedicated account manager
- Custom integrations
- SLA guarantee
- Onboarding assistance and training

### 5.3 Billing

- Monthly or annual billing
- Annual: 2 months free (NPR 9,990/year Starter / NPR 24,990/year Growth)
- Payment: eSewa or Khalti
- Auto-renewal with 3-day advance notification
- Invoice generated automatically each cycle
- Failed payment → 7-day grace period → downgrade to Free
- Upgrade/downgrade anytime — prorated

### 5.4 Free Trial

- 30 days free on Starter or Growth
- No payment required to start
- Full feature access during trial
- Day 25 reminder: "5 days left on your trial"
- Day 30: auto-downgrade to Free if no payment
- One trial per merchant — cannot restart

---

## 6. Smart Promotions & Push Campaigns

> The feature that drives repeat visits and proves ROI to merchants.

### 6.1 Smart Promotions — Automated (Starter+)

Fires automatically based on customer behaviour. Merchant enables/disables each toggle.

#### "X More Stamps" Notification — Most Important Feature

> Automatically notifies customers when they are close to earning a reward. Drives the visit.

- Merchant sets trigger threshold: notify when 1, 2, or 3 stamps away
- Fires once per reward cycle — not spammy
- Personalised and merchant-branded

**Examples:**

> ☕ "Just 1 stamp away from a FREE coffee at Brew & Co! Pop in today."

> 🍕 "3 more visits to Momo House = FREE momos! 🥟 Come see us."

> ✂️ "2 more haircuts at Style Studio and your next is 50% off!"

#### Win-Back Notification

- Fires when customer hasn't visited in X days (merchant sets: 14 / 30 / 45 / 60)
- Reminds customer they have stamps waiting

> "Miss us? 👋 6 stamps waiting at Brew & Co — just 4 more for your free coffee!"

#### Streak Encouragement

> "3 weeks in a row at Momo House! 🔥 You're on a streak — keep it going!"

#### Reward Expiry Warning

> "⏰ Your free coffee reward at Brew & Co expires in 3 days. Don't let it go!"

#### Birthday Promotion

> "🎂 Happy Birthday! Brew & Co is treating you to a surprise stamp today. Come celebrate!"

#### Post-Redemption Thank You

> 🆕 "Thank you for visiting Brew & Co! How was your reward? ⭐⭐⭐⭐⭐"

- Fires 1 hour after redemption
- Links to feedback rating

### 6.2 Push Campaigns — Manual (Growth+)

Merchant composes and sends custom push notifications to their customer base.

**Campaign Builder:**

- **Audience targeting:**
  - All customers
  - By segment: VIP / Regular / At Risk / New / Lapsed
  - By stamp count: e.g. customers with 5+ stamps
  - By last visit: e.g. haven't visited in 30 days
  - By spend: e.g. customers who've spent over NPR 2,000
- **Message composer:**
  - Title (max 50 chars)
  - Body (max 120 chars)
  - Emoji support
  - Template library (see below)
  - Preview on mock phone screen
- **Scheduling:**
  - Send now
  - Schedule for specific date/time
  - Best time suggestion (based on merchant's peak hours data)
- Estimated reach shown before sending
- Confirm before send

**Campaign Templates:**

```
☕ Slow Day Special
"It's quiet at [Merchant] today — perfect time to visit!
No queue. Great service. Come earn your stamp."

🎁 Double Stamp Event
"TODAY ONLY: Double stamps at [Merchant]!
Visit before 6pm — earn 2 stamps in one visit 🎯"

🌟 VIP Appreciation
"You're one of our most loyal customers 💛
As a thank you — surprise stamp waiting for you!"

🎊 Special Event
"Join us this [day] for [event] at [Merchant]!
Collect your stamp and enjoy something special."

🆕 New Menu Alert
"[Merchant] just launched something new!
Come try it today and earn your stamp 🌟"

📅 Seasonal Campaign
"[Festival] special at [Merchant]!
Collect [X] stamps this [month] and get [reward]."
```

**Campaign Analytics:**

- Sent / Delivered / Opened counts
- Visit rate: customers who visited within 24hrs of notification
- Stamps earned within 24hrs of campaign
- Estimated revenue from campaign visits
- Best performing campaign (tracked over time)

### 6.3 Campaign Cards — Time-Limited Promotions (Starter+)

Special loyalty card that runs for a fixed time period.

**Setup:**

- Card name: "Summer Special" / "Dashain Offer" / "Grand Opening"
- Start date + end date
- Stamp target (can be lower — e.g. 5 for urgency)
- Reward (can be more exciting than regular)
- Auto-deactivates after end date
- Customer's earned stamps preserved

**Examples:**

```
🌞 Summer Special (June 1 – August 31)
5 stamps → FREE cold brew
"Beat the heat with our summer loyalty deal!"

🎊 Dashain Offer (Oct 1–20)
3 stamps → 30% off next order
"Celebrate Dashain with us — 3 visits, massive savings!"

🆕 Grand Opening (July 1–15)
3 stamps → FREE item from new menu
"We just opened! Get rewarded fast."

🎂 Birthday Month Special
Collect during your birthday month → double reward value
"It's your month — we're celebrating with you!"
```

**Discovery:**

- Campaign cards shown in Nearby Merchants section
- Push notification to existing customers on campaign launch
- Campaign end countdown shown on card: "3 days left!"

### 6.4 Double Stamp Events

- Merchant declares time window: "Today 2pm–5pm: Double stamps!"
- Every approved stamp counts as 2 during window
- Push to all customers with merchant's card
- Banner shown on card in customer wallet during event
- Drives traffic during off-peak hours

### 6.5 Referral — Customer Brings Customer

- Customer shares referral link/QR for merchant
- Friend scans → joins → both get bonus stamp
- Merchant enables/disables per card
- Referral dashboard in analytics: organic vs referred customers
- Referred customers tracked — are they as loyal as organic?

---

## 7. Super Admin

### 7.1 Platform Health Dashboard

**Real-time metrics:**

- Total merchants: active / trial / free / paid / suspended / pending verification
- Total customers: active (stamped in last 30 days) / total registered
- Stamps issued: today / week / month / all time
- Rewards redeemed: today / week / month
- MRR: current + month-over-month trend
- New merchant signups: this week / month
- Churn rate: cancelled this month
- Dispute open rate: unresolved disputes as % of total stamps
- Average platform rating (from customer feedback)

### 7.2 Merchant Management

- Full list: search, filter by tier / status / country / category / verification
- Individual merchant view:
  - Business details + verification documents
  - Subscription + billing history
  - All cards + customer counts
  - Total stamps + revenue
  - Staff accounts
  - Dispute history
  - Activity log
- Actions:
  - Approve / reject verification documents
  - Suspend / reactivate
  - Manually change subscription tier
  - Extend trial
  - Send direct message
  - Add internal notes
  - Flag for fraud review

### 7.3 Customer Management

- Full list: search by phone or name
- Individual customer view:
  - All loyalty cards across all merchants
  - Full spending history (all merchants)
  - Notification history
  - Dispute history
  - Device info + account creation date
- Actions:
  - Suspend / reactivate
  - Manually add / void stamp (audit logged)
  - Export all data (GDPR request)
  - Delete account (GDPR request — irreversible)

### 7.4 Dispute Management

> 🆕 Central dispute resolution hub

- All open disputes across platform in one view
- Filter: unresolved / merchant resolved / admin resolved / closed
- Each dispute: customer name, merchant, date of visit, description
- Admin can:
  - View full context (stamp history, transaction record)
  - Override merchant decision
  - Manually issue stamp
  - Close with note
- SLA: all disputes resolved within 48hrs
- Auto-escalation: if merchant doesn't respond in 24hrs, dispute flags to admin

### 7.5 Fraud Detection

**Automated flags:**

- Customer scans same merchant QR 3+ times in 5 minutes
- Merchant approves 50+ stamps in 1 hour (unusual volume)
- Same phone number registers multiple accounts
- Redemption code used twice (system blocks but flags)
- Spend amounts always exactly at minimum threshold
- Multiple disputes filed against same merchant in short period

**Fraud dashboard:**

- Flagged merchants + customers list
- Severity: 🟡 Low / 🟠 Medium / 🔴 High
- Admin reviews: dismiss / warn / suspend
- All actions audit logged

### 7.6 Verification Queue

- Documents uploaded by merchants for paid tier verification
- Review interface: view document, approve or reject with reason
- Target: 24-hour turnaround
- Rejection triggers email to merchant with reason + resubmission link

### 7.7 Platform Announcements

- Push notification to all merchants or customers
- Segment: by tier / by country / by activity level
- In-app banner — shown on next app open
- Schedule in advance
- Preview before send

### 7.8 Revenue Management

- MRR dashboard with trend
- Revenue by tier breakdown
- Failed payment alerts: merchant + amount + days overdue
- Manual subscription overrides
- Invoice history per merchant
- Annual revenue forecast

### 7.9 Audit Log — Enhanced

Every platform action logged:

- Who (admin / merchant / customer ID)
- What (action type + before/after state)
- When (timestamp)
- Which device (user agent)

Filter: by action type / date / user / severity
Export as CSV

---

## 8. Platform & Scale

### 8.1 API for POS Integration (Growth+)

```
POST /api/v1/stamps/issue
  → Issue stamp from POS on payment
  Body: { customer_phone, card_id, amount_spent }
  Returns: { stamp_id, current_stamps, reward_status }

POST /api/v1/rewards/redeem
  → Redeem reward from POS
  Body: { customer_phone, card_id }
  Returns: { redeemed, new_cycle_started }

GET /api/v1/customers/{phone}
  → Get customer stamp status for this merchant
  Returns: { current_stamps, target, reward_status, last_visit }

GET /api/v1/analytics/summary
  → Merchant analytics summary
  Returns: { stamps_today, active_customers, redemptions_month }
```

**Webhooks:**

- `stamp.issued` — on stamp approved
- `reward.unlocked` — on target reached
- `reward.redeemed` — on merchant redemption
- `customer.new` — on new customer joining card
- `dispute.filed` — on customer dispute

**Developer portal:**

- API key management (generate / revoke)
- Usage logs and rate limits
- Swagger documentation
- Webhook test console

### 8.2 App Version Management + Force Update

> 🆕 Critical for when breaking changes are deployed

- Server-side minimum version config
- On app open: compare installed version vs minimum required
- If outdated: full-screen force update prompt — cannot bypass
- If recommended update: dismissable banner "Update available"
- Prevents users running broken old versions post-deployment

### 8.3 WhatsApp Bot (Later — Phase 3)

- Customer messages merchant's YoRewards WhatsApp number
- Bot shows stamp balance and reward status
- Browse merchant menu
- Place order → stamp auto-issued on completion
- Opt-in per merchant (Growth+ only)

### 8.4 Referral System

**Customer referral:**

- Unique referral link per customer per merchant
- Friend joins → both get bonus stamp
- Referrer stats: friends referred, stamps earned from referrals

**Merchant referral:**

- Merchant refers another merchant with unique code
- Referred merchant signs up paid plan → referring merchant gets 1 month free

### 8.5 Data & Privacy

- All data: Supabase PostgreSQL (Nepal — closest available region)
- Phone numbers masked in merchant view
- Customer data export: full history as PDF on request
- Account deletion: all data purged within 30 days
- Data retention: inactive accounts warned at 18 months, deleted at 24 months
- Phone numbers never shared between merchants
- Terms & Conditions + Privacy Policy pages in app (required for billing)

### 8.6 Terms & Conditions / Privacy Policy

> 🆕 Legal requirement — especially for paid subscriptions

- Privacy Policy page in customer app (accessible from profile)
- Terms & Conditions for merchant subscription (must accept before billing)
- Cookie policy (web dashboard)
- Must accept on signup — checkbox, not skippable
- Versioned — when updated, users prompted to re-accept
- Managed by Super Admin — editable from admin dashboard

---

## 9. Critical Missing Features — Added

> These were identified as gaps in the original V2 plan. All added above in full.

| #   | Feature                                     | Where Added  | Why Critical                                          |
| --- | ------------------------------------------- | ------------ | ----------------------------------------------------- |
| 1   | Customer onboarding tutorial                | Section 3.2  | First-time users won't understand the app without it  |
| 2   | Merchant verification + verified badge      | Section 4.2  | Prevents fake businesses, builds customer trust       |
| 3   | Customer feedback + rating after redemption | Section 3.7  | Invaluable data for merchants, closes experience loop |
| 4   | Merchant response to feedback               | Section 4.10 | Relationship building, shows merchant engagement      |
| 5   | Stamp dispute resolution                    | Section 3.8  | Customers lose stamps unfairly — need recourse        |
| 6   | Central dispute management (admin)          | Section 7.4  | Platform integrity and fairness                       |
| 7   | Offline / poor connection handling          | Section 2.3  | Nepal has inconsistent connectivity — critical        |
| 8   | Reward history (all time, all merchants)    | Section 3.6  | Customers need full reward visibility                 |
| 9   | Merchant business profile (public)          | Section 4.5  | Customers need hours, address, phone from card        |
| 10  | Business hours in nearby view               | Section 3.10 | Don't send customers to closed businesses             |
| 11  | Customer notification preferences           | Section 3.9  | Opt-in/out per type — prevents notification fatigue   |
| 12  | App version management + force update       | Section 8.2  | Prevents broken old versions post-deployment          |
| 13  | Deep linking                                | Section 3.12 | Viral growth — merchants share their card link        |
| 14  | Accessibility                               | Section 3.13 | Legal + ethical requirement                           |
| 15  | Terms & Conditions / Privacy Policy         | Section 8.6  | Legal requirement for billing and data                |
| 16  | Post-redemption thank you notification      | Section 6.1  | Triggers feedback, closes engagement loop             |
| 17  | Dispute analytics for admin                 | Section 7.4  | Platform health monitoring                            |
| 18  | In-app onboarding checklist for merchant    | Section 4.1  | Guides merchant to full setup completion              |

---

## 10. Tech Stack — V2 Additions

| Layer              | Technology                        | Purpose                                         |
| ------------------ | --------------------------------- | ----------------------------------------------- |
| Native app         | Expo SDK 53 (React Native)        | iOS + Android — customer + merchant             |
| Push notifications | Expo Push Notifications           | All customer + merchant push alerts             |
| Charts             | Recharts                          | Spend analytics, merchant dashboard             |
| Maps               | React Native Maps                 | Nearby merchants feature                        |
| Location           | Expo Location                     | Customer location for nearby                    |
| Background sync    | Expo Background Fetch             | Sync offline stamps on reconnect                |
| Offline DB         | WatermelonDB                      | Local stamp queue for merchant offline mode     |
| Payments           | eSewa SDK + Khalti SDK            | Merchant subscription billing                   |
| Campaign scheduler | Supabase Edge Functions + pg_cron | Scheduled push campaigns + automated promotions |
| API docs           | Swagger / OpenAPI                 | POS integration developer portal                |
| Deep links         | Expo Linking + Branch.io          | Universal deep links for card sharing           |
| Force update       | expo-updates                      | App version management                          |
| Analytics          | PostHog (self-hosted)             | Product analytics — funnels, retention, events  |
| Error tracking     | Sentry                            | Crash reporting for both apps                   |
| Image CDN          | Cloudflare Images                 | Merchant logo optimisation + fast delivery      |

---

## 11. V2 Build Order — 16 Weeks

| Week      | Focus                              | Deliverables                                                                                                                                      |
| --------- | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| **1–2**   | QR Stamp Flow + Offline            | Static merchant QR, customer scan, merchant approves + enters spend, offline queue, dispute filing                                                |
| **3–4**   | Native Customer App                | Expo setup, wallet, QR scanner (fixes iOS), push notifications, onboarding tutorial                                                               |
| **5–6**   | Merchant Mobile App + Verification | Expo merchant app, lock screen approve, offline mode, document verification flow, verified badge                                                  |
| **7–8**   | Spending Insights + Reward History | Customer spend dashboard, charts, reward history, merchant spend analytics, customer feedback                                                     |
| **9–10**  | Subscription Billing               | eSewa + Khalti, plan management, trial, upgrade/downgrade, invoicing, T&C acceptance                                                              |
| **11–12** | Smart Promotions                   | "X more stamps" auto-notification, win-back, expiry warning, birthday reward, campaign cards                                                      |
| **13–14** | Push Campaigns + CRM               | Manual campaign builder, audience targeting, merchant CRM, segments, private notes, merchant response to feedback                                 |
| **15–16** | Super Admin + Scale + Polish       | Fraud detection, dispute management centre, verification queue, revenue dashboard, deep linking, force update, accessibility pass, API + webhooks |

---

## 12. Complete Feature Summary

### 🔴 Core

- QR-based stamp flow — 2 steps, under 10 seconds
- Spend amount entered by merchant on every stamp approval
- Spend stored per transaction for full analytics
- Offline stamp queue — syncs on reconnect

### 👤 Customer

- Native iOS + Android app (Expo)
- First-time onboarding tutorial — 3-screen swipeable guide
- Redesigned wallet — sort, search, filter, swipe gestures
- Stamp progress counter — "3 more stamps for a free coffee!"
- Spending insights — monthly breakdown, weekly digest, yearly summary
- Reward history — all rewards ever, all merchants, all statuses
- Customer feedback — rate experience after redemption
- Stamp dispute resolution — report missing stamps
- Smart notifications — 9 trigger types, all opt-in/out per merchant
- Notification preferences — per type, per merchant, quiet hours
- Nearby merchants map — discovery + business hours + stamp overlay
- Reward enhancements — expiry, milestones, streak, birthday, surprise
- Deep linking — share merchant card via link or QR
- Accessibility — VoiceOver, TalkBack, WCAG AA, dynamic font size
- Profile — lifetime stats, data export, account deletion

### 🏪 Merchant

- Self-serve onboarding wizard — live in under 5 minutes
- Business verification + verified badge (Starter+)
- Complete business profile — hours, address, phone, description
- Dedicated mobile app — lock screen stamp approval, offline mode
- Stamp queue as primary view — cashier-optimised
- Multi-staff — roles (cashier / manager / owner), performance tracking
- Customer CRM — profiles, segments, private notes, spend history
- Multiple loyalty cards (tier-dependent)
- Campaign cards — time-limited promotions
- Double stamp events
- Smart automated promotions (Starter+):
  - "X more stamps" notification
  - Win-back, streak, expiry warning, birthday, post-redemption thank you
- Manual push campaigns with audience targeting (Growth+)
- Advanced analytics — spend trends, peak hours, cohort, ROI
- Customer feedback dashboard + merchant response
- Dispute management — respond to customer disputes
- In-app onboarding checklist
- CSV export (Starter+)
- API + webhooks for POS integration (Growth+)

### 💳 Subscription Plans

| Plan           | Price           | Key Features                                   |
| -------------- | --------------- | ---------------------------------------------- |
| **Free**       | NPR 0           | 1 card, 50 customers, basic flow               |
| **Starter**    | NPR 999/month   | 3 cards, CRM, smart promotions, verified badge |
| **Growth**     | NPR 2,499/month | Unlimited cards, push campaigns, API           |
| **Enterprise** | Custom          | White label, dedicated support                 |

- 30-day free trial · eSewa + Khalti · Annual discount (2 months free)

### 🔧 Super Admin

- Platform health dashboard — MRR, stamps, merchants, customers, churn
- Merchant management — approve, verify, suspend, message, adjust plan
- Customer management — view history, suspend, GDPR deletion
- Dispute management centre — resolve, override, SLA tracking
- Fraud detection — automated flags, severity levels, action tools
- Verification queue — document review within 24hrs
- Push announcements — segmented, scheduled
- Revenue dashboard — MRR trend, failed payments, forecast
- Enhanced audit log — filterable, exportable

### ⚙️ Platform

- REST API + webhooks + Swagger docs (Growth+)
- App version management + force update
- Deep linking via Branch.io
- Referral system (customer + merchant)
- WhatsApp bot (Phase 3)
- Data export + account deletion (GDPR)
- Terms & Conditions + Privacy Policy (required for billing)
- Error tracking (Sentry) + product analytics (PostHog)

---

## 13. The V2 Promise

When V2 ships, YoRewards is three things simultaneously:

**For Customers:**
A spending companion — not just a stamp collector. Customers know where their money goes, track their loyalty across every merchant, and feel genuinely rewarded. The app is useful every day, not just at the counter.

**For Merchants:**
A CRM and marketing platform — not just a digital punch card. Merchants know their best customers, see spending trends, run targeted campaigns, and measure real ROI. The stamp flow is so fast cashiers actually prefer it over paper.

**For YoRewards:**
A sustainable, scalable business with recurring revenue, fraud protection, platform intelligence, and the infrastructure to onboard hundreds of merchants without any manual work.

---

> **V1 was a digital punch card.**
> **V2 is a loyalty intelligence platform.**
> **The difference is data, automation, and trust.**

---

_YoRewards — V2 Final PRD · 2026 · Nepal 🇳🇵 · Confidential_
