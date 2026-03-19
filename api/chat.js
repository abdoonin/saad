export default async function handler(request, response) {
  // Allow cross-origin requests if needed
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle OPTIONS request for CORS preflight
  if (request.method === 'OPTIONS') {
    return response.status(200).end();
  }

  // Only allow POST methods for the chat
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method Not Allowed. Please use POST.' });
  }

  try {
    const { messages, model = "llama3-8b-8192" } = request.body;

    // Use the hidden GROQ_API_KEY from the Vercel internal environment
    const groqApiKey = process.env.GROQ_API_KEY;

    if (!groqApiKey) {
      return response.status(500).json({ error: 'مفتاح Groq غير متوفر في إعدادات السيرفر (GROQ_API_KEY).' });
    }

    // Call the actual Groq API securely from the backend
    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: messages, // Array of { role: "user" | "assistant", content: string }
        temperature: 0.7,
      }),
    });

    if (!groqResponse.ok) {
      const errorData = await groqResponse.text();
      throw new Error(`Groq API Error: ${groqResponse.status} - ${errorData}`);
    }

    const data = await groqResponse.json();
    return response.status(200).json(data);
    
  } catch (error) {
    console.error('Error in Groq API handler:', error);
    return response.status(500).json({ error: 'فشل في الاتصال بمزود الذكاء الاصطناعي', details: error.message });
  }
}
