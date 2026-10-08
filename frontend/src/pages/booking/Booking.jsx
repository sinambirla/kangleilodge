import { useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { createBooking } from "../../api/http";

function Booking() {
  const { roomTypeId } = useParams();
  const [searchParams] = useSearchParams();

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    country: "India",
    pincode: "",
    checkIn: searchParams.get("checkIn") || "",
    checkOut: searchParams.get("checkOut") || "",
    adults: searchParams.get("adults") || "2",
    children: searchParams.get("children") || "0",
    specialRequest: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");

    if (!form.firstName || !form.email || !form.phone) {
      setError("Please enter your name, email and phone number.");
      return;
    }

    if (!form.checkIn || !form.checkOut) {
      setError("Please select check-in and check-out dates.");
      return;
    }

    if (form.checkOut <= form.checkIn) {
      setError("Check-out date must be after check-in date.");
      return;
    }

    try {
      setLoading(true);

      const result = await createBooking({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
        city: form.city.trim(),
        state: form.state.trim(),
        country: form.country.trim(),
        pincode: form.pincode.trim(),
        checkIn: form.checkIn,
        checkOut: form.checkOut,
        adults: Number(form.adults),
        children: Number(form.children),
        roomTypeId: roomTypeId,
        specialRequest: form.specialRequest.trim(),
      });

      if (result.success) {
        window.location.href = `/booking-confirmation/${result.booking.booking_number}`;
      } else {
        setError(result.message || "Unable to create booking.");
      }
    } catch (err) {
      setError(err.message || "Unable to create booking.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="booking-page">
      <div className="container booking-container">
        <Link to={`/rooms/${roomTypeId}`} className="back-link">
          ← Back to room details
        </Link>

        <div className="booking-layout">
          {/* =====================================================
              LEFT - BOOKING FORM
          ====================================================== */}
          <div className="booking-card">
            <div className="booking-header">
              <p className="section-eyebrow">RESERVATION</p>

              <h1>Book Your Room</h1>

              <p>
                Enter your details below to complete your reservation request.
              </p>
            </div>

            {error && <div className="booking-error">{error}</div>}

            <form
              id="booking-form"
              className="booking-form"
              onSubmit={handleSubmit}
            >
              {/* =================================================
                  GUEST DETAILS
              ================================================== */}
              <section className="booking-section">
                <div className="booking-section-heading">
                  <h2>Guest Details</h2>
                </div>

                <div className="booking-form-grid">
                  <div className="form-field">
                    <label htmlFor="firstName">First Name *</label>

                    <input
                      id="firstName"
                      name="firstName"
                      type="text"
                      value={form.firstName}
                      onChange={handleChange}
                      autoComplete="given-name"
                      required
                    />
                  </div>

                  <div className="form-field">
                    <label htmlFor="lastName">Last Name</label>

                    <input
                      id="lastName"
                      name="lastName"
                      type="text"
                      value={form.lastName}
                      onChange={handleChange}
                      autoComplete="family-name"
                    />
                  </div>

                  <div className="form-field">
                    <label htmlFor="email">Email *</label>

                    <input
                      id="email"
                      name="email"
                      type="email"
                      value={form.email}
                      onChange={handleChange}
                      autoComplete="email"
                      required
                    />
                  </div>

                  <div className="form-field">
                    <label htmlFor="phone">Phone *</label>

                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={form.phone}
                      onChange={handleChange}
                      autoComplete="tel"
                      required
                    />
                  </div>

                  <div className="form-field booking-full-width">
                    <label htmlFor="address">Address</label>

                    <input
                      id="address"
                      name="address"
                      type="text"
                      value={form.address}
                      onChange={handleChange}
                      autoComplete="street-address"
                    />
                  </div>

                  <div className="form-field">
                    <label htmlFor="city">City</label>

                    <input
                      id="city"
                      name="city"
                      type="text"
                      value={form.city}
                      onChange={handleChange}
                      autoComplete="address-level2"
                    />
                  </div>

                  <div className="form-field">
                    <label htmlFor="state">State</label>

                    <input
                      id="state"
                      name="state"
                      type="text"
                      value={form.state}
                      onChange={handleChange}
                      autoComplete="address-level1"
                    />
                  </div>

                  <div className="form-field">
                    <label htmlFor="country">Country</label>

                    <input
                      id="country"
                      name="country"
                      type="text"
                      value={form.country}
                      onChange={handleChange}
                      autoComplete="country-name"
                    />
                  </div>

                  <div className="form-field">
                    <label htmlFor="pincode">Pincode</label>

                    <input
                      id="pincode"
                      name="pincode"
                      type="text"
                      value={form.pincode}
                      onChange={handleChange}
                      autoComplete="postal-code"
                    />
                  </div>
                </div>
              </section>

              {/* =================================================
                  STAY DETAILS
              ================================================== */}
              <section className="booking-section">
                <div className="booking-section-heading">
                  <h2>Stay Details</h2>
                </div>

                <div className="booking-form-grid">
                  <div className="form-field">
                    <label htmlFor="checkIn">Check-in *</label>

                    <input
                      id="checkIn"
                      name="checkIn"
                      type="date"
                      value={form.checkIn}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="form-field">
                    <label htmlFor="checkOut">Check-out *</label>

                    <input
                      id="checkOut"
                      name="checkOut"
                      type="date"
                      value={form.checkOut}
                      onChange={handleChange}
                      min={form.checkIn || undefined}
                      required
                    />
                  </div>

                  <div className="form-field">
                    <label htmlFor="adults">Adults *</label>

                    <input
                      id="adults"
                      name="adults"
                      type="number"
                      min="1"
                      value={form.adults}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="form-field">
                    <label htmlFor="children">Children</label>

                    <input
                      id="children"
                      name="children"
                      type="number"
                      min="0"
                      value={form.children}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="form-field booking-full-width">
                    <label htmlFor="specialRequest">
                      Special Request
                    </label>

                    <textarea
                      id="specialRequest"
                      name="specialRequest"
                      rows="2"
                      value={form.specialRequest}
                      onChange={handleChange}
                      placeholder="Any special requests or requirements?"
                    />
                  </div>
                </div>
              </section>

              {/* =================================================
                  MOBILE CONFIRM BUTTON
              ================================================== */}
              <button
                type="submit"
                className="room-book-button booking-submit-mobile"
                disabled={loading}
              >
                {loading ? "Creating Booking..." : "Confirm Booking"}
              </button>
            </form>
          </div>

          {/* =====================================================
              RIGHT - BOOKING SUMMARY
          ====================================================== */}
          <aside className="booking-summary">
            <div className="booking-summary-header">
              <p className="section-eyebrow">BOOKING SUMMARY</p>

              <h2>Your Reservation</h2>
            </div>

            <div className="booking-summary-content">
              <div className="booking-summary-row">
                <span>Room</span>

                <strong>Selected Room</strong>
              </div>

              <div className="booking-summary-divider" />

              <div className="booking-summary-row">
                <span>Check-in</span>

                <strong>
                  {form.checkIn || "Not selected"}
                </strong>
              </div>

              <div className="booking-summary-row">
                <span>Check-out</span>

                <strong>
                  {form.checkOut || "Not selected"}
                </strong>
              </div>

              <div className="booking-summary-row">
                <span>Guests</span>

                <strong>
                  {form.adults || 0} Adult
                  {Number(form.adults) !== 1 ? "s" : ""}

                  {Number(form.children) > 0
                    ? `, ${form.children} Child${
                        Number(form.children) !== 1 ? "ren" : ""
                      }`
                    : ""}
                </strong>
              </div>

              <div className="booking-summary-divider" />

              <div className="booking-summary-note">
                <span className="booking-summary-icon">✓</span>

                <p>
                  Your reservation details will be confirmed after submitting
                  this form.
                </p>
              </div>

              {/* Desktop confirmation button */}
              <button
                type="submit"
                form="booking-form"
                className="room-book-button booking-submit-desktop"
                disabled={loading}
              >
                {loading ? "Creating Booking..." : "Confirm Booking"}
              </button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

export default Booking;