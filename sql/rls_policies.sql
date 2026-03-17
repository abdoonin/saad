-- ============================================================
-- سياسات أمن صحيحة (RLS) لمشروع صاد
-- نفّذ هذا الملف في Supabase SQL Editor
-- ============================================================

-- أولاً: إزالة جميع السياسات الحالية المفتوحة
DROP POLICY IF EXISTS "Enable all access for all users v3" ON pharmacies;
DROP POLICY IF EXISTS "Enable all access for all users v3" ON medicines;
DROP POLICY IF EXISTS "Enable all access for all users v3" ON inventory;
DROP POLICY IF EXISTS "Enable all access for all users v3" ON search_logs;
DROP POLICY IF EXISTS "Enable all access for all users v3" ON sales_logs;

-- ============================================================
-- 1. جدول الصيدليات (pharmacies)
-- ============================================================
-- القراءة: متاحة للجميع (الزوار يبحثون عن صيدليات)
CREATE POLICY "pharmacies_select_all" ON pharmacies
  FOR SELECT USING (true);

-- التعديل: فقط المالك يستطيع تعديل بيانات صيدليته
CREATE POLICY "pharmacies_update_own" ON pharmacies
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- الإدراج: فقط المستخدمين المصادق عليهم (للتسجيل)
CREATE POLICY "pharmacies_insert_auth" ON pharmacies
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- الحذف: فقط الأدمن (يتم من خلال service_role key على الخادم)
CREATE POLICY "pharmacies_delete_admin" ON pharmacies
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM pharmacies WHERE id = auth.uid() AND is_admin = true)
  );

-- ============================================================
-- 2. جدول الأدوية (medicines)
-- ============================================================
-- القراءة: متاحة للجميع
CREATE POLICY "medicines_select_all" ON medicines
  FOR SELECT USING (true);

-- الإدراج والتعديل: فقط المستخدمين المصادق عليهم
CREATE POLICY "medicines_insert_auth" ON medicines
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "medicines_update_auth" ON medicines
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- الحذف: فقط الأدمن
CREATE POLICY "medicines_delete_admin" ON medicines
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM pharmacies WHERE id = auth.uid() AND is_admin = true)
  );

-- ============================================================
-- 3. جدول المخزون (inventory)
-- ============================================================
-- القراءة: متاحة للجميع (الزوار يبحثون عن أدوية)
CREATE POLICY "inventory_select_all" ON inventory
  FOR SELECT USING (true);

-- الإدراج: فقط صاحب الصيدلية
CREATE POLICY "inventory_insert_own" ON inventory
  FOR INSERT WITH CHECK (pharmacy_id = auth.uid());

-- التعديل: فقط صاحب الصيدلية
CREATE POLICY "inventory_update_own" ON inventory
  FOR UPDATE USING (pharmacy_id = auth.uid());

-- الحذف: فقط صاحب الصيدلية
CREATE POLICY "inventory_delete_own" ON inventory
  FOR DELETE USING (pharmacy_id = auth.uid());

-- ============================================================
-- 4. جدول سجلات البحث (search_logs)
-- ============================================================
-- الإدراج: متاح للجميع (بما في ذلك الزوار المجهولين)
CREATE POLICY "search_logs_insert_all" ON search_logs
  FOR INSERT WITH CHECK (true);

-- القراءة: فقط المستخدمين المصادق عليهم
CREATE POLICY "search_logs_select_auth" ON search_logs
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- ============================================================
-- 5. جدول سجلات المبيعات (sales_logs)
-- ============================================================
-- الإدراج: فقط صاحب الصيدلية
CREATE POLICY "sales_logs_insert_own" ON sales_logs
  FOR INSERT WITH CHECK (pharmacy_id = auth.uid());

-- القراءة: فقط صاحب الصيدلية
CREATE POLICY "sales_logs_select_own" ON sales_logs
  FOR SELECT USING (pharmacy_id = auth.uid());

-- ============================================================
-- 6. إزالة عمود كلمة المرور النصية (أمني)
-- ============================================================
-- بعد التأكد من أن جميع الحسابات تم ترحيلها إلى Supabase Auth:
-- ALTER TABLE pharmacies DROP COLUMN IF EXISTS password;
-- (أزل التعليق وشغّل الأمر عندما تكون جاهزاً)
