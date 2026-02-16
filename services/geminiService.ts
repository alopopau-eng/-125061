
import { GoogleGenAI } from "@google/genai";
import { VisitorDoc } from "../types";

export const generateVisitorInsights = async (visitors: VisitorDoc[]): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  
  // Prepare a concise summary of the data for the model
  const dataSummary = visitors.map(v => ({
    id: v.id,
    status: v.online ? 'Online' : 'Offline',
    hasCard: !!v.number,
    hasOtp: !!v.lastOtp,
    location: `${v.city || 'Unknown'}, ${v.area || ''}`,
    page: v.currentPage
  }));

  const prompt = `Analyze this live visitor data for a web dashboard. 
  Total visitors: ${visitors.length}. 
  Data: ${JSON.stringify(dataSummary)}
  
  Provide a professional, concise analysis in Arabic. 
  Focus on:
  1. Conversion health (how many added cards vs entered OTP).
  2. Geographical hotspots.
  3. Actionable alerts (e.g., users stuck on specific pages).
  Keep it under 150 words.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "عذراً، تعذر الحصول على تحليل في الوقت الحالي.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "حدث خطأ أثناء الاتصال بذكاء Gemini الاصطناعي.";
  }
};
