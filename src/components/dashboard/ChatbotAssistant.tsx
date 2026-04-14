'use client';

import { useChat } from '@ai-sdk/react';
import { Button } from '@heroui/button';
import { Textarea } from '@heroui/input';
import { Send, Sparkles, Plus, History, X, Trash2 } from 'lucide-react';
import { useRef, useEffect, useState, useCallback } from 'react';

interface Session {
    id: string;
    title: string;
    messages: any[];
}

interface ChatbotAssistantProps {
    className?: string;
    onClose?: () => void;
}

export function ChatbotAssistant({ className = '', onClose }: ChatbotAssistantProps) {
    const { messages, sendMessage, status, error, setMessages } = useChat();
    const [input, setInput] = useState('');
    const [sessions, setSessions] = useState<Session[]>([{ id: '1', title: 'New Session', messages: [] }]);
    const [activeSessionId, setActiveSessionId] = useState('1');
    const [showHistory, setShowHistory] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const shouldAutoScrollRef = useRef(true);
    const isLoading = status !== 'ready';

    // Sync current messages to active session and update title
    // Sync current messages to active session and update title
    useEffect(() => {
        if (!activeSessionId) return;

        const timer = setTimeout(() => {
            setSessions(prev => {
                const activeIndex = prev.findIndex(s => s.id === activeSessionId);
                if (activeIndex === -1) return prev;

                const activeSession = prev[activeIndex];
                if (!activeSession) return prev;

                const currentTitle = messages.length > 0
                    ? (messages[0]?.parts?.map((p: any) => p.type === 'text' ? p.text : '').join('') ?? '').slice(0, 20) + '...'
                    : 'New Session';

                const titleChanged = activeSession.title !== currentTitle;

                if (activeSession.messages === messages && !titleChanged) return prev;


                if (!titleChanged && JSON.stringify(activeSession.messages) === JSON.stringify(messages)) {
                    return prev;
                }


                const newSessions = [...prev];
                newSessions[activeIndex] = {
                    ...activeSession,
                    messages: messages,
                    title: currentTitle
                };
                return newSessions;
            });
        }, 0);

        return () => clearTimeout(timer);
    }, [messages, activeSessionId]);


    const createSession = useCallback(() => {
        const newId = Date.now().toString();
        const newSession = { id: newId, title: 'New Session', messages: [] };
        setSessions(prev => [...prev, newSession]);
        setActiveSessionId(newId);
        setMessages([]);
        setInput('');
    }, [setMessages]);

    const switchSession = useCallback((id: string) => {
        const session = sessions.find(s => s.id === id);
        if (session && id !== activeSessionId) {
            setActiveSessionId(id);
            setMessages(session.messages);
        }
    }, [sessions, activeSessionId, setMessages]);

    const closeSession = useCallback((id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const remaining = sessions.filter(s => s.id !== id);
        if (remaining.length === 0) {
            const newId = Date.now().toString();
            const newSession = { id: newId, title: 'New Session', messages: [] };
            setSessions([newSession]);
            setActiveSessionId(newId);
            setMessages([]);
            setInput('');
            return;
        }
        setSessions(remaining);
        if (id === activeSessionId) {
            const last = remaining[remaining.length - 1];
            if (last) {
                setActiveSessionId(last.id);
                setMessages(last.messages);
            }
        }
    }, [sessions, activeSessionId, setMessages]);

    // Initial scroll on mount
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, []);

    // Smart auto-scroll
    useEffect(() => {
        const container = scrollRef.current;
        if (!container) return;

        if (shouldAutoScrollRef.current) {
            container.scrollTo({
                top: container.scrollHeight,
                behavior: 'smooth'
            });
        }
    }, [messages]);

    const handleScroll = useCallback(() => {
        const container = scrollRef.current;
        if (!container) return;

        const { scrollTop, scrollHeight, clientHeight } = container;
        // Check if user is near bottom (within 100px)
        const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
        shouldAutoScrollRef.current = isNearBottom;
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const message = input;
        shouldAutoScrollRef.current = true; // Force scroll on user message
        setInput(''); // Clear input immediately

        try {
            await sendMessage({
                role: 'user',
                parts: [{ type: 'text', text: message }]
            });
        } catch (error) {
            console.error('Error sending message:', error);
        }
    };



    const assistTemplates = [
        {
            id: 1,
            icon: <Sparkles className="w-4 h-4 text-orange-500" />,
            text: "Draft a professional response to a critical complaint about Service Speed."
        },
        {
            id: 2,
            icon: <Sparkles className="w-4 h-4 text-orange-500" />,
            text: "Draft a professional response to a critical complaint about Service Speed."
        }
    ];

    const handleTemplateClick = useCallback((template: string) => {
        setInput(template);
    }, []);



    return (
        <div className={`bg-white dark:bg-[#161616] rounded-2xl shadow-sm border-4 border-gray-100 dark:border-[#1f1f1f] flex flex-col h-full relative overflow-hidden ${className}`}>
            {/* Top Navigation Bar */}
            <div className="flex items-center justify-between px-2 py-1 border-b border-gray-100 dark:border-[#1f1f1f] bg-white dark:bg-[#161616] z-20 gap-2">
                <div className="flex-1 flex items-center gap-2 overflow-x-auto no-scrollbar mask-gradient-right">
                    {sessions.map((session) => (
                        <button
                            key={session.id}
                            onClick={() => switchSession(session.id)}
                            className={`group flex items-center gap-2 px-3 py-1.5 border rounded-lg text-xs font-medium transition-all whitespace-nowrap min-w-[120px] max-w-[120px] relative ${activeSessionId === session.id
                                ? 'bg-gray-100 dark:bg-[#1f1f1f] border-gray-200 dark:border-[#2a2a2a] text-gray-900 dark:text-white shadow-sm'
                                : 'bg-transparent border-transparent text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#1f1f1f]'
                                }`}
                        >
                            <span className="truncate flex-1 text-left">{session.title}</span>
                            <div
                                onClick={(e) => closeSession(session.id, e)}
                                className={`p-0.5 rounded-full hover:bg-gray-200 dark:hover:bg-[#2a2a2a] transition-colors ${activeSessionId === session.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                                    }`}
                            >
                                <X className="w-3 h-3 text-gray-400" />
                            </div>
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-1 shrink-0 pl-2 border-l border-gray-100 dark:border-[#1f1f1f]">
                    <button
                        onClick={createSession}
                        title="New Chat"
                        className="p-2 hover:bg-gray-100 dark:hover:bg-[#1f1f1f] rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => setShowHistory(!showHistory)}
                        title="History"
                        className={`p-2 rounded-lg transition-colors ${showHistory
                            ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400'
                            : 'hover:bg-gray-100 dark:hover:bg-[#1f1f1f] text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                            }`}
                    >
                        <History className="w-4 h-4" />
                    </button>
                    <button
                        title="Close"
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-[#1f1f1f] rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* History Overlay */}
            {showHistory && (
                <div className="absolute top-[48px] left-0 right-0 bottom-0 bg-white dark:bg-[#161616] z-30 p-4 overflow-y-auto animate-in fade-in slide-in-from-bottom-2">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white">Chat History</h3>
                        <span className="text-xs text-gray-500">{sessions.length} sessions</span>
                    </div>
                    <div className="space-y-2">
                        {sessions.map((session) => (
                            <div
                                key={session.id}
                                onClick={() => {
                                    switchSession(session.id);
                                    setShowHistory(false);
                                }}
                                className={`p-3 rounded-xl border flex items-center justify-between group cursor-pointer transition-all ${activeSessionId === session.id
                                    ? 'border-orange-200 bg-orange-50 dark:bg-orange-900/10 dark:border-orange-900/30'
                                    : 'border-gray-100 dark:border-[#1f1f1f] hover:bg-gray-50 dark:hover:bg-[#1f1f1f]'
                                    }`}
                            >
                                <div className="flex flex-col gap-1 overflow-hidden flex-1 mr-2">
                                    <span className={`text-sm font-medium truncate ${activeSessionId === session.id ? 'text-orange-700 dark:text-orange-400' : 'text-gray-700 dark:text-gray-200'
                                        }`}>
                                        {session.title}
                                    </span>
                                    <span className="text-xs text-gray-400 truncate">
                                        {session.messages.length} messages • {session.id === '1' ? 'Current Session' : new Date(parseInt(session.id)).toLocaleDateString()}
                                    </span>
                                </div>
                                <button
                                    onClick={(e) => {
                                        closeSession(session.id, e);
                                        // If we deleted the only session (which creates a new one), keep history open to show the new one? 
                                        // Or if we deleted the active one, we might want to stay in history view.
                                    }}
                                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                    title="Delete Session"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            {/* Header - Only show when no messages */}
            {messages.length === 0 && (
                <div className="p-3 pb-4 border-b-2 border-gray-100 dark:border-[#1f1f1f]">
                    <div className="flex flex-row gap-3">
                        <div className="w-9 h-8 bg-orange-500 dark:bg-orange-400 rounded-lg flex items-center justify-center">
                            <Sparkles className="w-4 h-4 text-white" />
                        </div>
                        <div className='flex flex-col gap-1'>
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white leading-tight">AI Assistant</h2>
                            <p className="text-sm text-gray-600 dark:text-gray-300 leading-tight">Ready to help you boost business</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Assist Templates - Only show if no messages yet */}
            {messages.length === 0 && (
                <div className="p-3 w-full">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Assist Template</h3>
                    <div className="flex flex-row gap-2 no-scrollbar overflow-x-auto w-full">
                        {assistTemplates.map((template) => (
                            <button
                                key={template.id}
                                onClick={() => handleTemplateClick(template.text)}
                                className="shrink-0 w-[280px] p-3 border-2 border-gray-200 dark:border-[#1f1f1f] rounded-xl text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group"
                            >
                                <div className="flex items-start gap-3 w-full">
                                    <div className="mt-0.5">
                                        {template.icon}
                                    </div>
                                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed group-hover:text-gray-900 dark:group-hover:text-white">
                                        {template.text}
                                    </p>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Chat Messages */}
            <div
                ref={scrollRef}
                onScroll={handleScroll}
                className={`flex-1 px-3 overflow-y-auto ${messages.length > 0 ? 'pb-24 pt-3' : 'pb-3'}`}
            >
                <div className="space-y-4">
                    {messages.map((message) => (
                        <div
                            key={message.id}
                            className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            {/* AI Avatar */}
                            <div
                                className={`flex flex-col max-w-[85%] rounded-2xl p-2 text-sm leading-relaxed shadow-sm ${message.role === 'user'
                                    ? 'bg-orange-500 text-white rounded-tr-sm'
                                    : 'bg-white dark:bg-[#1f1f1f] text-gray-800 dark:text-gray-200 border border-gray-100 dark:border-gray-800 rounded-tl-sm'
                                    }`}
                            >
                                <div className="markdown-content space-y-2">
                                    {message.parts?.map((part, index) => {
                                        if (part.type === 'text') {
                                            // Simple Markdown Parsing for Bold/Lists without heavy libraries if preferred, 
                                            // or generally just rendering text with whitespace-pre-wrap for now to respect newlines.
                                            // Given requirements for "better structure", I'll use a basic parser approach or pre-wrap.
                                            // For true Markdown, we'd typically use `react-markdown`. 
                                            // Assuming I don't have that package installed unless I check package.json, 
                                            // I will use `whitespace-pre-wrap` and basic regex for bolding as a safe fallback or just basic formatting.
                                            // Actually, the screenshot shows "**text**", so it IS raw markdown coming back.
                                            // I will use a simple formatting helper since I cannot install new packages easily.

                                            // Helper to render formatting
                                            return (
                                                <div key={index} className="whitespace-pre-wrap font-normal">
                                                    {part.text.split(/(\*\*.*?\*\*)/g).map((chunk, i) => {
                                                        if (chunk.startsWith('**') && chunk.endsWith('**')) {
                                                            return <strong key={i} className={message.role === 'user' ? 'text-white' : 'text-gray-900 dark:text-white'}>{chunk.slice(2, -2)}</strong>;
                                                        }
                                                        return chunk;
                                                    })}
                                                </div>
                                            );
                                        }
                                        return null;
                                    })}
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Error Message */}
                    {error && (
                        <div className="flex justify-start">
                            <div className="bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 p-3 rounded-lg text-sm">
                                Error: {error.message || 'Something went wrong'}
                            </div>
                        </div>
                    )}

                    {/* Loading Indicator */}
                    {isLoading && (
                        <div className="flex justify-start">
                            <div className="bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white p-3 rounded-lg text-sm">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            </div>

            {/* Input Area */}
            <div className={`px-3 py-2 transition-all duration-300 ${messages.length > 0
                ? 'absolute bottom-0 left-0 right-0 bg-white/80 dark:bg-[#161616]/80 backdrop-blur-md border-t border-gray-100 dark:border-[#1f1f1f] shadow-lg z-10'
                : 'pt-4 border-t-2 border-gray-100 dark:border-[#1f1f1f]'
                }`}>
                <form onSubmit={handleSubmit} className="flex items-center gap-3">
                    <div className="flex-1 relative">
                        <Textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Start typing your prompt"
                            disabled={isLoading}
                            minRows={1}
                            maxRows={4}
                            classNames={{
                                base: "w-full",
                                input: "text-sm pr-10 resize-y min-h-[40px] no-scrollbar",
                                inputWrapper: "border border-gray-200 dark:border-[#1f1f1f] rounded-xl focus-within:ring-2 focus-within:ring-orange-500 focus-within:border-transparent bg-white dark:bg-gray-800 disabled:opacity-50"
                            }}
                        />
                        <Button
                            type="submit"
                            disabled={!input?.trim() || isLoading}
                            isIconOnly
                            size="sm"
                            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 dark:disabled:bg-[#1f1f1f] disabled:cursor-not-allowed rounded-lg transition-colors"
                        >
                            <Send className="w-4 h-4 text-white" />
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}