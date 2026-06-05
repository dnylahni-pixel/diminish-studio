خب الان همه چیز واضحه. گزارش رو مینویسم:

📋 گزارش پروژه Diminish Studio — برای AI بعدی

ساختار کلی

monorepo با pnpm workspaces:

diminish-studio/
├── artifacts/
│   ├── api-server/     ← بک‌اند Express/Node.js TypeScript
│   ├── diminish-studio/ ← فرانت‌اند React/Vite/TypeScript
│   └── mockup-sandbox/  ← تست (بی‌اهمیت)
├── lib/                 ← shared (احتمالاً خالی)
└── scripts/


فرانت‌اند (artifacts/diminish-studio/)

	•	React + Vite + TypeScript + Tailwind
	•	shadcn/ui components
	•	صفحات: home, login, register, profile, player, library, process, learn
	•	هیچ API client ای ندارد — src/lib/ فقط utils.ts داره (cn helper)
	•	روی Vercel deploy شده
	•	فرانت هنوز به بک‌اند وصل نیست

بک‌اند (artifacts/api-server/)

	•	Express + TypeScript + pino logger + cors
	•	Routes نوشته شده: chords, health, learning, library, songs, users
	•	middlewares/ خالیه (فقط .gitkeep)
	•	lib/ فقط logger.ts داره
	•	هیچ دیتابیسی وصل نیست
	•	هیچ auth middleware ای نیست
	•	هیچ جایی deploy نشده
	•	PORT از env میخونه

وضعیت کلی

رپلیت یه اسکلت تمیز ساخته. هم فرانت هم بک‌اند نصفه‌ان:

	•	بک‌اند: routes هست ولی منطق داخلشون احتمالاً خالیه یا موک
	•	فرانت: UI کامله ولی API call نداره

قدم‌های بعدی که صاحب پروژه میخواد:

	1.	دیتابیس انتخاب و وصل کنن (پیشنهاد: PostgreSQL با Neon یا Railway)
	2.	auth بنویسن (JWT یا session)
	3.	API client توی فرانت بنویسن
	4.	بک‌اند رو deploy کنن (پیشنهاد: Railway)
	5.	env variable بک‌اند رو توی Vercel ست کنن

فایل‌هایی که AI بعدی باید ببینه (به ترتیب اولویت):

	1.	artifacts/api-server/src/routes/users.ts — ببینه auth چطوره
	2.	artifacts/api-server/src/routes/songs.ts — ببینه data model چیه
	3.	artifacts/api-server/package.json — ببینه چه دیتابیس درایوری داره
	4.	artifacts/diminish-studio/src/pages/login.tsx — ببینه فرانت چی انتظار داره

الان برای ادامه کار، کدوم قدم اول رو میخوای بزنیم؟

	1.	دیتابیس وصل کنیم
	2.	auth بنویسیم
	3.	API client توی فرانت