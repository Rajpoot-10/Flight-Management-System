from fastapi import FastAPI, HTTPException
from database import supabase
from schemas import FlightCreate
from datetime import date
from schemas import FlightCreate, SeatHoldCreate
from fastapi import FastAPI, HTTPException
from datetime import date, datetime, timedelta, timezone
from schemas import FlightCreate, SeatHoldCreate, PassengerCreate
from schemas import (
    FlightCreate,
    SeatHoldCreate,
    PassengerCreate,
    BookingCreate,
    WaitlistCreate
)

app = FastAPI()


@app.get("/")
def home():
    return {"message": "Flight Management API is running"}


@app.get("/flights")
def get_flights():
    response = supabase.table("flights").select("*").execute()
    return response.data


@app.post("/flights")
def create_flight(flight: FlightCreate):

    flight_data = {
        "flight_number": flight.flight_number,
        "origin": flight.origin,
        "destination": flight.destination,
        "departure_time": flight.departure_time.isoformat(),
        "arrival_time": flight.arrival_time.isoformat(),
        "total_capacity": flight.total_capacity,
        "flight_status": "scheduled"
    }

    flight_response = (
        supabase
        .table("flights")
        .insert(flight_data)
        .execute()
    )

    if not flight_response.data:
        raise HTTPException(
            status_code=500,
            detail="Flight could not be created"
        )

    created_flight = flight_response.data[0]

    flight_id = created_flight["flight_id"]

    inventory_data = [
        {
            "flight_id": flight_id,
            "seat_class": "first",
            "total_seats": flight.first_seats,
            "available_seats": flight.first_seats
        },
        {
            "flight_id": flight_id,
            "seat_class": "business",
            "total_seats": flight.business_seats,
            "available_seats": flight.business_seats
        },
        {
            "flight_id": flight_id,
            "seat_class": "economy",
            "total_seats": flight.economy_seats,
            "available_seats": flight.economy_seats
        }
    ]

    inventory_response = (
        supabase
        .table("flight_class_inventory")
        .insert(inventory_data)
        .execute()
    )

    return {
        "message": "Flight created successfully",
        "flight": created_flight,
        "inventory": inventory_response.data
    }


@app.get("/search-flights")
def search_flights(
    origin: str,
    destination: str,
    travel_date: date
):
    flights_response = (
        supabase
        .table("flights")
        .select("*")
        .eq("origin", origin)
        .eq("destination", destination)
        .eq("flight_status", "Scheduled")
        .execute()
    )

    matching_flights = []

    for flight in flights_response.data:

        departure_date = flight["departure_time"][:10]

        if departure_date != str(travel_date):
            continue

        inventory_response = (
            supabase
            .table("flight_class_inventory")
            .select("*")
            .eq("flight_id", flight["flight_id"])
            .execute()
        )

        matching_flights.append({
            "flight_id": flight["flight_id"],
            "flight_number": flight["flight_number"],
            "origin": flight["origin"],
            "destination": flight["destination"],
            "departure_time": flight["departure_time"],
            "arrival_time": flight["arrival_time"],
            "available_classes": inventory_response.data
        })

    return {
        "count": len(matching_flights),
        "flights": matching_flights
    }


@app.post("/passenger")
def create_passenger(passenger: PassengerCreate):

    passenger_data = {
        "full_name": passenger.full_name,
        "email": passenger.email,
        "phone": passenger.phone,
        "passport_number": passenger.passport_number,
        "nationality": passenger.nationality
    }

    response = (
        supabase
        .table("passenger")
        .insert(passenger_data)
        .execute()
    )

    if not response.data:
        raise HTTPException(
            status_code=500,
            detail="Passenger could not be created"
        )

    return {
        "message": "Passenger created successfully",
        "passenger": response.data[0]
    }

 # for seats


@app.post("/flights/{flight_id}/generate-seats")
def generate_seats(flight_id: int):

    # 1. Check flight exists
    flight_response = (
        supabase
        .table("flights")
        .select("*")
        .eq("flight_id", flight_id)
        .execute()
    )

    if not flight_response.data:
        raise HTTPException(
            status_code=404,
            detail="Flight not found"
        )

    # 2. Prevent duplicate seat generation
    existing_seats = (
        supabase
        .table("seats")
        .select("seat_id")
        .eq("flight_id", flight_id)
        .execute()
    )

    if existing_seats.data:
        raise HTTPException(
            status_code=409,
            detail="Seats already generated for this flight"
        )

    # 3. Get class inventory
    inventory_response = (
        supabase
        .table("flight_class_inventory")
        .select("*")
        .eq("flight_id", flight_id)
        .execute()
    )

    if not inventory_response.data:
        raise HTTPException(
            status_code=404,
            detail="Flight class inventory not found"
        )

    seats_data = []

    prefixes = {
        "first": "F",
        "business": "B",
        "economy": "E"
    }

    # 4. Generate seats
    for inventory in inventory_response.data:

        seat_class = inventory["seat_class"].lower()
        total_seats = inventory["total_seats"]

        prefix = prefixes.get(seat_class)

        if not prefix:
            continue

        for number in range(1, total_seats + 1):

            seats_data.append({
                "flight_id": flight_id,
                "seat_number": f"{prefix}{number:03d}",
                "seat_class": seat_class,
                "seat_status": "available"
            })

    # 5. Insert all seats
    seat_response = (
        supabase
        .table("seats")
        .insert(seats_data)
        .execute()
    )

    return {
        "message": "Seats generated successfully",
        "flight_id": flight_id,
        "total_seats_created": len(seat_response.data),
        "seats": seat_response.data
    }


# create seat holds

@app.post("/seat-holds")
def create_seat_hold(hold: SeatHoldCreate):

    # 1. Check flight exists
    flight_response = (
        supabase
        .table("flights")
        .select("*")
        .eq("flight_id", hold.flight_id)
        .execute()
    )

    if not flight_response.data:
        raise HTTPException(
            status_code=404,
            detail="Flight not found"
        )

    # 2. Check passenger exists
    passenger_response = (
        supabase
        .table("passenger")
        .select("*")
        .eq("passenger_id", hold.passenger_id)
        .execute()
    )

    if not passenger_response.data:
        raise HTTPException(
            status_code=404,
            detail="Passenger not found"
        )

    # 3. Check seat exists
    seat_response = (
        supabase
        .table("seats")
        .select("*")
        .eq("seat_id", hold.seat_id)
        .execute()
    )

    if not seat_response.data:
        raise HTTPException(
            status_code=404,
            detail="Seat not found"
        )

    seat = seat_response.data[0]

    # 4. Check seat belongs to selected flight
    if seat["flight_id"] != hold.flight_id:
        raise HTTPException(
            status_code=400,
            detail="Seat does not belong to this flight"
        )

    # 5. Check seat class matches
    if seat["seat_class"].lower() != hold.seat_class.lower():
        raise HTTPException(
            status_code=400,
            detail="Seat class does not match"
        )

    # 6. Check seat is available
    if seat["seat_status"].lower() != "available":
        raise HTTPException(
            status_code=409,
            detail="Seat is not available"
        )
    inventory_response = (
        supabase
        .table("flight_class_inventory")
        .select("*")
        .eq("flight_id", hold.flight_id)
        .eq("seat_class", hold.seat_class)
        .execute()
    )

    if not inventory_response.data:
        raise HTTPException(
            status_code=404,
            detail="Seat class inventory not found"
        )

    inventory = inventory_response.data[0]

    if inventory["available_seats"] <= 0:
        raise HTTPException(
            status_code=409,
            detail="No seats available in this class"
        )

    # 8. Create expiry time
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=10)

    hold_data = {
        "flight_id": hold.flight_id,
        "seat_id": hold.seat_id,
        "passenger_id": hold.passenger_id,
        "seat_class": hold.seat_class,
        "hold_status": "active",
        "expires_at": expires_at.isoformat()
    }

    hold_response = (
        supabase
        .table("seat_holds")
        .insert(hold_data)
        .execute()
    )

    # 9. Mark physical seat as held
    supabase.table("seats").update(
        {
            "seat_status": "held"
        }
    ).eq(
        "seat_id",
        hold.seat_id
    ).execute()

    return {
        "message": "Seat held successfully",
        "hold": hold_response.data[0],
        "expires_in_minutes": 10
    }


# for bookings


@app.post("/bookings")
def create_booking(booking: BookingCreate):

    # 1. Prevent duplicate booking request
    existing_booking = (
        supabase
        .table("bookings")
        .select("*")
        .eq("idempotency_key", booking.idempotency_key)
        .execute()
    )

    if existing_booking.data:
        return {
            "message": "Booking already exists",
            "booking": existing_booking.data[0]
        }

    # 2. Get seat hold
    hold_response = (
        supabase
        .table("seat_holds")
        .select("*")
        .eq("hold_id", booking.hold_id)
        .execute()
    )

    if not hold_response.data:
        raise HTTPException(
            status_code=404,
            detail="Seat hold not found"
        )

    hold = hold_response.data[0]

    # 3. Hold must still be active
    if hold["hold_status"].lower() != "active":
        raise HTTPException(
            status_code=409,
            detail="Seat hold is not active"
        )

    # 4. Check hold expiry
    expires_at = datetime.fromisoformat(
        hold["expires_at"].replace("Z", "+00:00")
    )

    if datetime.now(timezone.utc) > expires_at:
        raise HTTPException(
            status_code=409,
            detail="Seat hold has expired"
        )

    # 5. Only confirm if payment is paid
    if booking.payment_status != "paid":
        raise HTTPException(
            status_code=400,
            detail="Payment must be paid before booking confirmation"
        )

    # 6. Get seat
    seat_response = (
        supabase
        .table("seats")
        .select("*")
        .eq("seat_id", hold["seat_id"])
        .execute()
    )

    if not seat_response.data:
        raise HTTPException(
            status_code=404,
            detail="Seat not found"
        )

    seat = seat_response.data[0]

    if seat["seat_status"].lower() != "held":
        raise HTTPException(
            status_code=409,
            detail="Seat is not currently held"
        )

    # 7. Get inventory
    inventory_response = (
        supabase
        .table("flight_class_inventory")
        .select("*")
        .eq("flight_id", hold["flight_id"])
        .eq("seat_class", hold["seat_class"])
        .execute()
    )

    if not inventory_response.data:
        raise HTTPException(
            status_code=404,
            detail="Flight class inventory not found"
        )

    inventory = inventory_response.data[0]

    if inventory["available_seats"] <= 0:
        raise HTTPException(
            status_code=409,
            detail="No seats available"
        )

    # 8. Create booking
    booking_data = {
        "flight_id": hold["flight_id"],
        "passenger_id": hold["passenger_id"],
        "seat_class": hold["seat_class"],
        "fare_type": booking.fare_type,
        "booking_status": "confirmed",
        "total_amount": booking.total_amount,
        "payment_status": booking.payment_status,
        "idempotency_key": booking.idempotency_key
    }

    booking_response = (
        supabase
        .table("bookings")
        .insert(booking_data)
        .execute()
    )

    if not booking_response.data:
        raise HTTPException(
            status_code=500,
            detail="Booking could not be created"
        )

    created_booking = booking_response.data[0]

    # 9. Link passenger + seat to booking
    supabase.table("booking_passengers").insert({
        "booking_id": created_booking["booking_id"],
        "passenger_id": hold["passenger_id"],
        "seat_id": hold["seat_id"],
        "passenger_status": "confirmed",
        "fare_amount": booking.total_amount
    }).execute()

    # 10. Mark seat booked
    supabase.table("seats").update({
        "seat_status": "booked"
    }).eq(
        "seat_id",
        hold["seat_id"]
    ).execute()

    # 11. Decrease class inventory
    supabase.table("flight_class_inventory").update({
        "available_seats": inventory["available_seats"] - 1
    }).eq(
        "inventory_id",
        inventory["inventory_id"]
    ).execute()

    # 12. Complete hold
    supabase.table("seat_holds").update({
        "hold_status": "completed"
    }).eq(
        "hold_id",
        booking.hold_id
    ).execute()

    return {
        "message": "Booking confirmed successfully",
        "booking": created_booking,
        "seat_id": hold["seat_id"]
    }


# cancellation and return


@app.post("/bookings/{booking_id}/cancel")
def cancel_booking(booking_id: int):

    # 1. Get booking
    booking_response = (
        supabase
        .table("bookings")
        .select("*")
        .eq("booking_id", booking_id)
        .execute()
    )

    if not booking_response.data:
        raise HTTPException(
            status_code=404,
            detail="Booking not found"
        )

    booking = booking_response.data[0]

    # Prevent cancelling twice
    if booking["booking_status"].lower() == "cancelled":
        raise HTTPException(
            status_code=409,
            detail="Booking is already cancelled"
        )

    # 2. Get fare rule
    rule_response = (
        supabase
        .table("fare_rules")
        .select("*")
        .eq("fare_type", booking["fare_type"])
        .eq("seat_class", booking["seat_class"])
        .execute()
    )

    if not rule_response.data:
        raise HTTPException(
            status_code=404,
            detail="Fare rule not found"
        )

    rule = rule_response.data[0]

    # 3. Calculate refund
    refund_amount = 0

    if rule["is_refundable"]:
        refund_amount = (
            float(booking["total_amount"])
            * float(rule["refund_percentage"])
            / 100
        )

    # 4. Find booked seat
    booking_passenger_response = (
        supabase
        .table("booking_passengers")
        .select("*")
        .eq("booking_id", booking_id)
        .execute()
    )

    if not booking_passenger_response.data:
        raise HTTPException(
            status_code=404,
            detail="Booking passenger not found"
        )

    booking_passenger = booking_passenger_response.data[0]
    seat_id = booking_passenger["seat_id"]

    # 5. Cancel booking
    supabase.table("bookings").update({
        "booking_status": "cancelled"
    }).eq(
        "booking_id", booking_id
    ).execute()

    # 6. Release physical seat
    supabase.table("seats").update({
        "seat_status": "available"
    }).eq(
        "seat_id", seat_id
    ).execute()

    # 7. Restore class inventory
    inventory_response = (
        supabase
        .table("flight_class_inventory")
        .select("*")
        .eq("flight_id", booking["flight_id"])
        .eq("seat_class", booking["seat_class"])
        .execute()
    )

    if inventory_response.data:
        inventory = inventory_response.data[0]

        supabase.table("flight_class_inventory").update({
            "available_seats": inventory["available_seats"] + 1
        }).eq(
            "inventory_id",
            inventory["inventory_id"]
        ).execute()

    # 8. Update passenger status
    supabase.table("booking_passengers").update({
        "passenger_status": "cancelled"
    }).eq(
        "booking_id", booking_id
    ).execute()

    # 9. Create refund record if refundable
    refund = None

    if refund_amount > 0:
        refund_response = (
            supabase
            .table("refunds")
            .insert({
                "booking_id": booking_id,
                "passenger_id": booking["passenger_id"],
                "refund_type": "cancellation",
                "refund_amount": refund_amount,
                "refund_status": "pending",
                "reason": "Passenger cancelled booking"
            })
            .execute()
        )

        refund = refund_response.data[0]

    return {
        "message": "Booking cancelled successfully",
        "booking_id": booking_id,
        "seat_released": seat_id,
        "refundable": rule["is_refundable"],
        "refund_amount": refund_amount,
        "refund": refund
    }


@app.post("/waitlist")
def join_waitlist(waitlist: WaitlistCreate):

    # 1. Check flight exists
    flight_response = (
        supabase
        .table("flights")
        .select("*")
        .eq("flight_id", waitlist.flight_id)
        .execute()
    )

    if not flight_response.data:
        raise HTTPException(
            status_code=404,
            detail="Flight not found"
        )

    # 2. Check passenger exists
    passenger_response = (
        supabase
        .table("passenger")
        .select("*")
        .eq("passenger_id", waitlist.passenger_id)
        .execute()
    )

    if not passenger_response.data:
        raise HTTPException(
            status_code=404,
            detail="Passenger not found"
        )

    # 3. Check class inventory
    inventory_response = (
        supabase
        .table("flight_class_inventory")
        .select("*")
        .eq("flight_id", waitlist.flight_id)
        .eq("seat_class", waitlist.seat_class)
        .execute()
    )

    if not inventory_response.data:
        raise HTTPException(
            status_code=404,
            detail="Seat class inventory not found"
        )

    inventory = inventory_response.data[0]

    # 4. Waitlist should only be used when class is full
    if inventory["available_seats"] > 0:
        raise HTTPException(
            status_code=409,
            detail="Seats are still available. Booking can be made directly."
        )

    # 5. Prevent duplicate waitlist entry
    existing = (
        supabase
        .table("waitlist")
        .select("*")
        .eq("flight_id", waitlist.flight_id)
        .eq("passenger_id", waitlist.passenger_id)
        .eq("seat_class", waitlist.seat_class)
        .in_("waitlist_status", ["waiting", "offered"])
        .execute()
    )

    if existing.data:
        raise HTTPException(
            status_code=409,
            detail="Passenger is already on the waitlist"
        )

    # 6. Create waitlist entry
    waitlist_data = {
        "flight_id": waitlist.flight_id,
        "passenger_id": waitlist.passenger_id,
        "seat_class": waitlist.seat_class,
        "fare_type": waitlist.fare_type,
        "priority_score": waitlist.priority_score,
        "waitlist_status": "waiting"
    }

    response = (
        supabase
        .table("waitlist")
        .insert(waitlist_data)
        .execute()
    )

    return {
        "message": "Passenger added to waitlist successfully",
        "waitlist": response.data[0]
    }


@app.post("/waitlist/promote/{flight_id}/{seat_class}")
def promote_waitlist(flight_id: int, seat_class: str):

    # 1. Check inventory
    inventory_response = (
        supabase
        .table("flight_class_inventory")
        .select("*")
        .eq("flight_id", flight_id)
        .eq("seat_class", seat_class)
        .execute()
    )

    if not inventory_response.data:
        raise HTTPException(
            status_code=404,
            detail="Seat class inventory not found"
        )

    inventory = inventory_response.data[0]

    if inventory["available_seats"] <= 0:
        raise HTTPException(
            status_code=409,
            detail="No seat is currently available for promotion"
        )

    # 2. Find highest-priority waiting passenger
    waitlist_response = (
        supabase
        .table("waitlist")
        .select("*")
        .eq("flight_id", flight_id)
        .eq("seat_class", seat_class)
        .eq("waitlist_status", "waiting")
        .order("priority_score", desc=True)
        .order("joined_at")
        .limit(1)
        .execute()
    )

    if not waitlist_response.data:
        raise HTTPException(
            status_code=404,
            detail="No waiting passenger found"
        )

    entry = waitlist_response.data[0]

    # 3. Create claim window
    offer_expires_at = (
        datetime.now(timezone.utc) + timedelta(minutes=10)
    )

    # 4. Mark passenger as offered
    update_response = (
        supabase
        .table("waitlist")
        .update({
            "waitlist_status": "offered",
            "offer_expires_at": offer_expires_at.isoformat()
        })
        .eq("waitlist_id", entry["waitlist_id"])
        .execute()
    )

    return {
        "message": "Waitlist passenger promoted successfully",
        "waitlist": update_response.data[0],
        "offer_valid_for_minutes": 10
    }


## if booking becomes avaible then claim
@app.post("/waitlist/{waitlist_id}/claim")
def claim_waitlist_offer(waitlist_id: int):

    # 1. Get waitlist entry
    waitlist_response = (
        supabase
        .table("waitlist")
        .select("*")
        .eq("waitlist_id", waitlist_id)
        .execute()
    )

    if not waitlist_response.data:
        raise HTTPException(
            status_code=404,
            detail="Waitlist entry not found"
        )

    entry = waitlist_response.data[0]

    # 2. Must be offered
    if entry["waitlist_status"].lower() != "offered":
        raise HTTPException(
            status_code=409,
            detail="This waitlist entry is not currently offered"
        )

    # 3. Check offer expiry
    offer_expires_at = datetime.fromisoformat(
        entry["offer_expires_at"].replace("Z", "+00:00")
    )

    if datetime.now(timezone.utc) > offer_expires_at:
        supabase.table("waitlist").update({
            "waitlist_status": "expired"
        }).eq(
            "waitlist_id", waitlist_id
        ).execute()

        raise HTTPException(
            status_code=409,
            detail="Waitlist offer has expired"
        )

    # 4. Find one available physical seat
    seat_response = (
        supabase
        .table("seats")
        .select("*")
        .eq("flight_id", entry["flight_id"])
        .eq("seat_class", entry["seat_class"])
        .eq("seat_status", "available")
        .limit(1)
        .execute()
    )

    if not seat_response.data:
        raise HTTPException(
            status_code=409,
            detail="No physical seat is currently available"
        )

    seat = seat_response.data[0]

    # 5. Create a 10-minute seat hold
    hold_expires_at = (
        datetime.now(timezone.utc) + timedelta(minutes=10)
    )

    hold_response = (
        supabase
        .table("seat_holds")
        .insert({
            "flight_id": entry["flight_id"],
            "seat_id": seat["seat_id"],
            "passenger_id": entry["passenger_id"],
            "seat_class": entry["seat_class"],
            "hold_status": "active",
            "expires_at": hold_expires_at.isoformat()
        })
        .execute()
    )

    if not hold_response.data:
        raise HTTPException(
            status_code=500,
            detail="Seat hold could not be created"
        )

    # 6. Mark seat held
    supabase.table("seats").update({
        "seat_status": "held"
    }).eq(
        "seat_id", seat["seat_id"]
    ).execute()

    # 7. Mark waitlist entry claimed
    waitlist_update = (
        supabase
        .table("waitlist")
        .update({
            "waitlist_status": "claimed"
        })
        .eq("waitlist_id", waitlist_id)
        .execute()
    )

    return {
        "message": "Waitlist offer claimed successfully",
        "waitlist": waitlist_update.data[0],
        "hold": hold_response.data[0],
        "seat": seat
    }