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
- Transaction-safe booking confirmation
- Idempotency handling
- Seat inventory management
- Basic and Flexible fare rules
- Transaction-safe booking cancellation
- Refund handling
- Database constraints and validation
- Waitlist joining
- Priority-based waitlist promotion
- Row-locking with FOR UPDATE SKIP LOCKED
- Waitlist offer claim flow
- Transaction-safe waitlist claiming
- 10-minute waitlist offer window
- Expired seat-hold cleanup automation
- Automatic seat release
- Automated promotion of the next waitlisted passenger
- Scheduled check-in reminder automation
- Cancelled-flight reminder suppression
- Gmail check-in reminder sending
- Notification logging in Supabase
- Duplicate reminder prevention / notification de-duplication
- Shared FastAPI + Supabase + n8n architecture
- Automated price-drop detection
- Gmail price-drop alert sending
- Price-drop notification de-duplication
- Daily operations reporting automation
- Weekly operations reporting automation
- Monthly operations reporting automation
- Automated flight, booking, refund, and waitlist reporting
- Revenue and refund aggregation
- Net revenue calculation
- Automated operations reports through Gmail
-  Airline policy RAG knowledge base
- Google Gemini policy embeddings
- Pinecone vector search and semantic policy retrieval
- Grounded AI passenger-policy responses
- Gmail-based passenger support automation
- Human-in-the-loop approval for AI-generated responses
- Approved responses sent to the original passenger
- Rejected AI responses suppressed

## n8n Workflows

### 1. Release Expired Seat Holds
Runs every 5 minutes and:
- detects expired active seat holds
- marks expired holds as expired
- releases the associated physical seats
- triggers promotion of the next eligible waitlisted passenger when a seat becomes available

### 2. Waitlist Promotion
Runs every 5 minutes and:
- detects available seat inventory
- calls the PostgreSQL waitlist promotion RPC
- selects the highest-priority waiting passenger
- uses row locking to prevent duplicate promotions
- marks the selected passenger as offered
- creates a 10-minute claim window

### 3. Flight Check-in Reminder
Runs every 30 minutes and:
- detects confirmed and paid bookings
- retrieves scheduled flight details
- identifies flights departing within the next 24 hours
- suppresses reminders for cancelled/non-scheduled flights
- retrieves the passenger's email
- checks whether a reminder has already been sent
- sends the check-in reminder through Gmail
- records the notification in Supabase
- prevents duplicate reminder emails on future workflow runs



### 4. Price Drop Alert
Runs every 30 minutes and:
- retrieves active passenger price alerts
- checks the current fare for the requested flight and seat class
- compares the current fare against the passenger's target price
- detects when the fare reaches or falls below the target
- retrieves passenger contact information
- sends price-drop alerts through Gmail
- stores the last notified fare
- prevents duplicate alerts for the same price

### 5. Operations Reporting
Automatically generates:
- daily operations reports
- weekly operations reports
- monthly operations reports
- flight activity summaries
- booking and cancellation statistics
- total revenue
- total refunds
- net revenue
- waitlist activity statistics
- automated Gmail reports for operational monitoring

### 6. Airline Policy Ingestion to Pinecone
Runs when airline policy knowledge needs to be created or updated and:
- loads the airline policy document
- splits policy content into semantic chunks
- processes chunks through the n8n data loader
- generates vector embeddings using Google Gemini Embeddings
- stores policy vectors in the Pinecone `airline-policies` index
- preserves policy content for semantic retrieval
- provides the knowledge base used by the passenger RAG assistant

### 7. Passenger Policy RAG Assistant
Processes passenger policy questions through Gmail and:
- detects new passenger emails using Gmail Trigger
- extracts the passenger email, subject, and question
- generates a query embedding using Google Gemini Embeddings
- retrieves the most relevant airline policy documents from Pinecone
- provides retrieved policy context to the Gemini-powered RAG assistant
- generates an answer grounded in the retrieved airline policies
- avoids inventing unsupported airline rules
- sends the proposed AI response for human approval
- waits for an explicit approve or reject decision
- sends approved responses to the original passenger through Gmail
- prevents rejected AI responses from being sent

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
        Flight Check-in Reminder
        Price Drop Aler
        Operations Reporting
        Airline Policy Ingestion to Pinecone
         Passenger Policy RAG Assistant
        
        

```

## Technology Stack

- Python
- FastAPI
- Supabase
- PostgreSQL
- n8n
- Pydantic
- REST API

## Security

Sensitive credentials such as the Supabase secret key are excluded from the repository. n8n workflow exports use placeholder credentials and must be configured after import.

## Author

**Hassam Ali**

AI & Data Science — SMIT
