# معماری هدف اتصال، Enforcement و عملیات هزینه‌دار

## 1. اصل معماری

دو مفهوم جدا هستند:

- قابلیت محصول در Admin تعریف، قیمت‌گذاری، محدود، منتشر و به پلن یا addon متصل می‌شود.
- عملکرد واقعی در User Application ساخته و از طریق Adapter استاندارد به موتور عمومی وصل می‌شود.

ساخت قابلیت در Admin نباید نیازمند تغییر موتور User باشد. ساخت رفتار نرم‌افزاری تازه فقط Adapter همان رفتار را اضافه می‌کند.

## 2. Control Plane و Data Plane

### Admin Control Plane

Admin مالک این رفتارهاست:

- تعریف قابلیت و کد پایدار آن
- plan/version/addon/subscription
- pricing، limit، dependency و negative credit ceiling
- draft، publish، selective sync، preview و rollback
- maintenance pause
- quote، authorization، reservation، capture و release
- actual provider cost، absorbed loss و user loss totals
- manual retry/block/unblock/refund controls
- audit، alert و retention configuration

### User Data Plane

User Application مالک این رفتارهاست:

- Clerk authentication و ownership
- انتخاب server-side operation/capability binding
- نمایش capability availability
- ساخت operation fingerprint
- اجرای واقعی provider یا business operation
- local operation journal
- گزارش success/failure و actual usage
- retry گزارش‌ها بدون retry خودکار provider
- runtime connection manifest

## 3. Seamهای عمیق

### Module اتصال مدیریتی

Module مستقل داخل Admin که بعداً قابل جداسازی به سرویس مستقل است. Interface نسخه‌دار آن باید این رفتارها را پشت خود پنهان کند:

- publish/sync/preview/rollback
- runtime manifest ingestion
- capability presentation
- quote/authorize/reserve
- capture/release
- loss and refund cases
- manual governance commands

User Application هیچ جدول Admin را مستقیم نمی‌خواند یا نمی‌نویسد.

### EnforcementGateway

تنها Interface شناخته‌شده در User Application برای:

- دریافت وضعیت قابل نمایش قابلیت
- quote
- authorize/reserve
- capture/release
- گزارش actual cost و failure
- publish runtime manifest

Routeها و عملکردها حق bypass این Gateway را ندارند.

### OperationExecutor

Module عمومی User Application که چرخه کامل یک عملیات را انجام می‌دهد:

1. auth و ownership
2. ساخت operation fingerprint
3. quote
4. نمایش و تأیید کاربر برای عملیات هزینه‌دار
5. authorize/reserve
6. اجرای Adapter دقیقاً یک‌بار
7. validation نتیجه
8. capture روی نتیجه معتبر
9. release روی failure/cancel/timeout
10. retry گزارش outcome بدون اجرای دوباره Adapter

### OperationAdapter

تنها کد اختصاصی هر عملکرد واقعی است و باید این اطلاعات را بدهد:

- operation code پایدار
- capability code اصلی
- resource identity و immutable content identity
- configuration fingerprint
- quantity estimate و actual quantity
- execute
- validate result
- actual provider cost

Client حق تعیین capability code، price، quantity trusted یا resource owner را ندارد.

## 4. Published Policy و Sync

- Admin draftها runtime نیستند.
- مالک محصول subset مشخصی از plan/capabilityها را برای sync انتخاب می‌کند.
- sync یک بسته atomic است.
- قبل از sync، تغییر قیمت، limit و تعداد کاربران تحت‌تأثیر نمایش داده می‌شود.
- هر sync موفق rollback به snapshot قبلی دارد.
- sync دستی است.
- maintenance pause اختیاری است.
- بدون pause، runtime با snapshot قبلی ادامه می‌دهد.
- با pause، درخواست تازه با reason code نگهداری رد می‌شود.

## 5. Runtime Connection

User Application یک manifest authenticated و versioned از operationهای واقعاً ثبت‌شده منتشر می‌کند.

Admin بر اساس manifest:

- connected/unconnected را نمایش می‌دهد.
- اتصال را دستی جعل نمی‌کند.
- قابلیت unconnected را قابل اجرا نمی‌داند.

Frontend:

- برای کاربران عادی قابلیت unconnected را مخفی می‌کند.
- برای کاربران پایلوت آن را غیرفعال با پیام «به‌زودی فراهم خواهد شد» نشان می‌دهد.

## 6. Subscription و Pilot

- هر user دقیقاً یک primary plan دارد.
- دسترسی اضافه و پایلوت با addon موقت داده می‌شود.
- Admin تعیین می‌کند چه grant یا planی در بدو ورود خودکار تعلق بگیرد.
- User Application هیچ default plan یا free grant را hard-code نمی‌کند.

## 7. Quote و Operation Fingerprint

Quote:

- قبل از اجرای واقعی محاسبه می‌شود.
- برای عملیات هزینه‌دار به کاربر نمایش داده و صریحاً تأیید می‌شود.
- برای عملیات رایگان confirmation قیمت لازم ندارد.
- single-use است.
- time-based business validity ندارد.
- به user، operation، capability، resource identity، content hash/object version، configuration و policy version قفل می‌شود.
- تغییر هر input quote را باطل می‌کند.

cleanup فنی quote رهاشده می‌تواند time-based باشد، اما timeout نباید قیمت یا حق اجرای quote دیگری را تعیین کند.

## 8. Authorization و Credit

API اتصال مدیریتی مرجع نهایی است:

- subscription، addon، feature status و dependency را resolve می‌کند.
- limit و usage را می‌سنجد.
- credit و negative credit ceiling را بررسی می‌کند.
- reservation idempotent ایجاد می‌کند.
- permit زمان‌دار و operation-bound صادر می‌کند.

عملیات طولانی heartbeat می‌فرستد. capability disable یا maintenance pause درخواست‌های تازه را رد می‌کند؛ permit معتبر موجود طبق قرارداد خود ادامه می‌یابد.

## 9. Outcome، Actual Cost و Loss

- نتیجه محصول تا حد امکان فقط success یا failure است.
- stateهای میانی فقط برای recovery داخلی‌اند.
- capture فقط پس از نتیجه معتبر و قابل استفاده انجام می‌شود.
- failure/cancel/timeout reservation کاربر را release می‌کند.
- provider execution پرهزینه خودکار retry نمی‌شود.
- actual provider cost برای success و failure ثبت می‌شود.
- absorbed loss یعنی هزینه failure که از کاربر گرفته نشده است.
- مجموع loss هر user atomic ثبت می‌شود.

سیستم thresholdها را محاسبه و alert می‌کند، اما این کنترل‌ها دستی هستند:

- اجازه retry تازه
- block/unblock user
- maintenance controls
- threshold changes/reset
- full/partial/no refund

## 10. Idempotency و Concurrency

هر mutation هزینه‌دار:

- operation ID یکتای اجباری دارد.
- operation ID به fingerprint و payload bind می‌شود.
- replay همان payload همان state/response را برمی‌گرداند.
- reuse با payload دیگر conflict است.
- resource key اختیاری برای جلوگیری از اجرای هم‌زمان روی یک فایل یا منبع دارد.
- capture/release/refund و outcome report idempotent هستند.

## 11. Failure Model

| Failure | رفتار |
|---|---|
| Integration API unavailable | عملیات محدود/هزینه‌دار fail-closed |
| presentation cache stale | فقط UI؛ authorization همیشه API |
| quote input changed | quote invalid |
| reserve failed | operation اجرا نمی‌شود |
| provider failed | no auto retry، release user reservation |
| outcome report failed | journal retry، provider دوباره اجرا نمی‌شود |
| capture ambiguous | recovery state، no provider replay |
| maintenance pause | درخواست تازه با پیام update رد می‌شود |
| unconnected capability | no permit |

## 12. Security

- service-to-service identity کوتاه‌عمر و قابل rotation
- versioned API contract
- no browser access to management integration API
- no raw Clerk token forwarded as management authorization
- internal user ID و server-selected operation
- least privilege DB inside Admin
- no Admin DB credential in User production
- no PII، token، signed URL یا secret در logs
- stable reason codes و request correlation IDs

## 13. Observability و Manual Governance

Admin باید نمایش دهد:

- operation count و success/failure
- quoted/user charge
- actual provider cost
- absorbed loss per operation/user/capability
- stuck reservations و outcome reports
- sync failures و active maintenance pauses
- users/capabilities نیازمند بررسی
- refund cases

تمام publish، sync، rollback، retry permission، block/unblock و refundها audit می‌شوند.

## 14. اثبات توسعه‌پذیری

قبل از اتصال قابلیت واقعی:

1. یک fake capability در Admin تعریف شود.
2. policy آن publish و manually sync شود.
3. یک fake OperationAdapter در User ثبت شود.
4. manifest اتصال را اثبات کند.
5. quote/reserve/execute/capture و failure/release end-to-end تست شوند.
6. engine code با اضافه‌شدن fake capability تغییر نکند.

پس از این tracer، Analyze اولین قابلیت واقعی متصل‌شده است.
