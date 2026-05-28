'use client';

import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Loader2, Bot, User } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

type Message = {
    role: 'user' | 'ai';
    content: string;
};

export default function ChatbotWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { role: 'ai', content: 'Halo! Saya Asisten Smart Santri. Ada yang bisa saya bantu terkait penggunaan sistem atau aturan keuangan pesantren?' }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isLoading]);

    const handleSend = async (e?: React.FormEvent) => {
        e?.preventDefault();
        
        const trimmed = input.trim();
        if (!trimmed || isLoading) return;

        // Optimistic UI update
        const userMsg: Message = { role: 'user', content: trimmed };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);

        try {
            // Kita akan mengirim seluruh riwayat pesan agar AI paham konteks percakapan sebelumnya
            const history = messages.map(m => ({ role: m.role, content: m.content }));
            
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: trimmed, history })
            });

            if (!response.ok) {
                if (response.status === 429) {
                    throw new Error('Sistem sedang beroperasi pada kapasitas penuh. Mohon tunggu beberapa saat sebelum bertanya lagi.');
                }
                throw new Error('Gagal terhubung ke server Chatbot.');
            }

            const data = await response.json();
            
            setMessages(prev => [...prev, { 
                role: 'ai', 
                content: data.reply || 'Maaf, saya tidak mengerti maksud Anda.'
            }]);
            
        } catch (error: any) {
            setMessages(prev => [...prev, { 
                role: 'ai', 
                content: error.message || 'Terjadi kesalahan sistem, silakan coba lagi nanti.' 
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end">
            {/* Chat Window */}
            {isOpen && (
                <div className="mb-4 w-[350px] sm:w-[400px] h-[500px] max-h-[80vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-100 transition-all duration-300 origin-bottom-right">
                    {/* Header */}
                    <div className="bg-emerald-600 p-4 flex items-center justify-between text-white shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                                <Bot size={18} className="text-white" />
                            </div>
                            <div>
                                <h3 className="font-bold text-sm">Smart Santri AI</h3>
                                <p className="text-[10px] text-emerald-100 opacity-90">Siap membantu Anda</p>
                            </div>
                        </div>
                        <button 
                            onClick={() => setIsOpen(false)}
                            className="p-1 hover:bg-white/20 rounded-full transition-colors"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {/* Chat Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`flex gap-2 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                    <div className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center mt-1 ${
                                        msg.role === 'user' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700'
                                    }`}>
                                        {msg.role === 'user' ? <User size={12} /> : <Bot size={12} />}
                                    </div>
                                    <div className={`p-3 rounded-2xl text-sm shadow-sm ${
                                        msg.role === 'user' 
                                            ? 'bg-emerald-600 text-white rounded-tr-sm' 
                                            : 'bg-white border border-slate-100 text-slate-700 rounded-tl-sm'
                                    }`}>
                                        {msg.role === 'user' ? (
                                            msg.content
                                        ) : (
                                            <div className="prose prose-sm prose-emerald max-w-none text-slate-700 leading-relaxed">
                                                <ReactMarkdown>
                                                    {msg.content}
                                                </ReactMarkdown>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="flex gap-2 max-w-[85%]">
                                    <div className="shrink-0 w-6 h-6 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center mt-1">
                                        <Bot size={12} />
                                    </div>
                                    <div className="bg-white border border-slate-100 p-4 rounded-2xl rounded-tl-sm flex gap-1 shadow-sm">
                                        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <form onSubmit={handleSend} className="p-3 bg-white border-t border-slate-100 flex items-center gap-2 shrink-0">
                        <input 
                            type="text" 
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Ketik pertanyaan Anda..."
                            className="flex-1 h-10 px-4 bg-slate-50 border border-slate-200 rounded-full text-sm outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all text-slate-700"
                            disabled={isLoading}
                        />
                        <button 
                            type="submit"
                            disabled={!input.trim() || isLoading}
                            className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center text-white shrink-0 hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Send size={16} className="ml-1" />
                        </button>
                    </form>
                </div>
            )}

            {/* Toggle Button */}
            {!isOpen && (
                <button 
                    onClick={() => setIsOpen(true)}
                    className="w-14 h-14 bg-emerald-600 text-white rounded-full flex items-center justify-center shadow-2xl hover:bg-emerald-700 hover:scale-105 transition-all focus:outline-none focus:ring-4 focus:ring-emerald-500/30"
                >
                    <MessageCircle size={28} />
                </button>
            )}
        </div>
    );
}
