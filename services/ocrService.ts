import { GoogleGenAI } from "@google/genai";

export const extractMedicineNameFromImage = async (base64Image: string, mimeType: string): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
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
  } catch (error) {
    console.error("OCR Error:", error);
    throw new Error("فشل في استخراج اسم الدواء من الصورة");
  }
};
