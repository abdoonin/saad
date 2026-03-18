export interface AIMapsResult {
  text: string;
  places: { title: string; uri: string }[];
}

export const findNearbyPharmaciesWithAI = async (query: string, lat?: number, lng?: number): Promise<AIMapsResult> => {
  try {
    if (!lat || !lng) {
      return {
        text: "عذراً، يرجى تفعيل الموقع (GPS) لنتمكن من البحث عن الصيدليات المجاورة لك بدقة.",
        places: []
      };
    }

    // استخراج الصيدليات قريبة (في دائرة 5000 متر = 5 كيلومتر) بحد أقصى 5 صيدليات
    const overpassQuery = `
      [out:json];
      node["amenity"="pharmacy"](around:5000, ${lat}, ${lng});
      out 5;
    `;
    
    // استخدام الخرائط المفتوحة المصدر كبديل مجاني قوي
    const response = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(overpassQuery)}`);
    
    if (!response.ok) {
      throw new Error(`Overpass HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const places: { title: string; uri: string }[] = [];

    if (data.elements && data.elements.length > 0) {
      data.elements.forEach((pharmacy: any) => {
        // استخراج أفضل اسم متاح أو إعطاء اسم مبسط 
        const name = pharmacy.tags?.['name:ar'] || pharmacy.tags?.name || pharmacy.tags?.['name:en'] || "صيدلية محلية (بدون اسم)";
        
        // رابط يفتح الخريطة على إحداثيات الصيدلية في خرائط جوجل مباشرة
        const uri = `https://www.google.com/maps/search/?api=1&query=${pharmacy.lat},${pharmacy.lon}`;
        
        places.push({
          title: name,
          uri: uri
        });
      });
    }

    let resultText = `لقد قمنا بالبحث عن الدواء المطلوب "**${query}**"، وإليك أقرب الصيدليات لموقعك في نطاق 5 كيلومتر:
    
⚠️ **تنبيه هام:** هذه الصيدليات المعروضة هنا غير مشتركة في بيانات تطبيق صاد حالياً. لذلك *لا يمكننا التأكيد بشكل قطعي* من توفر الدواء لديها في هذا الوقت. يرجى الاتصال بهم أو زيارتهم للتحقق.

💡 **مساهمتك تهمنا:** عندما تزور هذه الصيدليات، أخبرهم عن (تطبيق صاد) واقترح عليهم الاشتراك به حتى يسهل للجميع العثور على الأدوية بسرعة في الفترات القادمة!`;

    if (places.length === 0) {
      resultText = `عذراً، بحثنا عن دواء "**${query}**"، ولم نعثر على سجلات لصيدليات قريبة جداً من موقعك الحالي (ضمن مسافة 5 كيلومتر) في الخرائط المفتوحة.\n\n⚠️ يرجى توسيع نطاق بحثك أو التجول في المنطقة للبحث. ولا تنسَ إخبار الصيدليات التي تجدها بالاشتراك بتطبيق صاد!`;
    }

    return {
      text: resultText,
      places
    };
  } catch (error) {
    console.error("Maps Search Error (Overpass):", error);
    throw new Error("فشل في البحث عن الصيدليات عبر نظام الخرائط المفتوحة");
  }
};
