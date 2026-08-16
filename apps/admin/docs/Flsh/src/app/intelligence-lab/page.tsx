"use client";

import React, { useState, useEffect, useTransition } from "react";
import { MOCK_USERS } from "@/features/fixtures";
import {
  isDbSeededAction,
  seedDatabaseAction,
  getUserIntelligenceAction,
  executeCreditActionAction,
  validatePlanVersionDiffAction,
  getGlobalIntelligenceDataAction,
} from "./actions";

// Persian labels for users to help the auditor understand what they are testing
const USER_TEST_SCENARIOS: Record<string, { label: string; desc: string }> = {
  "usr-01": {
    label: "الیس احمدی (پلن Pro سالم)",
    desc: "کاربر فعال با پرداخت‌های منظم، استفاده نرمال و کیف پول اعتباری کاملاً سالم.",
  },
  "usr-02": {
    label: "بابک پارسا (سررسید گذشته + نشت درآمد)",
    desc: "اشتراک سررسید گذشته با فاکتور پرداخت‌نشده، فاکتور دیگری به دروغ پرداخت‌شده خورده ولی تراکنش آن ناموفق بوده است (نشت درآمد شدید).",
  },
  "usr-03": {
    label: "شارلی صبوری (پلن رایگان + اشباع سهمیه)",
    desc: "کاربر پلن رایگان با مصرف بسیار بالا و ناگهانی API (سیگنال غیرعادی / Anomaly) و رو به اتمام بودن شدید اعتبار (زیر ۱ روز).",
  },
  "usr-04": {
    label: "دیانا مرادی (دوره آزمایشی فعال)",
    desc: "در حال استفاده از Trial فعال پلن حرفه‌ای با ۲ روز باقی‌مانده و مصرف مناسب.",
  },
  "usr-05": {
    label: "احسان امینی (پلن Enterprise + مغایرت بالانس)",
    desc: "اشتراک موقتاً متوقف شده با مغایرت بالانس کیف پول! بالانس کش حساب ۵۰۰ واحد است اما جمع ریاضی لاگ‌های لجر ۸۰۰ است.",
  },
  "usr-06": {
    label: "فریبا نیکو (اشتراک لغو شده / Churned)",
    desc: "کاربر لغوشده که از پلتفرم خارج شده و فاقد اشتراک فعال است.",
  },
  "usr-07": {
    label: "گرشا رضایی (چرخه وابستگی ویژگی‌ها)",
    desc: "کاربری که پلن او به دلیل ویرایش ناصحیح کاتالوگ، دارای یک گراف چرخه تکراری است (Branding -> Reports -> SSO -> Branding).",
  },
  "usr-08": {
    label: "هانیه کرمی (بالانس منفی + پرداخت بی‌فاکتور)",
    desc: "دارای تراکنش موفق بدون صدور فاکتور درگاه، و همچنین موجودی منفی کیف پول (سوءاستفاده اعتباری).",
  },
};

export default function IntelligenceLabPage() {
  const [useDb, setUseDb] = useState<boolean>(false);
  const [dbStatus, setDbStatus] = useState<{ available: boolean; seeded: boolean; checked: boolean }>({
    available: false,
    seeded: false,
    checked: false,
  });

  // Selected state
  const [selectedUserId, setSelectedUserId] = useState<string>("usr-01");
  const [userIntelligence, setUserIntelligence] = useState<any>(null);
  const [globalIntelligence, setGlobalIntelligence] = useState<any>(null);

  // Credit atomic transaction panel state
  const [creditAmount, setCreditAmount] = useState<number>(100);
  const [creditAction, setCreditAction] = useState<"reserve" | "capture" | "release">("reserve");
  const [creditIdempotencyKey, setCreditIdempotencyKey] = useState<string>("");
  const [creditLog, setCreditLog] = useState<Array<{ time: string; msg: string; type: "success" | "error" | "info" }>>([]);

  // Plan Version Diff comparator state
  const [planDiff, setPlanDiff] = useState<any>(null);

  // Navigation / Loading States
  const [isPending, startTransition] = useTransition();
  const [isGlobalPending, startGlobalTransition] = useTransition();
  const [isSeeding, setIsSeeding] = useState<boolean>(false);

  // Initialize random idempotency key
  useEffect(() => {
    generateNewIdempotencyKey();
  }, []);

  function generateNewIdempotencyKey() {
    setCreditIdempotencyKey("idem_" + Math.random().toString(36).substring(2, 9));
  }

  // Check Database connection and seed status
  useEffect(() => {
    async function checkDb() {
      const status = await isDbSeededAction();
      if (status.success) {
        setDbStatus({
          available: status.dbAvailable || false,
          seeded: status.seeded || false,
          checked: true,
        });
        // If live db is available and seeded, let's default to db mode!
        if (status.dbAvailable && status.seeded) {
          setUseDb(true);
        }
      } else {
        setDbStatus({
          available: false,
          seeded: false,
          checked: true,
        });
      }
    }
    checkDb();
  }, []);

  // Fetch intelligence data when user or mode changes
  useEffect(() => {
    fetchUserIntel();
  }, [selectedUserId, useDb]);

  useEffect(() => {
    fetchGlobalIntel();
  }, [useDb]);

  async function fetchUserIntel() {
    startTransition(async () => {
      const res = await getUserIntelligenceAction(selectedUserId, useDb);
      if (res.success) {
        setUserIntelligence(res.data);
      } else {
        setUserIntelligence(null);
      }
    });
  }

  async function fetchGlobalIntel() {
    startGlobalTransition(async () => {
      const res = await getGlobalIntelligenceDataAction(useDb);
      if (res.success) {
        setGlobalIntelligence(res.data);
      } else {
        setGlobalIntelligence(null);
      }

      // Automatically run Pro plan v1 vs v2 diff as default
      const diffRes = await validatePlanVersionDiffAction("plan-pro", 1, 2, useDb);
      if (diffRes.success) {
        setPlanDiff(diffRes.diff);
      }
    });
  }

  // Handle Seeding database
  async function handleSeedDatabase() {
    setIsSeeding(true);
    try {
      const res = await seedDatabaseAction();
      alert(res.message);
      const status = await isDbSeededAction();
      setDbStatus({
        available: status.dbAvailable || false,
        seeded: status.seeded || false,
        checked: true,
      });
      if (status.seeded) {
        setUseDb(true);
      }
    } catch (e: any) {
      alert("بسترسازی دیتابیس با شکست مواجه شد: " + e.message);
    } finally {
      setIsSeeding(false);
      fetchUserIntel();
      fetchGlobalIntel();
    }
  }

  // Handle simulated credit reserve/capture/release
  async function handleCreditSimulate() {
    if (!userIntelligence?.user360?.creditAccount) {
      alert("کاربر فاقد حساب اعتباری است.");
      return;
    }
    const accId = userIntelligence.user360.creditAccount.id;
    setCreditLog((prev) => [...prev, { time: new Date().toLocaleTimeString(), msg: `ارسال تراکنش ${creditAction} به مبلغ ${creditAmount} با کلید ${creditIdempotencyKey}...`, type: "info" }]);

    const res = await executeCreditActionAction(accId, creditAmount, creditAction, creditIdempotencyKey, useDb);
    if (res.success && res.result?.success) {
      setCreditLog((prev) => [
        ...prev,
        {
          time: new Date().toLocaleTimeString(),
          msg: `تراکنش موفق: ${res.result?.message} (بالانس نهایی: ${res.result?.newBalance || 0}، رزرو نهایی: ${res.result?.newReserved || 0})`,
          type: "success",
        },
      ]);
      // generate a new key for subsequent requests
      generateNewIdempotencyKey();
      // reload data
      fetchUserIntel();
      fetchGlobalIntel();
    } else {
      setCreditLog((prev) => [
        ...prev,
        {
          time: new Date().toLocaleTimeString(),
          msg: `تراکنش ناموفق: ${res.result?.message || res.error || "خطای غیرمنتظره"}`,
          type: "error",
        },
      ]);
    }
  }

  // UI Presentation helpers
  const formatter = new Intl.NumberFormat("fa-IR");
  const currencySymbol = (cur: string) => (cur === "USD" ? "دلار" : cur === "CREDIT" ? "اعتبار" : cur);

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8 font-sans" dir="rtl">
      <div className="max-w-7xl mx-auto">
        {/* HEADER BRANDING */}
        <header className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl mb-8 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px]"></div>
          <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <span className="bg-indigo-500/20 text-indigo-300 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider">
                Diminish Super Admin Control Plane
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold mt-3 tracking-tight">
                آزمایشگاه هوش داده و موتور تصمیم‌گیری
              </h1>
              <p className="text-slate-300 mt-2 text-sm sm:text-base leading-relaxed max-w-3xl">
                بستر پیشرفته کشف، حسابرسی، بازرسی عملیاتی و تحلیل الگوهای اقتصادی و ریسک در سطح کاتالوگ، اشتراک‌ها، فاکتورها و لجر مالی اعتباری کاربران بر روی بستر PostgreSQL و Drizzle.
              </p>
            </div>

            {/* DB Mode Toggler */}
            <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl flex flex-col gap-3 min-w-[280px]">
              <div className="text-xs text-slate-300 font-medium">پیکربندی منبع تغذیه داده:</div>
              <div className="grid grid-cols-2 gap-2 bg-black/20 p-1 rounded-xl">
                <button
                  onClick={() => setUseDb(false)}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
                    !useDb ? "bg-indigo-600 text-white shadow-md" : "text-slate-300 hover:text-white"
                  }`}
                >
                  💡 حالت دمو (آفلاین)
                </button>
                <button
                  onClick={() => {
                    if (!dbStatus.available) {
                      alert("اتصال دیتابیس برقرار نیست. لطفاً ابتدا دیتابیس را بررسی کنید.");
                      return;
                    }
                    setUseDb(true);
                  }}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1 ${
                    useDb ? "bg-indigo-600 text-white shadow-md" : "text-slate-300 hover:text-white"
                  }`}
                  disabled={!dbStatus.available}
                >
                  🗄️ حالت دیتابیس زنده
                </button>
              </div>

              {/* Db Status Info */}
              <div className="flex items-center justify-between text-xs mt-1 border-t border-white/10 pt-2">
                <span className="text-slate-400">اتصال دیتابیس:</span>
                {dbStatus.checked ? (
                  dbStatus.available ? (
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      ● برقرار
                      {dbStatus.seeded ? " (Seeded)" : " (خالی)"}
                    </span>
                  ) : (
                    <span className="text-rose-400 font-bold">● قطع</span>
                  )
                ) : (
                  <span className="text-slate-400">درحال بررسی...</span>
                )}
              </div>

              {/* Seed Helper */}
              {dbStatus.available && (
                <button
                  onClick={handleSeedDatabase}
                  disabled={isSeeding}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 text-white text-xs py-2 px-3 rounded-lg transition-all font-semibold flex items-center justify-center gap-1 mt-1 cursor-pointer"
                >
                  <svg className={`w-3.5 h-3.5 ${isSeeding ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 15H19" />
                  </svg>
                  {isSeeding ? "درحال ریختن داده..." : "بسترسازی (Seed) مجدد دیتابیس واقعی"}
                </button>
              )}
            </div>
          </div>
        </header>

        {/* METRICS SUMMARY STRIP */}
        {globalIntelligence?.dataQualityScorecard && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <div className="text-xs text-slate-400 font-medium">کیفیت و جامعیت داده‌ها</div>
                <div className="text-xl font-bold text-slate-900 mt-1">
                  {formatter.format(globalIntelligence.dataQualityScorecard.overallScore)}٪
                </div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <div className="text-xs text-slate-400 font-medium">تعداد نشت درآمد (Recon)</div>
                <div className="text-xl font-bold text-slate-900 mt-1">
                  {formatter.format(globalIntelligence.revenueLeakage?.length || 0)} مورد
                </div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <div className="text-xs text-slate-400 font-medium">مجموع درآمد فعال (MRR)</div>
                <div className="text-xl font-bold text-slate-900 mt-1">
                  ${formatter.format((globalIntelligence.mrrWaterfall?.[0]?.endingMrr || 0) / 100)}
                </div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 114 0v2m-4 0h4m-4 0H5m12 0h1.586a1 1 0 01.707.293l2.414 2.414a1 1 0 01.293.707V17a2 2 0 01-2 2H5a2 2 0 01-2-2V9a2 2 0 012-2h2m3 4h10" />
                </svg>
              </div>
              <div>
                <div className="text-xs text-slate-400 font-medium">مغایرت بالانس اعتباری</div>
                <div className="text-xl font-bold text-slate-900 mt-1">
                  {formatter.format(globalIntelligence.ledgerReconciliation?.filter((r: any) => r.status !== "سالم").length || 0)} مورد
                </div>
              </div>
            </div>
          </div>
        )}

        {/* DUAL COLUMN ACTION AND DASHBOARD WORKSPACE */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* RIGHT COLUMN: USER 360 SELECT & PROFILE INTELLIGENCE (5 COLS) */}
          <section className="lg:col-span-5 flex flex-col gap-8">
            
            {/* USER SELECT CARD */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-4">
                <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </span>
                سناریوی تست و کاربری ۳۶۰ درجه
              </h2>
              <p className="text-slate-500 text-xs leading-relaxed mb-4">
                کاربر موردنظر خود را جهت فعال‌سازی شبیه‌ساز انتخاب کنید. هر کاربر نماینده یک سناریوی لبه‌ای تجاری خاص است:
              </p>

              {/* User Selection Grid */}
              <div className="flex flex-col gap-2.5">
                {MOCK_USERS.map((user) => {
                  const isSelected = user.id === selectedUserId;
                  const scenario = USER_TEST_SCENARIOS[user.id];
                  return (
                    <button
                      key={user.id}
                      onClick={() => setSelectedUserId(user.id)}
                      className={`text-right p-3 rounded-2xl border text-sm transition-all flex flex-col gap-1 cursor-pointer ${
                        isSelected
                          ? "bg-indigo-50 border-indigo-300 ring-2 ring-indigo-100"
                          : "bg-slate-50 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      <div className="flex justify-between items-center w-full">
                        <span className={`font-bold ${isSelected ? "text-indigo-900" : "text-slate-800"}`}>
                          {scenario?.label || user.name}
                        </span>
                        <span className="text-[10px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded-md font-mono">
                          {user.id}
                        </span>
                      </div>
                      <span className="text-slate-500 text-xs leading-relaxed line-clamp-2">
                        {scenario?.desc}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* SELECTED USER 360 INTELLIGENCE PANELS */}
            {isPending ? (
              <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm flex flex-col items-center justify-center gap-3 min-h-[300px]">
                <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-sm text-slate-500 font-medium">درحال محاسبه هوش داده کاربر...</span>
              </div>
            ) : userIntelligence ? (
              <div className="flex flex-col gap-8">
                
                {/* 1. HEALTH SCORE CARD */}
                <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-2.5 h-full bg-indigo-600"></div>
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-md font-bold text-slate-900 flex items-center gap-2">
                      <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                        </svg>
                      </span>
                      سلامت اشتراک و پیش‌بینی ریزش (Churn)
                    </h3>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                      userIntelligence.health?.riskLevel === "بحرانی"
                        ? "bg-rose-100 text-rose-700"
                        : userIntelligence.health?.riskLevel === "بالا"
                        ? "bg-amber-100 text-amber-700"
                        : userIntelligence.health?.riskLevel === "متوسط"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-emerald-100 text-emerald-700"
                    }`}>
                      ریسک {userIntelligence.health?.riskLevel}
                    </span>
                  </div>

                  {/* Circular visual progress */}
                  <div className="flex items-center gap-5 my-5">
                    <div className="relative flex items-center justify-center">
                      {/* Ring */}
                      <div className="w-16 h-16 rounded-full border-4 border-slate-100 flex items-center justify-center font-black text-lg text-slate-800">
                        {userIntelligence.health?.healthScore}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-400 font-medium">شاخص سلامت کاربر (از ۱۰۰)</div>
                      <div className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                        این نمره با بررسی الگوهای عدم پرداخت فاکتورها، توقف اشتراک، مانیتورینگ مصرف خام و موجودی منفی کیف پول بدست آمده است.
                      </div>
                    </div>
                  </div>

                  {/* Reason Codes list */}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block mb-2 tracking-wide">دلایل و توضیحات سیستم تصمیم‌یار:</span>
                    <ul className="flex flex-col gap-2">
                      {userIntelligence.health?.reasonCodes.map((reason: string, idx: number) => (
                        <li key={idx} className="text-xs text-slate-700 flex items-start gap-1.5 leading-relaxed">
                          <span className="text-slate-400 mt-1">•</span>
                          {reason}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* 2. CREDIT RUNWAY CARD */}
                {userIntelligence.user360?.creditAccount ? (
                  <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
                    <h3 className="text-md font-bold text-slate-900 flex items-center gap-2 mb-3">
                      <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </span>
                      وضعیت کیف پول و تحلیل مصرف اعتبار (Burn Rate)
                    </h3>

                    <div className="grid grid-cols-2 gap-4 my-4">
                      <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                        <span className="text-[10px] text-slate-400 font-bold block">موجودی کیف پول</span>
                        <span className={`text-lg font-black block mt-1 ${userIntelligence.user360.creditAccount.balance < 0 ? "text-rose-600" : "text-indigo-900"}`}>
                          {formatter.format(userIntelligence.user360.creditAccount.balance)} {currencySymbol(userIntelligence.user360.creditAccount.currency)}
                        </span>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                        <span className="text-[10px] text-slate-400 font-bold block">اعتبار رزرو شده (قفل)</span>
                        <span className="text-lg font-black text-slate-800 block mt-1">
                          {formatter.format(userIntelligence.user360.creditAccount.reserved_balance)} {currencySymbol(userIntelligence.user360.creditAccount.currency)}
                        </span>
                      </div>
                    </div>

                    {/* Runway details */}
                    {userIntelligence.burnRate && (
                      <div className="flex flex-col gap-2 mt-4 text-xs pt-3 border-t border-slate-100">
                        <div className="flex justify-between items-center text-slate-600">
                          <span>نرخ فرسایش روزانه اعتبار:</span>
                          <span className="font-bold text-slate-800">{formatter.format(userIntelligence.burnRate.dailyBurnRate)} واحد / روز</span>
                        </div>
                        <div className="flex justify-between items-center text-slate-600">
                          <span>پایداری باقیمانده (Runway):</span>
                          <span className={`font-black ${userIntelligence.burnRate.riskLevel === "بحرانی" ? "text-rose-600" : "text-slate-800"}`}>
                            {userIntelligence.burnRate.runwayDays === 9999 ? "بی‌نهایت" : `${formatter.format(userIntelligence.burnRate.runwayDays)} روز`}
                          </span>
                        </div>
                        {userIntelligence.burnRate.expiringSoonAmount > 0 && (
                          <div className="flex justify-between items-center text-slate-600">
                            <span>در آستانه انقضاء (۳۰ روز آینده):</span>
                            <span className="font-bold text-amber-600">{formatter.format(userIntelligence.burnRate.expiringSoonAmount)} واحد</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-slate-50 rounded-3xl p-6 text-center border border-dashed border-slate-200 text-slate-400 text-xs">
                    این کاربر فاقد کیف پول اعتباری است (پلن رایگان بدون کاتالوگ اعتباری).
                  </div>
                )}

                {/* 3. EFFECTIVE ENTITLEMENT RESOLVER */}
                <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
                  <h3 className="text-md font-bold text-slate-900 flex items-center gap-2 mb-3">
                    <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 114 0v2m-4 0h4m-4 0H5m12 0h1.586a1 1 0 01.707.293l2.414 2.414a1 1 0 01.293.707V17a2 2 0 01-2 2H5a2 2 0 01-2-2V9a2 2 0 012-2h2m3 4h10" />
                      </svg>
                    </span>
                    سهمیه‌های قطعی و قابلیت‌های فعال (Entitlement)
                  </h3>
                  <p className="text-slate-500 text-xs mb-4 leading-relaxed">
                    محاسبه نهایی دسترسی به ویژگی‌ها با ادغام محدودیت‌های پلن جاری و ملحقات آن:
                  </p>

                  <div className="flex flex-col gap-2.5">
                    {userIntelligence.entitlements && userIntelligence.entitlements.length > 0 ? (
                      userIntelligence.entitlements.map((ent: any) => (
                        <div key={ent.featureId} className="flex justify-between items-center p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                          <div>
                            <span className="font-bold text-slate-800">{ent.featureName}</span>
                            <span className="text-[10px] text-slate-400 block mt-0.5">{ent.featureCode}</span>
                          </div>
                          <div className="text-left">
                            {ent.hasAccess ? (
                              <span className="text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-md">
                                {ent.limitValue === 99999 ? "نامحدود" : `سقف ${formatter.format(ent.limitValue)}`}
                              </span>
                            ) : (
                              <span className="text-slate-400 bg-slate-200 px-2 py-0.5 rounded-md">فاقد دسترسی</span>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <span className="text-xs text-slate-400 text-center py-4">اشتراک فعالی وجود ندارد.</span>
                    )}
                  </div>
                </div>

                {/* 4. NEXT BEST ACTION FOR USER */}
                <div className="bg-indigo-950 text-white rounded-3xl p-6 shadow-md relative overflow-hidden">
                  <div className="absolute inset-0 bg-[linear-gradient(45deg,#312e81_25%,transparent_25%,transparent_50%,#312e81_50%,#312e81_75%,transparent_75%,transparent)] [background-size:24px_24px] opacity-10"></div>
                  <h3 className="text-sm font-bold text-indigo-200 uppercase tracking-wider flex items-center gap-1.5 relative z-10 mb-3">
                    <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    پیشنهاد اقدام بعدی سیستم تصمیم‌یار (Next Best Action)
                  </h3>

                  <div className="flex flex-col gap-3 relative z-10">
                    {userIntelligence.nextBestActions?.map((act: any, idx: number) => (
                      <div key={idx} className="bg-white/10 border border-white/10 rounded-2xl p-4 flex flex-col gap-1.5">
                        <div className="flex justify-between items-center">
                          <span className="font-extrabold text-white text-sm">{act.actionTitle}</span>
                          <span className="text-[10px] font-bold bg-amber-500 text-slate-900 px-2 py-0.5 rounded-full">
                            اولویت {act.relevanceScore}
                          </span>
                        </div>
                        <p className="text-slate-300 text-xs leading-relaxed">{act.reason}</p>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            ) : (
              <div className="bg-slate-100 rounded-3xl border border-slate-200 p-8 text-center text-slate-400 text-xs">
                کاربری یافت نشد یا محاسبات با خطا مواجه شد.
              </div>
            )}
          </section>

          {/* LEFT COLUMN: SYSTEM INTELLIGENCE & OPERATIONS CORES (7 COLS) */}
          <main className="lg:col-span-7 flex flex-col gap-8">
            
            {/* COMPONENT A: ATOMIC CREDIT RESERVE SIMULATOR */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-2">
                <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                </span>
                شبیه‌ساز تراکنش‌های اتمیک اعتباری (Idempotent Ledger)
              </h2>
              <p className="text-slate-500 text-xs leading-relaxed mb-4">
                تراکنش‌های رزرو، تایید و آزادسازی موقت اعتبار با الگوی توزیع‌شده و قفل همزمان دیتابیس را شبیه‌سازی کنید. هر دکمه یک فرآیند ایزوله لجر را با کلید یکتای Idempotency Key آغاز می‌کند:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-4">
                <div>
                  <label className="block text-[10px] text-slate-400 font-bold mb-1.5">مقدار اعتبار (Minor Unit)</label>
                  <input
                    type="number"
                    value={creditAmount}
                    onChange={(e) => setCreditAmount(Number(e.target.value))}
                    className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs font-bold text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 font-bold mb-1.5">نوع عملیات اتمیک</label>
                  <select
                    value={creditAction}
                    onChange={(e) => setCreditAction(e.target.value as any)}
                    className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs font-bold text-slate-800 cursor-pointer"
                  >
                    <option value="reserve">Reserve (رزرو موقت)</option>
                    <option value="capture">Capture (تایید و ثبت نهایی مصرف)</option>
                    <option value="release">Release (آزادسازی رزرو شده)</option>
                  </select>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-[10px] text-slate-400 font-bold">کلید یکتای درخواست (Idempotency)</label>
                    <button onClick={generateNewIdempotencyKey} className="text-[9px] text-indigo-600 font-bold hover:underline cursor-pointer">جدید</button>
                  </div>
                  <input
                    type="text"
                    value={creditIdempotencyKey}
                    onChange={(e) => setCreditIdempotencyKey(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs font-mono font-bold text-slate-600"
                  />
                </div>
              </div>

              <button
                onClick={handleCreditSimulate}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                اجرای تراکنش اتمیک روی کیف پول {MOCK_USERS.find((u) => u.id === selectedUserId)?.name || ""}
              </button>

              {/* Console log outputs */}
              <div className="mt-4">
                <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">کنسول خروجی فرآیند تراکنش:</span>
                <div className="bg-slate-900 text-slate-200 font-mono text-xs p-3.5 rounded-2xl h-36 overflow-y-auto flex flex-col gap-2 border border-slate-950">
                  {creditLog.length === 0 ? (
                    <span className="text-slate-500 text-[10px] italic">هیچ تراکنشی هنوز ارسال نشده است. روی دکمه اجرای تراکنش کلیک کنید...</span>
                  ) : (
                    creditLog.map((log, idx) => (
                      <div key={idx} className={`leading-relaxed ${
                        log.type === "success" ? "text-emerald-400 font-bold" : log.type === "error" ? "text-rose-400 font-bold" : "text-slate-300"
                      }`}>
                        [{log.time}] {log.msg}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* COMPONENT B: PRIORITIZED OPERATIONS WORK QUEUE */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-2">
                <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 114 0v2m-4 0h4m-4 0H5m12 0h1.586a1 1 0 01.707.293l2.414 2.414a1 1 0 01.293.707V17a2 2 0 01-2 2H5a2 2 0 01-2-2V9a2 2 0 012-2h2m3 4h10" />
                  </svg>
                </span>
                صف کارهای نیازمند اقدام فوری (Operations Work Queue)
              </h2>
              <p className="text-slate-500 text-xs leading-relaxed mb-4">
                لیست هوشمند چالش‌ها، نشت‌های درآمدی، مغایرت‌های بالانس و موارد اتمام سریع اعتبارات کاربران که براساس فرمول وزن‌دهی شدت چالش، رتبه‌بندی شده‌اند:
              </p>

              {isGlobalPending ? (
                <div className="flex flex-col items-center py-8 justify-center gap-2 text-slate-400 text-xs">
                  <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                  درحال تجدید صف کار...
                </div>
              ) : globalIntelligence?.prioritizedQueue && globalIntelligence.prioritizedQueue.length > 0 ? (
                <div className="flex flex-col gap-3 max-h-[400px] overflow-y-auto pr-1">
                  {globalIntelligence.prioritizedQueue.map((item: any, idx: number) => (
                    <div key={idx} className="bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row justify-between gap-4 text-xs transition-all">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <span className={`px-2 py-0.5 rounded-md font-extrabold text-[10px] ${
                            item.category === "مالی"
                              ? "bg-rose-100 text-rose-700"
                              : item.category === "کیف پول"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-indigo-100 text-indigo-700"
                          }`}>
                            {item.category}
                          </span>
                          <span className="font-bold text-slate-800">{item.userName}</span>
                          <span className="text-[10px] text-slate-400 font-mono">({item.userId})</span>
                        </div>
                        <p className="text-slate-600 leading-relaxed mb-2">{item.description}</p>
                        <div className="bg-white p-2.5 rounded-xl border border-slate-200 text-slate-700">
                          <strong className="text-indigo-900 font-bold block mb-0.5 text-[10px]">اقدام مقتضی برای اپراتور:</strong>
                          {item.actionRequired}
                        </div>
                      </div>

                      <div className="flex sm:flex-col items-center justify-between sm:justify-center border-t sm:border-t-0 sm:border-r border-slate-200 pt-2 sm:pt-0 sm:pr-4 min-w-[90px] shrink-0 gap-1">
                        <span className="text-[10px] text-slate-400 font-bold uppercase">امتیاز بحران</span>
                        <span className="text-2xl font-black text-slate-800">{formatter.format(item.priorityScore)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <span className="text-xs text-emerald-600 font-bold bg-emerald-50 border border-emerald-100 rounded-xl p-4 text-center block">
                  ✓ عالی! هیچ مغایرت، ریزش خطرناک یا نشتی پولی فعالی در پلتفرم وجود ندارد. سیستم در توازن کامل است.
                </span>
              )}
            </div>

            {/* COMPONENT C: REVENUE LEAKAGE DETAILS */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-2">
                <span className="p-1.5 bg-rose-50 text-rose-600 rounded-lg">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </span>
                موتور شناسایی نشتی درآمد (Revenue Leakage & Reconciliation)
              </h2>
              <p className="text-slate-500 text-xs leading-relaxed mb-4">
                تطبیق بلبرینگ‌های پولی؛ بررسی مواردی که فاکتور به دروغ پرداخت‌شده خورده ولی تراکنش آن ناموفق بوده یا برعکس (تراکنش‌های موفق بدون سند فاکتور):
              </p>

              {globalIntelligence?.revenueLeakage && globalIntelligence.revenueLeakage.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {globalIntelligence.revenueLeakage.map((leak: any, idx: number) => (
                    <div key={idx} className="border border-rose-100 bg-rose-50/50 rounded-2xl p-4 flex flex-col gap-2 text-xs">
                      <div className="flex justify-between items-center">
                        <strong className="text-rose-900 font-bold text-sm flex items-center gap-1">
                          ⚠️ {leak.issueType}
                        </strong>
                        <span className="font-extrabold text-rose-700 bg-rose-100/80 px-2 py-0.5 rounded">
                          مبلغ نشت: ${formatter.format(leak.amountLeaked / 100)}
                        </span>
                      </div>
                      <p className="text-slate-700 leading-relaxed font-medium">مشتری: {leak.userName} — {leak.description}</p>
                      <div className="bg-white p-2.5 rounded-xl border border-rose-100/50 text-slate-600 leading-relaxed">
                        <strong className="text-rose-950 font-bold block mb-0.5 text-[10px]">راهکار جبران خودکار:</strong>
                        {leak.remediation}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <span className="text-xs text-slate-400 text-center block py-4">موردی یافت نشد.</span>
              )}
            </div>

            {/* COMPONENT D: CATALOG INTELLIGENCE & VERSION COMPARATOR */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-2">
                <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                  </svg>
                </span>
                هوش کاتالوگ و گراف وابستگی ویژگی‌ها (Catalog & Graph Core)
              </h2>
              <p className="text-slate-500 text-xs leading-relaxed mb-4">
                تطبیق نسخه‌های یک پلن برای تایید صحت انتشار و شناسایی رکوردهای دایره‌ای مخرب (Dependency Cycles) در کاتالوگ با استفاده از موتور بازگشتی گراف:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. Plan Diff */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">اعتبارسنجی مقایسه‌ای پلن Pro (نسخه ۱ و ۲)</span>
                  {planDiff ? (
                    <div className="text-xs flex flex-col gap-2 mt-2">
                      <div className="flex justify-between items-center text-slate-600">
                        <span>اختلاف قیمتی نسخه‌ها:</span>
                        <span className={`font-bold ${planDiff.priceDiff > 0 ? "text-rose-600" : "text-emerald-600"}`}>
                          +{formatter.format(planDiff.priceDiff / 100)} دلار
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-slate-600">
                        <span>وضعیت تایید جهت انتشار:</span>
                        {planDiff.isValidForPublish ? (
                          <span className="text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded text-[10px]">قابل تایید</span>
                        ) : (
                          <span className="text-rose-600 font-bold bg-rose-50 px-1.5 py-0.5 rounded text-[10px]">خطای ساختاری</span>
                        )}
                      </div>
                      <div className="text-slate-500 text-[10px] leading-relaxed pt-2 border-t border-slate-200">
                        <strong>تغییرات محدودیت:</strong>
                        <ul className="list-disc pr-4 mt-1 flex flex-col gap-1">
                          {planDiff.addedLimits.map((lim: string, idx: number) => (
                            <li key={idx}>{lim}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ) : (
                    <span className="text-slate-400 text-center text-xs block py-4">بارگذاری...</span>
                  )}
                </div>

                {/* 2. Dependency Cycles */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">کاشف چرخه‌های کاتالوگ ویژگی‌ها</span>
                  {globalIntelligence?.dependencyReport ? (
                    <div className="text-xs flex flex-col gap-2 mt-2">
                      <div className="flex justify-between items-center text-slate-600">
                        <span>گراف دارای چرخه مخرب:</span>
                        {globalIntelligence.dependencyReport.hasCycle ? (
                          <span className="text-rose-600 font-bold bg-rose-50 px-1.5 py-0.5 rounded text-[10px]">بله (دارای عیب)</span>
                        ) : (
                          <span className="text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded text-[10px]">سالم</span>
                        )}
                      </div>
                      {globalIntelligence.dependencyReport.hasCycle && (
                        <div className="bg-rose-50 border border-rose-100 text-rose-950 p-2.5 rounded-xl mt-1 text-[11px] leading-relaxed">
                          <strong>مسیر دایره‌ای کشف شده:</strong>
                          <div className="font-mono mt-1 text-[10px] text-rose-800">
                            {globalIntelligence.dependencyReport.cyclePath.join(" ← ")}
                          </div>
                          <span className="text-[9px] text-slate-500 block mt-1">اپراتور نباید کاتالوگی را منتشر کند که نیاز به پیش‌نیازهای دوطرفه بن‌بست دارد.</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <span className="text-slate-400 text-center text-xs block py-4">بارگذاری...</span>
                  )}
                </div>
              </div>
            </div>

          </main>
        </div>

        {/* BOTTOM SECTION: DETAILED EXPLANATORY CARDS FOR AUDITOR */}
        <section className="mt-12 bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
            💡 مستندات و راهنمای درک عملکرد قابلیت‌های تصمیم‌یاری (Auditor Handbook)
          </h2>
          <p className="text-slate-600 text-sm leading-relaxed mb-6">
            آزمایشگاه هوش داده Diminish Super Admin صرفاً یک پنل گزارش‌گیری معمولی نیست؛ این بخش با تحلیل روابط پیشرفته لجر و انحرافات حساب‌ها ساخته شده است. راهنمای فنی زیر جزئیات ریاضی و ساختار داده هر قابلیت را برای ممیزان سیستم تشریح می‌کند:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-xs leading-relaxed">
            
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 flex flex-col gap-2">
              <strong className="text-indigo-950 text-sm font-bold">۱. سهمیه نهایی قطعی (Effective Entitlements)</strong>
              <p className="text-slate-600">
                <strong>جداول مرجع:</strong> <span className="font-mono text-slate-500 text-[10px]">subscriptions, plan_limits, addons, addon_features, subscription_addons</span>
              </p>
              <p className="text-slate-500">
                این موتور با ترکیب درختی کاتالوگ اصلی و افزونه‌های فعال خریداری شده هر اشتراک، محدودیت‌های نهایی مجاز هر ویژگی را به روش حل‌گر پایین‌به‌بالا محاسبه می‌کند تا از نشت امکانات پیشگیری شود.
              </p>
            </div>

            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 flex flex-col gap-2">
              <strong className="text-indigo-950 text-sm font-bold">۲. ممیزی لجر و تطبیق زنجیره (Ledger Reconciliation)</strong>
              <p className="text-slate-600">
                <strong>جداول مرجع:</strong> <span className="font-mono text-slate-500 text-[10px]">credit_accounts, credit_ledger</span>
              </p>
              <p className="text-slate-500">
                سیستم با نادیده گرفتن متغیرهای کش، تک‌تک رکوردهای تاریخی و اپند-اونلی لجر را بر اساس بردار جهت (credit/debit) جمع زده و با بالانس کش‌شده مقایسه می‌کند تا انحرافات ناشی از تراکنش‌های ناتمام را آشکار کند.
              </p>
            </div>

            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 flex flex-col gap-2">
              <strong className="text-indigo-950 text-sm font-bold">۳. نرخ فرسایش و بقاء کیف پول (Burn Rate & Runway)</strong>
              <p className="text-slate-600">
                <strong>جداول مرجع:</strong> <span className="font-mono text-slate-500 text-[10px]">credit_ledger, usage_daily_aggregates, credit_grants</span>
              </p>
              <p className="text-slate-500">
                با ردیابی مصرف در یک قاب زمانی غلتان، سرعت متوسط کسر اعتبار تعیین شده و موجودی کل بر آن تقسیم می‌شود تا مدت زمان پایداری حساب مشخص شود. همچنین سهمیه‌های در آستانه انقضا شناسایی می‌شوند.
              </p>
            </div>

            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 flex flex-col gap-2">
              <strong className="text-indigo-950 text-sm font-bold">۴. کشف رفتارهای انحرافی (Usage Anomalies)</strong>
              <p className="text-slate-600">
                <strong>جداول مرجع:</strong> <span className="font-mono text-slate-500 text-[10px]">usage_daily_aggregates</span>
              </p>
              <p className="text-slate-500">
                با اجرای محاسبات واریانس و انحراف معیار روی میانگین مصرف ۳۰ روز گذشته، هرگونه مصرف جهشی که دارای Z-Score بالای ۲ باشد به عنوان مصرف غیرعادی گزارش شده و در صف کار کارشناس جهت کنترل سوءاستفاده قرار می‌گیرد.
              </p>
            </div>

            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 flex flex-col gap-2">
              <strong className="text-indigo-950 text-sm font-bold">۵. پایداری درگاه پرداخت و نشت درآمد</strong>
              <p className="text-slate-600">
                <strong>جداول مرجع:</strong> <span className="font-mono text-slate-500 text-[10px]">invoices, transactions, subscriptions</span>
              </p>
              <p className="text-slate-500">
                سیستم با ادغام لاگ‌های بیرونی درگاه‌های استرایپ/بانک و اسناد داخلی فاکتورها، مغایرت‌های بزرگ نظیر فاکتورهای جعلی تایید شده بدون تراکنش بانکی موفق را برای ممانعت از فرار مالی کشف می‌کند.
              </p>
            </div>

            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 flex flex-col gap-2">
              <strong className="text-indigo-950 text-sm font-bold">۶. موتور اقدامات پیشگیرانه (Next Best Action)</strong>
              <p className="text-slate-600">
                <strong>جداول مرجع:</strong> <span className="font-mono text-slate-500 text-[10px]">کل ۳۸ جدول مدل داده‌ای</span>
              </p>
              <p className="text-slate-500">
                تصمیم‌یار به صورت مداوم با رصد کل وضعیت‌ها، به جای نمایش ساده خام اعداد، راهکارهایی عملیاتی (مانند ایمیل تذکر پرداخت، پیشنهاد پکیج افزایش حجم یا اخطار تعلیق) همراه با نمره اعتماد صادر می‌کند.
              </p>
            </div>

          </div>
        </section>

      </div>
    </div>
  );
}
