import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";

export interface EditorChatPayload {
  messages: Array<{ role: "user" | "ai"; content: string }>;
  documentTitle: string;
  documentContent: string;
  selectedText?: string;
  userName?: string;
}

export interface EditorChatResponse {
  message: string;
  proposedContent?: string;
  retryAttempt?: number;
  activeKeyMasked?: string;
}

class KeyRotator {
  private keys: string[] = [];
  private currentIndex: number = 0;

  constructor() {
    this.refreshKeys();
  }

  public refreshKeys() {
    const rawKeys = process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY || "";
    this.keys = rawKeys
      .split(",")
      .map((k) => k.trim())
      .filter((k) => k.length > 10 && !k.includes("your_gemini_api_key"));

    if (this.keys.length > 0) {
      console.log(`[KeyRotator] Loaded ${this.keys.length} Gemini API key(s) for auto-rotation.`);
    } else {
      console.warn("[KeyRotator] No valid Gemini API keys found in environment.");
    }
  }

  public getActiveKey(): string | null {
    if (this.keys.length === 0) return null;
    return this.keys[this.currentIndex % this.keys.length];
  }

  public getMaskedKey(): string {
    const active = this.getActiveKey();
    if (!active) return "Mock Offline Engine";
    return `${active.substring(0, 6)}...${active.substring(active.length - 4)}`;
  }

  public rotateToNextKey(): string | null {
    if (this.keys.length <= 1) return this.getActiveKey();
    this.currentIndex = (this.currentIndex + 1) % this.keys.length;
    console.warn(`[KeyRotator] Rate limit or error encountered! Switched to key #${this.currentIndex + 1} (${this.getMaskedKey()})`);
    return this.getActiveKey();
  }

  public totalKeys(): number {
    return this.keys.length;
  }
}

export class GeminiLangChainService {
  private keyRotator: KeyRotator;

  constructor() {
    this.keyRotator = new KeyRotator();
  }

  private getModel(apiKey: string): ChatGoogleGenerativeAI {
    return new ChatGoogleGenerativeAI({
      apiKey,
      model: "gemini-2.5-flash",
      temperature: 0.3,
      maxOutputTokens: 8192,
    });
  }

  /**
   * Process editor prompt with Exponential Backoff Retries & API Key Rotation
   * Handles 429 Rate Limits, 503 Overloaded, and Network Jitter automatically
   */
  async processEditorInstruction(payload: EditorChatPayload): Promise<EditorChatResponse> {
    const { messages, documentTitle, documentContent, selectedText, userName } = payload;
    const lastUserMessage = messages[messages.length - 1]?.content || "";

    const activeKey = this.keyRotator.getActiveKey();
    if (!activeKey) {
      return this.generateMockResponse(lastUserMessage, documentContent, selectedText);
    }

    const systemPrompt = `You are an expert AI Document Editor and Drafting Copilot embedded in a real-time rich-text word processor.
Author: ${userName || "Author"}
Document Title: "${documentTitle || "Untitled Document"}"
${selectedText ? `Currently Highlighted / Selected Text on Editor Canvas: "${selectedText}"` : "No text is currently highlighted."}

CURRENT DOCUMENT CONTENT (HTML):
"""
${documentContent || "<p><br></p>"}
"""

YOUR INSTRUCTIONS:
1. CASUAL CHAT & QUESTIONS: If the user is just asking a question, greeting, or discussing ideas without requesting document mutations, provide a clear, concise conversational answer in your "message" field. Do NOT provide "proposedContent".
2. DOCUMENT GENERATION / REWRITING / MUTATION: If the user asks to write, expand, fix grammar, summarize, format, or rewrite the document or highlighted selection:
   - Provide a helpful summary explanation in "message".
   - In "proposedContent", output the FULL revised HTML of the document with the requested edits applied accurately.
   - PRESERVE LENGTH & DETAIL: When editing, fixing grammar, rephrasing, or styling selected text, DO NOT aggressively compress, condense, or omit sections unless the user explicitly requested a summary. Retain the depth, vocabulary, and paragraph structure.
   - Maintain pristine semantic HTML tags: <h1>, <h2>, <h3>, <p>, <strong>, <em>, <ul>, <ol>, <li>, <blockquote>, <table>, <tr>, <td>, <th>.
   - Preserve all other unchanged paragraphs and headings in the document.

RESPONSE FORMAT (STRICT JSON ONLY):
Respond strictly with valid JSON with these two keys:
{
  "message": "Friendly explanation of what you did or answered",
  "proposedContent": "<p>Updated full HTML here...</p>" // omit or leave null if no document edit was performed
}`;

    const maxRetries = Math.max(3, this.keyRotator.totalKeys() * 2);
    let attempt = 0;
    let baseDelayMs = 1000; // 1s initial backoff

    while (attempt < maxRetries) {
      attempt++;
      const currentKey = this.keyRotator.getActiveKey();
      if (!currentKey) break;

      try {
        const model = this.getModel(currentKey);
        const response = await model.invoke([
          new SystemMessage(systemPrompt),
          new HumanMessage(lastUserMessage),
        ]);

        const rawText = typeof response.content === "string" ? response.content : JSON.stringify(response.content);
        const cleanJson = rawText.replace(/```json\s*/gi, "").replace(/```\s*$/gi, "").trim();
        const parsed = JSON.parse(cleanJson);

        return {
          message: parsed.message || "Updated your document based on your prompt.",
          proposedContent: parsed.proposedContent || undefined,
          retryAttempt: attempt > 1 ? attempt : undefined,
          activeKeyMasked: this.keyRotator.getMaskedKey(),
        };
      } catch (err: any) {
        const errMsg = err?.message || String(err);
        const isRateLimit = errMsg.includes("429") || errMsg.includes("RESOURCE_EXHAUSTED") || errMsg.includes("rate limit");
        const isOverloaded = errMsg.includes("503") || errMsg.includes("UNAVAILABLE") || errMsg.includes("overloaded");

        console.warn(`[Gemini Pipeline] Attempt ${attempt}/${maxRetries} failed with error: ${errMsg}`);

        if (attempt >= maxRetries) {
          throw new Error(`AI request failed after ${attempt} attempts with key rotation. Last error: ${errMsg}`);
        }

        // Rotate to another key immediately if rate-limited
        if (isRateLimit && this.keyRotator.totalKeys() > 1) {
          this.keyRotator.rotateToNextKey();
        }

        // Exponential backoff with jitter: delay = baseDelay * 2^(attempt-1) + random(0-500ms)
        const delay = baseDelayMs * Math.pow(2, attempt - 1) + Math.floor(Math.random() * 500);
        console.log(`[Gemini Pipeline] Waiting ${(delay / 1000).toFixed(1)}s (Exponential Backoff) before retrying...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    return {
      message: `Failed to complete generation after retrying across available API keys.`,
    };
  }

  private generateMockResponse(prompt: string, content: string, selectedText?: string): EditorChatResponse {
    const lower = prompt.toLowerCase();
    if (selectedText && (lower.includes("rewrite") || lower.includes("improve") || lower.includes("rephrase"))) {
      const improved = `<strong>[AI Enhanced]</strong> ${selectedText}`;
      const newContent = content.replace(selectedText, improved);
      return {
        message: `Rewrote the selected portion with improved tone and structure. Click "Accept Changes" to apply.`,
        proposedContent: newContent,
        activeKeyMasked: "Mock Offline Engine",
      };
    }

    if (lower.includes("generate") || lower.includes("draft") || lower.includes("write")) {
      const appended = `${content}<h2>AI Generated Section</h2><p>This section was synthesized by the AI Document Editor Copilot to expand your thoughts on <em>"${prompt}"</em>.</p><ul><li>Key takeaway 1: High context retention</li><li>Key takeaway 2: Bidirectional state synchronization</li></ul>`;
      return {
        message: `Drafted a new section for your document. Review the diff preview below.`,
        proposedContent: appended,
        activeKeyMasked: "Mock Offline Engine",
      };
    }

    return {
      message: `I am your AI Document Copilot. To enable live Gemini 3.1 Flash generation, add GEMINI_API_KEY (or comma-separated GEMINI_API_KEYS for rotation) in backend/.env. How can I help with "${prompt}"?`,
      activeKeyMasked: "Mock Offline Engine",
    };
  }
}

export const geminiLangChainService = new GeminiLangChainService();
