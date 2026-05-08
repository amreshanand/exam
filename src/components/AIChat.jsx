import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Send, X, Trash2, Bot, User, Loader2, Sparkles } from 'lucide-react';
import { useStore } from '../store/useStore';
import { fetchNews } from '../services/api';
import axios from 'axios';

// Tokens are accessed via import.meta.env inside the functions to ensure they are properly handled by Vite.

function buildContext(state) {
  const { issPosition, speedHistory, articles, astronauts } = state;
  const parts = [];

  // 1. ISS Telemetry
  if (issPosition?.iss_position) {
    const lat = parseFloat(issPosition.iss_position.latitude).toFixed(4);
    const lon = parseFloat(issPosition.iss_position.longitude).toFixed(4);
    const speed = speedHistory.length > 0 ? Math.round(speedHistory[speedHistory.length - 1]?.speed) : 27600;
    const timestamp = new Date(issPosition.timestamp).toLocaleTimeString();
    parts.push(`[TELEMETRY] ISS Position: Lat ${lat}, Lon ${lon}. Orbital Velocity: ${speed.toLocaleString()} km/h. Last Sync: ${timestamp}.`);
  }

  // 2. Crew Info
  if (astronauts?.people && astronauts.people.length > 0) {
    const crewList = astronauts.people.map(p => `${p.name} (${p.role || 'Crew Member'} on ${p.craft})`).join(', ');
    parts.push(`[CREW MANIFEST] ${astronauts.number} members currently aboard. Personnel: ${crewList}.`);
  } else if (astronauts?.number === 0) {
    parts.push(`[CREW MANIFEST] Status: No active crew data retrieved.`);
  }

  // 3. News Context
  if (articles?.length) {
    const newsSummary = articles.slice(0, 4).map((a, i) => 
      `Ref ${i+1}: "${a.title}" from ${a.source?.name || 'Unknown'}`
    ).join(' | ');
    parts.push(`[SPACE INTELLIGENCE] Recent Headlines: ${newsSummary}`);
  }

  return parts.join('\n\n');
}

async function callAI(messages, context) {
  const GROQ_TOKEN = import.meta.env.VITE_GROQ_TOKEN;
  const HF_TOKEN = import.meta.env.VITE_AI_TOKEN;

  const systemPrompt = `You are the ISS Mission Control AI Assistant. 
CORE DATA DIRECTIVE: Use the following LIVE dashboard telemetry to assist the user:

${context}

COMMUNICATION PROTOCOL:
1. Be professional, concise, and technically accurate.
2. If asked about ISS location, speed, or crew, use the provided [TELEMETRY] and [CREW MANIFEST] data.
3. If asked about recent events, refer to [SPACE INTELLIGENCE].
4. If the data is missing or doesn't cover the query, state: "I only have access to current ISS telemetry and latest space news."
5. Limit responses to 2-3 sentences max.`;

  const userMsg = messages[messages.length - 1].content;

  // 1. TRY GROQ (Llama 3)
  if (GROQ_TOKEN) {
    try {
      const res = await axios.post(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: systemPrompt },
            ...messages.slice(-3).map(m => ({ role: m.role, content: m.content }))
          ],
          max_tokens: 250,
          temperature: 0.5
        },
        { headers: { Authorization: `Bearer ${GROQ_TOKEN}`, 'Content-Type': 'application/json' }, timeout: 8000 }
      );
      
      if (res.data?.choices?.[0]?.message?.content) {
        return res.data.choices[0].message.content.trim();
      }
    } catch (e) {
      console.warn("Groq API Error:", e.response?.data || e.message);
    }
  }

  // 2. FALLBACK TO HUGGING FACE
  if (HF_TOKEN) {
    try {
      const res = await axios.post(
        'https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2',
        { 
          inputs: `[INST] ${systemPrompt}\nUser Question: ${userMsg} [/INST]`, 
          parameters: { max_new_tokens: 150, wait_for_model: true, return_full_text: false } 
        },
        { headers: { Authorization: `Bearer ${HF_TOKEN}`, 'Content-Type': 'application/json' }, timeout: 15000 }
      );
      
      if (res.data?.[0]?.generated_text) {
        return res.data[0].generated_text.trim();
      }
    } catch (e) {
      console.warn("Hugging Face API Error:", e.message);
    }
  }

  // 3. HARD-CODED FALLBACK (If all APIs fail or tokens are missing)
  const query = userMsg.toLowerCase();
  if (query.includes('where') || query.includes('location') || query.includes('lat') || query.includes('lon')) {
    const latMatch = context.match(/Lat ([\d.-]+), Lon ([\d.-]+)/);
    if (latMatch) return `The ISS is currently at Latitude ${latMatch[1]} and Longitude ${latMatch[2]}.`;
  }
  if (query.includes('speed') || query.includes('fast')) {
    const speedMatch = context.match(/Velocity: ([\d,]+) km\/h/);
    if (speedMatch) return `The ISS orbital velocity is currently ${speedMatch[1]} km/h.`;
  }
  if (query.includes('who') || query.includes('crew') || query.includes('people')) {
    const crewMatch = context.match(/\[CREW MANIFEST\] (.*?\.)/);
    if (crewMatch) return crewMatch[1];
  }

  if (!GROQ_TOKEN) {
    return "Mission Control: AI tokens are missing in the environment settings. Please verify VITE_GROQ_TOKEN in your deployment configuration.";
  }

  return "I'm currently experiencing connectivity issues with Mission Control servers. Please check the dashboard gauges for live telemetry.";
}

export default function AIChat() {
  const { chatMessages, addMessage, clearChat, issPosition, speedHistory, articles, astronauts, setArticles, newsLastFetched, setNewsLoading } = useStore();
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

    // If the user asks about news/headlines and our articles are stale or missing, fetch fresh articles first
    const wantsNews = /news|headline|headlines|latest|breaking/i.test(input);
    if (wantsNews && (!articles || articles.length < 3)) {
      try {
        setNewsLoading(true);
        const apiKey = import.meta.env.VITE_NEWS_API_KEY;
        const fresh = await fetchNews('space nasa iss spacex', apiKey);
        if (fresh?.length) setArticles(fresh);
      } catch (err) {
        console.warn('Failed to fetch news for chat:', err);
      } finally {
        setNewsLoading(false);
      }
    }

    const context = buildContext({ issPosition, speedHistory, articles, astronauts });
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
