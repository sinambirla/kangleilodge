import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getAdminBookings } from "../../api/http";
import "./AdminBookings.css";

function formatDate(dateString) {
  if (!dateString) return "-";

  // PostgreSQL DATE values must not be timezone-converted.
  const value = String(dateString).slice(0, 10);

  const parts = value.split("-");

  if (parts.length !== 3) {
    return value;
  }

  const [year, month, day] = parts;

  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  const monthIndex = Number(month) - 1;

  if (
    monthIndex < 0 ||
    monthIndex > 11
  ) {
    return value;
  }

  return `${day} ${monthNames[monthIndex]} ${year}`;
}

function formatDateTime(dateString) {
  if (!dateString) return "-";

  return new Date(dateString).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatAmount(amount) {
  return `₹${Number(amount || 0).toLocaleString("en-IN")}`;
}

function getStatusClass(status) {
  return String(status || "")
    .toLowerCase()
    .replace(/_/g, "-");
}

function getCustomerName(booking) {
  return (
    `${booking.first_name || ""} ${booking.last_name || ""}`.trim() ||
    "Unknown Customer"
  );
}

function AdminBookings() {
  const [bookings, setBookings] = useState([]);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadBookings(selectedStatus = "") {
    try {
      setLoading(true);
      setError("");

      const result = await getAdminBookings(selectedStatus);

      setBookings(result.bookings || []);
    } catch (err) {
      setError(err.message || "Unable to load bookings.");
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBookings(status);
  }, [status]);

  function handleStatusChange(event) {
    setStatus(event.target.value);
  }

  return (
    <div className="admin-bookings-page">
      <div className="admin-bookings-header">
        <div>
          <p className="admin-page-eyebrow">
            BOOKING MANAGEMENT
          </p>

          <h1>Bookings</h1>

          <p className="admin-page-description">
            View and manage all guest bookings at Kanglei Lodge.
          </p>
        </div>

        <div className="admin-bookings-filter">
          <label htmlFor="booking-status">
            Status
          </label>

          <select
            id="booking-status"
            value={status}
            onChange={handleStatusChange}
          >
            <option value="">All Bookings</option>
            <option value="PENDING">Pending</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="CHECKED_IN">Checked In</option>
            <option value="CHECKED_OUT">Checked Out</option>
            <option value="NO_SHOW">No Show</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="admin-bookings-error">
          {error}
        </div>
      )}

      <div className="admin-bookings-summary">
        <div className="admin-bookings-summary-card">
          <span>Total Bookings</span>
          <strong>{bookings.length}</strong>
        </div>

        <div className="admin-bookings-summary-card">
          <span>Pending</span>
          <strong>
            {
              bookings.filter(
                (booking) => booking.status === "PENDING"
              ).length
            }
          </strong>
        </div>

        <div className="admin-bookings-summary-card">
          <span>Confirmed</span>
          <strong>
            {
              bookings.filter(
                (booking) => booking.status === "CONFIRMED"
              ).length
            }
          </strong>
        </div>

        <div className="admin-bookings-summary-card">
          <span>Cancelled</span>
          <strong>
            {
              bookings.filter(
                (booking) => booking.status === "CANCELLED"
              ).length
            }
          </strong>
        </div>
      </div>

      <section className="admin-bookings-table-card">
        <div className="admin-bookings-table-header">
          <div>
            <h2>Booking List</h2>

            <p>
              {loading
                ? "Loading bookings..."
                : `${bookings.length} booking${
                    bookings.length !== 1 ? "s" : ""
                  } found`}
            </p>
          </div>

          <button
            type="button"
            className="admin-bookings-refresh-button"
            onClick={() => loadBookings(status)}
            disabled={loading}
          >
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>

        {loading ? (
          <div className="admin-bookings-state">
            <div className="admin-bookings-spinner" />
            <p>Loading bookings...</p>
          </div>
        ) : bookings.length === 0 ? (
          <div className="admin-bookings-state">
            <div className="admin-bookings-empty-icon">
              ▤
            </div>

            <h3>No bookings found</h3>

            <p>
              There are no bookings matching the selected status.
            </p>
          </div>
        ) : (
          <div className="admin-bookings-table-wrapper">
            <table className="admin-bookings-table">
              <thead>
                <tr>
                  <th>Booking</th>
                  <th>Guest</th>
                  <th>Stay</th>
                  <th>Guests</th>
                  <th>Rooms</th>
                  <th>Amount</th>
                  <th>Payment</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {bookings.map((booking) => (
                  <tr key={booking.id}>
                    <td>
                      <div className="booking-number">
                        {booking.booking_number}
                      </div>

                      {booking.special_request && (
                        <div className="booking-special-request">
                          Special request
                        </div>
                      )}
                    </td>

                    <td>
                      <div className="booking-guest">
                        <strong>
                          {getCustomerName(booking)}
                        </strong>

                        <span>{booking.email}</span>

                        {booking.phone && (
                          <span>{booking.phone}</span>
                        )}
                      </div>
                    </td>

                    <td>
                      <div className="booking-stay">
                        <strong>
                          {formatDate(booking.check_in)}
                        </strong>

                        <span>
                          to
                        </span>

                        <strong>
                          {formatDate(booking.check_out)}
                        </strong>
                      </div>
                    </td>

                    <td>
                      <div className="booking-guests">
                        <span>
                          {booking.adults} adult
                          {Number(booking.adults) !== 1
                            ? "s"
                            : ""}
                        </span>

                        <span>
                          {booking.children} child
                          {Number(booking.children) !== 1
                            ? "ren"
                            : ""}
                        </span>
                      </div>
                    </td>

                    <td>
                      <div className="booking-rooms">
                        <strong>
                          {booking.number_of_rooms}
                        </strong>

                        {booking.rooms?.length > 0 && (
                          <div className="booking-room-types">
                            {booking.rooms.map(
                              (room, index) => (
                                <span
                                  key={`${booking.id}-${index}`}
                                >
                                  {room.room_type_name}
                                  {room.room_number
                                    ? ` #${room.room_number}`
                                    : ""}
                                </span>
                              )
                            )}
                          </div>
                        )}
                      </div>
                    </td>

                    <td>
                      <div className="booking-amount">
                        <strong>
                          {formatAmount(
                            booking.total_amount
                          )}
                        </strong>

                        {Number(booking.tax || 0) > 0 && (
                          <span>
                            Tax:{" "}
                            {formatAmount(booking.tax)}
                          </span>
                        )}
                      </div>
                    </td>

                    <td>
                      <span
                        className={`booking-payment-status ${getStatusClass(
                          booking.payment_status
                        )}`}
                      >
                        {booking.payment_status || "-"}
                      </span>
                    </td>

                    <td>
                      <span
                        className={`booking-status ${getStatusClass(
                          booking.status
                        )}`}
                      >
                        {String(
                          booking.status || "-"
                        ).replace(/_/g, " ")}
                      </span>
                    </td>

                    <td>
                      <div className="booking-created">
                        {formatDateTime(
                          booking.created_at
                        )}
                      </div>
                    </td>
                    <td>
                        <Link
                            to={`/admin/bookings/${booking.booking_number}`}
                            className="admin-view-details-link"
                        >
                            View Details
                        </Link>
                        </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

export default AdminBookings;