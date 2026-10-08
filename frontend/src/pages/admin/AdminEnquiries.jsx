import { useEffect, useState } from "react";
import {
  getAdminEnquiries,
  updateAdminEnquiryStatus,
} from "../../api/http";
import "./AdminEnquiries.css";

function formatDate(dateString) {
  if (!dateString) return "-";

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

  return new Date(dateString).toLocaleString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  );
}

function getStatusClass(status) {
  return String(status || "")
    .toLowerCase()
    .replace(/_/g, "-");
}

function getStatusLabel(status) {
  return String(status || "-").replace(
    /_/g,
    " "
  );
}

function AdminEnquiries() {
  const [enquiries, setEnquiries] = useState([]);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] =
    useState(false);
  const [successMessage, setSuccessMessage] =
    useState("");

  async function loadEnquiries(
    selectedStatus = ""
  ) {
    try {
      setLoading(true);
      setError("");

      const response =
        await getAdminEnquiries(
          selectedStatus
        );

      setEnquiries(
        response.enquiries || []
      );
    } catch (err) {
      console.error(
        "Failed to load enquiries:",
        err
      );

      setError(
        err.message ||
          "Unable to load enquiries."
      );

      setEnquiries([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadEnquiries(status);
  }, [status]);

  async function handleStatusChange(
    enquiry,
    newStatus
  ) {
    if (actionLoading) {
      return;
    }

    const confirmed = window.confirm(
      `Change enquiry status to ${getStatusLabel(
        newStatus
      )}?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setActionLoading(true);
      setError("");
      setSuccessMessage("");

      const response =
        await updateAdminEnquiryStatus(
          enquiry.id,
          newStatus
        );

      setEnquiries((current) =>
        current.map((item) =>
          item.id === enquiry.id
            ? {
                ...item,
                status:
                  response.enquiry.status,
                updated_at:
                  response.enquiry
                    .updated_at,
              }
            : item
        )
      );

      setSuccessMessage(
        response.message ||
          "Enquiry status updated successfully."
      );
    } catch (err) {
      console.error(
        "Failed to update enquiry status:",
        err
      );

      setError(
        err.message ||
          "Failed to update enquiry status."
      );
    } finally {
      setActionLoading(false);
    }
  }

  const newCount = enquiries.filter(
    (enquiry) => enquiry.status === "NEW"
  ).length;

  const contactedCount = enquiries.filter(
    (enquiry) =>
      enquiry.status === "CONTACTED"
  ).length;

  const resolvedCount = enquiries.filter(
    (enquiry) =>
      enquiry.status === "RESOLVED"
  ).length;

  function renderActions(enquiry) {
    if (enquiry.status === "NEW") {
      return (
        <>
          <button
            type="button"
            className="admin-enquiry-action contacted"
            onClick={() =>
              handleStatusChange(
                enquiry,
                "CONTACTED"
              )
            }
            disabled={actionLoading}
          >
            Contacted
          </button>

          <button
            type="button"
            className="admin-enquiry-action resolved"
            onClick={() =>
              handleStatusChange(
                enquiry,
                "RESOLVED"
              )
            }
            disabled={actionLoading}
          >
            Resolved
          </button>
        </>
      );
    }

    if (enquiry.status === "CONTACTED") {
      return (
        <>
          <button
            type="button"
            className="admin-enquiry-action new"
            onClick={() =>
              handleStatusChange(
                enquiry,
                "NEW"
              )
            }
            disabled={actionLoading}
          >
            New
          </button>

          <button
            type="button"
            className="admin-enquiry-action resolved"
            onClick={() =>
              handleStatusChange(
                enquiry,
                "RESOLVED"
              )
            }
            disabled={actionLoading}
          >
            Resolved
          </button>
        </>
      );
    }

    return (
      <span className="admin-enquiry-no-actions">
        No further actions
      </span>
    );
  }

  return (
    <div className="admin-enquiries-page">
      <div className="admin-enquiries-header">
        <div>
          <p className="admin-page-eyebrow">
            ENQUIRY MANAGEMENT
          </p>

          <h1>Enquiries</h1>

          <p className="admin-page-description">
            View and manage guest enquiries at
            Kanglei Lodge.
          </p>
        </div>

        <div className="admin-enquiries-filter">
          <label htmlFor="enquiry-status">
            Status
          </label>

          <select
            id="enquiry-status"
            value={status}
            onChange={(event) =>
              setStatus(event.target.value)
            }
          >
            <option value="">
              All Enquiries
            </option>
            <option value="NEW">
              New
            </option>
            <option value="CONTACTED">
              Contacted
            </option>
            <option value="RESOLVED">
              Resolved
            </option>
          </select>
        </div>
      </div>

      {error && (
        <div className="admin-enquiries-error">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="admin-enquiries-success">
          {successMessage}
        </div>
      )}

      <div className="admin-enquiries-summary">
        <div className="admin-enquiries-summary-card">
          <span>Total</span>
          <strong>{enquiries.length}</strong>
        </div>

        <div className="admin-enquiries-summary-card">
          <span>New</span>
          <strong>{newCount}</strong>
        </div>

        <div className="admin-enquiries-summary-card">
          <span>Contacted</span>
          <strong>
            {contactedCount}
          </strong>
        </div>

        <div className="admin-enquiries-summary-card">
          <span>Resolved</span>
          <strong>
            {resolvedCount}
          </strong>
        </div>
      </div>

      <section className="admin-enquiries-table-card">
        <div className="admin-enquiries-table-header">
          <div>
            <h2>Enquiry List</h2>

            <p>
              {loading
                ? "Loading enquiries..."
                : `${enquiries.length} ${
                    enquiries.length === 1
                      ? "enquiry"
                      : "enquiries"
                  } found`}
            </p>
          </div>

          <button
            type="button"
            className="admin-enquiries-refresh-button"
            onClick={() =>
              loadEnquiries(status)
            }
            disabled={loading}
          >
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>

        {loading ? (
          <div className="admin-enquiries-state">
            <div className="admin-enquiries-spinner" />
            <p>Loading enquiries...</p>
          </div>
        ) : enquiries.length === 0 ? (
          <div className="admin-enquiries-state">
            <h3>No enquiries found</h3>

            <p>
              There are no enquiries matching the
              selected status.
            </p>
          </div>
        ) : (
          <div className="admin-enquiries-table-wrapper">
            <table className="admin-enquiries-table">
              <thead>
                <tr>
                  <th>Guest</th>
                  <th>Contact</th>
                  <th>Stay</th>
                  <th>Message</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {enquiries.map((enquiry) => (
                  <tr key={enquiry.id}>
                    <td>
                      <strong>
                        {enquiry.name}
                      </strong>
                    </td>

                    <td>
                      <div className="admin-enquiry-contact">
                        <span>
                          {enquiry.email}
                        </span>
                        <span>
                          {enquiry.phone}
                        </span>
                      </div>
                    </td>

                    <td>
                      <div className="admin-enquiry-stay">
                        {enquiry.check_in &&
                        enquiry.check_out ? (
                          <>
                            <strong>
                              {formatDate(
                                enquiry.check_in
                              )}
                            </strong>

                            <span>
                              to
                            </span>

                            <strong>
                              {formatDate(
                                enquiry.check_out
                              )}
                            </strong>
                          </>
                        ) : (
                          <span>
                            Not specified
                          </span>
                        )}
                      </div>
                    </td>

                    <td>
                      <div className="admin-enquiry-message">
                        {enquiry.message}
                      </div>
                    </td>

                    <td>
                      <span
                        className={`admin-enquiry-status ${getStatusClass(
                          enquiry.status
                        )}`}
                      >
                        {getStatusLabel(
                          enquiry.status
                        )}
                      </span>
                    </td>

                    <td>
                      {formatDateTime(
                        enquiry.created_at
                      )}
                    </td>

                    <td>
                      <div className="admin-enquiry-actions">
                        {renderActions(
                          enquiry
                        )}
                      </div>
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

export default AdminEnquiries;