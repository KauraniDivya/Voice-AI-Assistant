# Voice AI Companion

A React application that creates personalized AI voice companions using Gemini AI and ElevenLabs.

## Features

- 🎙️ Voice recognition using Web Speech API
- 🤖 AI responses via Google Gemini API
- 🔊 Text-to-speech via ElevenLabs (with browser fallback)
- 🎭 Multiple AI personalities (Detective, Therapist, Coach, Friend, Custom)
- 🎨 Modern, responsive UI

## Setup

1. **Clone the repository**
2. **Install dependencies**: `npm install`
3. **Get API Keys**:
   - [Gemini API Key](https://makersuite.google.com/app/apikey) (Required)
   - [ElevenLabs API Key](https://elevenlabs.io/api) (Optional)

## Development

### Local Development (Recommended)

The app runs on two servers for local development:
- **Frontend**: Vite dev server on port 5173
- **Backend**: Express API server on port 3001

```bash
# Start both servers
npm run dev

# Or start them separately
npm run server  # API server on port 3001
npm run client  # Vite dev server on port 5173
```

### Manual Setup

If the automatic setup doesn't work:

1. **Start API server** (Terminal 1):
   ```bash
   node server.js
   ```

2. **Start Vite dev server** (Terminal 2):
   ```bash
   npm run client
   ```

3. **Open browser**: http://localhost:5173

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Deploy - the API routes will be automatically detected

### Manual Deployment

```bash
npm run build
npm start  # Production server
```

## API Routes

The app includes serverless API routes for:

- `/api/gemini` - Handles Gemini AI requests
- `/api/elevenlabs/v1/text-to-speech/[voiceId]` - Handles ElevenLabs TTS

## Usage

1. Add your Gemini API key in the configuration panel
2. Choose an AI personality or create a custom one
3. Click the microphone button to start talking
4. The AI will respond both in text and voice

## Ports

- **Development**: 
  - Frontend: http://localhost:5173
  - API Server: http://localhost:3001
- **Production**: Single server on Vercel

## Technologies

- React 18
- Vite
- Express.js (local development)
- Tailwind CSS
- Web Speech API
- Google Gemini AI
- ElevenLabs TTS
- Vercel (deployment)
