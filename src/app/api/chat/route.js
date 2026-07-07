import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// Load services knowledge base once at module level
const servicesPath = path.join(process.cwd(), "data", "services.json");
const servicesData = JSON.parse(fs.readFileSync(servicesPath, "utf-8"));
const servicesContext = JSON.stringify(servicesData, null, 2);

// In-memory response cache for the session
const responseCache = new Map();

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

// Retry with exponential backoff and jitter for rate limiting
async function retryWithBackoff(fn, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      const isRateLimit = error?.status === 429 || error?.message?.includes("429") || error?.message?.includes("Resource has been exhausted");
      if (isRateLimit && i < maxRetries - 1) {
        const jitter = Math.floor(Math.random() * 1000); // 0 to 1000ms jitter
        const delay = Math.pow(2, i) * 1000 + jitter; // (2^attempt * 1000ms) + random jitter
        console.log(`Rate limited, retrying in ${delay}ms (attempt ${i + 2}/${maxRetries})`);
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

    const query = message.toLowerCase().trim();

    // 1. In-memory response cache
    if (responseCache.has(query)) {
      return NextResponse.json(responseCache.get(query));
    }

    // 2. Local knowledge-base shortcut
    let matchedService = null;
    for (const service of servicesData) {
      // Create a clean version of the service name for matching (e.g. "Aadhaar Card")
      const cleanName = service.serviceName.toLowerCase().split('(')[0].trim();
      if (query.includes(cleanName)) {
        matchedService = service;
        break;
      }
    }

    if (matchedService) {
      const reply = `**${matchedService.serviceName}**\n\n${matchedService.description}\n\n**Required Documents:**\n• ${matchedService.requiredDocuments.join('\n• ')}\n\n**Steps:**\n1. ${matchedService.steps.join('\n2. ')}\n\n**Where to apply:** ${matchedService.whereToApply}\n**Estimated Time:** ${matchedService.estimatedTime}\n**Fees:** ${matchedService.fees}`;

      const parsed = {
        intent: "service_info",
        reply: reply,
        suggestedActions: ["File a complaint", "Ask another question"],
        complaintData: null
      };
      
      responseCache.set(query, parsed);
      return NextResponse.json(parsed);
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
      if (cleaned.startsWith("\`\`\`")) {
        cleaned = cleaned.replace(/^\`\`\`(?:json)?\n?/, "").replace(/\n?\`\`\`$/, "");
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

    // Cache the successful Gemini response
    responseCache.set(query, parsed);

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("Chat API error:", error);
    // 3. Graceful fallback message instead of raw 429
    return NextResponse.json(
      {
        intent: "general",
        reply: "Nagrik Mitra is a little busy right now — please try again in a few seconds.",
        suggestedActions: ["Try again"],
        complaintData: null,
      },
      { status: 200 } // Return 200 so UI degrades gracefully
    );
  }
}
