# DiminishStudio — Feature Specification

## دو فیچر اصلی پلتفرم

-----

## فیچر ۱: Mute & Cover → AI Remix → Publish

### خلاصه

کاربر یکی از ۶ لایه آهنگ رو میوت میکنه، جای اون لایه رو خودش پر میکنه (خواندن/نوازندگی)، سپس AI کل ترکیب رو remix میکنه و کاربر با یه کلیک publish میکنه.

### فلوی کاربر

```
آهنگ انتخاب کن
↓
لایه‌ها نمایش داده میشن (vocals / drums / bass / guitar / piano / other)
↓
یکی رو mute کن
↓
دکمه REC بزن → میکروفون باز میشه
↓
با آهنگ بخون یا بنواز (لایه‌های دیگه پخش میشن)
↓
Stop → پیش‌نمایش ترکیب
↓
"AI Remix" → AI ترکیب رو polish میکنه (EQ / mix / master)
↓
نام بذار + تگ بزن → Publish
↓
میره توی Explore feed
```

### معماری فنی

#### Frontend

```
StemPlayer Component
├── AudioContext (Web Audio API)
├── SoundTouch.js (pitch/tempo control)
├── Per-stem GainNode (mute/solo)
├── MediaRecorder API (ضبط میکروفون)
└── WaveSurfer.js (ویژوالایزر)
```

#### Backend Flow

```
POST /api/covers/create
{
song_id: number,
muted_stem: "vocals" | "drums" | "bass" | ...,
user_recording: File (webm/wav),
apply_ai_remix: boolean
}
↓
Render Worker:
1. دریافت stems اصلی از Backblaze
2. ترکیب با ضبط کاربر (ffmpeg)
3. AI Mix/Master (اختیاری - loudness normalize + EQ)
4. آپلود خروجی به Backblaze
5. ذخیره در جدول covers
↓
Response: { cover_id, audio_url, preview_url }
```

#### جداول دیتابیس جدید

```sql
covers (موجود در schema)
+ cover_remixes
- id
- cover_id FK
- ai_model varchar
- settings jsonb
- output_url text
- created_at
```

### سیستم سکه (Earn to Create)

```
publish cover → +1 سکه
هر ۱۰۰ play روی cover → +1 سکه
هر ۵۰ like روی cover → +1 سکه

هزینه ساخت cover جدید:
- free plan: 1 سکه لازم داره
- pro plan: رایگان
```

### نکات پیاده‌سازی

- ضبط باید latency کم داشته باشه → Web Audio API مستقیم، نه MediaStream
- sync لایه‌ها با ضبط کاربر: همه از یه AudioContext.currentTime استارت بزنن
- AI remix در MVP = فقط loudnorm ffmpeg (کافیه)
- در نسخه بعدی = Matchering یا Spleeter re-mix

-----

## فیچر ۲: Voice → AI Song → Publish

### خلاصه

کاربر یه ویس ضبط میکنه (هر چیزی — ملودی زمزمه‌شده، کلمات، ایده خام)، یه AI موزیک‌ساز اون رو تبدیل به یه آهنگ کامل میکنه، و با یه کلیک publish میشه توی explore.

### فلوی کاربر

```
دکمه "بساز" بزن
↓
انتخاب: 🎙️ ویس بده | ✍️ متن بنویس | 🎵 ملودی بزن
↓
ضبط (حداکثر ۳۰ ثانیه) یا تایپ
↓
سبک انتخاب کن (پاپ / رپ / سنتی / الکترونیک / ...)
↓
"Generate" → AI آهنگ میسازه (~۱۰-۳۰ ثانیه)
↓
پیش‌نمایش + تنظیمات (tempo / key / mood)
↓
"Regenerate" یا "Publish" → میره توی Explore
```

### معماری فنی

#### AI Generation Options (به ترتیب پیشنهاد)

|گزینه |هزینه |کیفیت|API |
|--------------------------|------------|-----|-----|
|**Suno API** |~$0.01/song |عالی |موجود|
|**Udio API** |~$0.01/song |عالی |موجود|
|**MusicGen (HuggingFace)**|رایگان محدود|خوب |موجود|
|**RunPod + MusicGen** |~$0.002/song|خوب |خودت |

#### Backend Flow

```
POST /api/generate/song
{
type: "voice" | "text" | "melody",
input: File | string,
style: string,
duration: number (15-60s)
}
↓
Worker:
1. اگه voice: Whisper → transcript
2. Prompt ساخته میشه از transcript + style
3. Suno/Udio API call
4. دریافت آهنگ
5. آپلود به Backblaze
6. ذخیره در جدول generated_songs
↓
Response: { song_id, audio_url, duration }
```

#### جداول دیتابیس جدید

```sql
generated_songs
- id serial PK
- user_id int FK→users
- input_type varchar (voice/text/melody)
- input_transcript text
- style varchar
- prompt_used text
- audio_url text
- published boolean default false
- play_count int default 0
- like_count int default 0
- created_at timestamp

-- وقتی publish میشه، یه ردیف هم توی covers میره
```

### سیستم سکه

```
publish generated song → +2 سکه (چون محتوای اصیله)
هر ۵۰ play → +1 سکه
هر ۲۵ like → +1 سکه

هزینه generate:
- free plan: 2 سکه لازم داره
- pro plan: رایگان
- اولین generate: رایگان (onboarding hook)
```

-----

## سیستم سکه — قوانین کلی

```
جدول: user_coins
- id
- user_id FK
- amount int
- reason varchar
- ref_type varchar (cover/generated_song/play/like)
- ref_id int
- created_at

جدول: coin_transactions
- id
- user_id FK
- delta int (+/-)
- action varchar
- created_at
```

### نرخ‌ها

|اقدام |سکه|
|----------------------|---|
|publish cover |+1 |
|publish generated song|+2 |
|هر ۱۰۰ play روی محتوات|+1 |
|هر ۵۰ like روی محتوات |+1 |
|دعوت دوست |+3 |
|ساخت cover جدید |-1 |
|ساخت generated song |-2 |

### چرا این مدل کار میکنه

1. **ابزار رایگان نیست** — جامعه رایگانه
1. **محتوا → درآمد → محتوای بیشتر** — loop خودکار
1. **explore پر میشه** بدون هزینه مستقیم برای پلتفرم
1. **کاربر احساس ownership داره** — سکه‌هایی که خودش کسب کرده

-----

## Explore Feed — ساختار

```
POST /publish →
↓
moderation (auto: طول، حجم، بررسی سریع)
↓
explore feed (chronological + trending score)

trending score = plays×1 + likes×3 + comments×5 + shares×10
(decay: نصف هر ۴۸ ساعت)
```

-----

## MVP Priority

```
Phase 1 (بساز):
✅ Stem Player با mute
✅ ضبط میکروفون
✅ Mix ساده (ffmpeg)
✅ Publish → Explore

Phase 2 (بهتر بساز):
⬜ AI Remix (Matchering)
⬜ Voice → Song (Suno API)
⬜ سیستم سکه

Phase 3 (رشد):
⬜ Trending algorithm
⬜ Duet (دو نفره روی یه آهنگ)
⬜ Challenge (یه آهنگ، صدها cover)
```

-----

*DiminishStudio — Where listeners become creators*
