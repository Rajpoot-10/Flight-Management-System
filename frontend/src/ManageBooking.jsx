import { useState } from "react";
import { ArrowLeft, Search, Plane, XCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "./api";
import { confirmAction, showError, showSuccess } from "./dialogs";
import "./Operations.css";

function ManageBooking() {
    const navigate = useNavigate();
    const [bookingId, setBookingId] = useState("");
    const [record, setRecord] = useState(null);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [cancelling, setCancelling] = useState(false);

    const lookup = async (event) => {
        event.preventDefault();
        if (!bookingId.trim()) return setError("Enter a booking ID to continue.");
        try {
            setLoading(true); setError(""); setRecord(null);
            setRecord(await apiFetch(`/bookings/${encodeURIComponent(bookingId.trim())}`));
        } catch (requestError) { setError(requestError.message); await showError(requestError.message); }
        finally { setLoading(false); }
    };

    const cancel = async () => {
        const confirmation = await confirmAction(
            "This booking will be cancelled and the applicable refund will be processed."
        );
        if (!confirmation.isConfirmed) return;
        try {
            setCancelling(true); setError("");
            await apiFetch(`/bookings/${record.booking.booking_id}/cancel`, { method: "POST" });
            setRecord(await apiFetch(`/bookings/${record.booking.booking_id}`));
            await showSuccess("Booking cancelled", "Your refund details are now available below.");
        } catch (requestError) { setError(requestError.message); await showError(requestError.message); }
        finally { setCancelling(false); }
    };

    const booking = record?.booking;
    const flight = record?.flight;
    const passenger = record?.passenger;
    const refund = record?.refunds?.[0];
    const seat = record?.seats?.[0]?.seat;

    return <div className="operations-page">
        <nav className="operations-nav"><strong onClick={() => navigate("/")}><Plane size={20} /> AeroFlow</strong><button className="ghost-button" onClick={() => navigate("/")}><ArrowLeft size={16} /> Flights</button></nav>
        <main className="operations-container">
            <div className="page-intro"><span className="eyebrow">TRIP MANAGEMENT</span><h1>Manage your booking</h1><p>Retrieve your itinerary with the booking reference from your confirmation.</p></div>
            <form className="lookup-form" onSubmit={lookup}><input value={bookingId} onChange={(event) => setBookingId(event.target.value)} placeholder="Booking ID" inputMode="numeric" /><button className="primary-button" disabled={loading}><Search size={17} /> {loading ? "Searching..." : "Find booking"}</button></form>
            {error && <div className="notice error">{error}</div>}
            {booking && <section className="operation-card booking-detail">
                <div className="detail-header"><div><span className="eyebrow">BOOKING #{booking.booking_id}</span><h2>{booking.booking_status || "Booking"}</h2></div><span className={`status status-${booking.booking_status}`}>{booking.booking_status || "unknown"}</span></div>
                <div className="detail-grid">
                    <div><small>Passenger</small><strong>{passenger?.full_name || "-"}</strong><span>{passenger?.email || "-"}</span></div>
                    <div><small>Flight</small><strong>{flight?.flight_number || "-"}</strong><span>{flight?.origin} to {flight?.destination}</span></div>
                    <div><small>Departure</small><strong>{flight?.departure_time ? new Date(flight.departure_time).toLocaleString() : "-"}</strong><span>Scheduled departure</span></div>
                    <div><small>Seat</small><strong>{seat?.seat_number || "-"}</strong><span>{booking.seat_class || seat?.seat_class || "-"}</span></div>
                    <div><small>Fare</small><strong>{booking.fare_type || "-"}</strong><span>{booking.payment_status || "-"}</span></div>
                    <div><small>Total</small><strong>PKR {Number(booking.total_amount || 0).toLocaleString()}</strong><span>Paid amount</span></div>
                </div>
                {refund && <div className="notice success">Refund {refund.refund_status || "processed"}: PKR {Number(refund.refund_amount || 0).toLocaleString()}</div>}
                {booking.booking_status === "confirmed" && <button className="danger-button" onClick={cancel} disabled={cancelling}><XCircle size={17} /> {cancelling ? "Cancelling..." : "Cancel booking"}</button>}
            </section>}
        </main>
    </div>;
}

export default ManageBooking;
