import MarkdownViewer from '@/components/markdown-viewer';
import { Button } from '@/components/ui/button';
import axios from 'axios';
import { Check, Copy, FileText, LoaderCircle, Send, Sparkles, Trash2, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
}

export type AiChatContext = 'description' | 'specification';

interface AiChatPanelProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    featureName: string;
    projectId: number | string;
    currentContent: string;
    onApplyContent: (markdown: string) => void;
    context?: AiChatContext;
}

const contextConfig: Record<AiChatContext, { label: string; color: string; endpoint: string; placeholder: string; emptyHint: string }> = {
    description: {
        label: 'Beschreibung',
        color: 'bg-blue-500/10 text-blue-600 border-blue-200 dark:border-blue-800 dark:text-blue-400',
        endpoint: '/ai/chat',
        placeholder: 'z.B. „Kannst du die User Stories ergänzen?"',
        emptyHint: 'Stelle eine Frage zur Beschreibung',
    },
    specification: {
        label: 'Spezifikation',
        color: 'bg-purple-500/10 text-purple-600 border-purple-200 dark:border-purple-800 dark:text-purple-400',
        endpoint: '/ai/chat-specification',
        placeholder: 'z.B. „Kannst du die Akzeptanzkriterien verbessern?"',
        emptyHint: 'Stelle eine Frage zur Spezifikation',
    },
};

/** Extract fenced ```markdown-suggestion blocks from AI response */
function extractSuggestions(content: string): string[] {
    const regex = /```markdown-suggestion\n([\s\S]*?)```/g;
    const suggestions: string[] = [];
    let match;
    while ((match = regex.exec(content)) !== null) {
        suggestions.push(match[1].trim());
    }
    return suggestions;
}

export default function AiChatPanel({ open, onOpenChange, featureName, projectId, currentContent, onApplyContent, context = 'description' }: AiChatPanelProps) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [appliedIdx, setAppliedIdx] = useState<string | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    const cfg = contextConfig[context];

    const scrollToBottom = useCallback(() => {
        setTimeout(() => {
            scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
        }, 50);
    }, []);

    useEffect(() => {
        if (open) {
            setTimeout(() => inputRef.current?.focus(), 300);
        }
    }, [open]);

    useEffect(() => {
        scrollToBottom();
    }, [messages, scrollToBottom]);

    async function sendMessage() {
        const text = input.trim();
        if (!text || loading) return;

        const userMsg: ChatMessage = { role: 'user', content: text };
        const updatedMessages = [...messages, userMsg];
        setMessages(updatedMessages);
        setInput('');
        setLoading(true);
        setError('');

        try {
            const payload: Record<string, any> = {
                messages: updatedMessages,
                feature_name: featureName,
                project_id: typeof projectId === 'string' ? parseInt(projectId) : projectId,
            };
            if (context === 'specification') {
                payload.current_content = currentContent;
            } else {
                payload.current_description = currentContent;
            }
            const res = await axios.post(cfg.endpoint, payload);
            setMessages([...updatedMessages, { role: 'assistant', content: res.data.reply }]);
        } catch (e: any) {
            setError(e.response?.data?.error ?? 'Chat request failed');
        } finally {
            setLoading(false);
        }
    }

    function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    }

    function handleApply(suggestion: string, key: string) {
        onApplyContent(suggestion);
        setAppliedIdx(key);
        setTimeout(() => setAppliedIdx(null), 2000);
    }

    function clearChat() {
        setMessages([]);
        setError('');
    }

    if (!open) return null;

    return (
        <div className="border-l bg-background flex h-full flex-col">
            {/* Header */}
            <div className="flex-shrink-0 border-b px-4 py-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Sparkles className="text-primary h-5 w-5" />
                        <h3 className="text-sm font-semibold">KI Assistent</h3>
                        <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${cfg.color}`}>
                            <FileText className="h-3 w-3" />
                            {cfg.label}
                        </span>
                    </div>
                    <div className="flex items-center gap-1">
                        {messages.length > 0 && (
                            <Button variant="ghost" size="sm" onClick={clearChat} title="Chat leeren">
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        )}
                        <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)} title="Chat schließen">
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Message area */}
            <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-3 py-4">
                {messages.length === 0 && (
                    <div className="text-muted-foreground flex h-full flex-col items-center justify-center gap-3 text-center text-sm">
                        <Sparkles className="text-muted-foreground/50 h-10 w-10" />
                        <div>
                            <p className="font-medium">{cfg.emptyHint}</p>
                            <p className="mt-1 text-xs">{cfg.placeholder}</p>
                        </div>
                    </div>
                )}

                {messages.map((msg, i) => {
                    const isUser = msg.role === 'user';
                    const suggestions = !isUser ? extractSuggestions(msg.content) : [];

                    return (
                        <div key={i} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                            <div
                                className={`max-w-[95%] rounded-lg px-3 py-2 ${
                                    isUser
                                        ? 'bg-primary text-primary-foreground'
                                        : 'bg-muted border'
                                }`}
                            >
                                {isUser ? (
                                    <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
                                ) : (
                                    <div className="prose prose-sm dark:prose-invert max-w-none">
                                        <MarkdownViewer content={msg.content} />
                                    </div>
                                )}

                                {suggestions.length > 0 && (
                                    <div className="mt-2 flex flex-wrap gap-2 border-t pt-2">
                                        {suggestions.map((suggestion, si) => {
                                            const key = `${i}-${si}`;
                                            const isApplied = appliedIdx === key;
                                            return (
                                                <Button
                                                    key={key}
                                                    variant="secondary"
                                                    size="sm"
                                                    onClick={() => handleApply(suggestion, key)}
                                                    className="gap-1"
                                                >
                                                    {isApplied ? (
                                                        <>
                                                            <Check className="h-3.5 w-3.5" />
                                                            Übernommen
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Copy className="h-3.5 w-3.5" />
                                                            {suggestions.length === 1
                                                                ? 'Übernehmen'
                                                                : `Vorschlag ${si + 1}`}
                                                        </>
                                                    )}
                                                </Button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}

                {loading && (
                    <div className="flex justify-start">
                        <div className="bg-muted flex items-center gap-2 rounded-lg border px-3 py-2 text-sm">
                            <LoaderCircle className="h-4 w-4 animate-spin" />
                            KI denkt nach…
                        </div>
                    </div>
                )}
            </div>

            {/* Error display */}
            {error && (
                <div className="flex-shrink-0 px-3">
                    <p className="text-sm text-red-500">{error}</p>
                </div>
            )}

            {/* Input area */}
            <div className="flex-shrink-0 border-t px-3 py-3">
                <div className="flex gap-2">
                    <textarea
                        ref={inputRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Nachricht an KI…"
                        rows={2}
                        className="border-input bg-background placeholder:text-muted-foreground flex-1 resize-none rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-offset-2"
                        disabled={loading || !featureName || !projectId}
                    />
                    <Button
                        size="icon"
                        onClick={sendMessage}
                        disabled={loading || !input.trim() || !featureName || !projectId}
                        className="h-auto self-end"
                    >
                        <Send className="h-4 w-4" />
                    </Button>
                </div>
                <p className="text-muted-foreground mt-1 text-xs">Enter zum Senden, Shift+Enter für Zeilenumbruch</p>
            </div>
        </div>
    );
}
