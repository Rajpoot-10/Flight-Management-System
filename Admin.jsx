import { useEffect, useState } from "react";
import { ArrowLeft, ChevronDown, Plane, Plus, RefreshCw, Settings2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "./api";
import { confirmAction, showError, showSuccess } from "./dialogs";
import "./Operations.css";

const emptyFlight = { flight_number: "", origin: "", destination: "", departure_time: "", arrival_time: "", total_capacity: 0, first_seats: 0, business_seats: 0, economy_seats: 0, first_fare: 0, business_fare: 0, economy_fare: 0 };

function AdminFlightDropdown({ flights, value, onChange }) {
    const [open, setOpen] = useState(false);
    const selected = flights.find((item) => String(item.flight_id) === String(value));

    return <div className={`admin-flight-dropdown ${open ? "is-open" : ""}`}>
        <button type="button" className="admin-flight-trigger" aria-expanded={open} onClick={() => setOpen((current) => !current)}>
            <span className={selected ? "admin-flight-value" : "admin-flight-placeholder"}>{selected ? `${selected.flight_number} - ${selected.origin} to ${selected.destination}` : "Choose a flight"}</span>
            <ChevronDown size={17} />
        </button>
        {open && <div className="admin-flight-menu">
            <button type="button" className={`admin-flight-option ${!value ? "selected" : ""}`} onClick={() => { onChange(""); setOpen(false); }}>Choose a flight</button>
            {flights.map((item) => <button type="button" className={`admin-flight-option ${String(item.flight_id) === String(value) ? "selected" : ""}`} key={item.flight_id} onClick={() => { onChange(String(item.flight_id)); setOpen(false); }}>
                {item.flight_number} - {item.origin} to {item.destination}
            </button>)}
        </div>}
    </div>;
}

function Admin() {
    const navigate = useNavigate();
    const [flights, setFlights] = useState([]);
    const [form, setForm] = useState(emptyFlight);
    const [selected, setSelected] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const load = async () => {
        try {
            setFlights(await apiFetch("/flights"));
            setError("");
        } catch (e) {
            setError(e.message);
        }
    };

    useEffect(() => { load(); }, []);

    const update = (key, value) => setForm((current) => ({ ...current, [key]: ["total_capacity", "first_seats", "business_seats", "economy_seats", "first_fare", "business_fare", "economy_fare"].includes(key) ? Number(value) : value }));
    const create = async (event) => {
        event.preventDefault();
        try {
            setLoading(true);
            setError("");
            const result = await apiFetch("/flights", { method: "POST", body: JSON.stringify(form) });
            setMessage(`Created ${result.flight.flight_number}`);
            setForm(emptyFlight);
            await load();
            await showSuccess("Flight created", `${result.flight.flight_number} is ready for operations.`);
        } catch (e) {
            setError(e.message);
            await showError(e.message);
        } finally {
            setLoading(false);
        }
    };

    const action = async (path, options = {}, success = "Operation completed") => {
        try {
            setLoading(true);
            setError("");
            await apiFetch(path, options);
            setMessage(success);
            await load();
            await showSuccess(success);
        } catch (e) {
            setError(e.message);
            await showError(e.message);
        } finally {
            setLoading(false);
        }
    };

    const flight = flights.find((item) => String(item.flight_id) === String(selected));
    const cancelFlight = async () => {
        const confirmation = await confirmAction("All confirmed bookings on this flight may be cancelled and refunded.");
        if (!confirmation.isConfirmed) return;
        await action(`/flights/${flight.flight_id}/cancel`, { method: "POST", body: JSON.stringify({ reason: "Cancelled by airline administrator" }) }, "Flight cancellation submitted");
    };

    return <div className="operations-page">
        <nav className="operations-nav"><strong onClick={() => navigate("/")}><Plane size={20} /> AeroFlow Admin</strong><button className="ghost-button" onClick={() => navigate("/")}><ArrowLeft size={16} /> Flights</button></nav>
        <main className="operations-container">
            <div className="page-intro"><span className="eyebrow">OPERATIONS CONTROL</span><h1>Admin dashboard</h1><p>Manage fleet capacity, schedules and physical seat inventory.</p></div>
            {(message || error) && <div className={`notice ${error ? "error" : "success"}`}>{error || message}</div>}
            <section className="stats-grid"><div><small>Total flights</small><strong>{flights.length}</strong></div><div><small>Scheduled</small><strong>{flights.filter((item) => item.flight_status === "scheduled").length}</strong></div><div><small>Cancelled</small><strong>{flights.filter((item) => item.flight_status === "cancelled").length}</strong></div></section>
            <div className="admin-grid">
                <section className="operation-card"><div className="section-title"><div><span className="eyebrow">NEW ROUTE</span><h2>Create flight</h2></div><Plus size={20} /></div><form className="admin-form" onSubmit={create}>{[["flight_number", "Flight number"], ["origin", "Origin"], ["destination", "Destination"], ["departure_time", "Departure (ISO)"], ["arrival_time", "Arrival (ISO)"]].map(([key, label]) => <label key={key}>{label}<input required value={form[key]} onChange={(e) => update(key, e.target.value)} placeholder={label} /></label>)}<div className="form-three">{[["total_capacity", "Total"], ["first_seats", "First"], ["business_seats", "Business"], ["economy_seats", "Economy"]].map(([key, label]) => <label key={key}>{label}<input required type="number" min="0" value={form[key]} onChange={(e) => update(key, e.target.value)} /></label>)}</div><div className="form-three">{[["first_fare", "First fare"], ["business_fare", "Business fare"], ["economy_fare", "Economy fare"]].map(([key, label]) => <label key={key}>{label}<input required type="number" min="0" value={form[key]} onChange={(e) => update(key, e.target.value)} /></label>)}</div><button className="primary-button" disabled={loading}>Create flight</button></form></section>
                <section className="operation-card"><div className="section-title"><div><span className="eyebrow">FLIGHT CONTROL</span><h2>Selected flight</h2></div><Settings2 size={20} /></div><AdminFlightDropdown flights={flights} value={selected} onChange={setSelected} />{flight && <div className="admin-actions"><button className="secondary-button" onClick={() => action(`/flights/${flight.flight_id}/generate-seats`, { method: "POST" }, "Physical seats generated")}><RefreshCw size={16} /> Generate seats</button><button className="danger-button" onClick={cancelFlight}>Cancel entire flight</button><p className="muted">Schedule and capacity mutations remain protected by backend validation and notify affected workflows.</p></div>}</section>
            </div>
            <section className="operation-card flight-list"><div className="section-title"><h2>Flight inventory</h2><button className="icon-button" onClick={load} title="Refresh flights"><RefreshCw size={17} /></button></div>{flights.map((item) => <div className="flight-row" key={item.flight_id}><strong>{item.flight_number}</strong><span>{item.origin} to {item.destination}</span><span>{item.flight_status}</span><span>{new Date(item.departure_time).toLocaleString()}</span></div>)}</section>
        </main>
    </div>;
}

export default Admin;
