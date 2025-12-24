import { GoogleGenAI, Chat, Type } from "@google/genai";
import { StockReportData } from "../types";

const SYSTEM_INSTRUCTION = `
You are OverUnder, an expert senior financial analyst AI. Your goal is to help users determine if a stock is Undervalued, Overvalued, or Fairly Valued based on fundamental analysis.

**Process:**
1. **Identify the Stock:** If the user hasn't specified a stock, ask for it politely.
2. **Gather Data (Use Google Search):** When a stock is identified, you MUST use the 'googleSearch' tool to find the most recent real-time data for:
   - Current Price
   - P/E Ratio (and compare to Industry Average)
   - PEG Ratio (Under 1.0 is undervalued)
   - P/B Ratio (Under 1.0 is often undervalued)
   - P/S Ratio (Compare to historical or peers)
   - Dividend Yield (Compare to 5-year average)
   - Any recent news affecting valuation.
3. **Analyze:** Synthesize this data to form a valuation opinion.
4. **Output Format:**
   - If you are still gathering info or chatting, reply with normal text.
   - If you have performed an analysis, you MUST return the response in a specific JSON format wrapped in a code block labeled 'json_report'. Do not just output Markdown tables.
   - The JSON structure must match this schema:
     {
       "symbol": "AAPL",
       "companyName": "Apple Inc.",
       "currentPrice": "$150.00",
       "recommendation": "Buy",
       "valuationStatus": "Undervalued",
       "confidenceScore": 85,
       "summary": "Start with a brief introduction of the company, its core business/products, and market position. Then provide the executive summary of the valuation analysis...",
       "metrics": [
         {
           "label": "P/E Ratio",
           "value": "25.4",
           "benchmark": "Industry Avg 28.0",
           "signal": "undervalued",
           "explanation": "Lower than industry peer average."
         },
         ... other metrics
       ],
       "riskFactors": ["Supply chain issues", "High interest rates"]
     }

**Important Rules:**
- Be conservative and objective.
- Always explain *why* a metric suggests under/overvaluation.
- If data is missing (e.g., P/E for unprofitable companies), note it but continue analysis with available metrics (like P/S).
- The 'signal' field in metrics must be exactly 'undervalued', 'overvalued', or 'neutral'.
- 'confidenceScore' should be an integer between 0 and 100 representing how consistent the indicators are.
`;

let chatSession: Chat | null = null;
let genAI: GoogleGenAI | null = null;

export const initializeGenAI = () => {
  if (!process.env.API_KEY) {
    console.error("API_KEY is missing from environment variables.");
    return;
  }
  genAI = new GoogleGenAI({ apiKey: process.env.API_KEY });
  chatSession = genAI.chats.create({
    model: 'gemini-3-flash-preview',
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      tools: [{ googleSearch: {} }],
      temperature: 0.4, // Lower temperature for more analytical responses
    },
  });
};

export const sendMessageToGemini = async (
  message: string
): Promise<{ text: string; reportData?: StockReportData; groundingUrls: Array<{ title: string; uri: string }> }> => {
  if (!chatSession) {
    initializeGenAI();
  }

  if (!chatSession) {
    throw new Error("Failed to initialize Gemini session.");
  }

  try {
    const result = await chatSession.sendMessage({ message });
    
    // The response text might contain the JSON block or just text
    const responseText = result.text || "I couldn't generate a response. Please try again.";
    
    // Extract Grounding Metadata
    const groundingUrls: Array<{ title: string; uri: string }> = [];
    const chunks = result.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (chunks) {
      chunks.forEach((chunk: any) => {
        if (chunk.web?.uri && chunk.web?.title) {
          groundingUrls.push({ title: chunk.web.title, uri: chunk.web.uri });
        }
      });
    }

    // Attempt to parse JSON report if present
    const jsonMatch = responseText.match(/```json_report\s*([\s\S]*?)\s*```/);
    let reportData: StockReportData | undefined;
    let cleanText = responseText;

    if (jsonMatch && jsonMatch[1]) {
      try {
        reportData = JSON.parse(jsonMatch[1]);
        // Remove the JSON block from the displayed text to keep it clean, 
        // or keep a brief intro if needed. Ideally, the report component replaces the text body for that part.
        cleanText = responseText.replace(/```json_report[\s\S]*?```/, '').trim();
        if (!cleanText) {
          cleanText = "Here is the valuation report based on the latest market data.";
        }
      } catch (e) {
        console.error("Failed to parse stock report JSON", e);
      }
    }

    return {
      text: cleanText,
      reportData,
      groundingUrls
    };

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};