import { GoogleGenAI, Type } from "@google/genai";
import { MOCK_PITCHES } from '../constants';
import { Pitch } from '../types';

const apiKey = process.env.API_KEY || ''; // In a real app, strict handling.
const ai = new GoogleGenAI({ apiKey });

/**
 * AI Concierge: Searches available pitches based on natural language query.
 */
export const searchPitchesAI = async (query: string): Promise<string[]> => {
  if (!apiKey) {
    console.warn("No API Key");
    return [];
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `
        You are a soccer pitch booking assistant. 
        I have a list of pitches with these details:
        ${JSON.stringify(MOCK_PITCHES.map(p => ({
          id: p.id,
          name: p.name,
          surface: p.surface,
          price: p.pricePerHour,
          amenities: p.amenities,
          size: p.size,
          location: p.location.address
        })))}

        The user is asking: "${query}"

        Return a JSON array of strings containing ONLY the IDs of the pitches that match the user's criteria. 
        If nothing matches perfectly, return the closest matches.
        Example Output: ["p1", "p3"]
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });

    const text = response.text;
    if (!text) return [];
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini Search Error", error);
    return [];
  }
};

/**
 * Chat Support Bot
 */
export const chatWithSupport = async (history: {role: string, parts: {text: string}[]}[], userMessage: string): Promise<string> => {
   if (!apiKey) return "I'm offline right now (No API Key).";

   try {
    // We construct a new chat for each request to keep it simple and stateless for this demo, 
    // but passing history allows context.
    const chat = ai.chats.create({
      model: 'gemini-3-flash-preview',
      history: history,
      config: {
        systemInstruction: `You are 'PitchBot', a helpful support agent for the PitchPerfect app. 
        You can help with booking questions, cancellations (simulated), and general soccer banter.
        Keep responses short, friendly, and mobile-optimized (under 50 words usually).
        Current User: Alex Sterling. 
        `
      }
    });

    const result = await chat.sendMessage({ message: userMessage });
    return result.text || "I didn't catch that.";
   } catch (error) {
     console.error("Chat Error", error);
     return "Sorry, I'm having trouble connecting to the locker room.";
   }
}

/**
 * Demand Forecasting (Simulated Analysis)
 */
export const getPriceAnalysis = async (pitch: Pitch, date: string): Promise<string> => {
  if (!apiKey) return "Standard Rate";

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analyze the price for pitch: ${pitch.name} on ${date}. 
      Factors: 
      - It is a ${pitch.surface} pitch.
      - Weather forecast: Rain (Simulated).
      - Historical data: High demand on evenings.
      
      Output a short 1 sentence reason why the price is what it is (e.g., "Price increased due to high evening demand" or "Discount applied for rain").`
    });
    return response.text || "Standard Rate";
  } catch (e) {
    return "Standard Rate";
  }
}