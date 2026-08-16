import Link from "next/link";
import { db } from "@/db";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  // Simple check to ensure Drizzle/Postgres connection works
  let dbWorking = false;
  try {
    await db.execute(sql`SELECT 1`);
    dbWorking = true;
  } catch {
    dbWorking = false;
  }

  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 px-6 py-12" dir="rtl">
      <section className="w-full max-w-2xl rounded-3xl bg-white p-8 sm:p-12 shadow-[0_24px_60px_rgba(16,24,40,0.08)] border border-slate-100">
        <span className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-xs font-semibold tracking-wide">
          Diminish Studio Admin Portal
        </span>
        <h1 className="mt-4 text-3xl font-extrabold leading-tight text-slate-900">
          سامانه مدیریتی و کنترل پیشرفته دیمینیش
        </h1>
        <p className="mt-4 text-base text-slate-600 leading-relaxed">
          خوش آمدید! این سامانه مجهز به موتورهای تحلیل تجاری، مالی و حسابرسی اعتبارات (Ledger) بر روی پایگاه داده PostgreSQL و Drizzle ORM است.
        </p>

        {/* Database Status Alert */}
        <div className={`mt-6 p-4 rounded-2xl border flex items-center justify-between text-xs font-bold ${
          dbWorking 
            ? "bg-emerald-50 border-emerald-200 text-emerald-800" 
            : "bg-amber-50 border-amber-200 text-amber-800"
        }`}>
          <span>وضعیت دیتابیس PostgreSQL:</span>
          <span>{dbWorking ? "● فعال و متصل" : "● غیرفعال (استفاده از شبیه‌ساز خودکار آفلاین)"}</span>
        </div>

        {/* Portal CTA */}
        <div className="mt-8 pt-6 border-t border-slate-100">
          <Link
            href="/intelligence-lab"
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-6 py-4 text-sm font-bold text-white shadow-lg shadow-indigo-600/25 transition-all hover:bg-indigo-500 hover:shadow-indigo-600/35"
          >
            ورود به آزمایشگاه هوش داده و تصمیم‌گیری (Intelligence Lab)
            <svg className="w-4 h-4 transform rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </Link>
          <span className="mt-3 block text-center text-xs text-slate-400">
            طراحی شده با RTL کامل، همگام با ۳۸ جدول کاتالوگ، اشتراک و کیف پول اعتباری.
          </span>
        </div>
      </section>
    </main>
  );
}
