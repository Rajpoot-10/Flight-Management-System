
# ✈️ AeroFlow — Flight Management System

AeroFlow is a full-stack **Flight Management & Airline Automation System** built with **React, FastAPI, Supabase PostgreSQL, and n8n**.

It provides passenger booking, seat management, cancellations, refunds, waitlists, price alerts, admin flight operations, and automated airline workflows.

---

## 🚀 Features

### 👤 Passenger Portal
- Search available flights
- Filter past and cancelled flights
- Choose First, Business, or Economy class
- Enter passenger details
- Select physical aircraft seats
- Temporary seat holding
- Confirm bookings
- Cancel bookings and process refunds
- Join and claim waitlist offers
- Create price-drop alerts

### 🛠️ Admin Portal
- Create flights
- Generate aircraft seats
- Manage flight inventory
- Update flight schedules
- Cancel flights
- Manage cabin capacity

---

## 🧰 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite |
| Backend | FastAPI |
| Database | Supabase PostgreSQL |
| Automation | n8n |
| Language | Python + JavaScript |
| API | REST |

---

## 🏗️ Architecture

```text
              React + Vite
                   │
                   ▼
                FastAPI
                   │
                   ▼
         Supabase PostgreSQL
             ▲           ▲
             │           │
        Booking Logic    n8n
                         │
                         ▼
                   Automation
```

FastAPI handles the core business logic, while n8n handles scheduled and background automation.

---

## 🎫 Booking Flow

```text
Search Flight
     ↓
Select Flight
     ↓
Passenger Details
     ↓
Select Seat
     ↓
Temporary Seat Hold
     ↓
Confirm Booking
     ↓
Booking Confirmed
```

The system supports physical seats such as:

```text
First:     F001, F002...
Business:  B001, B002...
Economy:   E001, E002...
```

---

## 🤖 n8n Automations

AeroFlow currently includes **7 automation workflows**:

- 📊 Daily Operations Report
- 📊 Weekly Operations Report
- 📊 Monthly Operations Report
- 🔔 Flight Check-in Reminder
- 📉 Price Drop Alert
- 🔄 Automatic Waitlist Promotion
- 🧹 Expired Seat Hold Cleanup

Most workflows operate automatically in the background without requiring frontend interaction.

---

## 🕐 Waitlist System

When seats are unavailable:

```text
Join Waitlist
     ↓
n8n Monitors Availability
     ↓
Seat Becomes Available
     ↓
Passenger Gets Offer
     ↓
Claim Offer
```

---

## 📉 Price Alerts

Passengers can create a target-price alert.

```text
Passenger → React → FastAPI → Supabase
                               ↑
                              n8n
                               ↓
                        Price Monitoring
```

n8n monitors the alert in the background and handles the configured notification workflow.

---

## 🗄️ Database

Major PostgreSQL tables include:

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
```

---

## 📁 Project Structure

```text
Flight-Management-System/
│
├── frontend/              # React + Vite UI
├── n8n_workflows/         # n8n automation JSON files
├── main.py                # FastAPI application
├── database.py            # Database configuration
├── schemas.py             # Pydantic schemas
├── requirements.txt
└── README.md
```

---

## ⚙️ Run Locally

### 1. Clone

```bash
git clone https://github.com/Rajpoot-10/Flight-Management-System.git
cd Flight-Management-System
```

### 2. Start Backend

```bash
pip install -r requirements.txt
uvicorn main:app --reload
```

FastAPI:

```text
http://127.0.0.1:8000
```

Swagger:

```text
http://127.0.0.1:8000/docs
```

### 3. Start Frontend

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

Configure your Supabase credentials in `.env`.

```env
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
```

> Never commit API keys, database credentials, or other secrets to GitHub.

---

## 🎯 Project Highlights

- Full-stack airline booking system
- Real-time seat inventory
- Physical seat selection
- Temporary seat holds
- Booking cancellation & refunds
- Automated waitlist promotion
- Price monitoring
- Scheduled operational reports
- Passenger & Admin interfaces
- n8n workflow automation
- Supabase PostgreSQL integration

---

## 👨‍💻 Author

**Hassam Ali**  
Data Science & AI Engineering

GitHub: **https://github.com/Rajpoot-10**

---

## 📌 Project

**SMIT AI & Data Science Hackathon 2026**

Built as an end-to-end project demonstrating **full-stack development, database engineering, REST APIs, and workflow automation**.

---

⭐ **AeroFlow — Your journey, intelligently managed.**
