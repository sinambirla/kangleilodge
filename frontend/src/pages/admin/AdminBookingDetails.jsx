import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  getAdminBookingDetails,
  updateAdminBookingStatus,
  updateAdminBookingPaymentStatus,
} from "../../api/http";
import "./AdminBookingDetails.css";

function formatDate(dateString) {
  if (!dateString) return "-";

  // Preserve PostgreSQL DATE values without timezone conversion.
  const value = String(dateString).slice(0, 10);

  const parts = value.split("-");

  if (parts.length !== 3) {
    return value;
  }

  return `${parts[2]}-${parts[1]}-${parts[0]}`;
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

function formatCurrency(amount) {
  return `₹${Number(amount || 0).toLocaleString("en-IN")}`;
}

function getStatusClass(status) {
  return String(status || "")
    .toLowerCase()
    .replace(/_/g, "-");
}

function getStatusLabel(status) {
  return String(status || "-").replace(/_/g, " ");
}

function getActionMessage(status) {
  switch (status) {
    case "CONFIRMED":
      return "Confirm this booking?";

    case "CANCELLED":
      return "Cancel this booking? This action cannot be reversed.";

    case "CHECKED_IN":
      return "Check this guest in?";

    case "CHECKED_OUT":
      return "Check this guest out?";

    case "NO_SHOW":
      return "Mark this booking as No Show?";

    default:
      return `Change booking status to ${getStatusLabel(
        status
      )}?`;
  }
}

function getPaymentActionMessage(paymentStatus) {
  switch (paymentStatus) {
    case "UNPAID":
      return "Mark this payment as UNPAID?";

    case "PENDING":
      return "Mark this payment as PENDING?";

    case "PAID":
      return "Mark this payment as PAID?";

    case "REFUNDED":
      return "Mark this payment as REFUNDED?";

    default:
      return `Change payment status to ${paymentStatus}?`;
  }
}

export default function AdminBookingDetails() {
  const { bookingNumber } = useParams();

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");

  useEffect(() => {
    async function loadBooking() {
      try {
        setLoading(true);
        setError("");

        const response = await getAdminBookingDetails(
          bookingNumber
        );

        setBooking(response.booking);
      } catch (err) {
        console.error("Failed to load booking:", err);

        setError(
          err.message || "Failed to load booking details"
        );
      } finally {
        setLoading(false);
      }
    }

    loadBooking();
  }, [bookingNumber]);

  async function handleStatusUpdate(newStatus) {
    if (!booking || actionLoading) {
      return;
    }

    const confirmed = window.confirm(
      getActionMessage(newStatus)
    );

    if (!confirmed) {
      return;
    }

    try {
      setActionLoading(true);
      setActionError("");
      setActionSuccess("");

      const response = await updateAdminBookingStatus(
        booking.booking_number,
        newStatus
      );

      setBooking((current) => ({
        ...current,
        status: response.booking.status,
        payment_status:
          response.booking.payment_status,
        updated_at: response.booking.updated_at,
      }));

      setActionSuccess(
        response.message ||
          "Booking status updated successfully."
      );
    } catch (err) {
      console.error(
        "Failed to update booking status:",
        err
      );

      setActionError(
        err.message ||
          "Failed to update booking status."
      );
    } finally {
      setActionLoading(false);
    }
  }

  async function handlePaymentStatusUpdate(
    newPaymentStatus
  ) {
    if (!booking || actionLoading) {
      return;
    }

    const confirmed = window.confirm(
      getPaymentActionMessage(newPaymentStatus)
    );

    if (!confirmed) {
      return;
    }

    try {
      setActionLoading(true);
      setActionError("");
      setActionSuccess("");

      const response =
        await updateAdminBookingPaymentStatus(
          booking.booking_number,
          newPaymentStatus
        );

      setBooking((current) => ({
        ...current,
        status: response.booking.status,
        payment_status:
          response.booking.payment_status,
        updated_at: response.booking.updated_at,
      }));

      setActionSuccess(
        response.message ||
          "Payment status updated successfully."
      );
    } catch (err) {
      console.error(
        "Failed to update payment status:",
        err
      );

      setActionError(
        err.message ||
          "Failed to update payment status."
      );
    } finally {
      setActionLoading(false);
    }
  }

  function renderActionButtons() {
    if (!booking) {
      return null;
    }

    if (booking.status === "PENDING") {
      return (
        <>
          <button
            type="button"
            className="admin-action-button confirm"
            onClick={() =>
              handleStatusUpdate("CONFIRMED")
            }
            disabled={actionLoading}
          >
            {actionLoading
              ? "Updating..."
              : "Confirm"}
          </button>

          <button
            type="button"
            className="admin-action-button cancel"
            onClick={() =>
              handleStatusUpdate("CANCELLED")
            }
            disabled={actionLoading}
          >
            {actionLoading
              ? "Updating..."
              : "Cancel"}
          </button>

          <button
            type="button"
            className="admin-action-button no-show"
            onClick={() =>
              handleStatusUpdate("NO_SHOW")
            }
            disabled={actionLoading}
          >
            {actionLoading
              ? "Updating..."
              : "No Show"}
          </button>
        </>
      );
    }

    if (booking.status === "CONFIRMED") {
      return (
        <>
          <button
            type="button"
            className="admin-action-button cancel"
            onClick={() =>
              handleStatusUpdate("CANCELLED")
            }
            disabled={actionLoading}
          >
            {actionLoading
              ? "Updating..."
              : "Cancel"}
          </button>

          <button
            type="button"
            className="admin-action-button check-in"
            onClick={() =>
              handleStatusUpdate("CHECKED_IN")
            }
            disabled={actionLoading}
          >
            {actionLoading
              ? "Updating..."
              : "Check In"}
          </button>

          <button
            type="button"
            className="admin-action-button no-show"
            onClick={() =>
              handleStatusUpdate("NO_SHOW")
            }
            disabled={actionLoading}
          >
            {actionLoading
              ? "Updating..."
              : "No Show"}
          </button>
        </>
      );
    }

    if (booking.status === "CHECKED_IN") {
      return (
        <button
          type="button"
          className="admin-action-button check-out"
          onClick={() =>
            handleStatusUpdate("CHECKED_OUT")
          }
          disabled={actionLoading}
        >
          {actionLoading
            ? "Updating..."
            : "Check Out"}
        </button>
      );
    }

    return (
      <p className="admin-no-actions-message">
        No further booking status actions are
        available for this booking.
      </p>
    );
  }

  function renderPaymentActionButtons() {
    if (!booking) {
      return null;
    }

    if (booking.payment_status === "UNPAID") {
      return (
        <>
          <button
            type="button"
            className="admin-payment-action-button payment-pending"
            onClick={() =>
              handlePaymentStatusUpdate("PENDING")
            }
            disabled={actionLoading}
          >
            {actionLoading
              ? "Updating..."
              : "Mark Pending"}
          </button>

          <button
            type="button"
            className="admin-payment-action-button payment-paid"
            onClick={() =>
              handlePaymentStatusUpdate("PAID")
            }
            disabled={actionLoading}
          >
            {actionLoading
              ? "Updating..."
              : "Mark Paid"}
          </button>
        </>
      );
    }

    if (booking.payment_status === "PENDING") {
      return (
        <>
          <button
            type="button"
            className="admin-payment-action-button payment-unpaid"
            onClick={() =>
              handlePaymentStatusUpdate("UNPAID")
            }
            disabled={actionLoading}
          >
            {actionLoading
              ? "Updating..."
              : "Mark Unpaid"}
          </button>

          <button
            type="button"
            className="admin-payment-action-button payment-paid"
            onClick={() =>
              handlePaymentStatusUpdate("PAID")
            }
            disabled={actionLoading}
          >
            {actionLoading
              ? "Updating..."
              : "Mark Paid"}
          </button>
        </>
      );
    }

    if (booking.payment_status === "PAID") {
      return (
        <button
          type="button"
          className="admin-payment-action-button payment-refunded"
          onClick={() =>
            handlePaymentStatusUpdate("REFUNDED")
          }
          disabled={actionLoading}
        >
          {actionLoading
            ? "Updating..."
            : "Mark Refunded"}
        </button>
      );
    }

    return (
      <p className="admin-no-actions-message">
        No further payment actions are available.
      </p>
    );
  }

  if (loading) {
    return (
      <div className="admin-booking-details-page">
        <div className="admin-details-loading">
          Loading booking details...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-booking-details-page">
        <div className="admin-details-error">
          {error}
        </div>

        <Link
          to="/admin/bookings"
          className="admin-back-button"
        >
          ← Back to Bookings
        </Link>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="admin-booking-details-page">
        <div className="admin-details-error">
          Booking not found.
        </div>

        <Link
          to="/admin/bookings"
          className="admin-back-button"
        >
          ← Back to Bookings
        </Link>
      </div>
    );
  }

  const customerName = [
    booking.first_name,
    booking.last_name,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="admin-booking-details-page">
      <div className="admin-details-header">
        <div>
          <Link
            to="/admin/bookings"
            className="admin-back-link"
          >
            ← Back to Bookings
          </Link>

          <h1>Booking Details</h1>

          <p>{booking.booking_number}</p>
        </div>

        <div className="admin-details-statuses">
          <span
            className={`booking-status ${getStatusClass(
              booking.status
            )}`}
          >
            {getStatusLabel(booking.status)}
          </span>

          <span
            className={`payment-status ${getStatusClass(
              booking.payment_status
            )}`}
          >
            {booking.payment_status || "-"}
          </span>
        </div>
      </div>

      {actionError && (
        <div className="admin-details-error">
          {actionError}
        </div>
      )}

      {actionSuccess && (
        <div className="admin-details-success">
          {actionSuccess}
        </div>
      )}

      <section className="admin-details-card admin-booking-actions-card">
        <div className="admin-booking-actions-header">
          <div>
            <h2>Booking Actions</h2>

            <p>
              Current status:{" "}
              <strong>
                {getStatusLabel(booking.status)}
              </strong>
            </p>
          </div>
        </div>

        <div className="admin-booking-actions">
          {renderActionButtons()}
        </div>
      </section>

      <section className="admin-details-card admin-payment-actions-card">
        <div className="admin-booking-actions-header">
          <div>
            <h2>Payment Actions</h2>

            <p>
              Current payment status:{" "}
              <strong>
                {booking.payment_status || "-"}
              </strong>
            </p>
          </div>
        </div>

        <div className="admin-booking-actions">
          {renderPaymentActionButtons()}
        </div>
      </section>

      <div className="admin-details-grid">
        <section className="admin-details-card">
          <h2>Guest Information</h2>

          <div className="admin-details-fields">
            <div>
              <span>Name</span>
              <strong>{customerName || "-"}</strong>
            </div>

            <div>
              <span>Email</span>
              <strong>
                {booking.email || "-"}
              </strong>
            </div>

            <div>
              <span>Phone</span>
              <strong>
                {booking.phone || "-"}
              </strong>
            </div>

            <div>
              <span>Address</span>
              <strong>
                {booking.address || "-"}
              </strong>
            </div>

            <div>
              <span>City</span>
              <strong>
                {booking.city || "-"}
              </strong>
            </div>

            <div>
              <span>State</span>
              <strong>
                {booking.state || "-"}
              </strong>
            </div>

            <div>
              <span>Country</span>
              <strong>
                {booking.country || "-"}
              </strong>
            </div>

            <div>
              <span>Pincode</span>
              <strong>
                {booking.pincode || "-"}
              </strong>
            </div>
          </div>
        </section>

        <section className="admin-details-card">
          <h2>Stay Information</h2>

          <div className="admin-details-fields">
            <div>
              <span>Check-in</span>
              <strong>
                {formatDate(booking.check_in)}
              </strong>
            </div>

            <div>
              <span>Check-out</span>
              <strong>
                {formatDate(booking.check_out)}
              </strong>
            </div>

            <div>
              <span>Adults</span>
              <strong>
                {booking.adults}
              </strong>
            </div>

            <div>
              <span>Children</span>
              <strong>
                {booking.children}
              </strong>
            </div>

            <div>
              <span>Rooms</span>
              <strong>
                {booking.number_of_rooms}
              </strong>
            </div>
          </div>
        </section>
      </div>

      <section className="admin-details-card">
        <h2>Room Details</h2>

        {booking.rooms?.length > 0 ? (
          <div className="admin-room-table-wrapper">
            <table className="admin-room-table">
              <thead>
                <tr>
                  <th>Room</th>
                  <th>Room Type</th>
                  <th>Rate</th>
                  <th>Nights</th>
                  <th>Subtotal</th>
                </tr>
              </thead>

              <tbody>
                {booking.rooms.map((room, index) => (
                  <tr
                    key={room.room_id || index}
                  >
                    <td>
                      {room.room_number || "-"}
                    </td>

                    <td>
                      {room.room_type_name || "-"}
                    </td>

                    <td>
                      {formatCurrency(room.rate)}
                    </td>

                    <td>
                      {room.number_of_nights || 0}
                    </td>

                    <td>
                      {formatCurrency(
                        room.subtotal
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="admin-empty-message">
            No room information available.
          </p>
        )}
      </section>

      <div className="admin-details-grid">
        <section className="admin-details-card">
          <h2>Payment Summary</h2>

          <div className="admin-payment-summary">
            <div>
              <span>Subtotal</span>
              <strong>
                {formatCurrency(
                  booking.subtotal
                )}
              </strong>
            </div>

            <div>
              <span>Tax</span>
              <strong>
                {formatCurrency(booking.tax)}
              </strong>
            </div>

            <div>
              <span>Discount</span>
              <strong>
                {formatCurrency(
                  booking.discount
                )}
              </strong>
            </div>

            <div className="admin-total-row">
              <span>Total</span>
              <strong>
                {formatCurrency(
                  booking.total_amount
                )}
              </strong>
            </div>
          </div>
        </section>

        <section className="admin-details-card">
          <h2>Special Request</h2>

          <p className="admin-special-request">
            {booking.special_request ||
              "No special request"}
          </p>
        </section>
      </div>

      <section className="admin-details-card admin-booking-meta-card">
        <h2>Booking Information</h2>

        <div className="admin-details-fields">
          <div>
            <span>Created</span>
            <strong>
              {formatDateTime(
                booking.created_at
              )}
            </strong>
          </div>

          <div>
            <span>Last Updated</span>
            <strong>
              {formatDateTime(
                booking.updated_at
              )}
            </strong>
          </div>
        </div>
      </section>
    </div>
  );
}