# 📋 تحليل مشروع صاد (Saad) — دليل الصيدليات

## نظرة عامة على المشروع

مشروع **صاد** هو تطبيق ويب لتحديد مواقع الصيدليات والبحث عن الأدوية، مبني بـ:

| التقنية | الاستخدام |
|---------|-----------|
| **React 19** + **TypeScript** | واجهة المستخدم |
| **Vite 6** | أداة البناء والتطوير |
| **Tailwind CSS 4** | التنسيقات |
| **Supabase** | قاعدة البيانات + المصادقة |
| **Leaflet** | الخرائط التفاعلية |
| **Google Gemini AI** | بحث ذكي + OCR |
| **PWA** | دعم العمل كتطبيق |

### الميزات الحالية
- 🔍 بحث عن الأدوية بالاسم التجاري / العلمي مع اقتراح بدائل تلقائياً
- 🗺️ عرض النتائج على خريطة Leaflet أو كقائمة
- 🤖 بحث ذكي عبر Gemini AI + خرائط جوجل عند عدم وجود نتائج
- 📷 مسح الباركود + OCR لاستخراج أسماء الأدوية من الصور
- 👨‍⚕️ لوحة تحكم للصيدلي (إدارة المخزون، تسجيل المبيعات، استيراد CSV)
- 🛡️ لوحة إدارة كاملة (إحصائيات، إدارة الصيدليات والأدوية)
- 📊 تحليلات البحث حسب المنطقة الجغرافية
- ⏰ نظام ساعات عمل تلقائي + تبديل يدوي

### هيكل قاعدة البيانات
5 جداول: `pharmacies` → `inventory` ← `medicines` + `search_logs` + `sales_logs`

---

## 🔧 التحسينات المقترحة

### 1. 🔴 أمن حرج — سياسات RLS مفتوحة بالكامل

> [!CAUTION]
> جميع جداول Supabase تستخدم سياسة `FOR ALL USING (true) WITH CHECK (true)` — أي مستخدم مجهول يمكنه حذف أو تعديل أي بيانات!

**الحل:** تطبيق سياسات RLS مناسبة:
- `pharmacies`: القراءة للجميع، التعديل فقط للمالك (`auth.uid() = id`)
- `inventory`: القراءة للجميع، الكتابة فقط لصيدلي المخزون
- `medicines`: القراءة للجميع، الكتابة فقط للمصادق عليهم
- `search_logs`: الإدراج للجميع، القراءة فقط للمصادق عليهم
- `sales_logs`: الكتابة والقراءة فقط لمالك الصيدلية

---

### 2. 🔴 أمن حرج — مفتاح Gemini API مكشوف في الـ Client

> [!CAUTION]
> ملف [vite.config.ts](file:///c:/Users/Abdoonin/Desktop/nin/saad-%28%D8%B5%D8%A7%D8%AF%29---pharmacy-locator%20%282%29/vite.config.ts) يحقن `GEMINI_API_KEY` في `process.env` مما يعرضه في كود الـ JavaScript المبني. أي شخص يفحص الكود يمكنه سرقة المفتاح.

**الحل:** إنشاء Supabase Edge Function أو API Route بسيطة كوسيط (Proxy) لاستدعاءات Gemini.

---

### 3. 🟠 أمن — تخزين كلمات المرور كنص عادي

> [!WARNING]
> جدول `pharmacies` يحتوي على عمود `password TEXT` وكلمات المرور مخزنة كنص عادي في الـ mock data.

**الحل:** الاعتماد بالكامل على Supabase Auth (الذي يستخدم bcrypt)، وإزالة عمود `password` من جدول `pharmacies`.

---

### 4. 🟠 أمن — ملف [.env](file:///c:/Users/Abdoonin/Desktop/nin/saad-%28%D8%B5%D8%A7%D8%AF%29---pharmacy-locator%20%282%29/.env) يحتوي مفاتيح حقيقية

> [!WARNING]
> ملف [.env](file:///c:/Users/Abdoonin/Desktop/nin/saad-%28%D8%B5%D8%A7%D8%AF%29---pharmacy-locator%20%282%29/.env) يحتوي على مفاتيح Supabase حقيقية. تأكد من إضافته إلى [.gitignore](file:///c:/Users/Abdoonin/Desktop/nin/saad-%28%D8%B5%D8%A7%D8%AF%29---pharmacy-locator%20%282%29/.gitignore) (موجود بالفعل لكن يجب التأكد من عدم رفعه سابقاً).

---

### 5. 🟡 هيكلة الكود — [App.tsx](file:///c:/Users/Abdoonin/Desktop/nin/saad-%28%D8%B5%D8%A7%D8%AF%29---pharmacy-locator%20%282%29/App.tsx) ضخم جداً (475 سطر)

**المشكلة:** كل العرض والمنطق في ملف واحد بدون Router.

**الحل:**
- استخدام React Router لإدارة الصفحات
- نقل logic البحث إلى Custom Hook مثل `useSearch`
- نقل state المستخدم إلى React Context

---

### 6. 🟡 هيكلة — [DashboardPage.tsx](file:///c:/Users/Abdoonin/Desktop/nin/saad-%28%D8%B5%D8%A7%D8%AF%29---pharmacy-locator%20%282%29/components/DashboardPage.tsx) ضخم (881 سطر)

**المشكلة:** مكون واحد يحتوي على المخزون، المبيعات، التحليلات، والنماذج.

**الحل:** تقسيمه إلى مكونات فرعية: `StatsCards`, `InventoryTable`, `SalesTable`, `SaleModal`.

---

### 7. 🟡 أداء — لا يوجد Pagination

**المشكلة:** كل نتائج البحث والمخزون تُحمَّل دفعة واحدة.

**الحل:** إضافة pagination مع `.range()` في Supabase.

---

### 8. 🟢 UX — أيقونات PWA عشوائية

**المشكلة:** أيقونات التطبيق تأتي من `picsum.photos` — صور عشوائية!

**الحل:** تصميم أيقونة خاصة بعلامة صاد وحفظها في `/public`.

---

### 9. 🟢 UX — Google Analytics placeholder

**المشكلة:** معرّف GA4 هو `G-XXXXXXXXXX` — غير مفعّل.

**الحل:** استبداله بمعرّف حقيقي أو إزالة الكود.

---

### 10. 🟢 تحسين — عدم معالجة SQL Injection

**المشكلة:** `searchService.ts` يمرر الـ query مباشرة في ILIKE:
```typescript
.or(`trade_name.ilike.%${term}%,scientific_name.ilike.%${term}%`)
```

**الحل:** Supabase client يقوم بالـ escaping تلقائياً عبر PostgREST، لكن من الأفضل استخدام دالة RPC في PostgreSQL.

---

### 11. 🟢 تحسين — إزالة الملفات الزائدة

**المشكلة:** ملفات اختبارية (`test-supabase.js`, `test-supabase2.js`, `test-supabase3.js`, `update-locations.js`) وملفات SQL متعددة في المجلد الجذر.

**الحل:** نقلها إلى مجلد `scripts/` أو حذفها.

---

### 12. 🟢 تحسين — العملة ثابتة "ر.س"

**المشكلة:** العملة مكتوبة ثابتة كـ "ر.س" (ريال سعودي) مع أن التطبيق مخصص للعراق.

**الحل:** تغييرها إلى الدينار العراقي أو جعلها قابلة للتكوين.

---

## 🖥️ خطوات تشغيل المشروع محلياً مع Supabase

### الخطوة 1: إعداد Supabase
1. اذهب إلى [supabase.com](https://supabase.com) وسجّل الدخول
2. أنشئ مشروع جديد (أو استخدم المشروع الحالي)
3. من **Settings → API** انسخ:
   - `Project URL` → هذا هو `VITE_SUPABASE_URL`
   - `anon public key` → هذا هو `VITE_SUPABASE_ANON_KEY`

### الخطوة 2: إنشاء الجداول
1. اذهب إلى **SQL Editor** في Supabase Dashboard
2. انسخ والصق محتوى ملف [schema.sql](file:///c:/Users/Abdoonin/Desktop/nin/saad-(صاد)---pharmacy-locator%20(2)/schema.sql) ونفذه
3. ثم نفذ ملف [02_secure_schema.sql](file:///c:/Users/Abdoonin/Desktop/nin/saad-(صاد)---pharmacy-locator%20(2)/02_secure_schema.sql) إن وجد

### الخطوة 3: إعداد Supabase Auth
1. اذهب إلى **Authentication → Providers** في Dashboard
2. تأكد من تفعيل **Email** provider
3. أنشئ مستخدمين من **Authentication → Users** بنفس الإيميلات في `pharmacies` table
4. مهم: يجب أن يكون `id` المستخدم في Auth هو نفس `id` الصيدلية في الجدول

### الخطوة 4: إعداد ملف البيئة
أنشئ أو عدّل ملف `.env` في جذر المشروع:
```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
GEMINI_API_KEY=your_gemini_api_key_here
```

### الخطوة 5: التثبيت والتشغيل
```bash
# تثبيت الحزم
npm install

# تشغيل المشروع
npm run dev
```

المشروع سيعمل على `http://localhost:3000`

### الخطوة 6: اختبار الأساسيات
1. ✅ الصفحة الرئيسية تظهر بشكل صحيح
2. ✅ البحث عن دواء (مثال: Panadol) يعيد نتائج
3. ✅ تسجيل الدخول يعمل
4. ✅ لوحة التحكم تظهر المخزون
5. ✅ الخريطة تعمل

---

## 🚀 خطوات النشر على Vercel

### الخطوة 1: تجهيز المشروع
1. تأكد من وجود ملف `.gitignore` يحتوي على:
   ```
   node_modules
   dist
   .env
   .env.local
   ```
2. تأكد من أن المشروع يعمل محلياً بدون أخطاء:
   ```bash
   npm run build
   ```

### الخطوة 2: رفع المشروع على GitHub
```bash
# إنشاء مستودع جديد
git init
git add .
git commit -m "Initial commit - صاد pharmacy locator"

# ربط المستودع بـ GitHub (أنشئ repo فارغ أولاً على GitHub)
git remote add origin https://github.com/YOUR_USERNAME/saad-pharmacy-locator.git
git branch -M main
git push -u origin main
```

### الخطوة 3: ربط Vercel
1. اذهب إلى [vercel.com](https://vercel.com) وسجّل الدخول بحسابك على GitHub
2. اضغط **"Add New Project"**
3. اختر المستودع `saad-pharmacy-locator`
4. Vercel سيكتشف تلقائياً أنه مشروع Vite

### الخطوة 4: إضافة متغيرات البيئة
في صفحة الإعداد قبل النشر أو من **Settings → Environment Variables**:

| الاسم | القيمة |
|-------|--------|
| `VITE_SUPABASE_URL` | `https://YOUR_ID.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | مفتاح Supabase anon |
| `GEMINI_API_KEY` | مفتاحك من Google AI Studio |

> [!IMPORTANT]
> يجب أن تبدأ المتغيرات بـ `VITE_` ليتمكن Vite من حقنها في الكود. ما عدا `GEMINI_API_KEY` الذي يُحقن عبر `vite.config.ts`.

### الخطوة 5: إعدادات البناء
- **Framework Preset**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### الخطوة 6: النشر
اضغط **Deploy** وانتظر حتى ينتهي البناء. ستحصل على رابط مثل:
```
https://saad-pharmacy.vercel.app
```

### الخطوة 7: ربط دومين مخصص (اختياري)
1. من **Settings → Domains** في Vercel
2. أضف الدومين مثل `saad.iq`
3. عدّل DNS records حسب تعليمات Vercel

### الخطوة 8: تحديث Supabase
أضف رابط Vercel إلى قائمة **Site URL** و **Redirect URLs** في:
- **Authentication → URL Configuration**
  - Site URL: `https://your-app.vercel.app`
  - Redirect URLs: `https://your-app.vercel.app/**`

---

## ملخص الأولويات

| الأولوية | التحسين | الجهد |
|----------|---------|-------|
| 🔴 عاجل | إصلاح RLS policies | متوسط |
| 🔴 عاجل | إخفاء Gemini API Key | متوسط |
| 🟠 مهم | إزالة كلمات المرور النصية | منخفض |
| 🟡 موصى | React Router + تقسيم الكود | مرتفع |
| 🟡 موصى | Pagination للنتائج | متوسط |
| 🟢 تجميلي | أيقونات PWA حقيقية | منخفض |
| 🟢 تجميلي | تصحيح العملة | منخفض |
