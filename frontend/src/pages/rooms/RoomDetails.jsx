import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { getRoomDetails } from "../../api/http";

function RoomDetails() {
  const { roomTypeId } = useParams();
  const location = useLocation();

  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadRoomDetails() {
      try {
        setLoading(true);
        setError("");

        const result = await getRoomDetails(roomTypeId);

        setRoom(result.room);
      } catch (err) {
        setError(err.message || "Unable to load room details.");
      } finally {
        setLoading(false);
      }
    }

    loadRoomDetails();
  }, [roomTypeId]);

  if (loading) {
    return (
      <div className="room-details-page">
        <div className="container">
          <p>Loading room details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="room-details-page">
        <div className="container">
          <p className="availability-error">{error}</p>

          <Link to="/" className="back-link">
            ← Back to home
          </Link>
        </div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="room-details-page">
        <div className="container">
          <p>Room not found.</p>

          <Link to="/" className="back-link">
            ← Back to home
          </Link>
        </div>
      </div>
    );
  }

  const primaryImage =
    room.images?.find((image) => image.is_primary)?.image_url ||
    room.images?.[0]?.image_url;

  /*
   * Images returned by the API are relative paths such as:
   * /images/rooms/standard-placeholder.jpg
   *
   * The backend is running on port 5022, so convert the
   * relative image path into a backend URL.
   */
  const imageUrl = primaryImage
    ? primaryImage.startsWith("http")
      ? primaryImage
      : `http://127.0.0.1:5022${primaryImage}`
    : null;

  return (
    <div className="room-details-page">
      <div className="container">

        <Link to="/" className="back-link">
          ← Back to home
        </Link>

        <div className="room-details-card">

          {/* ROOM IMAGE */}
          {imageUrl && (
            <div className="room-details-image">
              <img
                src={imageUrl}
                alt={room.name}
                onError={(event) => {
                  event.currentTarget.style.display = "none";
                }}
              />
            </div>
          )}

          {/* ROOM INFORMATION */}
          <div className="room-details-content">

            <p className="section-eyebrow">
              ROOM DETAILS
            </p>

            <h1>{room.name}</h1>

            {room.description && (
              <p className="room-description">
                {room.description}
              </p>
            )}

            {/* BASIC ROOM DETAILS */}
            <div className="room-details-grid">

              <div>
                <span>Rate</span>
                <strong>
                  ₹{room.base_rate} / night
                </strong>
              </div>

              <div>
                <span>Available rooms</span>
                <strong>
                  {room.available_room_count}
                </strong>
              </div>

              <div>
                <span>Adults</span>
                <strong>
                  {room.max_adults}
                </strong>
              </div>

              <div>
                <span>Children</span>
                <strong>
                  {room.max_children}
                </strong>
              </div>

              <div>
                <span>Bed</span>
                <strong>
                  {room.bed_type}
                </strong>
              </div>

              <div>
                <span>Room size</span>
                <strong>
                  {room.room_size}
                </strong>
              </div>

            </div>

            {/* AMENITIES */}
            {room.amenities?.length > 0 && (
              <div className="room-amenities">

                <h2>Amenities</h2>

                <div className="amenities-list">

                  {room.amenities.map((amenity) => (
                    <div
                      className="amenity-item"
                      key={amenity.id}
                    >
                      <strong>
                        {amenity.name}
                      </strong>

                      {amenity.description && (
                        <span>
                          {amenity.description}
                        </span>
                      )}
                    </div>
                  ))}

                </div>
              </div>
            )}

            {/* PHYSICAL ROOM AVAILABILITY */}
            {room.physical_rooms?.length > 0 && (
              <div className="physical-rooms">

                <h2>Availability</h2>

                <p>
                  {room.physical_rooms.length} room
                  {room.physical_rooms.length !== 1
                    ? "s"
                    : ""}{" "}
                  currently available.
                </p>

              </div>
            )}

            {/* BOOK BUTTON */}
            <Link
              to={`/booking/${roomTypeId}${location.search}`}
              className="room-book-button"
            >
              Book This Room
            </Link>

          </div>
        </div>
      </div>
    </div>
  );
}

export default RoomDetails;