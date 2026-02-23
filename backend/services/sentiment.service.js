import AppError from "../utils/AppError.js";

/**
 * Analyze sentiment and topic of a chat message
 * This is ML-inference logic (API-based or rule-based)
 *
 * @param {string} text
 * @returns {Object|null}
 */
export const analyzeSentiment = async (text) => {
  try {
    if (!text || typeof text !== "string") {
      return null;
    }

    const cleanedText = text.trim().toLowerCase();

    if (cleanedText.length < 5) {
      return null;
    }

    /**
     * ------------------------------------------------
     * BASIC ML LOGIC (Rule + ML-Ready Hybrid)
     * ------------------------------------------------
     * You can replace this with:
     * - OpenAI API
     * - HuggingFace
     * - Google NLP
     */

    // 🔹 Topic detection (simple but effective)
    let topic = "other";

    if (cleanedText.match(/traffic|jam|road|congestion|signal/)) {
      topic = "traffic";
    } else if (cleanedText.match(/pollution|aqi|air|smog|smoke/)) {
      topic = "pollution";
    } else if (cleanedText.match(/weather|rain|heat|cold|storm|temperature/)) {
      topic = "weather";
    } else if (cleanedText.match(/crime|unsafe|robbery|accident|police/)) {
      topic = "safety";
    }

    // 🔹 Sentiment scoring (placeholder ML logic)
    let score = 0;
    let emotion = "neutral";
    let confidence = 0.6;

    if (cleanedText.match(/bad|worst|terrible|horrible|angry|hate/)) {
      score = -0.7;
      emotion = "anger";
      confidence = 0.85;
    } else if (cleanedText.match(/good|great|nice|happy|love|excellent/)) {
      score = 0.7;
      emotion = "happy";
      confidence = 0.85;
    }

    return {
      topic,
      score,
      emotion,
      confidence
    };
  } catch (error) {
    // ML failure should NEVER crash the app
    console.error("⚠️ Sentiment analysis failed:", error.message);
    throw new AppError("Sentiment analysis service failed", 500);
  }
};
