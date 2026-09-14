import { useState } from "react";
import { ArrowLeft, Bot, CheckCircle2, Plane } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "./api";
import "./Operations.css";

const services = ["Expired seat hold release", "Automated waitlist promotion", "Flight check-in reminders", "Price drop alerts", "Daily, weekly and monthly operations reports", "Flight schedule change notifications", "Flight cancellation notifications", "Pending refund escalation", "Fraud detection and scoring", "Historical fraud review", "Airline policy RAG assistant"];
function SystemFeatures() {
    const navigate = useNavigate();
    const [question, setQuestion] = useState("");
    const [answer, setAnswer] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const askPolicyAssistant = async (event) => {
        event.preventDefault();
        const trimmedQuestion = question.trim();
        if (!trimmedQuestion) {
            setError("Please enter a question.");
            setAnswer("");
            return;
        }

        try {
            setLoading(true);
            setError("");
            setAnswer("");
            const result = await apiFetch("/policy-assistant", {
                method: "POST",
                body: JSON.stringify({ question: trimmedQuestion }),
            });
            setAnswer(result.answer || "Policy assistant returned no answer.");
        } catch (requestError) {
            if (requestError.status === 504) {
                setError("The policy assistant took too long to respond. Please try again.");
            } else if (requestError.status === 502) {
                setError("Policy assistant is temporarily unavailable.");
            } else {
                setError(requestError.message || "Unable to get a policy answer right now.");
            }
        } finally {
            setLoading(false);
        }
    };

    return <div className="operations-page"><nav className="operations-nav"><strong onClick={() => navigate("/")}><Plane size={20} /> AeroFlow</strong><button className="ghost-button" onClick={() => navigate("/")}><ArrowLeft size={16} /> Flights</button></nav><main className="operations-container"><div className="page-intro"><span className="eyebrow">AEROFLOW PLATFORM</span><h1>System capabilities</h1><p>Background airline operations are coordinated by n8n while FastAPI remains the live operational ledger.</p></div><section className="operation-card policy-assistant"><div className="section-title"><div><span className="eyebrow">PASSENGER SUPPORT</span><h2>Airline policy assistant</h2></div><Bot size={22} /></div><form className="policy-form" onSubmit={askPolicyAssistant}><label htmlFor="policy-question">Ask a policy question<textarea id="policy-question" rows="4" value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="What is the refund policy?" /></label><button className="primary-button" disabled={loading}>{loading ? "Asking..." : "Ask assistant"}</button></form>{error && <div className="notice error">{error}</div>}{answer && <div className="policy-answer"><span className="eyebrow">ANSWER</span><p>{answer}</p></div>}</section><div className="service-grid">{services.map((service) => <article className="service-card" key={service}><div className="service-icon"><CheckCircle2 size={20} /></div><div><h3>{service}</h3><span><Bot size={14} /> Automated / Background Service</span></div></article>)}</div></main></div>;
}
export default SystemFeatures;
