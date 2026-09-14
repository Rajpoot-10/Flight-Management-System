import { useEffect, useState } from "react";
import { ArrowLeft, Plane, XCircle } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { apiFetch } from "./api";
import { confirmAction, showError, showSuccess } from "./dialogs";
import "./Operations.css";

function ManageBooking() {
    const navigate = useNavigate();
    const location = useLocation();
    const [records, setRecords] = useState([]);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [cancelling, setCancelling] = useState(false);

    const loadBookings = async () => {
        try {
            setLoading(true); setError("");
            setRecords(await apiFetch("/me/bookings"));
        } catch (requestError) {
            if (requestError.status === 401) {
                navigate("/login", { replace: true, state: { from: location } });
                return;
            }
            setError(requestError.message || "Unable to load your bookings.");
        }
        finally { setLoading(false); }
    };

    useEffect(() => { loadBookings(); }, [location, navigate]);

    const cancel = async (bookingId) => {
        const confirmation = await confirmAction(
            "This booking will be cancelled and the applicable refund will be processed."
        );
        if (!confirmation.isConfirmed) return;
        try {
            setCancelling(true); setError("");
            await apiFetch(`/bookings/${bookingId}/cancel`, { method: "POST" });
            await loadBookings();
            await showSuccess("Booking cancelled", "Your refund details are now available below.");
        } catch (requestError) {
            if (requestError.status === 401) {
                navigate("/login", { replace: true, state: { from: location } });
                return;
            }
            setError(requestError.message);
            await showError(requestError.message);
        }
        finally { setCancelling(false); }
    };

    const upcoming = records.filter((record) =>
        record.flight?.departure_time
        && new Date(record.flight.departure_time) >= new Date()
        && bookingStatus(record) !== "cancelled"
    );
    const past = records.filter((record) => !upcoming.includes(record));

    function bookingStatus(record) {
        return String(record?.booking?.booking_status || "").toLowerCase();
    }

    const renderBooking = (record) => {
        const booking = record.booking;
        const flight = record.flight;
        const passenger = record.passenger;
        const refund = record.refunds?.[0];
        const seat = record.seats?.[0]?.seat;

        return <article className="operation-card booking-detail" key={booking.booking_id}>
            <div className="detail-header"><div><span className="eyebrow">BOOKING #{booking.booking_id}</span><h2>{flight?.flight_number || "Flight"}</h2></div><span className={`status status-${booking.booking_status}`}>{booking.booking_status || "unknown"}</span></div>
            <div className="detail-grid">
                <div><small>Route</small><strong>{flight?.origin || "-"} → {flight?.destination || "-"}</strong><span>{flight?.departure_time ? new Date(flight.departure_time).toLocaleString() : "-"}</span></div>
                <div><small>Passenger</small><strong>{passenger?.full_name || "-"}</strong><span>{passenger?.email || "-"}</span></div>
                <div><small>Seat</small><strong>{seat?.seat_number || "-"}</strong><span>{booking.seat_class || seat?.seat_class || "-"}</span></div>
                <div><small>Fare</small><strong>{booking.fare_type || "-"}</strong><span>{booking.payment_status || "-"}</span></div>
                <div><small>Total</small><strong>PKR {Number(booking.total_amount || 0).toLocaleString()}</strong><span>Paid amount</span></div>
            </div>
            {refund && <div className="notice success">Refund {refund.refund_status || "processed"}: PKR {Number(refund.refund_amount || 0).toLocaleString()}</div>}
            {bookingStatus(record) === "confirmed" && <button className="danger-button" onClick={() => cancel(booking.booking_id)} disabled={cancelling}><XCircle size={17} /> {cancelling ? "Cancelling..." : "Cancel booking"}</button>}
        </article>;
    };

    const renderGroup = (title, items) => <section className="booking-group"><div className="section-title"><h2>{title}</h2><span className="result-count">{items.length}</span></div>{items.length ? items.map(renderBooking) : <div className="operation-card empty-bookings"><p>No bookings yet.</p><button className="primary-button" onClick={() => navigate("/")}>Search Flights</button></div>}</section>;

    return <div className="operations-page">
        <nav className="operations-nav"><strong onClick={() => navigate("/")}><Plane size={20} /> AeroFlow</strong><button className="ghost-button" onClick={() => navigate("/")}><ArrowLeft size={16} /> Flights</button></nav>
        <main className="operations-container">
            <div className="page-intro"><span className="eyebrow">TRIP MANAGEMENT</span><h1>Manage your bookings</h1><p>View your upcoming and previous trips.</p></div>
            {error && <div className="notice error">{error}</div>}
            {loading ? <div className="operation-card empty-bookings"><p>Loading your bookings...</p></div> : records.length ? <>{renderGroup("Upcoming Trips", upcoming)}{renderGroup("Past Trips", past)}</> : <div className="operation-card empty-bookings"><p>No bookings yet.</p><button className="primary-button" onClick={() => navigate("/")}>Search Flights</button></div>}
        </main>
    </div>;
}

export default ManageBooking;
