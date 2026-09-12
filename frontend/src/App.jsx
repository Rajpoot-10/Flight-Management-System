import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Plane,
  Search,
  Sparkles,
  ShieldCheck,
  Bell,
  MapPin,
  CalendarDays,
  Users,
  BarChart3,
  ChevronDown,
} from "lucide-react";

import "./App.css";
import heroImage from "./assets/aeroflow-hero.png";
import { apiFetch } from "./api";

const airports = [
  { city: "Karachi", code: "KHI" },
  { city: "Lahore", code: "LHE" },
  { city: "Islamabad", code: "ISB" },
  { city: "Faisalabad", code: "LYP" },
  { city: "Dubai", code: "DXB" },
  { city: "Manchester", code: "MAN" },
];

const airportAliases = new Map(
  airports.flatMap((airport) => [
    [airport.code.toLowerCase(), airport],
    [airport.city.toLowerCase(), airport],
  ])
);

function getLocalDateString() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function LandingDropdown({ label, value, placeholder, options, onChange }) {
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.value === value);

  return (
    <div className={`landing-dropdown ${open ? "is-open" : ""}`}>
      <span className="dropdown-label">{label}</span>
      <button
        type="button"
        className="dropdown-trigger"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <span className={selected ? "dropdown-value" : "dropdown-placeholder"}>
          {selected?.label || placeholder}
        </span>
        <ChevronDown size={17} />
      </button>
      {open && (
        <div className="dropdown-menu">
          {options.map((option) => (
            <button
              type="button"
              className={`dropdown-option ${option.value === value ? "selected" : ""}`}
              key={option.value}
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function App() {
  const navigate = useNavigate();
  const today = getLocalDateString();
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [departureDate, setDepartureDate] = useState("");
  const [seatClass, setSeatClass] = useState("economy");
  const [passengers, setPassengers] = useState(1);

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);
  const [availableRoutes, setAvailableRoutes] = useState([]);

  useEffect(() => {
    let active = true;

    apiFetch("/passenger/routes")
      .then((data) => {
        if (active && Array.isArray(data?.routes)) {
          setAvailableRoutes(data.routes);
        }
      })
      .catch(() => {
        if (active) setAvailableRoutes([]);
      });

    return () => {
      active = false;
    };
  }, []);

  const routeLocations = Array.from(
    new Map(
      availableRoutes
        .map((route) => route.origin)
        .filter(Boolean)
        .map((location) => {
          const rawLocation = String(location).trim();
          const airport = airportAliases.get(rawLocation.toLowerCase());
          const normalized = airport || {
            city: rawLocation,
            code: rawLocation,
          };
          return [rawLocation.toLowerCase(), { ...normalized, value: rawLocation }];
        })
    ).values()
  );

  const locations = routeLocations.length > 0 ? routeLocations : airports;
  const locationOptions = routeLocations.length > 0 ? locations.map((airport) => ({
    value: airport.value || airport.code,
    label: `${airport.city} (${airport.code})`,
  })) : [];
  const destinationLocations = Array.from(
    new Map(
      availableRoutes
        .filter((route) => route.origin === origin)
        .map((route) => route.destination)
        .filter(Boolean)
        .map((location) => {
          const rawLocation = String(location).trim();
          const airport = airportAliases.get(rawLocation.toLowerCase());
          const normalized = airport || { city: rawLocation, code: rawLocation };
          return [rawLocation.toLowerCase(), { ...normalized, value: rawLocation }];
        })
    ).values()
  );
  const destinationOptions = destinationLocations.map((airport) => ({
    value: airport.value || airport.code,
    label: `${airport.city} (${airport.code})`,
  }));
  const classOptions = [
    { value: "economy", label: "Economy" },
    { value: "business", label: "Business" },
    { value: "first", label: "First" },
  ];

  const searchFlights = async () => {
    if (!origin || !destination || !departureDate) {
      setError("Please select origin, destination and departure date.");
      return;
    }

    if (origin === destination) {
      setError("Origin and destination cannot be the same.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setResults([]);
      setSearched(true);

      const params = new URLSearchParams({
        origin,
        destination,
        travel_date: departureDate,
        seat_class: seatClass,
      });

      const data = await apiFetch(`/search-flights?${params.toString()}`);

      const flights = Array.isArray(data)
        ? data
        : data.flights || [];

      setResults(flights);

    } catch (err) {
      setError(err.message || "Unable to search flights.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">

      {/* NAVBAR */}
      <nav className="navbar">
        <div className="nav-container">

          <div className="brand">
            <div className="brand-icon">
              <Plane size={23} />
            </div>

            <span>AeroFlow</span>
          </div>

          <div className="nav-links">
            <a href="#flights">Flights</a>
            <a href="/manage-booking">Manage Booking</a>
            <a href="/services">Alerts</a>
            <a href="/system">System</a>

            <button className="admin-btn" onClick={() => navigate("/admin")}>
              Admin
            </button>
          </div>

        </div>
      </nav>

      {/* HERO */}
      <main
        className="hero"
        style={{
          backgroundImage: `url(${heroImage})`,
        }}
      >
        <div className="hero-overlay" />

        <div className="hero-content">

          {/* BADGE */}
          <div className="hero-badge">
            <Sparkles size={16} />
            AI-powered flight management
          </div>

          {/* HEADING */}
          <h1>
            Your journey,
            <span> intelligently managed.</span>
          </h1>

          <p className="hero-description">
            Search flights, manage bookings, track alerts and get
            intelligent airline support from one modern platform.
          </p>

          {/* SEARCH PANEL */}
          <div className="search-card">

            {/* FROM */}
            <div className="search-field">
              <div className="field-icon">
                <MapPin size={21} />
              </div>

              <div className="input-wrapper">
                <LandingDropdown
                  label="FROM"
                  value={origin}
                  placeholder={locationOptions.length ? "Select origin" : "No available origins"}
                  options={locationOptions}
                  onChange={(value) => {
                    setOrigin(value);
                    if (!destinationOptions.some((option) => option.value === destination)) {
                      setDestination("");
                    }
                  }}
                />
              </div>
            </div>

            {/* PLANE */}
            <div className="plane-divider">
              <Plane size={20} />
            </div>

            {/* TO */}
            <div className="search-field">
              <div className="field-icon">
                <MapPin size={21} />
              </div>

              <div className="input-wrapper">
                <LandingDropdown
                  label="TO"
                  value={destination}
                  placeholder={origin ? "No available destinations" : "Select origin first"}
                  options={destinationOptions}
                  onChange={setDestination}
                />
              </div>
            </div>

            {/* DATE */}
            <div className="search-field">
              <div className="field-icon">
                <CalendarDays size={21} />
              </div>

              <div className="input-wrapper">
                <label>DEPARTURE</label>

                <input
                  type="date"
                  min={today}
                  value={departureDate}
                  onChange={(e) =>
                    setDepartureDate(e.target.value)
                  }
                />
              </div>
            </div>

            {/* CLASS + PASSENGERS */}
            <div className="search-field">
              <div className="field-icon">
                <Users size={21} />
              </div>

              <div className="input-wrapper">
                <LandingDropdown
                  label="CLASS"
                  value={seatClass}
                  options={classOptions}
                  onChange={setSeatClass}
                />

                <div className="passenger-row">
                  <span>Passengers</span>

                  <input
                    className="passenger-input"
                    type="number"
                    min="1"
                    max="9"
                    value={passengers}
                    onChange={(e) =>
                      setPassengers(
                        Math.max(
                          1,
                          Math.min(
                            9,
                            Number(e.target.value)
                          )
                        )
                      )
                    }
                  />
                </div>
              </div>
            </div>

            {/* SEARCH BUTTON */}
            <button
              className="search-btn"
              onClick={searchFlights}
              disabled={loading}
            >
              <Search size={20} />

              {loading
                ? "Searching..."
                : "Search Flights"}
            </button>

          </div>

          {/* ERROR */}
          {error && (
            <div className="search-message error">
              {error}
            </div>
          )}

          {/* RESULTS */}
          {!loading && results.length > 0 && (
            <section
              className="results-section"
              id="flights"
            >
              <div className="results-heading">
                <div>
                  <span className="results-label">
                    AVAILABLE FLIGHTS
                  </span>

                  <h2>
                    {origin} → {destination}
                  </h2>
                </div>

                <span className="result-count">
                  {results.length}{" "}
                  {results.length === 1
                    ? "flight"
                    : "flights"}
                </span>
              </div>

              <div className="results-grid">
                {results.map((flight) => (
                  <div
                    className="flight-result-card"
                    key={flight.flight_id}
                  >
                    <div>
                      <span className="flight-number">
                        {flight.flight_number}
                      </span>

                      <h3>
                        {flight.origin}
                        {" → "}
                        {flight.destination}
                      </h3>

                      <p>
                        {new Date(
                          flight.departure_time
                        ).toLocaleString()}
                      </p>
                    </div>

                    <button
                      className="select-flight-btn"
                      onClick={() =>
                        navigate("/booking", {
                          state: {
                            flight,
                            seatClass,
                            passengers,
                          },
                        })
                      }
                    >
                      Select Flight
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* NO RESULTS */}
          {!loading &&
            searched &&
            !error &&
            results.length === 0 && (
              <div className="search-message">
                No available flights found for this
                route, date and class.
              </div>
            )}

          {/* FEATURES */}
          <section className="features">

            <div className="feature-card">
              <div className="feature-icon violet">
                <ShieldCheck size={27} />
              </div>

              <div>
                <h3>Smart Booking</h3>

                <p>
                  Seat holds, fare rules and secure
                  booking workflows.
                </p>
              </div>
            </div>

            <div className="feature-card">
              <div className="feature-icon blue">
                <Bell size={27} />
              </div>

              <div>
                <h3>Live Alerts</h3>

                <p>
                  Price drops, schedule changes and
                  check-in reminders.
                </p>
              </div>
            </div>

            <div className="feature-card">
              <div className="feature-icon violet">
                <Sparkles size={27} />
              </div>

              <div>
                <h3>AI Policy Assistant</h3>

                <p>
                  RAG-powered answers with human
                  approval support.
                </p>
              </div>
            </div>

            <div className="feature-card">
              <div className="feature-icon blue">
                <BarChart3 size={27} />
              </div>

              <div>
                <h3>Flight Operations</h3>

                <p>
                  Real-time monitoring and smarter
                  airline operations.
                </p>
              </div>
            </div>

          </section>

        </div>
      </main>
    </div>
  );
}

export default App;