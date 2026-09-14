import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Bot, CheckCircle2, ChevronRight, Plane, Plus, Send, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "./api";
import "./Operations.css";

const services = ["Expired seat hold release", "Automated waitlist promotion", "Flight check-in reminders", "Price drop alerts", "Daily, weekly and monthly operations reports", "Flight schedule change notifications", "Flight cancellation notifications", "Pending refund escalation", "Fraud detection and scoring", "Historical fraud review", "Airline policy RAG assistant"];
function SystemFeatures() {
    const navigate = useNavigate();
    const [question, setQuestion] = useState("");
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [retryQuestion, setRetryQuestion] = useState("");
    const conversationRef = useRef(null);

    const suggestions = [
        "Can I cancel my booking?",
        "What is the refund policy?",
        "Tell me about flexible fares",
        "What are the baggage rules?",
    ];

    useEffect(() => {
        const conversation = conversationRef.current;
        if (conversation) {
            conversation.scrollTo({ top: conversation.scrollHeight, behavior: "smooth" });
        }
    }, [messages, loading]);

    const askPolicyAssistant = async (rawQuestion = question) => {
        const trimmedQuestion = rawQuestion.trim();
        if (!trimmedQuestion) {
            setMessages((current) => [...current, {
                role: "error",
                content: "Please enter a question.",
            }]);
            return;
        }

        setQuestion("");
        setRetryQuestion("");
        setMessages((current) => [...current, { role: "user", content: trimmedQuestion }]);
        try {
            setLoading(true);
            const result = await apiFetch("/policy-assistant", {
                method: "POST",
                body: JSON.stringify({ question: trimmedQuestion }),
            });
            setMessages((current) => [...current, {
                role: "assistant",
                content: result.answer || "Policy assistant returned no answer.",
            }]);
        } catch (requestError) {
            let content = requestError.message || "AeroFlow AI could not respond right now.";
            if (requestError.status === 504) {
                content = "The policy assistant took too long to respond. Please try again.";
            } else if (requestError.status === 502) {
                content = "Policy assistant is temporarily unavailable.";
            }
            setRetryQuestion(trimmedQuestion);
            setMessages((current) => [...current, { role: "error", content }]);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        askPolicyAssistant();
    };

    const handleComposerKeyDown = (event) => {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            askPolicyAssistant();
        }
    };

    const newChat = () => {
        setMessages([]);
        setQuestion("");
        setRetryQuestion("");
    };

    return <div className="operations-page"><nav className="operations-nav"><strong onClick={() => navigate("/")}><Plane size={20} /> AeroFlow</strong><button className="ghost-button" onClick={() => navigate("/")}><ArrowLeft size={16} /> Flights</button></nav><main className="operations-container"><div className="page-intro"><span className="eyebrow">AEROFLOW PLATFORM</span><h1>System capabilities</h1><p>Background airline operations are coordinated by n8n while FastAPI remains the live operational ledger.</p></div><section className="policy-assistant"><div className="chat-header"><div className="chat-title"><div className={`ai-mark ${loading ? "is-thinking" : ""}`}><Sparkles size={19} /></div><div><div className="chat-name">AeroFlow AI <span className="online-status"><i /> AI Online</span></div><p>Your intelligent airline policy assistant</p></div></div><button className="new-chat-button" type="button" onClick={newChat}><Plus size={15} /> New chat</button></div><div className="chat-panel"><div className="chat-history" ref={conversationRef} aria-live="polite">{messages.length === 0 && <div className="chat-welcome"><div className="welcome-mark"><Sparkles size={26} /></div><h2>Hi, I&apos;m AeroFlow AI</h2><p>Ask me anything about airline policies, fares, refunds, cancellations, baggage, or booking rules.</p><div className="suggestion-grid">{suggestions.map((suggestion) => <button type="button" className="suggestion-chip" key={suggestion} onClick={() => askPolicyAssistant(suggestion)} disabled={loading}>{suggestion}<ChevronRight size={15} /></button>)}</div></div>}{messages.map((message, index) => <div className={`chat-message ${message.role}`} key={`${message.role}-${index}`}>{message.role === "user" ? <div className="user-bubble">{message.content}</div> : <div className="assistant-message"><div className="assistant-avatar"><Sparkles size={15} /></div><div className="assistant-content"><span>AeroFlow AI</span><div className="assistant-bubble">{message.content}{message.role === "error" && retryQuestion && index === messages.length - 1 && <button type="button" className="retry-button" onClick={() => askPolicyAssistant(retryQuestion)}>Try again</button>}</div></div></div>}</div>)}{loading && <div className="chat-message assistant"><div className="assistant-message"><div className="assistant-avatar is-thinking"><Sparkles size={15} /></div><div className="assistant-content"><span>AeroFlow AI</span><div className="assistant-bubble thinking-bubble"><span>Searching airline policies</span><div className="thinking-dots"><i /><i /><i /></div></div></div></div></div>}</div><form className="chat-composer" onSubmit={handleSubmit}><textarea value={question} onChange={(event) => setQuestion(event.target.value)} onKeyDown={handleComposerKeyDown} placeholder="Ask AeroFlow AI about airline policies..." rows="1" aria-label="Ask AeroFlow AI" disabled={loading} /><button type="submit" className="send-button" aria-label="Send question" disabled={loading || !question.trim()}><Send size={17} /></button></form></div></section><div className="service-grid">{services.map((service) => <article className="service-card" key={service}><div className="service-icon"><CheckCircle2 size={20} /></div><div><h3>{service}</h3><span><Bot size={14} /> Automated / Background Service</span></div></article>)}</div></main></div>;
}
export default SystemFeatures;
