import { useEffect, useState } from "react";
import { ArrowLeft, Bell, ChevronDown, Plane, UserPlus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "./api";
import "./Operations.css";

const initial = { flight_id: "", full_name: "", email: "", phone: "", passport_number: "", nationality: "", seat_class: "economy", fare_type: "flexible", target_price: "" };

function ServiceDropdown({ value, options, onChange }) {
    const [open, setOpen] = useState(false);
    const selected = options.find((option) => option.value === value);

    return <div className={`service-dropdown ${open ? "is-open" : ""}`}>
        <button type="button" className="service-dropdown-trigger" aria-expanded={open} onClick={() => setOpen((current) => !current)}>
            <span>{selected?.label}</span>
            <ChevronDown size={17} />
        </button>
        {open && <div className="service-dropdown-menu">
            {options.map((option) => <button type="button" className={`service-dropdown-option ${option.value === value ? "selected" : ""}`} key={option.value} onClick={() => { onChange(option.value); setOpen(false); }}>
                {option.label}
            </button>)}
        </div>}
    </div>;
}

function ServiceDesk() {
    const navigate = useNavigate();
    const [form, setForm] = useState(initial);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [waitlist, setWaitlist] = useState(null);
    const [waitlistFlight, setWaitlistFlight] = useState(null);
    const [claimId, setClaimId] = useState("");

    const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));
    const passenger = async () => apiFetch("/passenger", { method: "POST", body: JSON.stringify({ full_name: form.full_name, email: form.email, phone: form.phone, passport_number: form.passport_number, nationality: form.nationality }) });
    const join = async (event) => {
        event.preventDefault();
        try {
            if (!Number(form.flight_id)) throw new Error("Enter a valid flight ID.");
            setLoading(true);
            setError("");
            const created = await passenger();
            const id = created.passenger_id || created.passenger?.passenger_id || created.data?.passenger_id;
            const result = await apiFetch("/waitlist", { method: "POST", body: JSON.stringify({ flight_id: Number(form.flight_id), passenger_id: id, seat_class: form.seat_class, fare_type: form.fare_type }) });
            setWaitlist(result.waitlist);
            setWaitlistFlight(result.flight || null);
            setClaimId(String(result.waitlist?.waitlist_id || ""));
            setMessage("You are on the waitlist.");
        } catch (e) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };
    const alert = async (event) => {
        event.preventDefault();
        try {
            const targetPrice = Number(form.target_price);
            if (!Number.isFinite(targetPrice) || targetPrice <= 0) {
                throw new Error("Target price must be greater than 0.");
            }
            if (!Number(form.flight_id)) throw new Error("Enter a valid flight ID.");
            setLoading(true);
            setError("");
            const created = await passenger();
            const id = created.passenger_id || created.passenger?.passenger_id || created.data?.passenger_id;
            await apiFetch("/price-alerts", { method: "POST", body: JSON.stringify({ flight_id: Number(form.flight_id), passenger_id: id, seat_class: form.seat_class, target_price: targetPrice }) });
            setMessage("Price alert created successfully. We'll notify you when the fare reaches your target.");
        } catch (e) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };
    const claim = async () => {
        try {
            if (!Number(claimId)) throw new Error("Enter a valid waitlist ID.");
            setLoading(true);
            setError("");
            await apiFetch(`/waitlist/${claimId}/claim`, { method: "POST" });
            await refreshStatus(claimId);
            setMessage("Waitlist offer claimed.");
        } catch (e) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    const refreshStatus = async (waitlistId) => {
        const result = await apiFetch(`/waitlist/${waitlistId}`);
        setWaitlist(result.waitlist);
        setWaitlistFlight(result.flight || null);
    };

    useEffect(() => {
        if (!waitlist?.waitlist_id || !["waiting", "offered"].includes(waitlist.waitlist_status)) return undefined;
        const interval = window.setInterval(() => {
            refreshStatus(waitlist.waitlist_id).catch(() => undefined);
        }, 20000);
        return () => window.clearInterval(interval);
    }, [waitlist?.waitlist_id, waitlist?.waitlist_status]);

    return <div className="operations-page">
        <nav className="operations-nav"><strong onClick={() => navigate("/")}><Plane size={20} /> AeroFlow</strong><button className="ghost-button" onClick={() => navigate("/")}><ArrowLeft size={16} /> Flights</button></nav>
        <main className="operations-container">
            <div className="page-intro"><span className="eyebrow">TRAVEL ALERTS</span><h1>Waitlist & price tracking</h1><p>Join a full cabin or let n8n watch a fare on your behalf.</p></div>
            {(message || error) && <div className={`notice ${error ? "error" : "success"}`}>{error || message}</div>}
            <section className="operation-card">
                <form className="admin-form" onSubmit={join}>
                    <div className="form-three">
                        <label>Flight ID<input required type="number" value={form.flight_id} onChange={(e) => update("flight_id", e.target.value)} /></label>
                        <label>Cabin<ServiceDropdown value={form.seat_class} options={[{ value: "economy", label: "Economy" }, { value: "business", label: "Business" }, { value: "first", label: "First" }]} onChange={(value) => update("seat_class", value)} /></label>
                        <label>Fare type<ServiceDropdown value={form.fare_type} options={[{ value: "flexible", label: "Flexible" }, { value: "basic", label: "Basic" }]} onChange={(value) => update("fare_type", value)} /></label>
                    </div>
                    <div className="form-three">{[["full_name", "Full name"], ["email", "Email"], ["phone", "Phone"]].map(([key, label]) => <label key={key}>{label}<input required value={form[key]} onChange={(e) => update(key, e.target.value)} /></label>)}</div>
                    <div className="form-three"><label>Passport number<input value={form.passport_number} onChange={(e) => update("passport_number", e.target.value)} /></label><label>Nationality<input value={form.nationality} onChange={(e) => update("nationality", e.target.value)} /></label><label>Target price<input type="number" min="1" value={form.target_price} onChange={(e) => update("target_price", e.target.value)} placeholder="Optional for waitlist" /></label></div>
                    <div className="admin-actions"><button className="primary-button" disabled={loading}><UserPlus size={16} /> Join waitlist</button><button type="button" className="secondary-button" disabled={loading || !form.target_price} onClick={alert}><Bell size={16} /> Track this price</button></div>
                </form>
            </section>
            {waitlist && <section className="operation-card waitlist-status-card"><span className="eyebrow">WAITLIST STATUS</span><h2>{waitlist.waitlist_status}</h2><p>{waitlist.waitlist_status === "waiting" && "You're currently on the waitlist."}{waitlist.waitlist_status === "offered" && "A seat is now available."}{waitlist.waitlist_status === "claimed" && "Your offer has been claimed."}{waitlist.waitlist_status === "expired" && "This offer has expired."}{waitlist.waitlist_status === "cancelled" && "Your waitlist entry was cancelled."}</p><div className="detail-grid"><div><small>Waitlist ID</small><strong>{waitlist.waitlist_id}</strong></div><div><small>Flight</small><strong>{waitlistFlight?.flight_number || waitlist.flight_id}</strong></div><div><small>Route</small><strong>{waitlistFlight ? `${waitlistFlight.origin} to ${waitlistFlight.destination}` : "-"}</strong></div><div><small>Cabin</small><strong>{waitlist.seat_class}</strong></div><div><small>Joined</small><strong>{waitlist.joined_at ? new Date(waitlist.joined_at).toLocaleString() : "-"}</strong></div>{waitlist.offer_expires_at && <div><small>Offer expires</small><strong>{new Date(waitlist.offer_expires_at).toLocaleString()}</strong></div>}</div>{waitlist.waitlist_status === "offered" && <button className="primary-button" onClick={claim} disabled={loading}>Claim offer</button>}</section>}
            {!waitlist && <section className="operation-card"><h2>Check waitlist status</h2><div className="lookup-form"><input type="number" value={claimId} onChange={(e) => setClaimId(e.target.value)} placeholder="Waitlist ID" /><button className="primary-button" onClick={() => refreshStatus(claimId).catch((e) => setError(e.message))} disabled={!claimId || loading}>Check status</button></div></section>}
        </main>
    </div>;
}

export default ServiceDesk;
