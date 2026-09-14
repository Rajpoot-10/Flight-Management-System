# ✈️ AeroFlow — Intelligent Flight Management & Airline Automation Platform

AeroFlow is a full-stack **Flight Management, Passenger Booking, AI Assistance, and Airline Automation Platform** built with **React, FastAPI, Supabase PostgreSQL, n8n, Pinecone, and Google Gemini**.

It combines a modern passenger booking experience with airline operational tooling, background automation, authenticated passenger services, role-based administration, and a **RAG-powered airline policy assistant — AeroFlow AI**.

> **AeroFlow — Your journey, intelligently managed.**

---

## 🚀 Core Features

### 👤 Passenger Experience

- Search available flights without authentication
- Filter unavailable, past, and cancelled flights
- Browse Economy, Business, and First Class availability
- Sign up and sign in with Supabase Authentication
- Return to the intended action after authentication
- Prefill authenticated passenger information during booking
- Select physical aircraft seats
- Temporary seat holds to prevent booking conflicts
- Confirm flight bookings
- View authenticated **My Bookings**
- Cancel eligible bookings
- Process refunds according to configured fare rules
- Join flight waitlists
- Track personal waitlist status
- Claim available waitlist offers
- Create target-price alerts
- Receive automated operational notifications

---

## 🤖 AeroFlow AI

AeroFlow includes **AeroFlow AI**, a RAG-powered airline policy assistant available through a modern floating conversational interface.

Passengers can ask questions such as:

```text
"What is the refund policy?"
"Can I cancel my booking?"
"What are flexible fares?"
"What are the baggage rules?"
```

### AeroFlow AI Architecture

```text
Passenger
    ↓
AeroFlow React UI
    ↓
POST /policy-assistant
    ↓
FastAPI
    ↓
n8n
    ↓
Pinecone Vector Store
    ↓
Google Gemini
    ↓
RAG-generated response
    ↓
FastAPI
    ↓
AeroFlow AI Chat
```

Airline policy documents are chunked, embedded, and stored in **Pinecone**. When a passenger asks a policy question, the RAG workflow retrieves relevant policy context and uses **Google Gemini** to generate a grounded response.

The n8n production webhook remains server-side and is never exposed directly to the frontend.

---

## 🛠️ Admin Portal

AeroFlow includes protected airline administration functionality.

Administrators can:

- Create flights
- Generate aircraft seats
- Manage cabin inventory
- Update flight schedules
- Cancel flights
- Manage cabin capacity
- Perform protected operational actions

Admin authorization is enforced server-side using authenticated Supabase users and profile roles.

---

## 🔐 Authentication & Authorization

AeroFlow uses **Supabase Authentication** with role-based access control.

### Visitor Flow

```text
Visitor opens AeroFlow
        ↓
Searches flights freely
        ↓
Clicks protected passenger action
        ↓
Not authenticated?
        ↓
Sign In / Sign Up
        ↓
Authentication succeeds
        ↓
Return to intended action
```

Public flight discovery remains accessible without authentication, while protected passenger and administrative operations require valid authenticated sessions where applicable.

### Roles

```text
Passenger
   └── Passenger booking and account functionality

Admin
   └── Protected airline operational functionality
```

The backend validates authorization for protected administrative operations rather than relying only on frontend route protection.

---

## 🎫 Booking Flow

```text
Search Flight
     ↓
Select Flight
     ↓
Authenticate (if required)
     ↓
Passenger Details
     ↓
Select Physical Seat
     ↓
Temporary Seat Hold
     ↓
Confirm Booking
     ↓
Booking Confirmed
     ↓
My Bookings
```

Authenticated passenger information can be prefilled into the booking experience while remaining editable where appropriate.

### Physical Seat Representation

Example seat identifiers:

```text
First:     F001, F002, ...
Business:  B001, B002, ...
Economy:   E001, E002, ...
```

Temporary seat holds reduce the risk of multiple passengers attempting to confirm the same seat simultaneously.

---

## 🕐 Waitlist System

When the requested cabin has no available inventory, passengers can join a waitlist.

```text
Passenger Joins Waitlist
        ↓
Waitlist Record Created
        ↓
n8n Monitors Inventory
        ↓
Seat Becomes Available
        ↓
Highest-Priority Matching Passenger
        ↓
Waitlist Offer Created
        ↓
Passenger Claims Offer
```

Passenger-facing interfaces use recognizable flight information rather than requiring users to manually know internal database IDs.

---

## 📉 Price Tracking

Passengers can create target-price alerts for flights.

```text
Passenger
    ↓
AeroFlow
    ↓
FastAPI
    ↓
Supabase price_alerts
    ↑
    │
   n8n
    ↓
Monitor Current Fare
    ↓
Target Condition Reached
    ↓
Passenger Notification
```

The background workflow periodically evaluates active alerts and prevents unnecessary duplicate notifications.

---

## ⚙️ Airline Automation with n8n

AeroFlow uses **n8n** as its airline automation and orchestration layer.

The project includes workflows for areas such as:

- 🔄 Automatic waitlist promotion
- 🧹 Expired seat-hold cleanup
- 📉 Price-drop alerts
- ✈️ Flight check-in reminders
- ❌ Flight cancellation notifications
- 🔁 Flight schedule-change notifications
- 💰 Pending refund escalation
- 🛡️ Fraud detection and scoring
- 📋 Historical fraud review
- 📊 Daily operations reporting
- 📊 Weekly operations reporting
- 📊 Monthly operations reporting
- 📚 Airline policy ingestion into Pinecone
- 🤖 Passenger Policy RAG assistance

Most operational workflows run through scheduled/background triggers, while interactive AI functionality can be invoked through the application backend.

Workflow definitions are maintained under:

```text
n8n_workflows/
```

---

## 🏗️ System Architecture

```text
                        ┌──────────────────────┐
                        │      Passenger       │
                        └──────────┬───────────┘
                                   │
                                   ▼
                        ┌──────────────────────┐
                        │   React + Vite UI    │
                        │      (Vercel)        │
                        └──────────┬───────────┘
                                   │ REST
                                   ▼
                        ┌──────────────────────┐
                        │       FastAPI        │
                        │      (Render)        │
                        └───────┬──────┬───────┘
                                │      │
                   ┌────────────┘      └────────────┐
                   ▼                                ▼
        ┌──────────────────────┐          ┌───────────────────┐
        │ Supabase PostgreSQL  │          │        n8n        │
        │ + Authentication     │◄────────►│   Automation      │
        └──────────────────────┘          └─────────┬─────────┘
                                                   │
                                      ┌────────────┴───────────┐
                                      ▼                        ▼
                              ┌──────────────┐          ┌──────────────┐
                              │   Pinecone   │          │Google Gemini │
                              │ Vector Store │          │     LLM      │
                              └──────────────┘          └──────────────┘
```

### Responsibility Separation

**React + Vite**
- Passenger UI
- Admin UI
- Authentication experience
- Booking interface
- AeroFlow AI chat interface

**FastAPI**
- REST API
- Booking business logic
- Authentication/authorization enforcement
- Seat holds
- Waitlists
- Refund operations
- AeroFlow AI backend gateway

**Supabase**
- PostgreSQL database
- Authentication
- User profiles
- Passenger/account relationships
- Operational data

**n8n**
- Background airline automation
- Scheduled monitoring
- Notifications
- Operational reporting
- RAG orchestration

**Pinecone + Gemini**
- Airline policy vector retrieval
- RAG-based policy assistance

---

## 🗄️ Database

AeroFlow uses **Supabase PostgreSQL**.

Major tables include:

```text
flights
flight_class_inventory
seats
passenger
bookings
booking_passengers
seat_holds
fare_rules
refunds
waitlist
notifications
audit_logs
price_alerts
profiles
```

Additional relationships and operational records support authenticated passenger access, automation, and administrative functionality.

---

## 🧰 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite |
| Backend | FastAPI |
| Database | Supabase PostgreSQL |
| Authentication | Supabase Auth |
| Automation | n8n |
| Vector Database | Pinecone |
| Generative AI | Google Gemini |
| AI Architecture | Retrieval-Augmented Generation (RAG) |
| Backend Language | Python |
| Frontend Language | JavaScript |
| API | REST |
| Frontend Deployment | Vercel |
| Backend Deployment | Render |

---

## 📁 Project Structure

```text
Flight-Management-System/
│
├── frontend/                 # React + Vite frontend
├── n8n_workflows/            # Exported n8n workflow definitions
├── supabase/
│   └── migrations/           # Supabase database/auth migrations
│
├── main.py                   # FastAPI application
├── database.py               # Database configuration
├── schemas.py                # Pydantic schemas
├── airline_policies.txt      # Airline policy knowledge source
├── requirements.txt          # Python dependencies
├── .gitignore
└── README.md
```

> The repository may retain legacy/root frontend files where deployment usage has not yet been conclusively ruled out. They should not be removed without verifying the active Vercel build configuration.

---

## ⚙️ Running Locally

### 1. Clone the Repository

```bash
git clone https://github.com/Rajpoot-10/Flight-Management-System.git
cd Flight-Management-System
```

### 2. Install Backend Dependencies

```bash
pip install -r requirements.txt
```

### 3. Start FastAPI

```bash
uvicorn main:app --reload
```

Backend:

```text
http://127.0.0.1:8000
```

Swagger documentation:

```text
http://127.0.0.1:8000/docs
```

### 4. Start the Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend:

```text
http://localhost:5173
```

---

## 🔐 Environment Variables

Never commit production credentials or API keys to GitHub.

### Backend / Render

Configure the backend with the required Supabase and integration credentials.

Example:

```env
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_KEY=<backend-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>

N8N_POLICY_WEBHOOK_URL=<n8n-production-policy-assistant-webhook>
```

`SUPABASE_SERVICE_ROLE_KEY` and the n8n production webhook URL are **server-side secrets** and must never be exposed through the React frontend.

### Frontend / Vercel

```env
VITE_API_BASE_URL=https://flight-management-system-rdmc.onrender.com
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<supabase-anon-key>
```

Only frontend-safe public configuration should use the `VITE_` prefix.

---

## 🔑 Supabase Authentication Setup

Apply:

```text
supabase/migrations/20260913000000_profiles_and_auth.sql
```

This establishes the passenger-default `profiles` model, signup behavior, and relevant profile security policies.

To promote an existing verified user to administrator:

```sql
UPDATE public.profiles
SET role = 'admin'
WHERE id = '<USER_UUID>';
```

Also apply:

```text
supabase/migrations/20260913000001_passenger_auth_link.sql
```

This links authenticated Supabase users with passenger records through `passenger.auth_user_id`.

Historical passenger records remain unaffected where no authenticated relationship exists.

The authenticated **My Bookings** flow uses:

```text
GET /me/bookings
```

The backend derives the passenger relationship from the authenticated user rather than trusting an arbitrary email or passenger ID supplied by the browser.

---

## 🛡️ Security Design

AeroFlow follows several important application-security principles:

- Supabase service-role credentials remain server-side
- n8n production webhook URLs remain server-side
- Admin authorization is validated by the backend
- Passenger identity for authenticated resources is derived server-side
- Frontend environment variables contain only browser-safe configuration
- Sensitive credentials are excluded from source control
- Protected operations require appropriate authentication/authorization

> Never commit `.env` files, API keys, service-role keys, database credentials, webhook secrets, or other sensitive values.

---

## 🌐 Deployment

AeroFlow uses separate frontend and backend deployments.

```text
GitHub
   │
   ├──────────────► Vercel
   │                 │
   │                 └── React/Vite Frontend
   │
   └──────────────► Render
                     │
                     └── FastAPI Backend
```

The backend communicates with Supabase and server-side automation integrations.

n8n workflows run independently as the background orchestration layer.

---

## 🎯 Project Highlights

- ✈️ End-to-end flight booking platform
- 🔎 Public flight discovery
- 🔐 Supabase authentication
- 👥 Passenger/Admin role separation
- 💺 Physical aircraft seat selection
- ⏳ Temporary seat holds
- 🎫 Authenticated booking management
- ❌ Booking cancellation
- 💰 Fare-rule-based refunds
- 🕐 Automated waitlist management
- 📉 Price-drop monitoring
- 📧 Automated passenger notifications
- 🔄 Schedule-change notifications
- ✈️ Check-in reminders
- 💰 Refund escalation
- 🛡️ Fraud detection workflows
- 📊 Automated operational reporting
- 🤖 AeroFlow AI conversational assistant
- 🧠 RAG-powered airline policy retrieval
- 📚 Pinecone vector knowledge base
- ⚡ FastAPI REST architecture
- 🗄️ Supabase PostgreSQL
- 🔗 n8n workflow orchestration
- ☁️ Production deployment with Vercel + Render

---

## 🧠 What This Project Demonstrates

AeroFlow combines multiple areas of modern software and AI engineering:

```text
Full-Stack Development
        +
REST API Engineering
        +
Relational Database Design
        +
Authentication & RBAC
        +
Workflow Automation
        +
Event/Scheduled Processing
        +
Vector Databases
        +
Retrieval-Augmented Generation
        +
Generative AI
        +
Cloud Deployment
```

Rather than treating AI, automation, backend engineering, and data systems as isolated components, AeroFlow integrates them into a single operational airline platform.

---

## 👨‍💻 Author

**Hassam Ali**  
Data Science & AI Engineering

GitHub: `Rajpoot-10`

---

## 📌 Project Origin

**SMIT AI & Data Science Hackathon 2026**

AeroFlow originated as an end-to-end hackathon project and has since been expanded into a broader flight-management and airline-automation platform incorporating **full-stack development, database engineering, REST APIs, authentication, workflow automation, vector retrieval, and generative AI**.

---

⭐ **AeroFlow — Your journey, intelligently managed.**
