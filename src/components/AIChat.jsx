import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Send, X, Trash2, Bot, User, Loader2, Sparkles } from 'lucide-react';
import { useStore } from '../store/useStore';
import axios from 'axios';

// Tokens read from environment; keep safe redacted defaults
const HF_TOKEN = import.meta.env.VITE_AI_TOKEN || 'REDACTED_HF_TOKEN';
const GROQ_TOKEN = import.meta.env.VITE_GROQ_TOKEN || 'REDACTED_GROQ_TOKEN';

function buildContext(state) {
  const { issPosition, speedHistory, articles, astronauts } = state;
  const parts = [];

  if (issPosition?.iss_position) {
    const lat = parseFloat(issPosition.iss_position.latitude).toFixed(4);
    const lon = parseFloat(issPosition.iss_position.longitude).toFixed(4);
    const speed = speedHistory.length > 0 ? Math.round(speedHistory[speedHistory.length - 1]?.speed) : 27600;
    parts.push(`[ISS LIVE DATA] Position: ${lat} lat, ${lon} lon. Current Speed: ${speed.toLocaleString()} km/h.`);
  }

  if (astronauts?.people) {
    parts.push(`[CREW] ${astronauts.number} people in space. Names: ${astronauts.people.map(p => p.name).join(', ')}.`);
  }

  if (articles?.length) {
    const newsSummary = articles.slice(0, 5).map((a, i) => 
      `News ${i+1}: "${a.title}" (${a.source?.name || 'Unknown'})`
    ).join(' | ');
    parts.push(`[LATEST NEWS] ${newsSummary}`);
  }

  return parts.join('\n\n');
}

async function callAI(messages, context) {
  const systemPrompt = `You are an ISS Mission Control AI Assistant. Use this live dashboard data ONLY to answer the user's question:\n\n${context}\n\nKeep answers concise, direct, and under 3 sentences. If the user asks something not covered by the data, say "I can only provide information based on current ISS telemetry and space news."`;
  const userMsg = messages[messages.length - 1].content;

  // 1. TRY GROQ FIRST (Fastest)
  try {
    const res = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'llama3-8b-8192',
        messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userMsg }],
        max_tokens: 150,
        temperature: 0.3
      },
      { headers: { Authorization: `Bearer ${GROQ_TOKEN}`, 'Content-Type': 'application/json' }, timeout: 10000 }
    );
    if (res.data?.choices?.[0]?.message?.content) {
      return res.data.choices[0].message.content.trim();
    }
  } catch (e) {
    console.warn("Groq Service busy, trying Hugging Face...");
  }

  // 2. TRY HUGGING FACE (Fallback)
  try {
    const res = await axios.post(
      'https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2',
      { inputs: `[INST] ${systemPrompt}\nUser: ${userMsg} [/INST]`, parameters: { max_new_tokens: 150, wait_for_model: true } },
      { headers: { Authorization: `Bearer ${HF_TOKEN}`, 'Content-Type': 'application/json' }, timeout: 20000 }
    );
    if (res.data?.[0]?.generated_text) {
      return res.data[0].generated_text.split('[/INST]').pop().trim();
    }
  } catch (e) {
    console.error("All AI services offline.");
    
    // Manual fallback using regex to find answers if APIs fail
    const lCUserMsg = userMsg.toLowerCase();
    if (lCUserMsg.includes('where') || lCUserMsg.includes('location') || lCUserMsg.includes('lat') || lCUserMsg.includes('lon')) {
      const latMatch = context.match(/Position: ([\d.-]+) lat, ([\d.-]+) lon/);
      if (latMatch) return `The ISS is currently located at Latitude ${latMatch[1]} and Longitude ${latMatch[2]}.`;
    }
    if (lCUserMsg.includes('speed') || lCUserMsg.includes('fast')) {
       const speedMatch = context.match(/Speed: ([\d,]+) km\/h/);
       if (speedMatch) return `The ISS is traveling at a speed of ${speedMatch[1]} km/h.`;
    }
    if (lCUserMsg.includes('who') || lCUserMsg.includes('people') || lCUserMsg.includes('astronaut')) {
        const crewMatch = context.match(/\[CREW\] (.*?\.)/);
        if (crewMatch) return crewMatch[1];
    }
    if (lCUserMsg.includes('news') || lCUserMsg.includes('headline')) {
         const newsMatch = context.match(/\[LATEST NEWS\] (.*)/);
         if (newsMatch) return `Here are the latest headlines: ${newsMatch[1]}`;
    }

    return `I'm having trouble connecting to my AI processing servers right now. Please try again in a moment.`;
  }
}

export default function AIChat() {
  const { chatMessages, addMessage, clearChat, issPosition, speedHistory, articles } = useStore();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [chatMessages, isLoading]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg = { role: 'user', content: input, timestamp: Date.now() };
    addMessage(userMsg);
    setInput('');
    setIsLoading(true);

    const context = buildContext({ issPosition, speedHistory, articles });
    const response = await callAI([...chatMessages, userMsg], context);
    addMessage({ role: 'assistant', content: response, timestamp: Date.now() });
    setIsLoading(false);
  };

  return (
    <>
      <button onClick={() => setIsOpen(true)} className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-red-500 text-white shadow-lg flex items-center justify-center hover:scale-110 transition-transform z-50">
        <MessageSquare size={24} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ opacity: 0, y: 100, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 100, scale: 0.9 }} className="fixed bottom-24 right-6 w-[380px] h-[500px] bg-white rounded-2xl shadow-2xl flex flex-col z-50 border border-gray-100 overflow-hidden">
            <div className="p-4 bg-gray-900 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="font-bold text-sm orbitron">AI ASSISTANT</span>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={clearChat} className="p-1 hover:bg-white/10 rounded text-gray-400"><Trash2 size={16} /></button>
                <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-white/10 rounded"><X size={18} /></button>
              </div>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
              {chatMessages.length === 0 && (
                <div className="text-center py-10 text-gray-400">
                  <Bot size={40} className="mx-auto mb-2 opacity-20" />
                  <p className="text-xs">Ask me about ISS location, speed, or space news!</p>
                </div>
              )}
              {chatMessages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${msg.role === 'user' ? 'bg-red-500 text-white rounded-tr-none' : 'bg-white border border-gray-100 text-gray-800 shadow-sm rounded-tl-none'}`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white border border-gray-100 p-3 rounded-2xl rounded-tl-none shadow-sm">
                    <Loader2 size={16} className="animate-spin text-red-500" />
                  </div>
                </div>
              )}
            </div>

            <form onSubmit={handleSend} className="p-4 border-t border-gray-100 bg-white">
              <div className="flex gap-2">
                <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask from dashboard data only..." className="flex-1 text-sm bg-gray-100 border-none rounded-xl px-4 py-2 focus:ring-2 focus:ring-red-500 outline-none" />
                <button type="submit" disabled={isLoading} className="w-10 h-10 rounded-xl bg-red-500 text-white flex items-center justify-center hover:bg-red-600 disabled:opacity-50 transition-colors"><Send size={18} /></button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
