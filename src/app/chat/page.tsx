'use client'
import { useState, useRef, useEffect } from 'react'
import AppShell from '@/components/layout/AppShell'
import { Send, Paperclip, Bot, Sparkles } from 'lucide-react'

interface Message {
  id: string
  role: 'user' | 'assistant'
  text: string
  time: string
}

const PLACEHOLDER_MESSAGES: Message[] = [
  {
    id: '1',
    role: 'assistant',
    text: "Hi! I'm your family health assistant. I can help you understand health records, remind you of upcoming appointments, and answer general health questions. What would you like to know?",
    time: '10:00',
  },
]

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>(PLACEHOLDER_MESSAGES)
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = () => {
    if (!input.trim()) return
    const now = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
    const userMsg: Message = { id: Date.now().toString(), role: 'user', text: input, time: now }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    // Placeholder AI response
    setTimeout(() => {
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: "I'm a UI placeholder — AI responses coming soon! Your message has been noted.",
        time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
      }
      setMessages(prev => [...prev, botMsg])
    }, 800)
  }

  return (
    <AppShell>
      <div className="flex flex-col h-[calc(100dvh-5rem)]">
        {/* Header */}
        <div className="px-4 pt-12 pb-4 border-b border-stone-100 bg-[#f8f4ef]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-stone-800 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-semibold text-stone-800">Health Assistant</h1>
              <p className="text-xs text-stone-400">AI-powered · coming soon</p>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} gap-2`}>
              {msg.role === 'assistant' && (
                <div className="w-7 h-7 rounded-full bg-stone-100 flex items-center justify-center shrink-0 mt-1">
                  <Bot className="w-3.5 h-3.5 text-stone-500" />
                </div>
              )}
              <div className={`max-w-[80%] ${msg.role === 'user' ? 'bg-stone-800 text-white rounded-2xl rounded-tr-sm' : 'bg-white text-stone-800 rounded-2xl rounded-tl-sm card-shadow'} px-4 py-3`}>
                <p className="text-sm leading-relaxed">{msg.text}</p>
                <p className={`text-[10px] mt-1 ${msg.role === 'user' ? 'text-stone-400' : 'text-stone-300'}`}>{msg.time}</p>
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="px-4 pb-4 pt-2 bg-[#f8f4ef] border-t border-stone-100">
          <div className="flex items-end gap-2">
            <button className="w-10 h-10 rounded-full bg-white card-shadow flex items-center justify-center text-stone-400 shrink-0">
              <Paperclip className="w-4 h-4" />
            </button>
            <div className="flex-1 bg-white rounded-2xl card-shadow flex items-end px-4 py-2 min-h-[44px]">
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
                placeholder="Ask about health records…"
                rows={1}
                className="w-full resize-none bg-transparent text-stone-800 placeholder:text-stone-400 text-sm focus:outline-none leading-relaxed"
                style={{ maxHeight: '120px' }}
              />
            </div>
            <button
              onClick={send}
              disabled={!input.trim()}
              className="w-10 h-10 rounded-full bg-stone-800 flex items-center justify-center text-white disabled:opacity-40 shrink-0 transition-opacity"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
