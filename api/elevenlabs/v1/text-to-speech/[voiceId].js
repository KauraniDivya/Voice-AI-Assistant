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
    const { voiceId } = req.query;
    const { text, model_id, voice_settings, apiKey } = req.body;

    console.log('ElevenLabs request:', { voiceId, hasText: !!text, hasApiKey: !!apiKey });

    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    if (!apiKey) {
      return res.status(400).json({ error: 'API key is required' });
    }

    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': apiKey,
      },
      body: JSON.stringify({
        text,
        model_id: model_id || 'eleven_monolingual_v1',
        voice_settings: voice_settings || {
          stability: 0.5,
          similarity_boost: 0.6,
          style: 0.8,
          use_speaker_boost: true
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('ElevenLabs API error:', response.status, errorData);
      return res.status(response.status).json({ 
        error: `ElevenLabs API error: ${response.status}`,
        details: errorData
      });
    }

    const audioBuffer = await response.arrayBuffer();
    
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Length', audioBuffer.byteLength);
    res.send(Buffer.from(audioBuffer));
  } catch (error) {
    console.error('ElevenLabs API error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
} 