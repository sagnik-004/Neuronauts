import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

export const getGeminiResponse = async (prompt, projectId, callback) => {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      generationConfig: {
        maxOutputTokens: 1000,
        temperature: 0.5,
      },
    });

    const fullPrompt = `As a Project Risk Management AI, analyze this query: "${prompt}"
    Project ID: ${projectId}
    Provide response in markdown format with:
    1. Risk identification
    2. Impact assessment
    3. Mitigation strategies
    4. Action items
    Keep response concise and focused.`;

    const result = await model.generateContentStream({
      contents: [{ role: "user", parts: [{ text: fullPrompt }] }],
    });

    for await (const chunk of result.stream) {
      const chunkText = await chunk.text();
      callback(chunkText);
    }
  } catch (error) {
    throw new Error("Failed to analyze risks. Please try again.");
  }
};