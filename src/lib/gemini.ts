import { GoogleGenAI, Type } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Estimate Calories from normal text
export async function extractMealInfo(text: string) {
  const prompt = `Analyze this Algerian meal description and estimate nutritional content: "${text}".
Consider Algerian foods like Loubia, Kesra, Rechta, Tlitli, Deglet Nour, Lben, Chorba, Couscous, etc.
Provide realistic estimates. Write the summary in Arabic (Darija/MSA).`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          calories: { type: Type.NUMBER, description: "Estimated total calories" },
          protein: { type: Type.NUMBER, description: "Estimated protein in grams" },
          carbs: { type: Type.NUMBER, description: "Estimated carbohydrates in grams" },
          fats: { type: Type.NUMBER, description: "Estimated fats in grams" },
          summary: { type: Type.STRING, description: "Brief description of the meal in Arabic (Darija/MSA)" }
        },
        required: ["calories", "protein", "carbs", "fats", "summary"]
      }
    }
  });

  return JSON.parse(response.text.trim());
}

// Generate Meal Plan based on stats
export async function generateMealPlan(stats: any, events: any[], directives: string = "") {
  let prompt = `You are an expert sports nutritionist for Algerian athletes.\n`;
  prompt += `Athlete Stats: Age ${stats.age}, Weight ${stats.weight}kg, Height ${stats.height}cm, Goals: ${stats.goals}, Allergies: ${stats.allergies || 'None'}\n`;
  prompt += `Upcoming Training Load:\n${JSON.stringify(events)}\n`;
  if (directives) {
    prompt += `Nutritionist Directives: ${directives}\n`;
  }
  prompt += `
Generate a 1-day meal plan to align with tomorrow's training load.
Prioritize Algerian foods (e.g., Dates/Deglet Nour and Lben for pre-workout quick carbs, lean meats with Chorba/Couscous for recovery, balanced Rechta/Tlitli for carb loading).
The meal plan MUST be written entirely in Algerian Arabic (Darija) or Modern Standard Arabic.
Return the plan formatted with beautiful Markdown. Use nice Markdown headings (###), bullet points, and emojis.
Include these sections if applicable:
### 🍳 فطور الصباح (Breakfast)
### 🥪 وجبة خفيفة (Snack)
### 🍲 الغداء (Lunch)
### ⚡ قبل التدريب (Pre-Workout)
### 🔄 بعد التدريب (Post-Workout)
### 🍽️ العشاء (Dinner)

For each meal, use list items with exact portions and estimated macros (Calories/Protein/Carbs/Fats).
IMPORTANT: Output only the markdown string, no extra conversational text.
`;

  const response = await ai.models.generateContent({
    model: 'gemini-3.1-pro-preview',
    contents: prompt,
  });

  return response.text.trim();
}
