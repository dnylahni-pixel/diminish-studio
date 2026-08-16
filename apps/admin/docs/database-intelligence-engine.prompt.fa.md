# پرامپت نهایی — استخراج حداکثر قابلیت از دیتامدل Diminish

## نقش سیستم

شما هم‌زمان در نقش‌های زیر عمل می‌کنید:

- Principal PostgreSQL Database Architect
- Principal Data Product Engineer
- Senior Billing, Subscription & Credit Ledger Engineer
- Senior Analytics / Decision Intelligence Engineer
- Production Backend Architect برای Next.js، TypeScript، Drizzle ORM و Neon

شما صرفاً «کوئری‌نویس»، «سازنده داشبورد» یا «تحلیلگر BI» نیستید. مأموریت شما کشف و پیاده‌سازی بیشترین قابلیت محصولی، مدیریتی، مالی، عملیاتی، تحلیلی و اتوماسیونی قابل دفاع از دیتامدل موجود است.

## تعریف دقیق موفقیت

دو مهندس می‌توانند دقیقاً همین جداول را دریافت کنند:

- مهندس ضعیف فقط CRUD، شمارش رکوردها، چند فیلتر و نمودار ساده می‌سازد.
- مهندس ممتاز از روابط، تاریخچه‌ها، ledger، snapshotها، periodها، eventها، pricing ruleها و usage data یک Control Plane هوشمند می‌سازد.

شما باید مانند مهندس دوم عمل کنید.

هدف، پیچیده‌کردن نمایشی SQL نیست. هدف این است که قابلیت‌هایی کشف و ساخته شوند که یک تیم معمولی احتمالاً از کنار آن‌ها عبور می‌کند؛ مانند:

- تصمیم‌سازی مدیریتی و مالی
- موتور entitlement و eligibility
- شبیه‌سازی قیمت و سناریو
- تشخیص نشت درآمد و ناسازگاری مالی
- پیش‌بینی ریسک churn، payment failure و credit exhaustion
- تحلیل مسیر upgrade/downgrade
- تشخیص سوءاستفاده، anomaly و رفتار غیرعادی
- reconciliation و اثبات صحت ledger
- اتوماسیون lifecycle اشتراک، اعتبار، invoice و schedule
- پیشنهاد اقدام بعدی برای مدیر، نه صرفاً نمایش اعداد

تمرکز اصلی روی database intelligence، domain logic، backend modules و SQL است. بااین‌حال باید یک UI ساده، فارسی و کاربردی نیز بسازی تا قابلیت‌ها قابل فهم و قابل آزمایش باشند. این UI ویترین گرافیکی پروژه نیست و نباید زمان اصلی را از منطق داده بگیرد.

---

## زمینه قطعی پروژه

### محصول

`Diminish Super Admin` یک Control Plane تجاری برای مدیریت کاربران، پلن‌ها، نسخه‌های پلن، featureها، entitlement، اشتراک، trial، addon، تخفیف، coupon، invoice، transaction، tax، credit wallet و usage metering است.

### استک

- PostgreSQL روی Neon
- Drizzle ORM `0.45.x`
- Next.js `16.2.11`
- React `19.2.4`
- TypeScript
- Zod `4.x`
- Node.js runtime

### قواعد مهم محیط

- قبل از تغییر کد Next.js، راهنمای مرتبط را از `node_modules/next/dist/docs/` بخوان؛ این نسخه را بر اساس دانش نسخه‌های قدیمی Next.js فرض نکن.
- اتصال فعلی دیتابیس از `@neondatabase/serverless` و `drizzle-orm/neon-http` استفاده می‌کند.
- تراکنش چندمرحله‌ای را بدون بررسی محدودیت‌های Neon HTTP و driver فعلی طراحی نکن.
- در مرز Server/Client، مقدارهای `bigint` باید به شکل امن serialize شوند.
- تمام مبلغ‌ها minor unit هستند.
- currencyهای متفاوت هرگز بدون conversion source معتبر با هم جمع نشوند.
- timestampهای `withTimezone` و timestamp قدیمی `users.created_at` را آگاهانه مدیریت کن.
- اگرچه مستند دامنه جداول را منطقی به `app`، `catalog`، `billing` و `credits` تقسیم می‌کند، schema فیزیکی فعلی migration همگی را در PostgreSQL schema به نام `public` ساخته است.
- نام schema یا جدول خیالی نساز.
- به `.env`، credential یا دیتابیس واقعی دسترسی نداری و نباید درخواست دسترسی کنی.
- هیچ تست، build یا صفحه‌ای نباید برای اجرا به دیتابیس واقعی وابستگی اجباری داشته باشد.
- منطق‌ها را طوری طراحی کن که هسته محاسباتی آن‌ها با fixtureهای deterministic و بدون network قابل آزمایش باشد.
- اتصال به دیتابیس واقعی فقط یک adapter اختیاری است و نباید شرط کارکرد محیط demo/test باشد.

---

## منبع حقیقت و فایل‌هایی که ابتدا باید بررسی شوند

پیش از هر طراحی یا تولید کد، این فایل‌ها را کامل بخوان:

1. `AGENTS.md`
2. `package.json`
3. `drizzle.config.ts`
4. `src/db/index.ts`
5. `src/db/schema/index.ts`
6. تمام فایل‌های `src/db/schema/**/*.ts`
7. `src/db/migrations/meta/0000_snapshot.json`
8. `diminishstudio.md`
9. `docs/ai-dashboard-prompts/00-master-contract.md`
10. queryها و actionهای فعلی در `src/features/**`

تعریف‌های واقعی Drizzle و migration snapshot بر توضیحات این پرامپت اولویت دارند. اگر بین کد، snapshot و مستند اختلافی وجود داشت:

1. اختلاف را ثبت کن.
2. منبع عملیاتی فعلی را مشخص کن.
3. محافظه‌کارانه‌ترین راه سازگار را اجرا کن.
4. هیچ فرض پنهانی نداشته باش.

---

## فهرست قطعی ۳۸ جدول فعلی

### App

1. `users`

### Catalog و Product Configuration

2. `features`
3. `feature_dependencies`
4. `plans`
5. `plan_versions`
6. `plan_prices`
7. `plan_features`
8. `plan_limits`
9. `feature_pricing_rules`
10. `plan_credit_policies`
11. `plan_change_rules`
12. `addons`
13. `plan_addons`
14. `addon_prices`
15. `addon_features`
16. `coupons`

### Billing و Subscription Lifecycle

17. `subscriptions`
18. `subscription_events`
19. `subscription_periods`
20. `subscription_schedules`
21. `trials`
22. `subscription_addons`
23. `subscription_discounts`
24. `transactions`
25. `payment_methods`
26. `invoices`
27. `invoice_items`
28. `tax_rates`
29. `coupon_redemptions`
30. `usage_daily_aggregates`

### Credits و Metered Usage

31. `credit_accounts`
32. `credit_ledger`
33. `credit_grants`
34. `credit_reservations`
35. `credit_packages`
36. `credit_package_prices`
37. `credit_expirations`
38. `usage_events`

---

## ظرفیت‌های دامنه که باید حتماً بررسی شوند

این فهرست پاسخ آماده نیست؛ حداقل سطح اکتشاف مورد انتظار است. هر مورد را با schema واقعی اعتبارسنجی کن، موارد بهتر کشف کن و سپس اولویت‌بندی انجام بده.

### 1. Product Catalog Intelligence

- مقایسه نسخه‌های یک پلن در سطح price، feature، quota، pricing rule و credit policy
- تشخیص نسخه‌های هم‌پوشان، gap زمانی، چند نسخه published ناسازگار یا subscription متصل به نسخه نامعتبر
- ساخت dependency graph برای featureها، cycle detection با Recursive CTE و تشخیص missing dependency
- محاسبه effective entitlement هر subscription با ترکیب plan feature، addon feature، dependency، limit و policy
- plan completeness score و publish-readiness validator
- تشخیص featureهای بلااستفاده، addonهای کم‌ارزش و planهای cannibalizing
- تحلیل ارزش نسبی پلن‌ها و شکاف منطقی میان tierها
- اعتبارسنجی graph تغییر پلن و کشف مسیرهای بن‌بست یا bypass قوانین

### 2. Pricing & Monetization Intelligence

- موتور محاسبه flat، tiered و volume pricing از `feature_pricing_rules.tiers`
- شبیه‌ساز invoice قبل از اعمال تغییر
- محاسبه proration برای تغییر پلن/قیمت بر اساس rule و زمان باقی‌مانده
- مقایسه درآمد واقعی با درآمد مورد انتظار
- تشخیص revenue leakage، underbilling، overbilling و orphan usage
- تحلیل discount leakage و بازده coupon/promotion
- تحلیل addon attach rate، expansion revenue و credit package economics
- MRR/ARR درست به تفکیک currency، plan، cohort و version
- MRR waterfall شامل new، expansion، contraction، reactivation و churn

### 3. Subscription Lifecycle Intelligence

- بازسازی state timeline از `subscription_events`
- تشخیص transitionهای نامعتبر یا event/state drift
- محاسبه churn، reactivation، pause، recovery و survival curve
- cohortهای شروع، trial، plan version و acquisition source
- تحلیل upgrade/downgrade path با `LAG/LEAD`
- اجرای امن scheduleهای due و تشخیص scheduleهای stuck/conflicting
- trial conversion، time-to-convert، trial abuse و عوامل conversion
- health score قابل توضیح برای هر subscription

### 4. Credit Economy & Ledger Intelligence

- reconciliation میان `credit_accounts`، `credit_ledger`، `credit_grants`، `credit_reservations` و `usage_events`
- بازسازی balance از ledger و مقایسه با cached balance
- FIFO grant consumption و expiration-aware allocation
- aging bucket برای creditها و پیش‌بینی مقدار در معرض expiration
- burn rate، runway و زمان تقریبی اتمام اعتبار
- breakage rate و اقتصاد rollover
- تشخیص reservationهای منقضی، double capture، over-capture و stuck hold
- کنترل invariantهای lifetimeGranted/lifetimeUsed/balance/reservedBalance
- عملیات اتمیک reserve، capture، release، grant، refund و expire با idempotency
- تشخیص credit abuse و الگوی مصرف غیرعادی

### 5. Billing, Invoice & Payment Intelligence

- reconciliation بین invoice header و invoice items
- reconciliation بین invoice، transaction و subscription period
- aging report و dunning priority score
- collection rate، refund rate، recovery rate و failed-payment patterns
- تشخیص invoiceهای paid بدون transaction موفق یا transaction موفق بدون invoice صحیح
- کنترل snapshot integrity برای customer، tax، discount و catalog references
- tax applicability و temporal validity
- payment method expiry risk و failure concentration
- محاسبه LTV، ARPU، ARPPU، revenue retention و net revenue retention

### 6. Usage & Behavioral Intelligence

- trend و moving average با `usage_daily_aggregates`
- استفاده از `usage_events` برای forensic/detail و نه scan بی‌دلیل گزارش‌های روزانه
- quota utilization، overage likelihood و saturation
- feature adoption depth/breadth و stickiness
- dormant، power user، at-risk و expansion-ready segmentation
- anomaly detection با روش‌های robust مانند median/MAD، percentile، rolling z-score یا peer baseline
- seasonality و change-point heuristic بدون ادعای ML غیرواقعی
- unit/currency consistency و late-arriving event detection
- ارزیابی کیفیت daily aggregate در برابر raw events

### 7. Cross-Domain Decision Intelligence

- User 360 materialized read model
- next-best-action برای هر کاربر/اشتراک با reason code شفاف
- recommendation برای upgrade، downgrade، addon یا credit pack
- risk/work queue اولویت‌دار برای عملیات مالی و پشتیبانی
- plan profitability proxy و cost-to-serve در حد داده موجود
- تشخیص accountهایی که discount، usage و support risk آن‌ها سودآوری را تهدید می‌کند
- impact analysis قبل از retire یا تغییر plan version
- what-if scenario engine برای price، quota، credit grant و discount

### 8. Data Quality, Integrity & Operations

- orphan reference detection برای UUIDهای بدون FK
- duplicate/idempotency conflict detection
- stale status، impossible timestamps و overlapping periods
- ledger gap و broken balance chain
- data quality scorecard با severity و remediation
- incremental aggregation و backfill امن
- auditability، dry-run، retry، failure recovery و observability

---

## مأموریت اجرایی

### فاز A — Deep Audit

ابتدا schema، constraintها، enumها، indexها، relationها، JSONBها، queryهای فعلی و business ruleها را تحلیل کن.

یک capability map بساز که برای هر خوشه مشخص کند:

- داده موجود چه چیزی را ممکن می‌کند؟
- چه قابلیت‌هایی اکنون پیاده نشده‌اند؟
- کدام قابلیت صرفاً گزارش است؟
- کدام قابلیت یک موتور عملیاتی/تصمیم‌گیری واقعی است؟
- داده برای کدام ادعا کافی نیست؟
- چه risk یا invariant پنهانی وجود دارد؟

### فاز B — Opportunity Portfolio

حداقل ۳۰ ایده غیرتکراری تولید کن و هرکدام را با معیارهای زیر امتیاز بده:

- Business Value: 1–5
- Operational Value: 1–5
- Data Readiness: 1–5
- Novelty: 1–5
- Confidence: 1–5
- Implementation Effort: 1–5
- Performance Risk: 1–5

ایده‌ها نباید با تغییر نام، تکرار یکدیگر باشند. حداقل:

- ۵ مورد Product/Catalog
- ۵ مورد Subscription
- ۵ مورد Billing/Revenue
- ۵ مورد Credits/Ledger
- ۵ مورد Usage/Behavior
- ۵ مورد Cross-domain/Integrity

سپس بهترین portfolio قابل پیاده‌سازی را انتخاب کن؛ صرفاً ساده‌ترین موارد را انتخاب نکن.

### فاز C — Production Implementation

قابلیت‌های منتخب را به شکل کد کامل، ماژولار، تست‌شده و قابل اجرا پیاده‌سازی کن. خروجی نباید مجموعه‌ای از snippetهای جدا یا مقاله باشد.

ترکیبی متوازن از موارد زیر ارائه کن، فقط جایی که توجیه معماری دارند:

- analytical SQL
- views یا materialized views
- PostgreSQL functions/procedures
- constraint و indexes
- incremental refresh/backfill jobs
- Drizzle query/service modules
- domain calculators
- validation/reconciliation modules
- action/recommendation engines
- test fixtures و automated tests

SQL پیشرفته ابزار است، نه هدف. از Window Functions، Recursive CTE، FILTER، GROUPING SETS، ordered-set aggregates، lateral join، range logic و JSONB فقط وقتی ارزش واقعی ایجاد می‌کنند استفاده کن.

---

## حداقل خروجی پیاده‌سازی

حداقل موارد زیر را به‌طور کامل تحویل بده:

1. یک `User 360 / Account Intelligence` read model
2. یک `Subscription Health & Churn Risk` engine با reason code
3. یک `MRR Waterfall & Revenue Movement` engine به تفکیک currency
4. یک `Revenue Leakage & Billing Reconciliation` engine
5. یک `Credit Ledger Reconciliation` engine
6. عملیات اتمیک و idempotent برای چرخه reserve/capture/release اعتبار
7. یک `Credit Burn Rate / Runway / Expiry Risk` engine
8. یک `Effective Entitlement Resolver`
9. یک `Plan Version Diff & Publish Validator`
10. یک `Feature Dependency Cycle/Missing Dependency` detector
11. یک `Usage Anomaly & Quota Saturation` engine
12. یک `Trial/Coupon/Promotion Effectiveness` analysis
13. یک `Next Best Action` engine با explanation و confidence
14. یک `Data Quality & Integrity Scorecard`
15. یک `Prioritized Operations Work Queue`

اگر schema برای بخشی واقعاً ناکافی است، آن را با خروجی دروغین پر نکن. نزدیک‌ترین نسخه معتبر را بساز و کمبود داده را دقیق ثبت کن.

---

## معماری اجباری خروجی

خروجی را مستقیماً به‌صورت یک پروژه منظم، روشن و ماژولار تولید کن.

ساختار هدف را با معماری فعلی repo تطبیق بده، ولی حداقل این جداسازی مفهومی را رعایت کن:

```text
diminish-database-intelligence-engine/
├── README.md
├── MANIFEST.md
├── docs/
│   ├── architecture.md
│   ├── capability-map.md
│   ├── opportunity-portfolio.md
│   ├── assumptions-and-limitations.md
│   ├── data-dictionary.md
│   ├── formulas-and-kpis.md
│   ├── operations-runbook.md
│   └── integration-guide.md
├── migrations/
│   ├── up/
│   └── down/
├── sql/
│   ├── views/
│   ├── materialized-views/
│   ├── functions/
│   ├── procedures/
│   ├── indexes/
│   ├── integrity/
│   ├── analytics/
│   ├── reconciliation/
│   ├── maintenance/
│   └── validation/
├── src/
│   ├── app/
│   │   └── (admin)/
│   │       └── intelligence-lab/
│   ├── features/
│   │   ├── account-intelligence/
│   │   ├── subscription-intelligence/
│   │   ├── revenue-intelligence/
│   │   ├── credit-intelligence/
│   │   ├── entitlement-engine/
│   │   ├── usage-intelligence/
│   │   ├── catalog-intelligence/
│   │   ├── decision-engine/
│   │   └── data-quality/
│   ├── db/
│   ├── jobs/
│   ├── demo/
│   └── shared/
├── tests/
│   ├── fixtures/
│   ├── unit/
│   ├── integration/
│   └── sql/
└── scripts/
    ├── validate.*
    ├── refresh.*
    └── benchmark.*
```

این tree قرارداد مفهومی است، نه مجوز ساخت فایل‌های بی‌مصرف. فایل‌های واقعی باید با repo موجود قابل ادغام باشند. از فایل عظیم monolithic خودداری کن.

### قانون تفکیک

- هر capability در پوشه مستقل خود
- هر query مهم در فایل نام‌دار مستقل
- هر formula مشترک در module مشترک
- SQL migration، analytical query، validation و rollback جدا
- type، schema validation، repository/query، service/calculator و tests جدا
- public API هر ماژول از `index.ts`
- dependency direction روشن و بدون circular import

---

## UI فارسی ساده و آزمایشگاه قابلیت‌ها

یک route مستقل و ساده در ساختار موجود پروژه بساز؛ نام پیشنهادی:

`/intelligence-lab`

این صفحه باید:

- فارسی و RTL باشد، حتی اگر پنل اصلی انگلیسی و LTR است.
- از componentها و design tokenهای موجود پروژه استفاده کند.
- ساده، خوانا و بدون بازطراحی shell اصلی باشد.
- برای هر capability توضیح فارسی کوتاه و دقیق نمایش دهد:
  - این قابلیت چیست؟
  - از کدام جدول‌ها استفاده می‌کند؟
  - چه مسئله‌ای را حل می‌کند؟
  - خروجی چگونه تفسیر می‌شود؟
  - محدودیت و سطح اطمینان آن چیست؟
- قابلیت‌ها را بر اساس دامنه دسته‌بندی کند: Catalog، Subscription، Revenue، Credits، Usage، Integrity و Decision Intelligence.
- برای هر قابلیت یک نمونه اجرای واقعی از همان منطق پیاده‌سازی‌شده ارائه کند، نه خروجی hard-code شده.
- ورودی‌های کنترل‌شده برای تغییر سناریوی تست داشته باشد؛ مانند currency، بازه زمانی، مقدار مصرف، موجودی اعتبار، وضعیت invoice یا plan transition.
- نتیجه، reason code، formula summary و جدول رکوردهای مؤثر را نمایش دهد.
- امکان اجرای edge caseهای از پیش تعریف‌شده را داشته باشد.
- شکست validation را به فارسی و قابل فهم نمایش دهد.

### دو حالت داده

1. `Demo Mode` که اجباری و همیشه قابل اجراست:
   - از fixtureهای کوچک، ثابت، deterministic و version-controlled استفاده کند.
   - به `.env`، network یا دیتابیس واقعی نیاز نداشته باشد.
   - داده demo را با badge واضح «داده آزمایشی» از داده واقعی متمایز کند.
   - اعداد demo نباید در صفحات production یا metricهای واقعی پروژه استفاده شوند.

2. `Database Mode` که صرفاً adapter اختیاری است:
   - فقط اگر اتصال موجود پروژه از قبل قابل استفاده بود فعال شود.
   - نبود اتصال نباید باعث crash، build failure یا صفحه خراب شود.
   - در حالت نبود دیتابیس، UI خودکار و شفاف روی Demo Mode بماند.
   - عملیات تغییردهنده داده در UI پیش‌فرض غیرفعال یا dry-run باشند.

هدف UI این است که من بتوانم منطق‌ها را بفهمم، ورودی‌ها را تغییر بدهم، سناریوها را اجرا کنم و نتیجه را ببینم؛ نه اینکه صرفاً یک dashboard تزئینی تحویل بگیرم.

---

## استاندارد نام‌گذاری اجباری

نام‌ها باید دقیق، domain-driven و self-explanatory باشند.

### TypeScript

- فایل‌ها: `kebab-case.ts`
- function/variable: `camelCase`
- type/interface/class: `PascalCase`
- constant: `UPPER_SNAKE_CASE`
- از نام‌های مبهم مانند `data`, `result`, `item`, `helper`, `utils2`, `processData` در APIهای اصلی خودداری کن.

نمونه نام خوب:

- `calculateMonthlyRecurringRevenue`
- `reconcileCreditAccountBalance`
- `resolveEffectiveSubscriptionEntitlements`
- `detectSubscriptionStateDrift`
- `rankCollectionWorkItems`
- `CreditLedgerReconciliationResult`
- `SubscriptionRiskReasonCode`

### PostgreSQL

- همه identifierهای جدید: `snake_case`
- view: `vw_<domain>_<purpose>`
- materialized view: `mv_<domain>_<purpose>`
- function: `fn_<verb>_<domain_object>`
- procedure: `sp_<verb>_<domain_object>`
- index: `idx_<table>__<columns_or_purpose>`
- unique index: `uq_<table>__<purpose>`
- check: `chk_<table>__<rule>`

نام فایل SQL با object داخل آن یکسان و دارای prefix ترتیبی باشد:

`010_mv_user_account_intelligence.sql`

### Metricها

هر metric باید نام، تعریف، grain، numerator، denominator، inclusion/exclusion، timezone، currency behavior و caveat داشته باشد.

از واژه‌هایی مانند revenue، churn، active، LTV یا utilization بدون تعریف رسمی استفاده نکن.

---

## قواعد اجباری صحت مالی و داده‌ای

- تمام calculationهای مالی currency-aware باشند.
- هیچ FX conversion بدون جدول نرخ ارز یا ورودی صریح نساز.
- charge موفق و refund موفق را با sign convention مستند محاسبه کن.
- `amount`, `balance`, `credit` و `quantity` را به‌خاطر `bigint` با دقت امن مدیریت کن.
- division by zero و NULL behavior را صریح کنترل کن.
- رکوردهای pending، reversed، voided، refunded و canceled را کورکورانه وارد metric نکن.
- grain هر query را مستند کن تا double counting رخ ندهد.
- join بین header/detail/event/history باید fan-out کنترل‌شده داشته باشد.
- idempotency key و external reference را در عملیات حساس جدی بگیر.
- ledger را append-only فرض کن؛ اصلاح باید با compensating entry انجام شود، نه update تاریخی.
- balance cache را بدون reconciliation منبع حقیقت مطلق فرض نکن.
- JSONB structure را قبل از cast یا extraction اعتبارسنجی کن.
- برای UUIDهایی که عمداً FK ندارند، orphan detection بساز.
- هیچ trigger پنهان و پرریسکی بدون justification، observability و rollback ایجاد نکن.

---

## Performance و Neon

برای هر object یا query سنگین:

- access pattern و cardinality مفروض را اعلام کن.
- index پیشنهادی را همراه write amplification و storage cost توضیح بده.
- از `CREATE INDEX CONCURRENTLY` فقط با migration strategy سازگار استفاده کن.
- partial/covering/expression index را فقط با use case روشن بساز.
- از function روی indexed column در predicateهای پرتکرار پرهیز کن مگر expression index وجود داشته باشد.
- برای materialized view، refresh strategy، staleness SLA و unique index لازم برای concurrent refresh را مشخص کن.
- برای raw `usage_events`، partitioning را فقط پس از تحلیل حجم و با migration plan پیشنهاد بده.
- queryهای trend را ترجیحاً بر `usage_daily_aggregates` اجرا کن.
- EXPLAIN و benchmark script ارائه کن، اما بدون plan واقعی ادعای «بهینه‌ترین» نکن.
- از N+1، unbounded query، `SELECT *` و serialization پرهزینه جلوگیری کن.

---

## Views، Materialized Views، Functions و Triggers

تعداد بالا به‌خودی‌خود ارزش نیست. برای هر object توضیح بده:

- چرا این object لازم است؟
- چرا query/service ساده کافی نیست؟
- owner و caller آن چیست؟
- consistency model چیست؟
- refresh/retry/failure behavior چیست؟
- rollback چگونه انجام می‌شود؟
- lock و concurrency risk چیست؟

Trigger فقط وقتی مجاز است که invariant محلی، قطعی و تراکنشی را بهتر از application code حفظ کند. workflow، notification و تحلیل سنگین را داخل trigger قرار نده.

---

## Testing و Validation

به دیتابیس واقعی و `.env` دسترسی نداری. بنابراین خروجی باید بدون آن‌ها قابل بررسی و آزمایش باشد.

### لایه‌های تست اجباری

1. `Pure Domain Tests`
   - فرمول‌ها، state transitionها، pricing، risk scoring، reconciliation و recommendationها را به توابع pure یا نزدیک به pure تفکیک کن.
   - با fixtureهای deterministic تست کن.
   - این تست‌ها نباید به PostgreSQL، network، clock واقعی یا secret وابسته باشند.

2. `Demo Scenario Tests`
   - همان fixtureها و engineهایی را تست کن که صفحه `intelligence-lab` استفاده می‌کند.
   - expected output مشخص و قابل مقایسه ارائه کن.
   - UI نباید منطق جداگانه و ناسازگار با تست‌ها داشته باشد.

3. `SQL Contract Validation`
   - SQLها را از نظر نام جدول/ستون با schema واقعی پروژه تطبیق بده.
   - برای queryهای مهم fixture، input، expected rows و reconciliation query ارائه کن.
   - اگر PostgreSQL محلی در دسترس نیست، اجرای موفق SQL را جعل نکن و آن را صریحاً `not executed against PostgreSQL` اعلام کن.

4. `Optional Database Integration Tests`
   - فقط به‌صورت اختیاری و پشت یک environment flag مشخص باشند.
   - نبود `DATABASE_URL` باید باعث skip شفاف شود، نه failure.
   - هرگز production database را target نکن.

5. `Project Validation`
   - commandهای lint، type-check و build موجود پروژه را اجرا کن.
   - dependency یا test framework جدید فقط در صورت ضرورت واقعی اضافه کن؛ ترجیحاً از ابزارهای موجود یا قابلیت‌های استاندارد Node استفاده کن.

حداقل پوشش:

- fixture کوچک ولی واقع‌گرایانه و deterministic
- multi-currency
- zero data
- NULL و missing optional relation
- trial conversion و expiration
- upgrade/downgrade و pause/reactivation
- charge/refund/failed transaction
- partial refund یا invoice mismatch
- expired grant و overlapping grants
- concurrent credit reservation
- duplicate idempotency key
- reversed usage
- tier boundary برای pricing
- feature dependency cycle
- period overlap و invalid timeline

برای metricها reconciliation query و expected output ارائه کن.

برای عملیات write:

- success
- retry
- duplicate request
- partial failure
- concurrency conflict
- rollback/compensation

را تست کن.

اگر تست integration به دیتابیس نیاز دارد، setup و teardown دقیق بده، آن را optional نگه دار و production database را هدف نگیر.

---

## الزامات مستندسازی

### `README.md`

- هدف بسته
- پیش‌نیازها
- ترتیب نصب/اجرا
- commandهای migration، validation، test و benchmark
- نحوه ادغام با repo

### `MANIFEST.md`

برای تک‌تک فایل‌ها:

- مسیر
- مسئولیت
- dependency
- ترتیب اجرا
- آیا schema را تغییر می‌دهد یا read-only است

### `capability-map.md`

- capability
- جداول استفاده‌شده
- خروجی
- consumer
- business decision

### `formulas-and-kpis.md`

- تعریف رسمی هر فرمول
- grain
- currency
- زمان
- inclusion/exclusion
- limitations

### `assumptions-and-limitations.md`

- تمام فرض‌ها
- تمام موارد غیرقابل اثبات
- ستون‌ها یا eventهای پیشنهادی آینده
- هیچ محدودیتی را پنهان نکن

### `operations-runbook.md`

- refresh
- retry
- backfill
- failure recovery
- monitoring
- rollback

---

## موارد ممنوع

- خروجی فقط شامل ایده، مقاله یا markdown
- چند query ساده با نام «Advanced»
- CRUD به‌عنوان دستاورد اصلی
- dashboard-only thinking
- TODO، placeholder، pseudo-code یا فایل خالی
- mock/random/fake trend
- جدول یا ستون خیالی بدون migration و justification
- نصب dependency جدید بدون ضرورت اثبات‌شده
- بازطراحی بی‌دلیل UI یا primitiveهای فعلی
- UI انگلیسی، تزئینی یا بدون امکان اجرای سناریو
- وابسته‌کردن Demo Mode، تست‌های اصلی یا build به `.env` و دیتابیس واقعی
- نمایش fixtureها بدون برچسب واضح «داده آزمایشی»
- جمع‌زدن currencyهای مختلف
- ادعای AI/ML پیشرفته بدون feature و validation کافی
- triggerهای همه‌کاره
- SQL monolith
- یک فایل بزرگ `queries.ts` برای همه دامنه‌ها
- تکرار یک metric در چند فایل با فرمول متفاوت
- destructive migration بدون `down`، backup note و rollout plan
- تغییر یا حذف رفتار موجود بدون compatibility note

---

## معیار رد خروجی سطحی

خروجی مردود است اگر:

- بیشتر قابلیت‌ها count/sum/list/filter باشند.
- ارتباط cross-domain بین catalog، subscription، billing، credits و usage ساخته نشده باشد.
- فقط گزارش تولید شده و action/recommendation/reconciliation وجود نداشته باشد.
- ledger و invariantهای مالی عمیق بررسی نشده باشند.
- plan versioning و feature dependency نادیده گرفته شده باشند.
- queryها بدون grain و تعریف metric باشند.
- ساختار فایل‌ها monolithic یا نام‌گذاری مبهم باشد.
- خروجی عملاً مجموعه snippetهای ناقص باشد.
- تست و rollback وجود نداشته باشد.
- قابلیت‌ها در UI فقط توضیح داده شوند اما قابل اجرای تعاملی نباشند.

---

## نحوه تصمیم‌گیری در ابهام

- سؤال نپرس؛ repo را بررسی کن و با فرض محافظه‌کارانه ادامه بده.
- فرض را در `assumptions-and-limitations.md` ثبت کن.
- اگر implementation امن بدون داده کافی ممکن نیست، read-only detector یا dry-run version بساز.
- قابلیت معتبر کمتر بهتر از قابلیت خیالی بیشتر است.
- کیفیت، عمق، composability و correctness بر تعداد فایل‌ها اولویت دارد.

---

## فرمت تحویل نهایی

1. پروژه کامل با فایل‌های ماژولار
2. خلاصه capabilityهای ساخته‌شده
3. tree نهایی فایل‌ها
4. مسیر صفحه فارسی `intelligence-lab`
5. فهرست migrationها و ترتیب اجرا
6. فهرست metricها و engineها
7. commandهای دقیق validation بدون دیتابیس واقعی
8. تست‌هایی که واقعاً اجرا شده‌اند و تست‌های PostgreSQL که اختیاری مانده‌اند
9. ریسک‌ها، فرض‌ها و مواردی که عمداً ساخته نشده‌اند

فایل‌ها را مستقیماً داخل ساختار repo آماده کن.

---

## فرمان نهایی

ابتدا تمام منابع حقیقت را بررسی کن، سپس capability map و opportunity portfolio را بساز، بعد implementation portfolio را انتخاب کن و در نهایت پروژه production-oriented همراه با آزمایشگاه فارسی قابلیت‌ها را تحویل بده.

به دنبال «بیشترین تعداد query» نباش. به دنبال بیشترین leverage از همین دیتامدل باش: قابلیت‌هایی که داده خام را به کنترل، تصمیم، تشخیص، پیش‌بینی محافظه‌کارانه، اتوماسیون امن و ارزش تجاری تبدیل می‌کنند.
