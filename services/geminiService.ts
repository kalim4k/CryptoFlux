
import { GoogleGenAI } from "@google/genai";
import { MarketInsight } from "../types";

/**
 * Get market analysis from Gemini using Google Search grounding.
 * Strictly follows @google/genai SDK guidelines.
 */
export const getMarketAnalysis = async (cryptoName: string): Promise<MarketInsight> => {
  // Always use process.env.API_KEY directly for initialization
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analyse le marché actuel pour ${cryptoName}. Donne un sentiment global (Bullish, Bearish ou Neutral) et un court paragraphe explicatif sur les tendances récentes. Réponds en français.`,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    // Access .text property directly as per guidelines (it is a property, not a method)
    const text = response.text || "Analyse indisponible pour le moment.";
    const sentimentMatch = text.match(/Bullish|Bearish|Neutral/i);
    const sentiment = (sentimentMatch ? sentimentMatch[0] : 'Neutral') as any;
    
    // Extract search grounding URLs if available from groundingChunks
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
