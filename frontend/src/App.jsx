import { useState } from "react";
import { Link, Routes, Route } from "react-router-dom";

import "./App.css";

import { getAvailability } from "./api/http";

import RoomDetails from "./pages/rooms/RoomDetails";
import Booking from "./pages/booking/Booking";
import BookingConfirmation from "./pages/booking/BookingConfirmation";

import AdminLogin from "./pages/admin/AdminLogin";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminBookings from "./pages/admin/AdminBookings";
import AdminBookingDetails from "./pages/admin/AdminBookingDetails";

import AdminRooms from "./pages/admin/AdminRooms";

import AdminEnquiries from "./pages/admin/AdminEnquiries";

function Home() {
  const [showAvailability, setShowAvailability] = useState(false);

  const [search, setSearch] = useState({
    checkIn: "",
    checkOut: "",
    adults: 2,
    children: 0,
  });

  const [availability, setAvailability] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleChange(event) {
    const { name, value } = event.target;

    setSearch((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleAvailabilitySearch(event) {
    event.preventDefault();

    setError("");
    setAvailability([]);

    if (!search.checkIn || !search.checkOut) {
      setError("Please select check-in and check-out dates.");
      return;
    }

    if (search.checkOut <= search.checkIn) {
      setError("Check-out date must be after check-in date.");
      return;
    }

    try {
      setLoading(true);

      const result = await getAvailability({
        checkIn: search.checkIn,
        checkOut: search.checkOut,
        adults: search.adults,
        children: search.children,
      });

      setAvailability(result.rooms || []);
    } catch (err) {
      setError(err.message || "Unable to check availability.");
    } finally {
      setLoading(false);
    }
  }

  function openAvailability() {
    setShowAvailability(true);

    setTimeout(() => {
      document
        .getElementById("availability")
        ?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
    }, 50);
  }

  return (
    <div className="app">
      {/* =====================================================
          HEADER
          ===================================================== */}

      <header className="site-header">
        <div className="container header-inner">
          <div className="brand">
            <span className="brand-name">KANGLEI LODGE</span>

            <span className="brand-tagline">
              Hotel & Hospitality
            </span>
          </div>

          <nav className="main-nav">
            <a href="#home">Home</a>
            <a href="#rooms">Rooms</a>
            <a href="#about">About</a>
            <a href="#contact">Contact</a>
          </nav>

          <button
            className="header-book-button"
            onClick={openAvailability}
          >
            Book Now
          </button>
        </div>
      </header>

      <main>
        {/* =====================================================
            HERO
            ===================================================== */}

        <section id="home" className="hero">
          <div className="hero-overlay">
            <div className="container hero-content">
              <p className="hero-eyebrow">
                WELCOME TO KANGLEI LODGE
              </p>

              <h1>
                A comfortable stay,
                <br />
                at - Kanglei Lodge - Imphal, Manipur.
              </h1>

              <p className="hero-description">
                Comfortable rooms, best hospitality
                and a relaxing stay in the heart of Imphal.
              </p>

              <button
                className="hero-button"
                onClick={openAvailability}
              >
                Check Availability
              </button>
            </div>
          </div>
        </section>

        {/* =====================================================
            AVAILABILITY
            ===================================================== */}

        {showAvailability && (
          <section
            id="availability"
            className="availability-section"
          >
            <div className="container">
              <div className="section-heading">
                <p className="section-eyebrow">
                  PLAN YOUR STAY
                </p>

                <h2>Check Room Availability</h2>

                <p className="section-description">
                  Select your dates and number of guests to see
                  the rooms available at Kanglei Lodge.
                </p>
              </div>

              <form
                className="availability-form"
                onSubmit={handleAvailabilitySearch}
              >
                <div className="form-field">
                  <label htmlFor="checkIn">
                    Check-in
                  </label>

                  <input
                    id="checkIn"
                    name="checkIn"
                    type="date"
                    value={search.checkIn}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="checkOut">
                    Check-out
                  </label>

                  <input
                    id="checkOut"
                    name="checkOut"
                    type="date"
                    value={search.checkOut}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="adults">
                    Adults
                  </label>

                  <input
                    id="adults"
                    name="adults"
                    type="number"
                    min="1"
                    value={search.adults}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="children">
                    Children
                  </label>

                  <input
                    id="children"
                    name="children"
                    type="number"
                    min="0"
                    value={search.children}
                    onChange={handleChange}
                  />
                </div>

                <button
                  type="submit"
                  className="availability-search-button"
                  disabled={loading}
                >
                  {loading
                    ? "Checking..."
                    : "Search Rooms"}
                </button>
              </form>

              {error && (
                <p className="availability-error">
                  {error}
                </p>
              )}

              {/* =================================================
                  RESULTS
                  ================================================= */}

              {!loading &&
                availability.length > 0 && (
                  <div
                    id="rooms"
                    className="availability-results"
                  >
                    <div className="results-heading">
                      <div>
                        <p className="section-eyebrow">
                          AVAILABLE ACCOMMODATION
                        </p>

                        <h3>Choose Your Room</h3>
                      </div>

                      <span className="results-count">
                        {availability.length} room
                        {availability.length !== 1
                          ? "s"
                          : ""}{" "}
                        available
                      </span>
                    </div>

                    <div className="room-results">
                      {availability.map((room) => (
                        <article
                          className="room-result-card"
                          key={room.id}
                        >
                          <div className="room-result-content">
                            <p className="room-card-label">
                              KANGLEI LODGE
                            </p>

                            <h4>{room.name}</h4>

                            {room.description && (
                              <p className="room-card-description">
                                {room.description}
                              </p>
                            )}

                            <div className="room-card-facts">
                              <div>
                                <span>Rate</span>

                                <strong>
                                  ₹{room.base_rate}
                                </strong>

                                <small>/ night</small>
                              </div>

                              <div>
                                <span>Available</span>

                                <strong>
                                  {room.available_room_count}
                                </strong>
                              </div>
                            </div>

                            <div className="room-card-action">
                              <Link
                                to={`/rooms/${room.id}?checkIn=${search.checkIn}&checkOut=${search.checkOut}&adults=${search.adults}&children=${search.children}`}
                                className="room-details-button"
                              >
                                View Room
                              </Link>
                            </div>
                          </div>
                        </article>
                      ))}
                    </div>
                  </div>
                )}

              {!loading &&
                !error &&
                availability.length === 0 &&
                search.checkIn &&
                search.checkOut && (
                  <div className="no-availability-box">
                    <strong>
                      No rooms available
                    </strong>

                    <p>
                      No rooms are available for the selected
                      dates and guests. Please try different
                      dates or guest numbers.
                    </p>
                  </div>
                )}
            </div>
          </section>
        )}

        {/* =====================================================
            ABOUT / INTRO
            ===================================================== */}

        <section
          id="about"
          className="intro-section"
        >
          <div className="container">
            <p className="section-eyebrow">
              YOUR STAY, YOUR WAY
            </p>

            <h2>
              Comfort designed around you
            </h2>

            <p className="section-description">
              Whether you are visiting for business, leisure or
              a family getaway, Kanglei Lodge offers comfortable
              accommodation and the essentials for a pleasant
              stay.
            </p>
          </div>
        </section>
      </main>

      {/* =====================================================
          FOOTER
          ===================================================== */}

      <footer
        id="contact"
        className="site-footer"
      >
        <div className="container">
          <p>
            © 2026 Kanglei Lodge. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

function App() {
  return (
    <Routes>
      {/* =====================================================
          CUSTOMER ROUTES
          ===================================================== */}

      <Route path="/" element={<Home />} />

      <Route path="/rooms/:roomTypeId" element={<RoomDetails />} />

      <Route path="/booking/:roomTypeId" element={<Booking />} />

      <Route path="/booking-confirmation/:bookingNumber" element={<BookingConfirmation />} />

      {/* ===  ADMIN LOGIN ==================== */}

      <Route path="/admin/login" element={<AdminLogin />} />

      {/* ========== ADMIN PORTAL============= */}

      <Route path="/admin" element={<AdminLayout />} >
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="bookings" element={<AdminBookings />} />
        <Route path="bookings/:bookingNumber" element={<AdminBookingDetails />} />
        <Route path="rooms" element={<AdminRooms />} />
        <Route path="enquiries" element={<AdminEnquiries />} />
      </Route>

    </Routes>
  );
}

export default App;