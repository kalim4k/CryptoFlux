
import { GoogleGenAI } from "@google/genai";
import { MarketInsight } from "../types";

// Note: API key is now retrieved directly from process.env.API_KEY during client initialization per guidelines.

export const getMarketAnalysis = async (cryptoName: string): Promise<MarketInsight> => {
  // Always initialize with direct access to process.env.API_KEY as per named parameter requirement.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    const response = await ai.models.generateContent({
      // Using gemini-3-pro-preview for market analysis as it involves reasoning on complex financial data.
      model: 'gemini-3-pro-preview',
      contents: `Analyse le marché actuel pour ${cryptoName}. Donne un sentiment global (Bullish, Bearish ou Neutral) et un court paragraphe explicatif sur les tendances récentes. Réponds en français.`,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    // Directly access the text property as it is a getter, not a method.
    const text = response.text || "Analyse indisponible pour le moment.";
    const sentimentMatch = text.match(/Bullish|Bearish|Neutral/i);
    const sentiment = (sentimentMatch ? sentimentMatch[0] : 'Neutral') as any;
    
    // Extract search grounding sources if available from groundingChunks.
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((chunk: any) => ({
      title: chunk.web?.title || 'Source',
      uri: chunk.web?.uri || '#'
    })) || [];

    return {
      sentiment,
      analysis: text,
      sources
    };
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return {
      sentiment: 'Neutral',
      analysis: "L'analyse IA nécessite une clé API valide. Contactez l'administrateur.",
      sources: []
    };
  }
};
