export const barcodeDatabase: Record<string, { trade_name: string, scientific_name: string, price: number }> = {
  "6281086000109": { trade_name: "Panadol Extra", scientific_name: "Paracetamol 500mg, Caffeine 65mg", price: 15.5 },
  "6281086000208": { trade_name: "Fevadol 500mg", scientific_name: "Paracetamol 500mg", price: 8.0 },
  "6281086000307": { trade_name: "Brufen 400mg", scientific_name: "Ibuprofen 400mg", price: 12.0 },
  "6281086000406": { trade_name: "Amoxil 500mg", scientific_name: "Amoxicillin 500mg", price: 25.0 },
  "6281086000505": { trade_name: "Zyrtec 10mg", scientific_name: "Cetirizine 10mg", price: 18.5 },
  "6281086000604": { trade_name: "Augmentin 1g", scientific_name: "Amoxicillin 875mg, Clavulanic Acid 125mg", price: 65.0 },
  "6281086000703": { trade_name: "Nexium 40mg", scientific_name: "Esomeprazole 40mg", price: 85.0 },
  "6281086000802": { trade_name: "Lipitor 20mg", scientific_name: "Atorvastatin 20mg", price: 110.0 },
  "6281086000901": { trade_name: "Concor 5mg", scientific_name: "Bisoprolol 5mg", price: 35.0 },
  "6281086001007": { trade_name: "Glucophage 500mg", scientific_name: "Metformin 500mg", price: 20.0 },
  // Common test barcodes
  "1234567890128": { trade_name: "Test Medicine A", scientific_name: "Active Ingredient A", price: 10.0 },
  "987654321098": { trade_name: "Test Medicine B", scientific_name: "Active Ingredient B", price: 20.0 },
};

/**
 * هذه الدالة مهيأة للعمل مع API حقيقي (مثل هيئة الغذاء والدواء SFDA).
 * بمجرد حصولك على الرابط الرسمي، يمكنك استبدال الكود الداخلي.
 */
export const getMedicineByBarcode = async (barcode: string) => {
  try {
    // ---------------------------------------------------------
    // الكود المستقبلي للربط الحقيقي (Real API Integration):
    // ---------------------------------------------------------
    // const response = await fetch(`https://api.sfda.gov.sa/v1/drugs/barcode/${barcode}`, {
    //   method: 'GET',
    //   headers: {
    //     'Authorization': `Bearer ${process.env.SFDA_API_KEY}`,
    //     'Content-Type': 'application/json'
    //   }
    // });
    // if (!response.ok) throw new Error('Medicine not found');
    // const data = await response.json();
    // return {
    //   trade_name: data.tradeName,
    //   scientific_name: data.scientificName,
    //   price: data.publicPrice
    // };
    // ---------------------------------------------------------

    // محاكاة للاتصال بالخادم (تأخير زمني بسيط)
    await new Promise(resolve => setTimeout(resolve, 600));

    // إرجاع البيانات من القاعدة المؤقتة كبديل لحين توفر الـ API
    return barcodeDatabase[barcode] || null;
  } catch (error) {
    console.error("Error fetching barcode data:", error);
    return null;
  }
};

/**
 * دالة لحفظ الباركود الجديد في قاعدة البيانات ليتعلمه النظام (Build-as-you-go)
 */
export const saveMedicineBarcode = async (barcode: string, data: { trade_name: string, scientific_name: string, price: number }) => {
  try {
    // محاكاة للاتصال بالخادم
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // حفظ في الذاكرة المؤقتة (في الواقع سيتم حفظها في قاعدة البيانات الحقيقية مثل Supabase)
    barcodeDatabase[barcode] = data;
    console.log(`تم حفظ الباركود الجديد: ${barcode}`, data);
    return true;
  } catch (error) {
    console.error("Error saving new barcode:", error);
    return false;
  }
};
