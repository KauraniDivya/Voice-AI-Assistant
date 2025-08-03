// App.jsx
import React, { useState, useRef, useEffect } from 'react';
import { 
  Mic, 
  MicOff, 
  Settings, 
  ExternalLink,
  Volume2,
  User,
  Key,
  Bot,
  ChevronDown,
  Play,
  Square
} from 'lucide-react';

const VoiceAICompanion = () => {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [conversation, setConversation] = useState([]);
  const [config, setConfig] = useState({
    geminiApiKey: '',
    elevenLabsApiKey: '',
    voiceId: 'pqHfZKP75CvOlQylNhV4',
    companionType: 'detective',
    customPrompt: '',
    companionName: 'Detective Mr. X'
  });
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  const recognitionRef = useRef(null);
  const audioRef = useRef(null);

  const companionPresets = {
    detective: {
      name: 'Detective Mr. X',
      description: 'Analytical problem solver with wit',
      prompt: 'You are Detective Mr. X, a witty and charming AI detective. You solve problems with sharp logic, clever humor, and friendly banter. Always be helpful, engaging, and add a touch of playful mystery to your responses. Keep responses under 40 words and make them entertaining.',
      icon: '🕵️'
    },
    therapist: {
      name: 'Dr. Sage',
      description: 'Compassionate listener and advisor',
      prompt: 'You are Dr. Sage, a warm and understanding AI therapist. You listen with empathy, offer gentle wisdom, and sprinkle in light humor to brighten the conversation. Be supportive, caring, and uplifting. Keep responses under 40 words with a friendly, encouraging tone.',
      icon: '🧠'
    },
    coach: {
      name: 'Coach Elite',
      description: 'Performance and motivation expert',
      prompt: 'You are Coach Elite, an enthusiastic and motivating AI performance coach. You inspire with energy, celebrate victories, and turn challenges into opportunities with humor and positivity. Be encouraging, dynamic, and fun. Keep responses under 40 words with high energy.',
      icon: '💪'
    },
    friend: {
      name: 'Alex',
      description: 'Your trusted conversation partner',
      prompt: 'You are Alex, a fun-loving and loyal AI friend. You chat like a best buddy - casual, supportive, funny, and always ready with a joke or encouragement. Be relatable, cheerful, and genuinely caring. Keep responses under 40 words with a friendly, upbeat vibe.',
      icon: '👋'
    },
    custom: {
      name: 'Custom AI',
      description: 'Design your own personality',
      prompt: '',
      icon: '⚡'
    }
  };

  useEffect(() => {
    initializeSpeechRecognition();
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const initializeSpeechRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      alert("Speech Recognition not supported. Please use Chrome, Edge, or Safari.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    
    recognition.onresult = async (event) => {
      const transcript = event.results[0][0].transcript;
      await handleUserInput(transcript);
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
    };

    recognitionRef.current = recognition;
  };

  const handleUserInput = async (transcript) => {
    setConversation(prev => [...prev, { type: 'user', text: transcript, timestamp: Date.now() }]);
    setIsProcessing(true);

    try {
      // Capture the current config state at the time of API call
      const currentConfig = { ...config };
      console.log('handleUserInput - Current config:', {
        hasGeminiKey: !!currentConfig.geminiApiKey,
        geminiKeyLength: currentConfig.geminiApiKey?.length || 0
      });
      
      const response = await callGemini(transcript, currentConfig);
      const aiResponse = response.candidates[0].content.parts[0].text;
      
      setConversation(prev => [...prev, { type: 'ai', text: aiResponse, timestamp: Date.now() }]);
      await synthesizeSpeech(aiResponse);
    } catch (error) {
      console.error('Error:', error);
      setConversation(prev => [...prev, { type: 'error', text: 'Unable to process request. Please check your API configuration.', timestamp: Date.now() }]);
    } finally {
      setIsProcessing(false);
    }
  };

  const callGemini = async (userInput, currentConfig = config) => {
    const selectedPreset = companionPresets[currentConfig.companionType];
    const prompt = currentConfig.customPrompt || selectedPreset.prompt;
    
    const fullPrompt = `${prompt}\n\nUser said: "${userInput}"\n\nRespond as ${currentConfig.companionName}:`;
  
    // Debug logging
    console.log('=== GEMINI API REQUEST DEBUG ===');
    console.log('Passed config geminiApiKey:', currentConfig.geminiApiKey ? `${currentConfig.geminiApiKey.substring(0, 10)}...` : 'MISSING');
    console.log('Global config geminiApiKey:', config.geminiApiKey ? `${config.geminiApiKey.substring(0, 10)}...` : 'MISSING');
    console.log('Using config object:', {
      hasGeminiKey: !!currentConfig.geminiApiKey,
      geminiKeyLength: currentConfig.geminiApiKey?.length || 0,
      companionType: currentConfig.companionType,
      companionName: currentConfig.companionName
    });
  
    // Fixed: Send apiKey and contents separately
    const body = {
      contents: [{
        parts: [{ text: fullPrompt }]
      }],
      apiKey: currentConfig.geminiApiKey  // Use the passed config instead of global config
    };
  
    console.log('Request body structure:', {
      hasContents: !!body.contents,
      hasApiKey: !!body.apiKey,
      apiKeyLength: body.apiKey?.length || 0
    });
    console.log('=== END DEBUG ===');
  
    const response = await fetch('/api/gemini', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
  
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error:', response.status, errorText);
      throw new Error(`API Error: ${response.status} - ${errorText}`);
    }
  
    return await response.json();
  };

  const synthesizeSpeech = async (text) => {
    if (!config.elevenLabsApiKey) {
      fallbackToChrome(text);
      return;
    }
  
    try {
      // Fixed: Send apiKey in the body, not headers
      const response = await fetch(`/api/elevenlabs/v1/text-to-speech/${config.voiceId}`, {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: text,
          model_id: 'eleven_monolingual_v1',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.6,
            style: 0.8,
            use_speaker_boost: true
          },
          apiKey: config.elevenLabsApiKey  // Send apiKey in body
        })
      });
  
      if (!response.ok) {
        console.warn('ElevenLabs API failed, using fallback voice');
        fallbackToChrome(text);
        return;
      }
  
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        audioRef.current.play();
      }
    } catch (error) {
      console.warn('Voice synthesis error, using fallback:', error);
      fallbackToChrome(text);
    }
  };

  const fallbackToChrome = (text) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      const voices = speechSynthesis.getVoices();
      
      const preferredVoice = voices.find(voice => 
        voice.name.includes('Google UK English Male') ||
        voice.name.includes('Microsoft David')
      ) || voices[0];
      
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }
      
      utterance.rate = 0.85;
      utterance.pitch = 0.75;
      utterance.volume = 1;
      
      speechSynthesis.speak(utterance);
    }
  };

  const startListening = () => {
    console.log('=== START LISTENING DEBUG ===');
    console.log('Has recognition:', !!recognitionRef.current);
    console.log('API Key available:', config.geminiApiKey ? `${config.geminiApiKey.substring(0, 10)}...` : 'MISSING');
    console.log('canStartListening:', canStartListening);
    console.log('Current config snapshot:', {
      hasGeminiKey: !!config.geminiApiKey,
      geminiKeyLength: config.geminiApiKey?.length || 0
    });
    console.log('=== END DEBUG ===');
    
    if (recognitionRef.current && config.geminiApiKey) {
      recognitionRef.current.start();
    } else {
      console.error('Cannot start listening - missing recognition or API key');
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  const selectedPreset = companionPresets[config.companionType];
  const canStartListening = config.geminiApiKey && !isProcessing;

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-light mb-4 tracking-tight">
            Voice AI
          </h1>
          <p className="text-xl text-gray-400 font-light max-w-2xl mx-auto">
            Create intelligent voice companions that understand and respond naturally
          </p>
        </div>

        <div className="grid lg:grid-cols-5 gap-12">
          {/* Configuration Sidebar */}
          <div className="lg:col-span-2">
            <div className="bg-gray-900/50 backdrop-blur-sm rounded-3xl p-8 border border-gray-800">
              <h2 className="text-2xl font-light mb-8 text-white">Configuration</h2>

              {/* API Keys Section */}
              <div className="space-y-6 mb-10">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-medium text-gray-300">Gemini API Key</label>
                    <button
                      onClick={() => window.open('https://makersuite.google.com/app/apikey', '_blank')}
                      className="text-xs text-gray-400 hover:text-white transition-colors flex items-center gap-1"
                    >
                      Get Key <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                  <input
                    type="password"
                    value={config.geminiApiKey}
                    onChange={(e) => {
                      console.log('API Key input changed:', e.target.value ? `${e.target.value.substring(0, 10)}...` : 'EMPTY');
                      setConfig({...config, geminiApiKey: e.target.value});
                    }}
                    className="w-full bg-black/50 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-white focus:border-transparent transition-all"
                    placeholder="Required for AI responses"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-medium text-gray-300">ElevenLabs API Key</label>
                    <button
                      onClick={() => window.open('https://elevenlabs.io/api', '_blank')}
                      className="text-xs text-gray-400 hover:text-white transition-colors flex items-center gap-1"
                    >
                      Get Key <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                  <input
                    type="password"
                    value={config.elevenLabsApiKey}
                    onChange={(e) => setConfig({...config, elevenLabsApiKey: e.target.value})}
                    className="w-full bg-black/50 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-white focus:border-transparent transition-all"
                    placeholder="Optional for premium voice"
                  />
                  <p className="text-xs text-gray-500 mt-2">Leave empty to use browser voice synthesis</p>
                </div>
              </div>

              {/* Companion Selection */}
              <div className="mb-8">
                <label className="text-sm font-medium text-gray-300 mb-4 block">Choose Personality</label>
                <div className="space-y-2">
                  {Object.entries(companionPresets).map(([key, preset]) => (
                    <button
                      key={key}
                      onClick={() => setConfig({...config, companionType: key, companionName: preset.name})}
                      className={`w-full p-4 rounded-xl border text-left transition-all ${
                        config.companionType === key 
                          ? 'bg-white text-black border-white' 
                          : 'bg-black/30 border-gray-700 hover:border-gray-600 text-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{preset.icon}</span>
                        <div>
                          <div className="font-medium">{preset.name}</div>
                          <div className={`text-sm ${config.companionType === key ? 'text-gray-700' : 'text-gray-400'}`}>
                            {preset.description}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Advanced Settings */}
              <div>
                <button
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="flex items-center justify-between w-full text-sm font-medium text-gray-300 mb-4 hover:text-white transition-colors"
                >
                  Advanced Settings
                  <ChevronDown className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
                </button>
                
                {showAdvanced && (
                  <div className="space-y-4 border-t border-gray-800 pt-6">
                    <div>
                      <label className="text-sm font-medium text-gray-300 mb-2 block">Companion Name</label>
                      <input
                        type="text"
                        value={config.companionName}
                        onChange={(e) => setConfig({...config, companionName: e.target.value})}
                        className="w-full bg-black/50 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-white focus:border-transparent transition-all"
                      />
                    </div>

                    {config.elevenLabsApiKey && (
                      <div>
                        <label className="text-sm font-medium text-gray-300 mb-2 block">Voice ID</label>
                        <input
                          type="text"
                          value={config.voiceId}
                          onChange={(e) => setConfig({...config, voiceId: e.target.value})}
                          className="w-full bg-black/50 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-white focus:border-transparent transition-all"
                        />
                      </div>
                    )}

                    {config.companionType === 'custom' && (
                      <div>
                        <label className="text-sm font-medium text-gray-300 mb-2 block">Custom Personality</label>
                        <textarea
                          value={config.customPrompt}
                          onChange={(e) => setConfig({...config, customPrompt: e.target.value})}
                          className="w-full bg-black/50 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-white focus:border-transparent transition-all h-24 resize-none"
                          placeholder="Describe your AI companion's personality and behavior..."
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Main Interface */}
          <div className="lg:col-span-3">
            <div className="bg-gray-900/30 backdrop-blur-sm rounded-3xl p-8 border border-gray-800 min-h-[600px]">
              {/* Companion Info */}
              <div className="text-center mb-12">
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
                  <Bot className="w-10 h-10 text-black" />
                </div>
                <h3 className="text-2xl font-light mb-2">{config.companionName}</h3>
                <p className="text-gray-400">{selectedPreset.description}</p>
              </div>

              {/* Voice Control */}
              <div className="text-center mb-12">
                <button
                  onClick={isListening ? stopListening : startListening}
                  disabled={!canStartListening}
                  className={`relative w-24 h-24 rounded-full transition-all duration-200 ${
                    isListening 
                      ? 'bg-red-600 hover:bg-red-700 shadow-lg shadow-red-600/25' 
                      : canStartListening
                      ? 'bg-white hover:bg-gray-100 shadow-lg shadow-white/10'
                      : 'bg-gray-700 cursor-not-allowed'
                  } transform hover:scale-105 disabled:hover:scale-100 disabled:hover:bg-gray-700`}
                >
                  {isListening ? (
                    <Square className="w-8 h-8 text-white mx-auto" />
                  ) : (
                    <Mic className={`w-8 h-8 mx-auto ${canStartListening ? 'text-black' : 'text-gray-500'}`} />
                  )}
                  
                  {isListening && (
                    <>
                      <div className="absolute inset-0 rounded-full border-2 border-red-400 animate-ping"></div>
                      <div className="absolute inset-0 rounded-full border border-red-300 animate-pulse"></div>
                    </>
                  )}
                </button>
                
                <div className="mt-6">
                  {isListening && (
                    <p className="text-white font-medium">Listening...</p>
                  )}
                  {isProcessing && (
                    <p className="text-gray-300 font-medium">Processing...</p>
                  )}
                  {!isListening && !isProcessing && canStartListening && (
                    <p className="text-gray-400">Click to start conversation</p>
                  )}
                  {!config.geminiApiKey && (
                    <p className="text-gray-500">Add Gemini API key to begin</p>
                  )}
                </div>
              </div>

              {/* Conversation */}
              <div className="space-y-6 max-h-80 overflow-y-auto">
                {conversation.map((message, index) => (
                  <div
                    key={index}
                    className={`flex gap-4 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {message.type === 'ai' && (
                      <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                        <Bot className="w-4 h-4 text-black" />
                      </div>
                    )}
                    
                    <div className={`max-w-md p-4 rounded-2xl ${
                      message.type === 'user' 
                        ? 'bg-white text-black' 
                        : message.type === 'ai'
                        ? 'bg-gray-800 text-white'
                        : 'bg-red-900/50 text-red-200 border border-red-800'
                    }`}>
                      <p className="leading-relaxed">{message.text}</p>
                    </div>

                    {message.type === 'user' && (
                      <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                        <User className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {conversation.length === 0 && (
                <div className="text-center text-gray-500 py-16">
                  <Bot className="w-12 h-12 mx-auto mb-4 opacity-30" />
                  <p>Your conversation will appear here</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-16 text-gray-600">
          <p className="font-light">Built with AI assistance</p>
        </div>
      </div>

      <audio ref={audioRef} style={{ display: 'none' }} />
    </div>
  );
};

export default VoiceAICompanion;