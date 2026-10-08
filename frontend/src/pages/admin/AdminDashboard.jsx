import { useEffect, useState } from "react";
import { getAdminDashboard } from "../../api/http";
import "./AdminDashboard.css";

function formatDate(dateString) {
  if (!dateString) return "-";

  return new Date(dateString).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
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
  return String(status || "").toLowerCase().replace(/_/g, "-");
}

function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);
        setError("");

        const result = await getAdminDashboard();

        setData(result);
      } catch (err) {
        console.error("Admin dashboard error:", err);

        setError(
          err?.message || "Unable to load admin dashboard."
        );
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="admin-dashboard-page">
        <div className="admin-dashboard-loading">
          <div className="admin-loading-spinner"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-dashboard-page">
        <div className="admin-dashboard-error">
          <h2>Unable to load dashboard</h2>
          <p>{error}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const {
    admin,
    rooms,
    bookings,
    today,
    enquiries,
    recent_bookings: recentBookings,
  } = data;

  return (
    <div className="admin-dashboard-page">
      <div className="admin-dashboard-container">

        {/* Header */}
        <header className="admin-dashboard-header">
          <div>
            <p className="admin-dashboard-eyebrow">
              KANGLEI LODGE ADMINISTRATION
            </p>

            <h1>Admin Dashboard</h1>

            <p className="admin-dashboard-welcome">
              Welcome back, {admin?.email}
            </p>
          </div>

          <div className="admin-header-user">
            <span className="admin-user-role">
              {admin?.role || "ADMIN"}
            </span>

            <button
              type="button"
              className="admin-logout-button"
              onClick={() => {
                localStorage.removeItem("chinjak_admin_token");
                localStorage.removeItem("chinjak_admin");
                window.location.href = "/admin/login";
              }}
            >
              Logout
            </button>
          </div>
        </header>

        {/* Overview cards */}
        <section className="admin-section">
          <div className="admin-section-heading">
            <h2>Overview</h2>
          </div>

          <div className="admin-stat-grid">

            <div className="admin-stat-card">
              <div className="admin-stat-icon rooms-icon">
                🛏️
              </div>

              <div>
                <p>Total Rooms</p>
                <strong>{rooms?.total_rooms ?? 0}</strong>
              </div>
            </div>

            <div className="admin-stat-card">
              <div className="admin-stat-icon available-icon">
                ✓
              </div>

              <div>
                <p>Available Rooms</p>
                <strong>{rooms?.available_rooms ?? 0}</strong>
              </div>
            </div>

            <div className="admin-stat-card">
              <div className="admin-stat-icon booking-icon">
                📋
              </div>

              <div>
                <p>Total Bookings</p>
                <strong>{bookings?.total_bookings ?? 0}</strong>
              </div>
            </div>

            <div className="admin-stat-card">
              <div className="admin-stat-icon enquiry-icon">
                ✉
              </div>

              <div>
                <p>Total Enquiries</p>
                <strong>{enquiries?.total_enquiries ?? 0}</strong>
              </div>
            </div>

          </div>
        </section>

        {/* Today's activity */}
        <section className="admin-section">
          <div className="admin-section-heading">
            <h2>Today's Activity</h2>
          </div>

          <div className="admin-today-grid">

            <div className="admin-today-card">
              <div className="admin-today-number">
                {today?.today_check_ins ?? 0}
              </div>

              <div>
                <h3>Check-ins</h3>
                <p>Guests arriving today</p>
              </div>
            </div>

            <div className="admin-today-card">
              <div className="admin-today-number">
                {today?.today_check_outs ?? 0}
              </div>

              <div>
                <h3>Check-outs</h3>
                <p>Guests departing today</p>
              </div>
            </div>

          </div>
        </section>

        {/* Rooms and bookings */}
        <section className="admin-dashboard-columns">

          <div className="admin-panel">
            <div className="admin-panel-header">
              <h2>Room Status</h2>
            </div>

            <div className="admin-status-list">

              <div className="admin-status-row">
                <span>Available</span>
                <strong>{rooms?.available_rooms ?? 0}</strong>
              </div>

              <div className="admin-status-row">
                <span>Maintenance</span>
                <strong>{rooms?.maintenance_rooms ?? 0}</strong>
              </div>

              <div className="admin-status-row">
                <span>Out of Service</span>
                <strong>{rooms?.out_of_service_rooms ?? 0}</strong>
              </div>

              <div className="admin-status-row total-row">
                <span>Total</span>
                <strong>{rooms?.total_rooms ?? 0}</strong>
              </div>

            </div>
          </div>

          <div className="admin-panel">
            <div className="admin-panel-header">
              <h2>Booking Status</h2>
            </div>

            <div className="admin-status-list">

              <div className="admin-status-row">
                <span>Pending</span>
                <strong>{bookings?.pending_bookings ?? 0}</strong>
              </div>

              <div className="admin-status-row">
                <span>Confirmed</span>
                <strong>{bookings?.confirmed_bookings ?? 0}</strong>
              </div>

              <div className="admin-status-row">
                <span>Checked In</span>
                <strong>{bookings?.checked_in_bookings ?? 0}</strong>
              </div>

              <div className="admin-status-row">
                <span>Checked Out</span>
                <strong>{bookings?.checked_out_bookings ?? 0}</strong>
              </div>

              <div className="admin-status-row">
                <span>Cancelled</span>
                <strong>{bookings?.cancelled_bookings ?? 0}</strong>
              </div>

              <div className="admin-status-row">
                <span>No Show</span>
                <strong>{bookings?.no_show_bookings ?? 0}</strong>
              </div>

            </div>
          </div>

          <div className="admin-panel">
            <div className="admin-panel-header">
              <h2>Enquiries</h2>
            </div>

            <div className="admin-status-list">

              <div className="admin-status-row">
                <span>New</span>
                <strong>{enquiries?.new_enquiries ?? 0}</strong>
              </div>

              <div className="admin-status-row">
                <span>Contacted</span>
                <strong>{enquiries?.contacted_enquiries ?? 0}</strong>
              </div>

              <div className="admin-status-row">
                <span>Resolved</span>
                <strong>{enquiries?.resolved_enquiries ?? 0}</strong>
              </div>

              <div className="admin-status-row total-row">
                <span>Total</span>
                <strong>{enquiries?.total_enquiries ?? 0}</strong>
              </div>

            </div>
          </div>

        </section>

        {/* Recent bookings */}
        <section className="admin-section">
          <div className="admin-section-heading">
            <div>
              <h2>Recent Bookings</h2>
              <p>The five most recent bookings</p>
            </div>
          </div>

          <div className="admin-bookings-table-wrapper">

            {recentBookings?.length ? (
              <table className="admin-bookings-table">

                <thead>
                  <tr>
                    <th>Booking</th>
                    <th>Guest</th>
                    <th>Stay</th>
                    <th>Guests</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Payment</th>
                  </tr>
                </thead>

                <tbody>
                  {recentBookings.map((booking) => (
                    <tr key={booking.booking_number}>

                      <td>
                        <strong className="booking-number">
                          {booking.booking_number}
                        </strong>

                        <small>
                          Created{" "}
                          {formatDateTime(booking.created_at)}
                        </small>
                      </td>

                      <td>
                        <strong>
                          {booking.first_name} {booking.last_name}
                        </strong>

                        <small>{booking.email}</small>
                      </td>

                      <td>
                        <strong>
                          {formatDate(booking.check_in)}
                        </strong>

                        <small>
                          to {formatDate(booking.check_out)}
                        </small>
                      </td>

                      <td>
                        <strong>
                          {booking.adults} Adult
                          {booking.adults !== 1 ? "s" : ""}
                        </strong>

                        <small>
                          {booking.children} Child
                          {booking.children !== 1 ? "ren" : ""}
                        </small>
                      </td>

                      <td>
                        <strong>
                          {formatAmount(booking.total_amount)}
                        </strong>

                        <small>
                          {booking.number_of_rooms} room
                          {booking.number_of_rooms !== 1 ? "s" : ""}
                        </small>
                      </td>

                      <td>
                        <span
                          className={`admin-status-badge ${getStatusClass(
                            booking.status
                          )}`}
                        >
                          {booking.status}
                        </span>
                      </td>

                      <td>
                        <span
                          className={`admin-status-badge payment-${getStatusClass(
                            booking.payment_status
                          )}`}
                        >
                          {booking.payment_status}
                        </span>
                      </td>

                    </tr>
                  ))}
                </tbody>

              </table>
            ) : (
              <div className="admin-empty-state">
                No recent bookings found.
              </div>
            )}

          </div>
        </section>

      </div>
    </div>
  );
}

export default AdminDashboard;