import { GoogleGenerativeAI } from "@google/generative-ai";
import "dotenv/config";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export const generateMeetingMinutes = async (transcript) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    
    const prompt = `
You are a professional meeting assistant. Analyze this meeting transcript and create structured meeting minutes.

Transcript:
${transcript}

Please provide:
1. A brief summary (2-3 sentences)
2. Key discussion points (bullet points)
3. Decisions made (if any)
4. Action items with who should do what (if mentioned)

Format your response as JSON:
{
  "summary": "Brief summary here",
  "keyPoints": ["point 1", "point 2"],
  "decisions": ["decision 1", "decision 2"],
  "actionItems": [
    {
      "task": "task description",
      "assignedTo": "person name or 'Not specified'"
    }
  ]
}
`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    
    console.log("Raw AI response:", text);
    
    // Parse JSON response - handle markdown code blocks
    let jsonText = text;
    jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    
    const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    throw new Error("Could not parse AI response");
  } catch (error) {
    console.error("Error generating meeting minutes:", error);
    throw error;
  }
};