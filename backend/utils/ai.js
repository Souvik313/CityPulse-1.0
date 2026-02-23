import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export const generateAIReply = async (userMessage, cityContext = '') => {
  const completion = await groq.chat.completions.create({
    model: 'llama-3.1-8b-instant', // free and fast
    messages: [
      {
        role: 'system',
        content: `You are a helpful city assistant for ${cityContext}. 
                  Answer questions about the city, local services, events, 
                  and help residents with their concerns. Be concise and friendly.`
      },
      { role: 'user', content: userMessage }
    ],
    max_tokens: 200
  });

  return completion.choices[0].message.content;
};