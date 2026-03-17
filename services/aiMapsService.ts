import { GoogleGenAI } from "@google/genai";

export interface AIMapsResult {
  text: string;
  places: { title: string; uri: string }[];
}

export const findNearbyPharmaciesWithAI = async (query: string, lat?: number, lng?: number): Promise<AIMapsResult> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    let prompt = `أنا أبحث عن صيدليات قريبة قد يتوفر فيها دواء "${query}".
يرجى البحث في خرائط جوجل وتزويدي بقائمة بالصيدليات القريبة.

تعليمات هامة جداً لصياغة الرد:
1. ابدأ الرد برسالة تحذيرية ودية توضح أن: "⚠️ هذه الصيدليات المعروضة غير مشتركة في تطبيق صاد، ولذلك لا يمكننا التأكد من توفر الدواء لديها في الوقت الحالي. يرجى الاتصال بهم للتأكد قبل الذهاب."
2. اعرض قائمة الصيدليات بوضوح.
3. اختم الرد برسالة تشجيعية للمستخدم تقول فيها: "💡 مساهمتك تهمنا: عند زيارتك أو اتصالك بهذه الصيدليات، شاركهم تجربتك وأخبرهم عن (تطبيق صاد) ودعوتهم للاشتراك به، لنسهل عليك وعلى الجميع إيجاد الأدوية مستقبلاً!"`;
    
    const config: any = {
      tools: [{ googleMaps: {} }],
    };

    if (lat && lng) {
      config.toolConfig = {
        retrievalConfig: {
          latLng: {
            latitude: lat,
            longitude: lng
          }
        }
      };
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: config
    });

    let resultText = response.text || "";
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    
    const places: { title: string; uri: string }[] = [];
    
    chunks.forEach((chunk: any) => {
      if (chunk.maps?.uri && chunk.maps?.title) {
        places.push({
          title: chunk.maps.title,
          uri: chunk.maps.uri
        });
      }
    });

    return {
      text: resultText,
      places
    };
  } catch (error) {
    console.error("AI Maps Error:", error);
    throw new Error("فشل في البحث باستخدام الذكاء الاصطناعي");
  }
};
