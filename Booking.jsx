import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Plane,
  ArrowLeft,
  CalendarDays,
  Users,
  Armchair,
} from "lucide-react";

import "./Booking.css";
import { apiFetch } from "./api";
import { showSuccess } from "./dialogs";

function Booking() {
  const location = useLocation();
  const navigate = useNavigate();

  const { flight, seatClass, passengers } = location.state || {};
  const passengerCount = Number(passengers) || 1;

  const [availableSeats, setAvailableSeats] = useState([]);
  const [seatLoading, setSeatLoading] = useState(false);
  const [seatError, setSeatError] = useState("");
  const [showSeats, setShowSeats] = useState(false);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [processingBooking, setProcessingBooking] = useState(false);
  const [bookingError, setBookingError] = useState("");
  const [createdPassengers, setCreatedPassengers] = useState([]);
  const [seatHolds, setSeatHolds] = useState([]);
  const [bookingResult, setBookingResult] = useState(null);
  const [confirmingBooking, setConfirmingBooking] = useState(false);
  const [cancelResult, setCancelResult] = useState(null);
  const [cancellingBooking, setCancellingBooking] = useState(false);

  const handleCancelBooking = async () => {
    try {
      setCancellingBooking(true);
      setBookingError("");

      const bookingId =
        bookingResult?.booking_id ??
        bookingResult?.id;

      if (!bookingId) {
        throw new Error("Booking ID not found.");
      }

      const data = await apiFetch(`/bookings/${bookingId}/cancel`, { method: "POST" });

      setCancelResult(data);

    } catch (error) {
      setBookingError(error.message);
    } finally {
      setCancellingBooking(false);
    }
  };

  const handleConfirmBooking = async () => {
    try {
      setConfirmingBooking(true);
      setBookingError("");

      if (seatHolds.length !== passengerCount) {
        throw new Error("Seat holds are incomplete.");
      }

      const firstPassengerId =
        createdPassengers[0]?.passenger_id ??
        createdPassengers[0]?.passenger?.passenger_id ??
        createdPassengers[0]?.data?.passenger_id ??
        createdPassengers[0]?.data?.[0]?.passenger_id;

      if (!firstPassengerId) {
        throw new Error("Lead passenger ID not found.");
      }
      const firstHold = seatHolds[0];

      const holdId =
        firstHold?.hold_id ??
        firstHold?.hold?.hold_id ??
        firstHold?.seat_hold?.hold_id ??
        firstHold?.data?.hold_id ??
        firstHold?.data?.[0]?.hold_id ??
        firstHold?.result?.hold_id;

      if (!holdId) {
        throw new Error("Hold ID not found.");
      }

      const totalAmount =
        Number(inventory.base_fare || 0) * passengerCount;

      const data = await apiFetch("/bookings", {
        method: "POST",
        body: JSON.stringify({
          flight_id: flight.flight_id,
          passenger_id: firstPassengerId,
          seat_class: seatClass.toLowerCase(),
          fare_type: "flexible",
          total_amount: totalAmount,
          payment_status: "paid",
          idempotency_key: crypto.randomUUID(),
          hold_id: holdId,
        }),
      });

      setBookingResult(data);
      const bookingId = data?.booking_id ?? data?.id ?? data?.[0]?.booking_id;
      await showSuccess(
        "Booking confirmed",
        bookingId
          ? `Booking #${bookingId} has been created successfully.`
          : "Your flight booking has been created successfully."
      );
      navigate("/");

    } catch (error) {
      setBookingError(error.message);
    } finally {
      setConfirmingBooking(false);
    }
  };


  const handleCreatePassengerAndHoldSeats = async () => {
    try {
      setProcessingBooking(true);
      setBookingError("");

      const incompletePassenger = passengerForms.some(
        (p) =>
          !p.full_name.trim() ||
          !p.email.trim() ||
          !p.phone.trim() ||
          !p.passport_number.trim() ||
          !p.nationality.trim()
      );

      if (incompletePassenger) {
        throw new Error("Please complete all passenger details.");
      }

      if (selectedSeats.length !== passengerCount) {
        throw new Error(
          `Please select exactly ${passengerCount} seat(s).`
        );
      }

      const passengerRecords = [];
      const holdRecords = [];

      for (let i = 0; i < passengerForms.length; i++) {
        const passenger = passengerForms[i];
        const seat = selectedSeats[i];

        // 1. Create passenger
        const passengerData = await apiFetch("/passenger", {
          method: "POST",
          body: JSON.stringify(passenger),
        });


        const passengerId =
          passengerData.passenger_id ??
          passengerData.passenger?.passenger_id ??
          passengerData.data?.passenger_id ??
          passengerData.data?.[0]?.passenger_id;

        if (!passengerId) {
          throw new Error(
            "Passenger ID was not returned by the API."
          );
        }

        passengerRecords.push(passengerData);

        // 2. Create seat hold
        const holdData = await apiFetch("/seat-holds", {
          method: "POST",
          body: JSON.stringify({
            flight_id: flight.flight_id,
            seat_id: seat.seat_id,
            passenger_id: passengerId,
            seat_class: seatClass.toLowerCase(),
          }),
        });

        holdRecords.push(holdData);
      }

      setCreatedPassengers(passengerRecords);
      setSeatHolds(holdRecords);

    } catch (error) {
      setBookingError(error.message);
    } finally {
      setProcessingBooking(false);
    }
  };

  const [passengerForms, setPassengerForms] = useState(
    Array.from({ length: passengerCount }, () => ({
      full_name: "",
      email: "",
      phone: "",
      passport_number: "",
      nationality: "",
    }))
  );

  useEffect(() => {
    setAvailableSeats([]);
    setSeatError("");
    setShowSeats(false);
    setSelectedSeats([]);
    setBookingError("");
    setCreatedPassengers([]);
    setSeatHolds([]);
    setBookingResult(null);
    setProcessingBooking(false);
    setConfirmingBooking(false);

    setPassengerForms(
      Array.from({ length: passengerCount }, () => ({
        full_name: "",
        email: "",
        phone: "",
        passport_number: "",
        nationality: "",
      }))
    );
  }, [flight?.flight_id, seatClass, passengerCount]);

  const handleSeatSelect = (seat) => {
    const alreadySelected = selectedSeats.some(
      (item) => item.seat_id === seat.seat_id
    );

    if (alreadySelected) {
      setSelectedSeats((current) =>
        current.filter((item) => item.seat_id !== seat.seat_id)
      );
      return;
    }

    if (selectedSeats.length >= passengerCount) {
      return;
    }

    setSelectedSeats((current) => [...current, seat]);
  };

  const handlePassengerChange = (index, field, value) => {
    setPassengerForms((current) =>
      current.map((passenger, i) =>
        i === index ? { ...passenger, [field]: value } : passenger
      )
    );
  };

  const handleContinueToSeats = async () => {
    if (!flight) return;

    try {
      setSeatLoading(true);
      setSeatError("");

      setBookingResult(null);
      setBookingError("");
      setCreatedPassengers([]);
      setSeatHolds([]);
      setSelectedSeats([]);

      const url =
        `/flights/${flight.flight_id}/seats` +
        `?seat_class=${encodeURIComponent((seatClass || "").toLowerCase())}`;

      const data = await apiFetch(url);

      setAvailableSeats(Array.isArray(data) ? data : []);
      setShowSeats(true);
    } catch (error) {
      setSeatError(error.message || "Failed to load available seats");
    } finally {
      setSeatLoading(false);
    }
  };

  if (!flight) {
    return (
      <div className="booking-empty">
        <h2>No flight selected</h2>
        <p>Please search and select a flight first.</p>
        <button onClick={() => navigate("/")}>Back to Flights</button>
      </div>
    );
  }

  const inventory = flight.inventory || {};

  return (
    <div className="booking-page">
      <nav className="booking-navbar">
        <div className="booking-brand">
          <div className="booking-logo">
            <Plane size={21} />
          </div>
          <span>AeroFlow</span>
        </div>

        <button className="back-button" onClick={() => navigate("/")}>
          <ArrowLeft size={18} />
          Back to flights
        </button>
      </nav>

      <main className="booking-container">
        <div className="booking-heading">
          <span>BOOK YOUR FLIGHT</span>
          <h1>Complete your journey</h1>
          <p>
            Review your selected flight and continue with passenger and seat
            details.
          </p>
        </div>

        <div className="booking-layout">
          <section className="booking-main">
            <div className="booking-card flight-summary">
              <div className="summary-top">
                <div>
                  <span className="small-label">SELECTED FLIGHT</span>
                  <h2>{flight.flight_number}</h2>
                </div>

                <span className="status-pill">
                  {flight.flight_status || "scheduled"}
                </span>
              </div>

              <div className="route-display">
                <div>
                  <strong>{flight.origin}</strong>
                  <span>Departure</span>
                </div>

                <div className="route-line">
                  <span />
                  <Plane size={22} />
                  <span />
                </div>

                <div>
                  <strong>{flight.destination}</strong>
                  <span>Arrival</span>
                </div>
              </div>

              <div className="flight-meta">
                <div>
                  <CalendarDays size={20} />
                  <div>
                    <span>Date & Time</span>
                    <strong>
                      {new Date(flight.departure_time).toLocaleString()}
                    </strong>
                  </div>
                </div>

                <div>
                  <Armchair size={20} />
                  <div>
                    <span>Cabin</span>
                    <strong>
                      {seatClass
                        ? seatClass.charAt(0).toUpperCase() + seatClass.slice(1)
                        : "—"}
                    </strong>
                  </div>
                </div>

                <div>
                  <Users size={20} />
                  <div>
                    <span>Passengers</span>
                    <strong>{passengerCount}</strong>
                  </div>
                </div>
              </div>
            </div>

            <div className="booking-card">
              <div className="card-heading">
                <span>01</span>

                <div>
                  <h2>Passenger Details</h2>
                  <p>
                    Enter the passenger information exactly as shown on their
                    travel document.
                  </p>
                </div>
              </div>

              <div className="passengers-container">
                {passengerForms.map((passenger, index) => (
                  <div className="passenger-block" key={index}>
                    <h3>Passenger {index + 1}</h3>

                    <div className="passenger-form">
                      <div className="form-field full">
                        <label>Full Name</label>
                        <input
                          type="text"
                          value={passenger.full_name}
                          placeholder="Enter full name"
                          onChange={(e) =>
                            handlePassengerChange(index, "full_name", e.target.value)
                          }
                        />
                      </div>

                      <div className="form-field">
                        <label>Email</label>
                        <input
                          type="email"
                          value={passenger.email}
                          placeholder="name@example.com"
                          onChange={(e) =>
                            handlePassengerChange(index, "email", e.target.value)
                          }
                        />
                      </div>

                      <div className="form-field">
                        <label>Phone</label>
                        <input
                          type="tel"
                          value={passenger.phone}
                          placeholder="+92 300 0000000"
                          onChange={(e) =>
                            handlePassengerChange(index, "phone", e.target.value)
                          }
                        />
                      </div>

                      <div className="form-field">
                        <label>Passport Number</label>
                        <input
                          type="text"
                          value={passenger.passport_number}
                          placeholder="Passport number"
                          onChange={(e) =>
                            handlePassengerChange(index, "passport_number", e.target.value)
                          }
                        />
                      </div>

                      <div className="form-field">
                        <label>Nationality</label>
                        <input
                          type="text"
                          value={passenger.nationality}
                          placeholder="Nationality"
                          onChange={(e) =>
                            handlePassengerChange(index, "nationality", e.target.value)
                          }
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {showSeats && (
              <div className="booking-card">
                <div className="card-heading">
                  <span>02</span>

                  <div>
                    <h2>Seat Selection</h2>
                    <p>Choose an available {seatClass} class seat.</p>
                  </div>
                </div>

                <div className="seat-grid">
                  {availableSeats.length === 0 ? (
                    <p>No available seats found.</p>
                  ) : (
                    availableSeats.map((seat) => (
                      <button
                        type="button"
                        key={seat.seat_id}
                        className={`seat-button ${selectedSeats.some(
                          (item) => item.seat_id === seat.seat_id
                        )
                          ? "selected"
                          : ""
                          }`}
                        onClick={() => handleSeatSelect(seat)}
                      >
                        {seat.seat_number}
                      </button>
                    ))
                  )}
                </div>

                <div className="seat-selection-summary">
                  <span>Selected Seats</span>
                  <strong>
                    {selectedSeats.length > 0
                      ? selectedSeats.map((seat) => seat.seat_number).join(", ")
                      : "None"}
                  </strong>
                  <small>
                    {selectedSeats.length} of {passengerCount} selected
                  </small>
                </div>
                {!bookingResult && seatHolds.length === 0 && (
                  <button
                    className="continue-button"
                    onClick={handleCreatePassengerAndHoldSeats}
                    disabled={
                      processingBooking ||
                      selectedSeats.length !== passengerCount
                    }
                    style={{ marginTop: "20px" }}
                  >
                    {processingBooking
                      ? "Holding Seats..."
                      : "Continue to Booking"}
                  </button>
                )}

                {!bookingResult && seatHolds.length === passengerCount && (
                  <button
                    className="continue-button"
                    onClick={handleConfirmBooking}
                    disabled={confirmingBooking}
                    style={{ marginTop: "14px" }}
                  >
                    {confirmingBooking
                      ? "Confirming Booking..."
                      : "Confirm Booking"}
                  </button>

                )}

                {bookingResult && (
                  <div className="booking-success">
                    <h2>Booking Confirmed</h2>

                    <p>
                      Flight: <strong>{flight.flight_number}</strong>
                    </p>

                    <p>
                      Route:{" "}
                      <strong>
                        {flight.origin} → {flight.destination}
                      </strong>
                    </p>

                    <p>
                      Seats:{" "}
                      <strong>
                        {selectedSeats
                          .map((seat) => seat.seat_number)
                          .join(", ")}
                      </strong>
                    </p>

                    <p>
                      Booking ID:{" "}
                      <strong>
                        {bookingResult.booking_id ??
                          bookingResult.id ??
                          "Created successfully"}
                      </strong>
                    </p>

                    {/* SHOW IMMEDIATELY AFTER CONFIRMATION */}
                    {!cancelResult && (
                      <button
                        className="cancel-booking-button"
                        onClick={handleCancelBooking}
                        disabled={cancellingBooking}
                      >
                        {cancellingBooking
                          ? "Cancelling Booking..."
                          : "Cancel Booking"}
                      </button>
                    )}

                    {cancelResult && (
                      <div className="cancel-result">
                        <strong>Booking Cancelled</strong>

                        {cancelResult.refund_amount !== undefined && (
                          <p>
                            Refund: PKR{" "}
                            {Number(
                              cancelResult.refund_amount
                            ).toLocaleString()}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}
                {bookingError && (
                  <p
                    style={{
                      color: "red",
                      marginTop: "12px",
                      fontSize: "13px",
                    }}
                  >
                    {bookingError}
                  </p>
                )}
              </div>

            )}
          </section>

          <aside className="booking-sidebar">
            <div className="booking-card fare-card">
              <span className="small-label">BOOKING SUMMARY</span>
              <h2>Fare details</h2>

              <div className="fare-row">
                <span>Flight</span>
                <strong>{flight.flight_number}</strong>
              </div>

              <div className="fare-row">
                <span>Cabin</span>
                <strong>{seatClass || "—"}</strong>
              </div>

              <div className="fare-row">
                <span>Passengers</span>
                <strong>{passengerCount}</strong>
              </div>

              {inventory.available_seats !== undefined && (
                <div className="fare-row">
                  <span>Seats available</span>
                  <strong>{inventory.available_seats}</strong>
                </div>
              )}

              {inventory.base_fare != null && (
                <>
                  <div className="fare-divider" />
                  <div className="fare-total">
                    <span>Base fare</span>
                    <strong>
                      PKR {Number(inventory.base_fare).toLocaleString()}
                    </strong>
                  </div>
                </>
              )}

              {!bookingResult && (
                <button
                  className="continue-button"
                  onClick={handleContinueToSeats}
                  disabled={seatLoading}
                >
                  {seatLoading
                    ? "Loading Seats..."
                    : "Continue to Seat Selection"}
                </button>
              )}

              {seatError && (
                <p style={{ color: "red", marginTop: "10px" }}>{seatError}</p>
              )}

              <p className="secure-text">
                Your seat will be temporarily held before booking confirmation.
              </p>
            </div>


          </aside>
        </div>
      </main>
    </div>
  );
}

export default Booking;
