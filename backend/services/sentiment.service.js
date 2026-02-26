import AppError from "../utils/AppError.js";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

/**
 * Analyze sentiment and topic of a chat message using Groq API
 * @param {string} text
 * @returns {Object|null}
 */
export const analyzeSentiment = async (text) => {
    try {
        if (!text || typeof text !== "string") return null;

        const cleanedText = text.trim();
        if (cleanedText.length < 5) return null;

        const prompt = `Analyze the following city-related message and return ONLY a valid JSON object with no explanation, no markdown, no extra text.

          Message: "${cleanedText}"

          Return exactly this JSON structure:
          {
            "topic": one of ["traffic", "pollution", "weather", "safety", "other"],
            "score": a float between -1.0 (very negative) and 1.0 (very positive),
            "emotion": one of ["anger", "happy", "sad", "fear", "neutral"],
            "confidence": a float between 0.0 and 1.0
          }`;

        const response = await groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [
                {
                    role: "system",
                    content: "You are a sentiment analysis engine. You only respond with valid JSON. Never include markdown, code blocks, or explanations."
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            temperature: 0.1,  // low temperature = more consistent structured output
            max_tokens: 100    // sentiment JSON is small, no need for more
        });

        const rawContent = response.choices[0]?.message?.content?.trim();

        if (!rawContent) {
            throw new Error("Empty response from Groq");
        }

        // Strip any accidental markdown code fences just in case
        const cleaned = rawContent.replace(/```json|```/g, "").trim();
        const result = JSON.parse(cleaned);

        // Validate all required fields are present
        const validTopics = ["traffic", "pollution", "weather", "safety", "other"];
        const validEmotions = ["anger", "happy", "sad", "fear", "neutral"];

        const topic = validTopics.includes(result.topic) ? result.topic : "other";
        const emotion = validEmotions.includes(result.emotion) ? result.emotion : "neutral";
        const score = isFinite(result.score) ? Math.max(-1, Math.min(1, result.score)) : 0;
        const confidence = isFinite(result.confidence) ? Math.max(0, Math.min(1, result.confidence)) : 0.5;

        return { topic, score, emotion, confidence };

    } catch (error) {
        console.error("⚠️ Sentiment analysis failed:", error.message);

        // If Groq fails (rate limit, network, etc.), fall back to rule-based logic
        // so the app never crashes due to a sentiment failure
        // return fallbackSentiment(text);
    }
};

/**
 * Rule-based fallback if Groq API fails
 * Keeps the original logic as a safety net
 * @param {string} text
 * @returns {Object}
 */
// function fallbackSentiment(text) {
//     const t = text.trim().toLowerCase();

//     let topic = "other";
//     if (t.match(/traffic|jam|road|congestion|signal/)) topic = "traffic";
//     else if (t.match(/pollution|aqi|air|smog|smoke/)) topic = "pollution";
//     else if (t.match(/weather|rain|heat|cold|storm|temperature/)) topic = "weather";
//     else if (t.match(/crime|unsafe|robbery|accident|police/)) topic = "safety";

//     let score = 0;
//     let emotion = "neutral";
//     let confidence = 0.5; // lower confidence since this is a fallback

//     if (t.match(/bad|worst|worse|worsening|terrible|horrible|angry|hate/)) {
//         score = -0.7;
//         emotion = "anger";
//         confidence = 0.85;
//     } else if (t.match(/good|better|best|great|nice|happy|love|lovely|excellent/)) {
//         score = 0.7;
//         emotion = "happy";
//         confidence = 0.85;
//     }

//     return { topic, score, emotion, confidence };
// }