import { GoogleGenAI } from "@google/genai";

export const extractMedicineNameFromImage = async (base64Image: string, mimeType: string): Promise<string> => {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    throw new Error("مفتاح Gemini API غير مُعرَّف. يرجى إضافة GEMINI_API_KEY في ملف .env");
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Image,
              mimeType: mimeType,
            },
          },
          {
            text: "Extract only the medicine name from this image. Return ONLY the medicine name, nothing else. If there are multiple words, return the most prominent one that looks like a brand or scientific name. If you cannot find any medicine name, return an empty string.",
          },
        ],
      },
    });

    return response.text?.trim() || "";
  } catch (error: any) {
    console.error("OCR Error:", error);
    if (error.message?.includes("API key")) {
      throw new Error("مفتاح API غير صالح. يرجى التحقق من GEMINI_API_KEY في ملف .env");
    }
    throw new Error("فشل في استخراج اسم الدواء من الصورة. تأكد من اتصالك بالإنترنت وصلاحية مفتاح API.");
  }
};
