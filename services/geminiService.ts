import { GoogleGenAI, Type } from "@google/genai";
import { Question } from "../types";

export const generateQuizQuestion = async (): Promise<Question> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: "Génère une question de culture générale amusante pour une classe avec 4 options, dont 1 à 3 peuvent être correctes.",
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          text: { type: Type.STRING },
          options: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                text: { type: Type.STRING },
                isCorrect: { type: Type.BOOLEAN }
              },
              required: ["text", "isCorrect"]
            }
          }
        },
        required: ["text", "options"]
      }
    }
  });

  const text = response.text;
  if (!text) {
    throw new Error("No content generated from Gemini");
  }

  const data = JSON.parse(text.trim());
  const newId = Math.random().toString(36).substr(2, 9);
  
  // Wrap single generated question into the items array structure
  return {
    id: newId,
    items: [{
      id: newId,
      type: 'MULTIPLE_CHOICE',
      text: data.text,
      textInputCount: 1,
      options: data.options.map((o: any, i: number) => ({
        id: `opt-${i}`,
        ...o
      }))
    }]
  };
};