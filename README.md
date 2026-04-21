# حسين بيرام | نظام حجوزات الجلسات التصويرية

نظام إدارة حجوزات عربي RTL مبني بـ Next.js + Supabase، مع دخول إدارة عبر PIN فقط، وقاعدة بيانات سحابية حقيقية لحفظ الحجوزات والفواتير أونلاين.

## الميزات

- دخول إدارة برمز PIN فقط بدون بريد إلكتروني أو كلمة مرور
- جلسة آمنة عبر `HttpOnly Cookie`
- حماية للمسارات والـ API عبر `middleware`
- Rate limiting لمحاولات الدخول الخاطئة
- إدارة حجوزات كاملة: إضافة، تعديل، حذف
- بحث بالاسم أو الهاتف
- فلترة: اليوم، القادمة، هذا الشهر
- إحصاءات فورية: عدد الحجوزات، حجوزات اليوم، الواصل، المتبقي
- فاتورة عربية أنيقة مع معاينة وطباعة PDF من المتصفح ومشاركة نصية
- تصميم فاخر RTL مع الهوية البصرية الحالية والشعارين

## التقنيات

- `Next.js 16`
- `React 19`
- `Supabase PostgreSQL`
- `Tailwind/PostCSS` موجودان من القالب، لكن الواجهة مبنية فعليًا بـ CSS Modules + Global CSS
- `bcryptjs` لتخزين ومطابقة الـ PIN بشكل آمن
- `zod` للتحقق من صحة البيانات

## بنية المشروع

```text
src/
  app/
    api/                 # مصادقة PIN و CRUD الحجوزات
    dashboard/           # لوحة الإدارة والفواتير
    login/               # صفحة الدخول
  components/            # الواجهات القابلة لإعادة الاستخدام
  lib/                   # الأمان، الجلسات، Supabase، التحقق
  types/                 # أنواع TypeScript
public/brand/            # intro-logo.png + hb-logo.png
supabase/schema.sql      # مخطط قاعدة البيانات
scripts/hash-pin.mjs     # توليد hash جديد للـ PIN
```

## 1. إعداد Supabase

1. أنشئ مشروع Supabase جديد.
2. افتح SQL Editor داخل Supabase.
3. الصق محتوى الملف التالي ونفّذه:

   `supabase/schema.sql`

هذا سينشئ:

- جدول `bookings`
- جدول `admin_login_rate_limits`
- الفهارس
- trigger لتحديث `updated_at`
- عمود `remaining_amount` محسوب تلقائيًا من:

  `total_amount - paid_amount`

## 2. متغيرات البيئة

أنشئ ملف `.env.local` اعتمادًا على `.env.example`:

```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
ADMIN_PIN_HASH=$2b$12$replace_this_with_bcrypt_hash
SESSION_SECRET=replace-with-a-long-random-secret-at-least-32-characters
```

## 3. أين تضع الـ PIN بشكل آمن؟

لا تضع الـ PIN نفسه داخل الواجهة أبدًا.

الطريقة الصحيحة:

1. ولّد hash جديد:

   ```bash
   npm run hash-pin -- 1234
   ```

2. انسخ القيمة الناتجة وضعها في:

   `ADMIN_PIN_HASH`

بهذا الشكل، الخادم يتحقق من الرمز باستخدام hash فقط، وليس من قيمة مكشوفة في الواجهة.

## 4. تشغيل المشروع محليًا

```bash
npm install
npm run dev
```

ثم افتح:

- صفحة الدخول: [http://localhost:3000/login](http://localhost:3000/login)
- اللوحة: [http://localhost:3000/dashboard](http://localhost:3000/dashboard)

## 5. تغيير رمز الإدارة لاحقًا

عند الرغبة بتغيير الـ PIN:

1. ولّد hash جديد:

   ```bash
   npm run hash-pin -- 5678
   ```

2. حدّث قيمة `ADMIN_PIN_HASH` في `.env.local` أو في إعدادات البيئة على Vercel.
3. أعد نشر المشروع أو أعد تشغيل الخادم.

لا تحتاج إلى تعديل الكود نفسه.

## 6. النشر على Vercel

1. ارفع المشروع إلى GitHub.
2. أنشئ مشروعًا جديدًا على Vercel من نفس المستودع.
3. أضف متغيرات البيئة التالية في Vercel Project Settings:

   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `ADMIN_PIN_HASH`
   - `SESSION_SECRET`

4. نفّذ نشر المشروع.

بعد النشر، ستعمل نفس مسارات الدخول واللوحة والفواتير مباشرة.

## 7. ملاحظات أمنية مهمة

- التحقق من PIN يتم في الخادم فقط
- لا يوجد Signup عام
- لا يوجد Email/Password
- كل CRUD يمر عبر API محمي بالجلسة
- الـ Service Role Key لا يذهب إلى المتصفح
- `remaining_amount` محفوظ بشكل محسوب على مستوى قاعدة البيانات
- المسارات الإدارية محمية في `middleware.ts`

## 8. ملاحظات قاعدة البيانات

الحقول الأساسية في جدول `bookings`:

- `id`
- `customer_name`
- `phone`
- `booking_date`
- `service_type`
- `session_size`
- `location_type`
- `staff_gender`
- `extra_details`
- `total_amount`
- `paid_amount`
- `remaining_amount`
- `payment_status`
- `notes`
- `created_at`
- `updated_at`

## 9. الشعار والهوية

تم وضع ملفات الشعار المستخدمة هنا:

- `public/brand/intro-logo.png`
- `public/brand/hb-logo.png`

## 10. أوامر مفيدة

```bash
npm run dev
npm run lint
npm run typecheck
npm run build
npm run hash-pin -- 1234
```
