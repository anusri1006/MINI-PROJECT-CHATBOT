import OpenAI from "openai";

let openaiClient = null;

/**
 * Lazily initializes and caches the OpenAI client instance.
 * This prevents ESM import hoisting from loading placeholders before dotenv.config() runs.
 */
function getOpenAIClient() {
  if (!openaiClient) {
    const apiKey = process.env.NVIDIA_API_KEY || "placeholder-key-for-bootstrapping";
    // Strips any trailing single quotes from the URL (e.g. from env configs)
    const baseURL = (process.env.NVIDIA_BASE_URL || "https://integrate.api.nvidia.com/v1").replace(/'$/, '');
    
    openaiClient = new OpenAI({
      apiKey,
      baseURL
    });
  }
  return openaiClient;
}

export async function askNvidiaAI(messages) {
  const openai = getOpenAIClient();
  try {
    console.log("CALLING NVIDIA");
    const completion = await openai.chat.completions.create({
      model: "openai/gpt-oss-20b",
      messages,
      temperature: 0.7,
      top_p: 1,
      max_tokens: 4096,
      stream: false,
    });
    console.log("NVIDIA RESPONSE RECEIVED");

    const message = completion.choices?.[0]?.message;

    return {
      content: message?.content || "",
      reasoning: message?.reasoning_content || null,
    };
  } catch (error) {
    console.error("NVIDIA AI ERROR");
    console.error("Status:", error?.status);
    console.error("Code:", error?.code);
    console.error("Message:", error?.message);
    console.error("Type:", error?.type);
    throw error;
  }
}
