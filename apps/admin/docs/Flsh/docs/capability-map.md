# Diminish Database Intelligence — نگاشت ظرفیت‌ها و اهداف تجاری (Capability Map)

این سند تحلیل می‌کند که چگونه موتورهای داده‌ای ما، جداول خام سیستم را به کنترل پنل‌های با ارزش و عملیاتی هوشمند تبدیل می‌کنند.

| عنوان موتور و قابلیت داده‌ای | جداول خام مورد استفاده | خروجی ملموس تصمیم‌یار | تصمیم کلان یا عملیات کسب‌وکاری تسهیل شده |
| :--- | :--- | :--- | :--- |
| **User 360 & Account Intelligence** | `users`, `subscriptions`, `credit_accounts`, `invoices`, `usage_daily_aggregates` | نمایه کامل وضعیت کاربر، اشتراک فعال، بدهی معوق و لجر | پشتیبانی مشتریان با پاسخگویی ۱۰۰٪ منطبق با واقعیت تراکنشی. |
| **Subscription Health & Churn Risk** | `subscriptions`, `subscription_events`, `credit_accounts`, `usage_daily_aggregates` | نمره عددی سلامت اشتراک به همراه ریسک ریزش (بحرانی تا پایین) | کمپین‌های بازگردانی خودکار کاربران در آستانه ترک پلتفرم. |
| **MRR Waterfall & Revenue Movement** | `plan_prices`, `subscriptions`, `plan_versions`, `plan_prices` | جریان خالص تحرک پولی ماهانه (New, Contraction, Churn...) | گزارش‌های دوره‌ای هیئت مدیره و سهامداران، تحلیل سلامت اقتصادی محصول. |
| **Revenue Leakage detection** | `invoices`, `transactions`, `subscriptions` | لیست فاکتورهای جعلی تایید شده، تراکنش‌های بدون سند فاکتور | توقف سوءاستفاده‌های حسابداری و ممانعت از فرار مالی یا باگ درگاه. |
| **Credit Ledger Reconciliation** | `credit_accounts`, `credit_ledger` | گزارش عددی توازن کیف پول، هشدار مغایرت زنجیره لاگ‌ها | اثبات صحت حسابداری و تایید پایداری سیستم لجر مالی پلتفرم. |
| **Atomic Idempotent Reservation** | `credit_accounts`, `credit_ledger` | رزرو امن دارایی، مهار پرداخت‌های تکراری با کلید یکتا | اجرای تراکنش‌های مالی همزمان بدون قفل یا کسر دوبرابری موجودی. |
| **Credit Burn Rate & Runway** | `credit_ledger`, `usage_daily_aggregates`, `credit_grants` | پیش‌بینی تعداد روزهای حیات کیف پول، تخمین انقضاء سهمیه‌ها | پیش‌فروش بسته‌های افزایش حجم و ترغیب کاربر به شارژ کیف پول. |
| **Effective Entitlements Solver** | `subscriptions`, `plan_limits`, `subscription_addons`, `addon_features` | لیست ویژگی‌های فعال به همراه سقف مجاز قطعی کلاینت | ممانعت از استفاده رایگان امکانات پولی توسط کلاینت در وب‌سایت. |
| **Plan Version Diff & Validator** | `plans`, `plan_versions`, `plan_prices`, `plan_limits` | تحلیل تغییر سقف سهمیه‌ها و قیمت‌ها، رد یا تایید انتشار عمومی | ممانعت از انتشار پلن‌های آسیب‌دیده، خالی یا فاقد چارچوب مصوب مالی. |
| **Dependency Cycle Detector** | `features`, `feature_dependencies` | ردگیری وابستگی‌های تکراری و دایره‌ای کاتالوگ و ریشه‌یابی آن | کمک به معماران محصول جهت ممانعت از پیچیدگی‌های بن‌بست در کدهای کلاینت. |
| **Usage Anomaly Detection** | `usage_daily_aggregates` | محاسبه Z-Score جهش‌های مصرفی و آستانه اشباع سهمیه | ملوگیری از حملات سایبری یا خزیدن‌های نامتعارف ربات‌ها در API. |
| **Trial & Promo ROI Analyzer** | `subscriptions`, `trials`, `coupon_redemptions`, `coupons` | نرخ تبدیل تریال به پرداخت، و بازگشت سرمایه تخفیف‌ها | ارزیابی کارایی مالی کمپین‌های بازاریابی و تعیین دقیق اثربخشی کوپن‌ها. |
| **Next Best Action Core** | کل ۳۸ جدول | سیستم توصیه‌گر هوشمند اقدامات فنی، مالی و ارتباطی | اتوماسیون تعامل با کاربر (پیشنهاد ارتقاء، قفل اشتراک، آفر ویژه). |
| **Data Quality Scorecard** | کل ۳۸ جدول | نمره کیفیت سلامت کل داده‌های ذخیره‌شده (۰ تا ۱۰۰) | پیشگیری از فرسودگی داده‌ها و گزارش مشکلات Chronological در پایگاه‌داده. |
| **Prioritized Operations Queue** | کل ۳۸ جدول | صف وظایف دارای وزن و مرتب‌شده برای کارشناسان مالی | افزایش کارایی عملیاتی و رسیدگی سریع به بحرانی‌ترین پرونده‌های مغایرت. |
