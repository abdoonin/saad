export const extractMedicineNameFromImage = async (base64Image: string, mimeType: string): Promise<string> => {
  // استخدام مفتاح OCR.space الذي تم تحديده
  const apiKey = "K89533894688957";

  try {
    const formData = new FormData();
    // يجب دمج الصيغة (Mime Type) مع كود Base64 حتى يقرأه OCR.space
    formData.append("base64Image", `data:${mimeType};base64,${base64Image}`);
    // محرك رقم 2 من OCR ممتاز في استخراج النصوص اللاتينية والطبية
    formData.append("language", "eng");
    formData.append("OCREngine", "2");

    const response = await fetch("https://api.ocr.space/parse/image", {
      method: "POST",
      headers: {
        "apikey": apiKey,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    if (result.IsErroredOnProcessing) {
      throw new Error(result.ErrorMessage?.[0] || "حدث خطأ غير معروف في خادم الباركود والصور");
    }

    // استخراج النص من النتيجة
    if (result.ParsedResults && result.ParsedResults.length > 0) {
      const parsedText: string = result.ParsedResults[0].ParsedText || "";
      // نقوم بتنظيف النص ليحتوي على أهم الأقسام التي قد تكون اسم الدواء 
      // سنعيد أول سطر فيه نص كاسم دواء مقترح (بناءً على أن الروشتة ترتب الأدوية في أسطر)
      const cleanedText = parsedText.trim();
      const firstLines = cleanedText.split('\n').filter(line => line.trim().length > 2);
      
      if (firstLines.length > 0) {
        return firstLines[0].trim();
      }
      return cleanedText;
    }

    return "";
  } catch (error: any) {
    console.error("OCR Error:", error);
    const details = error.message || error.toString();
    throw new Error(`فشل في معالجة الصورة عبر OCR.space: ${details}`);
  }
};
