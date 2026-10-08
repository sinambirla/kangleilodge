import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getBooking } from "../../api/http";
import "./BookingConfirmation.css";

function BookingConfirmation() {
  const { bookingNumber } = useParams();

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadBooking() {
      try {
        setLoading(true);
        setError("");

        const result = await getBooking(bookingNumber);

        if (result.success) {
          setBooking(result.booking);
        } else {
          setError(result.message || "Unable to load booking details.");
        }
      } catch (err) {
        setError(err.message || "Unable to load booking details.");
      } finally {
        setLoading(false);
      }
    }

    loadBooking();
  }, [bookingNumber]);

  function formatDate(dateValue) {
    if (!dateValue) {
      return "-";
    }

    return new Date(dateValue).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  function formatCurrency(value) {
    return `₹${Number(value || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  /*
   * Loading state
   */
  if (loading) {
    return (
      <div className="booking-confirmation-page">
        <div className="container booking-confirmation-container">
          <div className="confirmation-message-card">
            <div className="confirmation-message-icon confirmation-loading-icon">
              ...
            </div>

            <p className="confirmation-eyebrow">BOOKING</p>

            <h1>Loading Your Booking</h1>

            <p>
              Please wait while we retrieve your reservation details...
            </p>
          </div>
        </div>
      </div>
    );
  }

  /*
   * Error state
   */
  if (error) {
    return (
      <div className="booking-confirmation-page">
        <div className="container booking-confirmation-container">
          <div className="confirmation-message-card">
            <div className="confirmation-message-icon confirmation-error-icon">
              !
            </div>

            <p className="confirmation-eyebrow">BOOKING</p>

            <h1>Unable to Load Booking</h1>

            <div className="confirmation-error">
              {error}
            </div>

            <p className="confirmation-reference">
              Booking Number:{" "}
              <strong>{bookingNumber}</strong>
            </p>

            <Link to="/" className="confirmation-primary-button">
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  /*
   * Booking not found
   */
  if (!booking) {
    return (
      <div className="booking-confirmation-page">
        <div className="container booking-confirmation-container">
          <div className="confirmation-message-card">
            <div className="confirmation-message-icon confirmation-error-icon">
              !
            </div>

            <p className="confirmation-eyebrow">BOOKING</p>

            <h1>Booking Not Found</h1>

            <p>
              We could not find a booking with number{" "}
              <strong>{bookingNumber}</strong>.
            </p>

            <Link to="/" className="confirmation-primary-button">
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const customer = booking.customer || {};
  const room = booking.rooms?.[0] || {};

  const guestName =
    [customer.first_name, customer.last_name]
      .filter(Boolean)
      .join(" ") || "Guest";

  const bookingStatus = booking.status || "PENDING";
  const paymentStatus = booking.payment_status || "PENDING";

  return (
    <div className="booking-confirmation-page">
      <div className="container booking-confirmation-container">

        {/* =====================================================
            CONFIRMATION HEADER
        ====================================================== */}
        <section className="confirmation-header-card">

          <div className="confirmation-success-icon">
            ✓
          </div>

          <div className="confirmation-header-content">
            <p className="confirmation-eyebrow">
              BOOKING CONFIRMED
            </p>

            <h1>Thank You for Your Booking</h1>

            <p>
              Your booking request has been received successfully.
            </p>
          </div>

          <div className="confirmation-number-box">
            <span>Booking Number</span>

            <strong>
              {booking.booking_number || bookingNumber}
            </strong>
          </div>

          <div className="confirmation-status-box">
            <span>Status</span>

            <strong>{bookingStatus}</strong>
          </div>
        </section>

        {/* =====================================================
            MAIN CONTENT
        ====================================================== */}
        <div className="confirmation-layout">

          {/* ===================================================
              LEFT COLUMN
          ==================================================== */}
          <main className="confirmation-main">

            {/* -------------------------------------------------
                STAY DETAILS
            -------------------------------------------------- */}
            <section className="confirmation-section">

              <div className="confirmation-section-heading">
                <h2>Stay Details</h2>
              </div>

              <div className="confirmation-grid">

                <div className="confirmation-item">
                  <span>Room</span>
                  <strong>
                    {room.room_type_name || "-"}
                  </strong>
                </div>

                <div className="confirmation-item">
                  <span>Room Number</span>
                  <strong>
                    {room.room_number || "-"}
                  </strong>
                </div>

                <div className="confirmation-item">
                  <span>Floor</span>
                  <strong>
                    {room.floor || "-"}
                  </strong>
                </div>

                <div className="confirmation-item">
                  <span>Bed</span>
                  <strong>
                    {room.bed_type || "-"}
                  </strong>
                </div>

                <div className="confirmation-item">
                  <span>Check-in</span>
                  <strong>
                    {formatDate(booking.check_in)}
                  </strong>
                </div>

                <div className="confirmation-item">
                  <span>Check-out</span>
                  <strong>
                    {formatDate(booking.check_out)}
                  </strong>
                </div>

                <div className="confirmation-item">
                  <span>Nights</span>
                  <strong>
                    {room.number_of_nights || "-"}
                  </strong>
                </div>

                <div className="confirmation-item">
                  <span>Guests</span>
                  <strong>
                    {booking.adults} Adult
                    {Number(booking.adults) !== 1 ? "s" : ""}

                    {Number(booking.children) > 0
                      ? `, ${booking.children} Child${
                          Number(booking.children) !== 1
                            ? "ren"
                            : ""
                        }`
                      : ""}
                  </strong>
                </div>

              </div>
            </section>

            {/* -------------------------------------------------
                GUEST DETAILS
            -------------------------------------------------- */}
            <section className="confirmation-section">

              <div className="confirmation-section-heading">
                <h2>Guest Details</h2>
              </div>

              <div className="confirmation-grid">

                <div className="confirmation-item">
                  <span>Name</span>
                  <strong>{guestName}</strong>
                </div>

                <div className="confirmation-item">
                  <span>Email</span>
                  <strong>
                    {customer.email || "-"}
                  </strong>
                </div>

                <div className="confirmation-item">
                  <span>Phone</span>
                  <strong>
                    {customer.phone || "-"}
                  </strong>
                </div>

                <div className="confirmation-item">
                  <span>Address</span>
                  <strong>
                    {customer.address || "-"}
                  </strong>
                </div>

                <div className="confirmation-item">
                  <span>City</span>
                  <strong>
                    {customer.city || "-"}
                  </strong>
                </div>

                <div className="confirmation-item">
                  <span>State</span>
                  <strong>
                    {customer.state || "-"}
                  </strong>
                </div>

                <div className="confirmation-item">
                  <span>Country</span>
                  <strong>
                    {customer.country || "-"}
                  </strong>
                </div>

                <div className="confirmation-item">
                  <span>Pincode</span>
                  <strong>
                    {customer.pincode || "-"}
                  </strong>
                </div>

              </div>
            </section>

            {/* -------------------------------------------------
                SPECIAL REQUEST
            -------------------------------------------------- */}
            {booking.special_request && (
              <section className="confirmation-section">

                <div className="confirmation-section-heading">
                  <h2>Special Request</h2>
                </div>

                <p className="confirmation-special-request">
                  {booking.special_request}
                </p>

              </section>
            )}

          </main>

          {/* ===================================================
              RIGHT COLUMN
          ==================================================== */}
          <aside className="confirmation-sidebar">

            {/* -------------------------------------------------
                PRICE DETAILS
            -------------------------------------------------- */}
            <section className="confirmation-price-card">

              <div className="confirmation-section-heading">
                <h2>Price Details</h2>
              </div>

              <div className="confirmation-price-row">
                <span>Room charges</span>

                <strong>
                  {formatCurrency(booking.subtotal)}
                </strong>
              </div>

              <div className="confirmation-price-row">
                <span>Tax</span>

                <strong>
                  {formatCurrency(booking.tax)}
                </strong>
              </div>

              <div className="confirmation-price-row">
                <span>Discount</span>

                <strong>
                  -{formatCurrency(booking.discount)}
                </strong>
              </div>

              <div className="confirmation-price-divider" />

              <div className="confirmation-total">
                <span>Total</span>

                <strong>
                  {formatCurrency(booking.total)}
                </strong>
              </div>

              <div className="confirmation-payment-status">
                <span>Payment Status</span>

                <strong>{paymentStatus}</strong>
              </div>

            </section>

            {/* -------------------------------------------------
                NOTE
            -------------------------------------------------- */}
            <div className="confirmation-note">

              <span className="confirmation-note-icon">
                ✓
              </span>

              <div>
                <strong>Reservation received</strong>

                <p>
                  Please keep your booking number for future
                  reference.
                </p>
              </div>

            </div>

            {/* -------------------------------------------------
                ACTION
            -------------------------------------------------- */}
            <div className="confirmation-actions">

              <Link
                to="/"
                className="confirmation-primary-button"
              >
                Back to Home
              </Link>

            </div>

          </aside>
        </div>
      </div>
    </div>
  );
}

export default BookingConfirmation;