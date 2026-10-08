import { useEffect, useState } from "react";
import {
  getAdminRooms,
  updateAdminRoomStatus,
} from "../../api/http";
import "./AdminRooms.css";

function getStatusClass(status) {
  return String(status || "")
    .toLowerCase()
    .replace(/_/g, "-");
}

function getStatusLabel(status) {
  return String(status || "-").replace(/_/g, " ");
}

function AdminRooms() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] =
    useState(false);
  const [actionError, setActionError] =
    useState("");
  const [successMessage, setSuccessMessage] =
    useState("");

  async function loadRooms() {
    try {
      setLoading(true);
      setError("");

      const response = await getAdminRooms();

      setRooms(response.rooms || []);
    } catch (err) {
      console.error(
        "Failed to load rooms:",
        err
      );

      setError(
        err.message || "Unable to load rooms."
      );

      setRooms([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRooms();
  }, []);

  async function handleStatusChange(
    room,
    newStatus
  ) {
    if (actionLoading) {
      return;
    }

    const confirmed = window.confirm(
      `Change room ${room.room_number} status to ${getStatusLabel(
        newStatus
      )}?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setActionLoading(true);
      setActionError("");
      setSuccessMessage("");

      const response =
        await updateAdminRoomStatus(
          room.id,
          newStatus
        );

      setRooms((currentRooms) =>
        currentRooms.map((currentRoom) =>
          currentRoom.id === room.id
            ? {
                ...currentRoom,
                status: response.room.status,
                updated_at:
                  response.room.updated_at,
              }
            : currentRoom
        )
      );

      setSuccessMessage(
        response.message ||
          "Room status updated successfully."
      );
    } catch (err) {
      console.error(
        "Failed to update room status:",
        err
      );

      setActionError(
        err.message ||
          "Failed to update room status."
      );
    } finally {
      setActionLoading(false);
    }
  }

  const availableCount = rooms.filter(
    (room) => room.status === "AVAILABLE"
  ).length;

  const maintenanceCount = rooms.filter(
    (room) => room.status === "MAINTENANCE"
  ).length;

  const outOfServiceCount = rooms.filter(
    (room) =>
      room.status === "OUT_OF_SERVICE"
  ).length;

  return (
    <div className="admin-rooms-page">
      <div className="admin-rooms-header">
        <div>
          <p className="admin-page-eyebrow">
            ROOM MANAGEMENT
          </p>

          <h1>Rooms</h1>

          <p className="admin-page-description">
            View and manage all physical rooms at
            Kanglei Lodge.
          </p>
        </div>

        <button
          type="button"
          className="admin-rooms-refresh-button"
          onClick={loadRooms}
          disabled={loading}
        >
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      {error && (
        <div className="admin-rooms-error">
          {error}
        </div>
      )}

      {actionError && (
        <div className="admin-rooms-error">
          {actionError}
        </div>
      )}

      {successMessage && (
        <div className="admin-rooms-success">
          {successMessage}
        </div>
      )}

      <div className="admin-rooms-summary">
        <div className="admin-rooms-summary-card">
          <span>Total Rooms</span>
          <strong>{rooms.length}</strong>
        </div>

        <div className="admin-rooms-summary-card">
          <span>Available</span>
          <strong>{availableCount}</strong>
        </div>

        <div className="admin-rooms-summary-card">
          <span>Maintenance</span>
          <strong>{maintenanceCount}</strong>
        </div>

        <div className="admin-rooms-summary-card">
          <span>Out of Service</span>
          <strong>{outOfServiceCount}</strong>
        </div>
      </div>

      <section className="admin-rooms-table-card">
        <div className="admin-rooms-table-header">
          <div>
            <h2>Room List</h2>

            <p>
              {loading
                ? "Loading rooms..."
                : `${rooms.length} room${
                    rooms.length !== 1
                      ? "s"
                      : ""
                  } found`}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="admin-rooms-state">
            <div className="admin-rooms-spinner" />
            <p>Loading rooms...</p>
          </div>
        ) : rooms.length === 0 ? (
          <div className="admin-rooms-state">
            <h3>No rooms found</h3>

            <p>
              No physical rooms are currently
              available.
            </p>
          </div>
        ) : (
          <div className="admin-rooms-table-wrapper">
            <table className="admin-rooms-table">
              <thead>
                <tr>
                  <th>Room</th>
                  <th>Floor</th>
                  <th>Room Type</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {rooms.map((room) => (
                  <tr key={room.id}>
                    <td>
                      <strong className="admin-room-number">
                        {room.room_number}
                      </strong>
                    </td>

                    <td>
                      {room.floor || "-"}
                    </td>

                    <td>
                      {room.room_type_name ||
                        "-"}
                    </td>

                    <td>
                      <span
                        className={`admin-room-status ${getStatusClass(
                          room.status
                        )}`}
                      >
                        {getStatusLabel(
                          room.status
                        )}
                      </span>
                    </td>

                    <td>
                      <div className="admin-room-actions">
                        {room.status !==
                          "AVAILABLE" && (
                          <button
                            type="button"
                            className="admin-room-action available"
                            onClick={() =>
                              handleStatusChange(
                                room,
                                "AVAILABLE"
                              )
                            }
                            disabled={
                              actionLoading
                            }
                          >
                            Available
                          </button>
                        )}

                        {room.status !==
                          "MAINTENANCE" && (
                          <button
                            type="button"
                            className="admin-room-action maintenance"
                            onClick={() =>
                              handleStatusChange(
                                room,
                                "MAINTENANCE"
                              )
                            }
                            disabled={
                              actionLoading
                            }
                          >
                            Maintenance
                          </button>
                        )}

                        {room.status !==
                          "OUT_OF_SERVICE" && (
                          <button
                            type="button"
                            className="admin-room-action out-of-service"
                            onClick={() =>
                              handleStatusChange(
                                room,
                                "OUT_OF_SERVICE"
                              )
                            }
                            disabled={
                              actionLoading
                            }
                          >
                            Out of Service
                          </button>
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

export default AdminRooms;