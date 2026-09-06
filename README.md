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

## API Documentation

After starting the FastAPI server, open:

```text
http://127.0.0.1:8000/docs
```

The Swagger UI can be used to test the available Flight Management System endpoints.

## Environment Setup

Create a `.env` file in the project root:

```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_secret_key
```

> The actual `.env` file is excluded from GitHub for security.

## Installation

Install the required dependencies:

```bash
pip install -r requirements.txt
```

Then start the API:

```bash
uvicorn main:app --reload
```

## Project Structure

```text
flight_management_system/
├── main.py
├── schemas.py
├── database.py
├── requirements.txt
├── README.md
├── .gitignore
└── n8n_workflows/
    ├── Release Expired Seat Holds.json
    └── Promote Waitlist When Seats Are Available.json
```

## Technology Stack

- Python
- FastAPI
- Supabase
- PostgreSQL
- n8n
- Pydantic
- REST API

## Current Scope

The current implementation focuses on the core flight booking lifecycle and scheduled database automation.

Advanced capstone components such as Pinecone/RAG policy retrieval, Gmail notifications, fraud detection, operational reporting, and some production-level concurrency controls are not fully implemented.

## Security

Sensitive credentials such as the Supabase secret key are excluded from the repository. n8n workflow exports use placeholder credentials and must be configured after import.

## Author

**Hassam Ali**

AI & Data Science — SMIT
