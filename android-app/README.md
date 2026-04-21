# Android APK

هذا المجلد يحتوي تطبيق Android أصلي يغلّف نسخة الويب من نظام `حسين بيرام` داخل `WebView` مع شاشة افتتاحية فاخرة مدتها 3 ثوانٍ.

## قبل البناء

1. انشر مشروع Next.js الحالي على رابط HTTPS ثابت مثل Vercel.
2. عدّل المتغير `BOOKINGS_WEB_URL` داخل [android-app/gradle.properties](/Users/yoland/Desktop/hussen%20baeram%20/android-app/gradle.properties) أو مرره وقت البناء:

```bash
BOOKINGS_WEB_URL=https://your-domain.vercel.app ./gradlew assembleDebug
```

3. أضف ملف `local.properties` داخل `android-app` يحتوي مسار Android SDK:

```properties
sdk.dir=/absolute/path/to/android-sdk
```

4. استخدم Java 17 وAndroid SDK Platform 34 مع Build Tools 34.

## البناء

```bash
cd android-app
./gradlew assembleDebug
```

ملف الـ APK الناتج سيكون هنا:

`android-app/app/build/outputs/apk/debug/app-debug.apk`

## ملاحظات

- شاشة الافتتاح تظهر عند كل تشغيل للتطبيق لمدة 3 ثوانٍ مع انتقال Fade سلس.
- زر `طباعة PDF` داخل الفاتورة يستدعي طباعة أندرويد الأصلية من داخل التطبيق.
- زر `مشاركة الفاتورة` يستخدم مشاركة أندرويد الأصلية عندما يكون التطبيق مفتوحًا داخل الـ APK.
