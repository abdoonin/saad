import React from 'react';
import { ShieldAlert, FileText, Lock } from 'lucide-react';

export const TermsPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-12 animate-in fade-in duration-500">
      <h1 className="text-3xl font-extrabold text-gray-900 mb-8 text-center">الشروط والأحكام وسياسة الخصوصية</h1>
      
      <div className="space-y-10">
        {/* Medical Disclaimer */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-red-50 rounded-lg text-red-600">
              <ShieldAlert size={24} />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">إخلاء المسؤولية الطبية</h2>
          </div>
          <div className="bg-red-50/50 border border-red-100 rounded-xl p-6 text-gray-700 leading-relaxed">
            <p className="mb-4">
              <strong>تطبيق "صاد" هو مجرد وسيط تقني (دليل)</strong> يهدف إلى تسهيل عملية البحث عن الأدوية في الصيدليات القريبة منك. 
            </p>
            <ul className="list-disc list-inside space-y-2 marker:text-red-400">
              <li>نحن لا نقوم بوصف الأدوية أو تقديم أي استشارات طبية.</li>
              <li>المعلومات المتوفرة في التطبيق لا تغني بأي شكل من الأشكال عن استشارة الطبيب المختص أو الصيدلي.</li>
              <li>يجب دائماً قراءة النشرة الداخلية للدواء واستشارة الصيدلي قبل تناول أي دواء.</li>
              <li>التطبيق غير مسؤول عن أي مضاعفات أو أضرار تنتج عن الاستخدام الخاطئ للأدوية.</li>
            </ul>
          </div>
        </section>

        {/* Terms of Use */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-primary-50 rounded-lg text-primary-600">
              <FileText size={24} />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">شروط الاستخدام</h2>
          </div>
          <div className="text-gray-600 leading-relaxed space-y-4">
            <p>
              باستخدامك لتطبيق "صاد"، فإنك توافق على الشروط التالية:
            </p>
            <ul className="list-disc list-inside space-y-2">
              <li>تُستخدم المعلومات المتوفرة في التطبيق لأغراض البحث الشخصي فقط.</li>
              <li>يُمنع استخدام التطبيق لأي أغراض تجارية غير مصرح بها أو استخراج البيانات (Data Scraping) بأي شكل.</li>
              <li>الصيدليات المشتركة هي المسؤولة عن دقة وتحديث بيانات الأدوية وأسعارها وتوفرها.</li>
              <li>نحتفظ بالحق في تعديل أو إيقاف الخدمة في أي وقت دون إشعار مسبق.</li>
            </ul>
          </div>
        </section>

        {/* Privacy Policy */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-green-50 rounded-lg text-green-600">
              <Lock size={24} />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">سياسة الخصوصية</h2>
          </div>
          <div className="text-gray-600 leading-relaxed space-y-4">
            <p>
              نحن نهتم بخصوصيتك ونلتزم بحماية بياناتك الشخصية:
            </p>
            <ul className="list-disc list-inside space-y-2">
              <li><strong>الموقع الجغرافي:</strong> نطلب صلاحية الوصول إلى موقعك الجغرافي فقط لعرض الصيدليات الأقرب إليك، ولا نقوم بتخزين موقعك الدقيق في خوادمنا.</li>
              <li><strong>بيانات البحث:</strong> نقوم بجمع بيانات مجهولة المصدر (Anonymous Data) حول الأدوية الأكثر بحثاً لتحسين الخدمة وتوفير إحصائيات عامة، دون ربطها بهويتك الشخصية.</li>
              <li><strong>تحليلات جوجل (Google Analytics):</strong> نستخدم أدوات التحليل لفهم كيفية استخدام التطبيق وتحسين تجربة المستخدم.</li>
              <li>لا نقوم ببيع أو مشاركة بياناتك الشخصية مع أي أطراف ثالثة لأغراض تسويقية.</li>
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
};
