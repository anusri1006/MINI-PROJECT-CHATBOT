import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

console.log("=== NVIDIA Diagnostics ===");
console.log("NVIDIA_API_KEY loaded:", !!process.env.NVIDIA_API_KEY);
console.log("NVIDIA_BASE_URL loaded:", !!process.env.NVIDIA_BASE_URL);
if (process.env.NVIDIA_BASE_URL) {
  console.log("NVIDIA_BASE_URL value:", process.env.NVIDIA_BASE_URL);
}

// Strip trailing quotes if present
const apiKey = process.env.NVIDIA_API_KEY;
const baseURL = process.env.NVIDIA_BASE_URL ? process.env.NVIDIA_BASE_URL.replace(/'$/, '') : undefined;

const openai = new OpenAI({
  apiKey: apiKey,
  baseURL: baseURL,
});

async function run() {
  console.log("\nSending direct test request to NVIDIA...");
  try {
    const completion = await openai.chat.completions.create({
      model: "openai/gpt-oss-20b",
      messages: [
        {
          role: "user",
          content: "Say hello in one short sentence."
        }
      ],
      temperature: 0.7,
      max_tokens: 100,
      stream: false
    });
    console.log("NVIDIA Response Received Successfully!");
    console.log("Reply:", completion.choices?.[0]?.message?.content);
  } catch (error) {
    console.error("NVIDIA AI ERROR");
    console.error("Status:", error?.status);
    console.error("Code:", error?.code);
    console.error("Message:", error?.message);
    console.error("Type:", error?.type);
  }
}

run();
