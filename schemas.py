from pydantic import BaseModel
from pydantic import BaseModel, Field, model_validator
from datetime import datetime
from pydantic import BaseModel, EmailStr
from typing import Literal


class FlightCreate(BaseModel):
    flight_number: str
    origin: str
    destination: str
    departure_time: datetime
    arrival_time: datetime

    total_capacity: int = Field(gt=0)

    first_seats: int = Field(gt=0)
    business_seats: int = Field(gt=0)
    economy_seats: int = Field(gt=0)

    @model_validator(mode="after")
    def validate_flight(self):
        seat_total = (
            self.first_seats
            + self.business_seats
            + self.economy_seats
        )

        if seat_total != self.total_capacity:
            raise ValueError(
                "First + Business + Economy seats must equal total_capacity"
            )

        if self.arrival_time <= self.departure_time:
            raise ValueError(
                "arrival_time must be after departure_time"
            )

        if self.origin.lower() == self.destination.lower():
            raise ValueError(
                "origin and destination cannot be the same"
            )

        return self


class SeatHoldCreate(BaseModel):
    flight_id: int
    passenger_id: int
    seat_id: int
    seat_class: Literal["first", "business", "economy"]


class PassengerCreate(BaseModel):
    full_name: str
    email: EmailStr
    phone: str | None = None
    passport_number: str | None = None
    nationality: str | None = None


class BookingCreate(BaseModel):
    hold_id: int
    fare_type: Literal["basic", "flexible"]
    total_amount: float
    payment_status: Literal["paid", "pending"]
    idempotency_key: str

class WaitlistCreate(BaseModel):
    flight_id: int
    passenger_id: int
    seat_class: Literal["first", "business", "economy"]
    fare_type: Literal["basic", "flexible"]
    priority_score: int = 0


class PriceAlertCreate(BaseModel):
    flight_id: int
    passenger_id: int
    seat_class: Literal["first", "business", "economy"]
    target_price: float = Field(gt=0)