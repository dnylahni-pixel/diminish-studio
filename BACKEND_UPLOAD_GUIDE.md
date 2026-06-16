# راهنمای پیاده‌سازی Backend برای آپلود به Backblaze B2

## نیازمندی‌ها

Frontend اکنون آماده است و منتظر این endpoint از Backend:

### 1. Endpoint: دریافت Presigned URL

**مسیر:** `POST /api/upload/presigned-url`

**Request Body:**
```json
{
  "filename": "song.mp3",
  "contentType": "audio/mpeg",
  "fileSize": 5242880
}
```

**Response:**
```json
{
  "presignedUrl": "https://s3.us-west-000.backblazeb2.com/bucket-name/uploads/uuid-filename.mp3?X-Amz-...",
  "fileKey": "uploads/uuid-filename.mp3"
}
```

## مراحل پیاده‌سازی Backend

### نصب Package

```bash
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

### کد نمونه (Node.js/Express)

```typescript
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';

// تنظیمات Backblaze B2
const s3Client = new S3Client({
  endpoint: 'https://s3.us-west-000.backblazeb2.com', // endpoint باکت خودتون
  region: 'us-west-000', // region خودتون
  credentials: {
    accessKeyId: process.env.B2_KEY_ID!,
    secretAccessKey: process.env.B2_APPLICATION_KEY!,
  },
});

const BUCKET_NAME = 'your-bucket-name';

// Route handler
app.post('/api/upload/presigned-url', async (req, res) => {
  try {
    const { filename, contentType, fileSize } = req.body;

    // اعتبارسنجی
    if (!filename || !contentType) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // ایجاد نام یونیک برای فایل
    const fileExtension = filename.split('.').pop();
    const uniqueFilename = `${uuidv4()}.${fileExtension}`;
    const fileKey = `uploads/${uniqueFilename}`;

    // ساخت presigned URL
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileKey,
      ContentType: contentType,
      // اختیاری: ContentLength برای محدودیت حجم
      // ContentLength: fileSize,
    });

    const presignedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 3600, // 1 ساعت
    });

    res.json({
      presignedUrl,
      fileKey,
    });
  } catch (error) {
    console.error('Presigned URL generation failed:', error);
    res.status(500).json({ error: 'Failed to generate upload URL' });
  }
});
```

## متغیرهای محیطی (.env)

```env
B2_KEY_ID=your_backblaze_key_id
B2_APPLICATION_KEY=your_backblaze_application_key
B2_BUCKET_NAME=your-bucket-name
B2_ENDPOINT=https://s3.us-west-000.backblazeb2.com
B2_REGION=us-west-000
```

## تنظیمات Backblaze B2 Bucket

### 1. ساخت Bucket
- Bucket Type: **Private** یا **Public** (بسته به نیاز)
- Lifecycle Settings: می‌توانید فایل‌های موقت را بعد از چند روز حذف کنید

### 2. ایجاد Application Key
- Capabilities: `writeFiles`, `deleteFiles`, `listFiles`
- Bucket Access: فقط bucket مورد نظر

### 3. CORS Settings (اگر مستقیم از browser آپلود می‌کنید)
```json
[
  {
    "corsRuleName": "uploadRule",
    "allowedOrigins": [
      "http://localhost:5173",
      "https://yourdomain.com"
    ],
    "allowedOperations": [
      "s3_put"
    ],
    "allowedHeaders": [
      "content-type",
      "x-bz-content-sha1"
    ],
    "maxAgeSeconds": 3600
  }
]
```

## فلوی کامل

```
1. کاربر فایل را انتخاب می‌کند
   ↓
2. Frontend اعتبارسنجی می‌کند (پسوند، حجم، مدت‌زمان)
   ↓
3. Frontend درخواست presigned URL می‌دهد
   ↓ POST /api/upload/presigned-url
4. Backend presigned URL تولید می‌کند
   ↓
5. Frontend مستقیماً به B2 آپلود می‌کند (PUT request)
   ↓
6. Frontend با fileKey پردازش را شروع می‌کند
   ↓ POST /api/process با source: fileKey
7. Backend فایل را از B2 دریافت و پردازش می‌کند
```

## نکات مهم

✅ **امنیت:**
- Presigned URL فقط 1 ساعت اعتبار دارد
- فایل‌ها در پوشه `uploads/` با UUID ذخیره می‌شوند
- Application Key باید فقط دسترسی محدود داشته باشد

✅ **عملکرد:**
- آپلود مستقیم به B2 → سرور شما load ندارد
- Frontend progress monitoring می‌تواند اضافه شود

✅ **بعد از پردازش:**
- فایل‌های اصلی رو می‌توانید نگه دارید یا حذف کنید
- فایل‌های پردازش‌شده (stems, chords) را در bucket دیگری ذخیره کنید

## تست

```bash
# تست endpoint
curl -X POST http://localhost:3000/api/upload/presigned-url \
  -H "Content-Type: application/json" \
  -d '{
    "filename": "test.mp3",
    "contentType": "audio/mpeg",
    "fileSize": 1024000
  }'
```

باید یک presigned URL دریافت کنید که شبیه این باشد:
```
https://s3.us-west-000.backblazeb2.com/bucket-name/uploads/xxx-xxx-xxx.mp3?X-Amz-Algorithm=AWS4-HMAC-SHA256&...
```
