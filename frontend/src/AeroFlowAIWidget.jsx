import { useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronRight, Plus, Send, Sparkles } from "lucide-react";
import { useLocation } from "react-router-dom";
import { apiFetch } from "./api";
import "./AeroFlowAIWidget.css";

const suggestions = [
    "What is the refund policy?",
    "Can I cancel my booking?",
    "What are flexible fares?",
    "What are the baggage rules?",
];

function AeroFlowAIWidget() {
    const location = useLocation();
    const [open, setOpen] = useState(false);
    const [question, setQuestion] = useState("");
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [retryQuestion, setRetryQuestion] = useState("");
    const conversationRef = useRef(null);
    const inputRef = useRef(null);

    const hiddenRoutes = ["/login", "/signup", "/admin"];
    const hidden = hiddenRoutes.some((route) => location.pathname === route || location.pathname.startsWith(`${route}/`));

    useEffect(() => {
        if (open) inputRef.current?.focus();
    }, [open]);

    useEffect(() => {
        if (!open) return;
        const conversation = conversationRef.current;
        conversation?.scrollTo({ top: conversation.scrollHeight, behavior: "smooth" });
    }, [messages, loading, open]);

    useEffect(() => {
        const closeOnEscape = (event) => {
            if (event.key === "Escape") setOpen(false);
        };
        window.addEventListener("keydown", closeOnEscape);
        return () => window.removeEventListener("keydown", closeOnEscape);
    }, []);

    if (hidden) return null;

    const ask = async (rawQuestion = question) => {
        const trimmedQuestion = rawQuestion.trim();
        if (!trimmedQuestion || loading) return;

        setQuestion("");
        setRetryQuestion("");
        setMessages((current) => [...current, { role: "user", content: trimmedQuestion }]);
        setLoading(true);

        try {
            const result = await apiFetch("/policy-assistant", {
                method: "POST",
                body: JSON.stringify({ question: trimmedQuestion }),
            });
            setMessages((current) => [...current, {
                role: "assistant",
                content: result.answer || "AeroFlow AI returned no answer.",
            }]);
        } catch {
            setRetryQuestion(trimmedQuestion);
            setMessages((current) => [...current, {
                role: "error",
                content: "Sorry, I couldn't reach AeroFlow AI right now. Please try again.",
            }]);
        } finally {
            setLoading(false);
        }
    };

    const submit = (event) => {
        event.preventDefault();
        ask();
    };

    const handleKeyDown = (event) => {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            ask();
        }
    };

    const newChat = () => {
        setMessages([]);
        setQuestion("");
        setRetryQuestion("");
    };

    return (
        <div className={`aero-ai-widget ${open ? "is-open" : ""}`}>
            {open && <section className="aero-ai-panel" aria-label="AeroFlow AI chat">
                <header className="aero-ai-header">
                    <div className="aero-ai-heading">
                        <div className={`aero-ai-avatar ${loading ? "is-thinking" : ""}`}><Sparkles size={18} /></div>
                        <div>
                            <strong>AeroFlow AI <span className="aero-ai-online"><i /> Online</span></strong>
                            <span>Intelligent airline assistant</span>
                        </div>
                    </div>
                    <div className="aero-ai-header-actions">
                        <button type="button" className="aero-ai-new-chat" onClick={newChat}><Plus size={14} /> New chat</button>
                        <button type="button" className="aero-ai-icon-button" onClick={() => setOpen(false)} aria-label="Minimize AeroFlow AI"><ChevronDown size={18} /></button>
                    </div>
                </header>

                <div className="aero-ai-body" ref={conversationRef} aria-live="polite">
                    {!messages.length && <div className="aero-ai-welcome">
                        <div className="aero-ai-welcome-icon"><Sparkles size={23} /></div>
                        <h2>Hi! I&apos;m AeroFlow AI.</h2>
                        <p>How can I help with your journey?</p>
                        <small>Ask me about refunds, cancellations, fares, baggage and airline policies.</small>
                        <div className="aero-ai-suggestions">
                            {suggestions.map((suggestion) => <button type="button" key={suggestion} onClick={() => ask(suggestion)} disabled={loading}>{suggestion}<ChevronRight size={14} /></button>)}
                        </div>
                    </div>}
                    {messages.map((message, index) => <div className={`aero-ai-message ${message.role}`} key={`${message.role}-${index}`}>
                        {message.role === "user" ? <div className="aero-ai-user-bubble">{message.content}</div> : <div className="aero-ai-assistant-row"><div className="aero-ai-small-avatar"><Sparkles size={13} /></div><div className="aero-ai-assistant-content"><strong>AeroFlow AI</strong><div className="aero-ai-assistant-bubble">{message.content}{message.role === "error" && index === messages.length - 1 && retryQuestion && <button type="button" className="aero-ai-retry" onClick={() => ask(retryQuestion)}>Retry</button>}</div></div></div>}
                    </div>)}
                    {loading && <div className="aero-ai-message assistant"><div className="aero-ai-assistant-row"><div className="aero-ai-small-avatar is-thinking"><Sparkles size={13} /></div><div className="aero-ai-assistant-content"><strong>AeroFlow AI</strong><div className="aero-ai-assistant-bubble aero-ai-thinking"><span>Searching airline policies</span><i /><i /><i /></div></div></div></div>}
                </div>

                <form className="aero-ai-composer" onSubmit={submit}>
                    <textarea ref={inputRef} value={question} onChange={(event) => setQuestion(event.target.value)} onKeyDown={handleKeyDown} placeholder="Ask AeroFlow AI..." rows="1" aria-label="Ask AeroFlow AI" disabled={loading} />
                    <button type="submit" className="aero-ai-send" aria-label="Send question" disabled={loading || !question.trim()}><Send size={16} /></button>
                </form>
            </section>}

            {!open && <button type="button" className="aero-ai-launcher" onClick={() => setOpen(true)} aria-label="Open AeroFlow AI">
                <span className="aero-ai-launcher-icon"><Sparkles size={17} /></span>
                <span>AeroFlow AI</span>
                <i className="aero-ai-attention" />
            </button>}
        </div>
    );
}

export default AeroFlowAIWidget;
