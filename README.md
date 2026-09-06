# Flight Management System

A capstone project built using FastAPI, Supabase PostgreSQL, and n8n.

## Architecture

- FastAPI handles live booking operations.
- Supabase PostgreSQL is the shared database.
- n8n handles scheduled/background automation.

## Implemented Features

- Flight creation
- Flight search
- Passenger creation
- Physical seat generation
- Temporary seat holds
- Booking confirmation
- Idempotency handling
- Seat inventory management
- Basic and Flexible fare rules
- Booking cancellation
- Refund handling
- Waitlist joining
- Waitlist promotion
- Waitlist claim flow
- Expired seat-hold cleanup automation
- Automated waitlist promotion

## n8n Workflows

### 1. Release Expired Seat Holds
Runs every 5 minutes and:
- detects expired active holds
- marks holds as expired
- releases held seats

### 2. Waitlist Promotion
Runs every 5 minutes and:
- detects available seats
- finds the highest-priority waiting passenger
- marks the passenger as offered
- creates a 10-minute claim window

## Run FastAPI

```bash
uvicorn main:app --reload