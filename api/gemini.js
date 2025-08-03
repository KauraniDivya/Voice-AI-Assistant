export default async function handler(req, res) {
  // Add CORS headers for preflight requests
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Debug logging
    console.log('Request method:', req.method);
    console.log('Request body:', req.body);
    console.log('Request headers:', req.headers);

    const { contents, apiKey } = req.body;
    
    if (!apiKey) {
      console.log('Missing API key');
      return res.status(400).json({ error: 'API key is required' });
    }

    if (!contents) {
      console.log('Missing contents');
      return res.status(400).json({ error: 'Contents are required' });
    }

    console.log('Making request to Gemini API...');
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ contents }),
      }
    );

    console.log('Gemini API response status:', response.status);

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Gemini API error:', response.status, errorData);
      return res.status(response.status).json({ 
        error: `Gemini API error: ${response.status}`,
        details: errorData
      });
    }

    const data = await response.json();
    console.log('Success! Returning data');
    res.status(200).json(data);
  } catch (error) {
    console.error('API error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
} 