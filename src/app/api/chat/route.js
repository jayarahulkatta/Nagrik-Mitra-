import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// Load services knowledge base once at module level
const servicesPath = path.join(process.cwd(), "data", "services.json");
const servicesData = JSON.parse(fs.readFileSync(servicesPath, "utf-8"));
const servicesContext = JSON.stringify(servicesData, null, 2);

const SYSTEM_PROMPT = `You are Nagrik Mitra, a friendly, trustworthy AI assistant that helps Indian citizens
access government services, understand civic processes, and report public issues.

Rules:
1. Detect the language the user is writing in and respond in that same language.
2. Keep answers concise, practical, and in plain language — avoid bureaucratic jargon.
3. When asked about a government service, ONLY use the information provided in the
   knowledge base context below. Do not invent document requirements, fees, or portals.
   If the service isn't in the knowledge base, say so honestly and give general guidance
   on where a citizen could find out (e.g. "your local municipal office" or "the state
   government portal"), without inventing specific URLs or fees.
4. If the user is describing a public problem (pothole, garbage, broken streetlight,
   water leakage, etc.), recognize this as a complaint and extract: category, location,
   and a one-line summary. Respond confirming you're filing it and ask for missing
   details (like exact location) only if truly necessary.
5. Always end responses with 1-2 short, relevant suggested next actions.
6. Be warm and reassuring — many users may not be comfortable with government processes.
7. Never ask for sensitive personal identifiers like Aadhaar number, bank details, or OTPs.
8. Output format: respond ONLY in JSON (no markdown, no code fences, just raw JSON) with this exact shape so the frontend can render it:
{
  "intent": "service_info" | "file_complaint" | "document_help" | "general",
  "reply": "the natural language response to show the user",
  "suggestedActions": ["action 1", "action 2"],
  "complaintData": { "category": "", "location": "", "summary": "" }
}
- complaintData should be included ONLY if intent is "file_complaint", otherwise set it to null.
- For complaintData.category, use one of: "pothole", "garbage", "streetlight", "water", "electricity", "other"
- IMPORTANT: Output ONLY the JSON object. No markdown formatting, no code blocks, no backticks, no explanation outside the JSON.

Knowledge base context:
${servicesContext}`;

// Retry with exponential backoff for rate limiting
async function retryWithBackoff(fn, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      const isRateLimit = error?.status === 429 || error?.message?.includes("429") || error?.message?.includes("Resource has been exhausted");
      if (isRateLimit && i < maxRetries - 1) {
        const delay = (i + 1) * 5000; // 5s, 10s, 15s
        console.log(`Rate limited, retrying in ${delay / 1000}s (attempt ${i + 2}/${maxRetries})`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
}

export async function POST(request) {
  try {
    const { message, history } = await request.json();

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      systemInstruction: SYSTEM_PROMPT,
    });

    // Build chat history for context
    const chatHistory = (history || []).map((msg) => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.content }],
    }));

    const chat = model.startChat({
      history: chatHistory,
    });

    const result = await retryWithBackoff(() => chat.sendMessage(message));
    const responseText = result.response.text();

    // Try to parse the JSON response from Gemini
    let parsed;
    try {
      // Clean potential markdown code fences
      let cleaned = responseText.trim();
      if (cleaned.startsWith("```")) {
        cleaned = cleaned.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
      }
      parsed = JSON.parse(cleaned);
    } catch {
      // If parsing fails, wrap raw text as a general response
      parsed = {
        intent: "general",
        reply: responseText,
        suggestedActions: [],
        complaintData: null,
      };
    }

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      {
        intent: "general",
        reply: "I'm sorry, I'm having trouble processing your request right now. Please try again in a moment.",
        suggestedActions: ["Try again"],
        complaintData: null,
        error: true,
      },
      { status: 500 }
    );
  }
}
