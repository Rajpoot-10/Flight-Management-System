import { useEffect, useState } from "react";
import { ArrowLeft, Bell, ChevronDown, Plane, UserPlus } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { apiFetch } from "./api";
import { useAuth } from "./AuthContext";
import "./Operations.css";

const initial = { flight_id: "", full_name: "", email: "", phone: "", passport_number: "", nationality: "", seat_class: "economy", fare_type: "flexible", target_price: "" };

function formatDeparture(value) {
    return new Intl.DateTimeFormat(undefined, {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
    }).format(new Date(value));
}

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
    const location = useLocation();
    const { user, profile } = useAuth();
    const routeFlightId = location.state?.flight_id || location.state?.flight?.flight_id
        || new URLSearchParams(location.search).get("flight_id") || "";
    const [form, setForm] = useState({
        ...initial,
        flight_id: String(routeFlightId),
        full_name: profile?.full_name || "",
        email: user?.email || "",
    });
    const [flights, setFlights] = useState([]);
    const [flightsLoading, setFlightsLoading] = useState(true);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [waitlists, setWaitlists] = useState([]);
    const [waitlistsLoading, setWaitlistsLoading] = useState(false);

    const statusLabels = {
        waiting: "Waiting",
        offered: "Seat Available",
        claimed: "Claimed",
        expired: "Offer Expired",
        cancelled: "Cancelled",
    };

    const loadWaitlists = async () => {
        if (!user) {
            setWaitlists([]);
            return;
        }

        try {
            setWaitlistsLoading(true);
            const records = await apiFetch("/me/waitlists");
            setWaitlists(Array.isArray(records) ? records : []);
            setError("");
        } catch (requestError) {
            if (requestError.status === 401) {
                navigate("/login", { replace: true, state: { from: location } });
                return;
            }
            if (requestError.status === 403) {
                setError("You do not have access to this waitlist.");
            } else {
                setError("Unable to load your waitlists right now.");
            }
        } finally {
            setWaitlistsLoading(false);
        }
    };

    const waitlistErrorMessage = (requestError) => {
        if (requestError.status === 403) return "You do not have access to this waitlist.";
        if (requestError.status === 500 || !requestError.status) return "Unable to load your waitlists right now.";
        return requestError.message || "Unable to load your waitlists right now.";
    };

    useEffect(() => {
        let active = true;
        apiFetch("/passenger/flights")
            .then((data) => {
                if (!active) return;
                const availableFlights = Array.isArray(data) ? data : [];
                setFlights(availableFlights);
                setForm((current) => ({
                    ...current,
                    flight_id: availableFlights.some((flight) => String(flight.flight_id) === String(current.flight_id))
                        ? current.flight_id
                        : "",
                }));
            })
            .catch(() => {
                if (active) setFlights([]);
            })
            .finally(() => {
                if (active) setFlightsLoading(false);
            });

        return () => {
            active = false;
        };
    }, []);

    useEffect(() => {
        setForm((current) => ({
            ...current,
            full_name: current.full_name || profile?.full_name || "",
            email: current.email || user?.email || "",
        }));
    }, [profile?.full_name, user?.email]);

    useEffect(() => {
        loadWaitlists();
    }, [user?.id]);

    const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));
    const requireAuth = () => {
        if (user) return true;
        navigate("/login", { state: { from: location } });
        return false;
    };
    const passenger = async () => apiFetch("/passenger", { method: "POST", body: JSON.stringify({ full_name: form.full_name, email: form.email, phone: form.phone, passport_number: form.passport_number, nationality: form.nationality }) });
    const join = async (event) => {
        event.preventDefault();
        if (!requireAuth()) return;
        try {
            if (!form.flight_id) throw new Error("Please select a flight.");
            setLoading(true);
            setError("");
            const created = await passenger();
            const id = created.passenger_id || created.passenger?.passenger_id || created.data?.passenger_id;
            await apiFetch("/waitlist", { method: "POST", body: JSON.stringify({ flight_id: Number(form.flight_id), passenger_id: id, seat_class: form.seat_class, fare_type: form.fare_type }) });
            await loadWaitlists();
            setMessage("You are on the waitlist.");
        } catch (e) {
            if (e.status === 401) {
                navigate("/login", { replace: true, state: { from: location } });
                return;
            }
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };
    const alert = async (event) => {
        event.preventDefault();
        if (!requireAuth()) return;
        try {
            const targetPrice = Number(form.target_price);
            if (!Number.isFinite(targetPrice) || targetPrice <= 0) {
                throw new Error("Target price must be greater than 0.");
            }
            if (!form.flight_id) throw new Error("Please select a flight.");
            setLoading(true);
            setError("");
            const created = await passenger();
            const id = created.passenger_id || created.passenger?.passenger_id || created.data?.passenger_id;
            await apiFetch("/price-alerts", { method: "POST", body: JSON.stringify({ flight_id: Number(form.flight_id), passenger_id: id, seat_class: form.seat_class, target_price: targetPrice }) });
            setMessage("Price alert created successfully. We'll notify you when the fare reaches your target.");
        } catch (e) {
            if (e.status === 401) {
                navigate("/login", { replace: true, state: { from: location } });
                return;
            }
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };
    const claim = async (waitlistId) => {
        if (!requireAuth()) return;
        try {
            setLoading(true);
            setError("");
            await apiFetch(`/waitlist/${waitlistId}/claim`, { method: "POST" });
            await loadWaitlists();
            setMessage("Waitlist offer claimed.");
        } catch (e) {
            if (e.status === 401) {
                navigate("/login", { replace: true, state: { from: location } });
                return;
            }
            setError(waitlistErrorMessage(e));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!user || !waitlists.some(({ waitlist }) => ["waiting", "offered"].includes(waitlist.waitlist_status))) return undefined;
        const interval = window.setInterval(() => {
            loadWaitlists();
        }, 20000);
        return () => window.clearInterval(interval);
    }, [user?.id, waitlists]);

    const formatWaitlistStatus = (status) => statusLabels[status] || status;

    return <div className="operations-page">
        <nav className="operations-nav"><strong onClick={() => navigate("/")}><Plane size={20} /> AeroFlow</strong><button className="ghost-button" onClick={() => navigate("/")}><ArrowLeft size={16} /> Flights</button></nav>
        <main className="operations-container">
            <div className="page-intro"><span className="eyebrow">TRAVEL ALERTS</span><h1>Waitlist & price tracking</h1><p>Join a full cabin or let n8n watch a fare on your behalf.</p></div>
            {(message || error) && <div className={`notice ${error ? "error" : "success"}`}>{error || message}</div>}
            <section className="operation-card">
                <form className="admin-form" onSubmit={join}>
                    <div className="form-three">
                        <label>Flight<select required value={form.flight_id} onChange={(e) => update("flight_id", e.target.value)} disabled={flightsLoading}>
                            <option value="">{flightsLoading ? "Loading flights..." : "Select a flight"}</option>
                            {flights.map((flight) => <option key={flight.flight_id} value={String(flight.flight_id)}>
                                {flight.flight_number} — {flight.origin} → {flight.destination} — {formatDeparture(flight.departure_time)}
                            </option>)}
                        </select></label>
                        <label>Cabin<ServiceDropdown value={form.seat_class} options={[{ value: "economy", label: "Economy" }, { value: "business", label: "Business" }, { value: "first", label: "First" }]} onChange={(value) => update("seat_class", value)} /></label>
                        <label>Fare type<ServiceDropdown value={form.fare_type} options={[{ value: "flexible", label: "Flexible" }, { value: "basic", label: "Basic" }]} onChange={(value) => update("fare_type", value)} /></label>
                    </div>
                    <div className="form-three">{[["full_name", "Full name"], ["email", "Email"], ["phone", "Phone"]].map(([key, label]) => <label key={key}>{label}<input required value={form[key]} onChange={(e) => update(key, e.target.value)} /></label>)}</div>
                    <div className="form-three"><label>Passport number<input value={form.passport_number} onChange={(e) => update("passport_number", e.target.value)} /></label><label>Nationality<input value={form.nationality} onChange={(e) => update("nationality", e.target.value)} /></label><label>Target price<input type="number" min="1" value={form.target_price} onChange={(e) => update("target_price", e.target.value)} placeholder="Optional for waitlist" /></label></div>
                    <div className="admin-actions"><button className="primary-button" disabled={loading}><UserPlus size={16} /> Join waitlist</button><button type="button" className="secondary-button" disabled={loading || !form.target_price} onClick={alert}><Bell size={16} /> Track this price</button></div>
                </form>
            </section>
            <section className="operation-card waitlists-section">
                <div className="section-title"><div><span className="eyebrow">PASSENGER ACCOUNT</span><h2>My Waitlists</h2></div></div>
                {waitlistsLoading && <p className="muted">Loading your waitlists...</p>}
                {!waitlistsLoading && !user && <p className="muted">Sign in to view your waitlists.</p>}
                {!waitlistsLoading && user && !waitlists.length && <p className="muted">No active waitlists.</p>}
                {!waitlistsLoading && waitlists.map(({ waitlist, flight }) => (
                    <article className="waitlist-entry" key={waitlist.waitlist_id}>
                        <div className="detail-header"><div><span className="eyebrow">{flight?.flight_number || "Flight"}</span><h2>{flight ? `${flight.origin} → ${flight.destination}` : "Flight details unavailable"}</h2></div><span className={`status status-${waitlist.waitlist_status}`}>{formatWaitlistStatus(waitlist.waitlist_status)}</span></div>
                        <div className="detail-grid">
                            <div><small>Departure</small><strong>{flight?.departure_time ? new Date(flight.departure_time).toLocaleString() : "-"}</strong></div>
                            <div><small>Cabin</small><strong>{waitlist.seat_class}</strong></div>
                            <div><small>Joined</small><strong>{waitlist.joined_at ? new Date(waitlist.joined_at).toLocaleString() : "-"}</strong></div>
                            {waitlist.offer_expires_at && <div><small>Offer expires</small><strong>{new Date(waitlist.offer_expires_at).toLocaleString()}</strong></div>}
                        </div>
                        {waitlist.waitlist_status === "offered" && new Date(waitlist.offer_expires_at) > new Date() && <button className="primary-button" onClick={() => claim(waitlist.waitlist_id)} disabled={loading}>Claim Offer</button>}
                    </article>
                ))}
            </section>
        </main>
    </div>;
}

export default ServiceDesk;
