require("dotenv").config();

const express = require("express");
const path = require("path");

const cors = require("cors");

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const { Pool } = require("pg");

const app = express();
app.use(
  "/images",
  express.static(path.join(__dirname, "public", "images"))
);

const PORT = Number(process.env.PORT || 5022);
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not configured");
}
/*
 * JWT authentication middleware
 *
 * Requires:
 * Authorization: Bearer <jwt-token>
 */
function requireAdminAuth(req, res, next) {
  try {
    const authorization = req.headers.authorization;

    if (!authorization) {
      return res.status(401).json({
        success: false,
        message: "Authorization token is required",
      });
    }

    const [scheme, token] = authorization.split(" ");

    if (scheme !== "Bearer" || !token) {
      return res.status(401).json({
        success: false,
        message: "Invalid authorization format",
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);

    if (decoded.role !== "ADMIN") {
      return res.status(403).json({
        success: false,
        message: "Admin access required",
      });
    }

    req.admin = decoded;

    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Authorization token has expired",
      });
    }

    return res.status(401).json({
      success: false,
      message: "Invalid authorization token",
    });
  }
}

const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 5432),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

/*
 * Validate YYYY-MM-DD date strings
 */
function isValidDateString(value) {
  if (typeof value !== "string") return false;

  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

  if (!dateRegex.test(value)) return false;

  const parsed = new Date(`${value}T00:00:00Z`);

  if (Number.isNaN(parsed.getTime())) return false;

  const [year, month, day] = value.split("-").map(Number);

  return (
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() + 1 === month &&
    parsed.getUTCDate() === day
  );
}

app.use(cors());
app.use(express.json());

/*
 * Health check
 */
app.get("/chinjak-api/health", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW() AS current_time");

    res.json({
      success: true,
      message: "Chinjak API is running",
      database: "connected",
      time: result.rows[0].current_time,
    });
  } catch (error) {
    console.error("Database health check failed:", error.message);

    res.status(500).json({
      success: false,
      message: "Database connection failed",
    });
  }
});

/*
 * Hotel information
 */
app.get("/chinjak-api/hotel", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        id,
        name,
        description,
        address,
        city,
        state,
        country,
        pincode,
        phone,
        email,
        latitude,
        longitude,
        google_maps_url,
        check_in_time,
        check_out_time
      FROM hotel
      ORDER BY id
      LIMIT 1
    `);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Hotel information not found",
      });
    }

    res.json({
      success: true,
      hotel: result.rows[0],
    });
  } catch (error) {
    console.error("Hotel query failed:", error.message);

    res.status(500).json({
      success: false,
      message: "Unable to retrieve hotel information",
    });
  }
});

/*
 * Get all active room types
 */
app.get("/chinjak-api/rooms", async (req, res) => {
  try {
    const roomTypesResult = await pool.query(`
      SELECT
        rt.id,
        rt.name,
        rt.description,
        rt.max_adults,
        rt.max_children,
        rt.bed_type,
        rt.room_size,
        rt.base_rate,
        rt.extra_adult_rate,
        rt.extra_child_rate,
        rt.status,

        (
          SELECT COUNT(*)
          FROM rooms r
          WHERE r.room_type_id = rt.id
            AND r.status = 'AVAILABLE'
        ) AS available_room_count

      FROM room_types rt
      WHERE rt.status = 'ACTIVE'
      ORDER BY rt.id
    `);

    const rooms = [];

    for (const roomType of roomTypesResult.rows) {
      const amenitiesResult = await pool.query(
        `
        SELECT
          a.id,
          a.name,
          a.description,
          a.icon
        FROM amenities a
        JOIN room_type_amenities rta
          ON rta.amenity_id = a.id
        WHERE rta.room_type_id = $1
        ORDER BY a.id
        `,
        [roomType.id]
      );

      const imagesResult = await pool.query(
        `
        SELECT
          id,
          image_url,
          display_order,
          is_primary
        FROM room_images
        WHERE room_type_id = $1
        ORDER BY display_order, id
        `,
        [roomType.id]
      );

      rooms.push({
        ...roomType,
        available_room_count: Number(roomType.available_room_count),
        amenities: amenitiesResult.rows,
        images: imagesResult.rows,
      });
    }

    res.json({
      success: true,
      rooms,
    });
  } catch (error) {
    console.error("Rooms query failed:", error.message);

    res.status(500).json({
      success: false,
      message: "Unable to retrieve rooms",
    });
  }
});

/*
 * Get a single room type
 */
app.get("/chinjak-api/rooms/:id", async (req, res) => {
  try {
    const roomTypeId = Number(req.params.id);

    if (!Number.isInteger(roomTypeId) || roomTypeId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid room ID",
      });
    }

    const roomTypeResult = await pool.query(
      `
      SELECT
        rt.id,
        rt.name,
        rt.description,
        rt.max_adults,
        rt.max_children,
        rt.bed_type,
        rt.room_size,
        rt.base_rate,
        rt.extra_adult_rate,
        rt.extra_child_rate,
        rt.status,

        (
          SELECT COUNT(*)
          FROM rooms r
          WHERE r.room_type_id = rt.id
            AND r.status = 'AVAILABLE'
        ) AS available_room_count

      FROM room_types rt
      WHERE rt.id = $1
        AND rt.status = 'ACTIVE'
      `,
      [roomTypeId]
    );

    if (roomTypeResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Room type not found",
      });
    }

    const roomType = roomTypeResult.rows[0];

    const amenitiesResult = await pool.query(
      `
      SELECT
        a.id,
        a.name,
        a.description,
        a.icon
      FROM amenities a
      JOIN room_type_amenities rta
        ON rta.amenity_id = a.id
      WHERE rta.room_type_id = $1
      ORDER BY a.id
      `,
      [roomTypeId]
    );

    const imagesResult = await pool.query(
      `
      SELECT
        id,
        image_url,
        display_order,
        is_primary
      FROM room_images
      WHERE room_type_id = $1
      ORDER BY display_order, id
      `,
      [roomTypeId]
    );

    const physicalRoomsResult = await pool.query(
      `
      SELECT
        id,
        room_number,
        floor,
        status
      FROM rooms
      WHERE room_type_id = $1
      ORDER BY room_number
      `,
      [roomTypeId]
    );

    res.json({
      success: true,
      room: {
        ...roomType,
        available_room_count: Number(roomType.available_room_count),
        amenities: amenitiesResult.rows,
        images: imagesResult.rows,
        physical_rooms: physicalRoomsResult.rows,
      },
    });
  } catch (error) {
    console.error("Room detail query failed:", error.message);

    res.status(500).json({
      success: false,
      message: "Unable to retrieve room details",
    });
  }
});

/*
 * Check room availability
 *
 * Example:
 * /chinjak-api/availability
 *   ?checkIn=2026-10-10
 *   &checkOut=2026-10-12
 *   &adults=2
 *   &children=1
 */
app.get("/chinjak-api/availability", async (req, res) => {
  try {
    const {
      checkIn,
      checkOut,
      adults,
      children = 0,
    } = req.query;

    /*
     * Validate required dates
     */
    if (!checkIn || !checkOut) {
      return res.status(400).json({
        success: false,
        message: "checkIn and checkOut are required",
      });
    }

    /*
     * Validate date format
     */
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

    if (!dateRegex.test(checkIn) || !dateRegex.test(checkOut)) {
      return res.status(400).json({
        success: false,
        message: "Dates must use YYYY-MM-DD format",
      });
    }

    /*
     * Validate that the dates are real calendar dates
     */
    const parsedCheckIn = new Date(`${checkIn}T00:00:00Z`);
    const parsedCheckOut = new Date(`${checkOut}T00:00:00Z`);

    if (
      Number.isNaN(parsedCheckIn.getTime()) ||
      Number.isNaN(parsedCheckOut.getTime())
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid check-in or check-out date",
      });
    }

    if (checkOut <= checkIn) {
      return res.status(400).json({
        success: false,
        message: "checkOut must be after checkIn",
      });
    }

    /*
     * Validate guest counts
     */
    const adultCount = Number(adults);
    const childCount = Number(children);

    if (!Number.isInteger(adultCount) || adultCount <= 0) {
      return res.status(400).json({
        success: false,
        message: "adults must be a positive integer",
      });
    }

    if (!Number.isInteger(childCount) || childCount < 0) {
      return res.status(400).json({
        success: false,
        message: "children must be a non-negative integer",
      });
    }

    /*
     * Find active room types that can accommodate
     * the requested number of guests.
     */
    const roomTypesResult = await pool.query(
      `
      SELECT
        rt.id,
        rt.name,
        rt.description,
        rt.max_adults,
        rt.max_children,
        rt.bed_type,
        rt.room_size,
        rt.base_rate,
        rt.extra_adult_rate,
        rt.extra_child_rate,
        rt.status
      FROM room_types rt
      WHERE rt.status = 'ACTIVE'
        AND rt.max_adults >= $1
        AND rt.max_children >= $2
      ORDER BY rt.id
      `,
      [adultCount, childCount]
    );

    const nights =
      (parsedCheckOut.getTime() - parsedCheckIn.getTime()) /
      (1000 * 60 * 60 * 24);

    const availableRooms = [];

    for (const roomType of roomTypesResult.rows) {
      /*
       * Find physical rooms of this type that are not
       * already assigned to an overlapping booking.
       *
       * Overlap condition:
       *
       * existing check-in < requested check-out
       * AND
       * existing check-out > requested check-in
       */
      const availableRoomsResult = await pool.query(
        `
        SELECT
          r.id,
          r.room_number,
          r.floor
        FROM rooms r
        WHERE r.room_type_id = $1
          AND r.status = 'AVAILABLE'

          AND NOT EXISTS (
            SELECT 1
            FROM booking_rooms br
            JOIN bookings b
              ON b.id = br.booking_id
            WHERE br.room_id = r.id

              AND b.status IN (
                'PENDING',
                'CONFIRMED',
                'CHECKED_IN'
              )

              AND b.check_in < $3::date
              AND b.check_out > $2::date
          )

        ORDER BY r.room_number
        `,
        [
          roomType.id,
          checkIn,
          checkOut,
        ]
      );

      const availableCount = availableRoomsResult.rows.length;

      /*
       * Calculate rate for the requested number of guests.
       *
       * Base rate covers the normal occupancy defined
       * by max_adults / max_children.
       *
       * Extra guests are charged according to the
       * configured extra adult/child rates.
       */
      const includedAdults = Math.min(
        adultCount,
        Number(roomType.max_adults)
      );

      const includedChildren = Math.min(
        childCount,
        Number(roomType.max_children)
      );

      const extraAdults = Math.max(
        0,
        adultCount - includedAdults
      );

      const extraChildren = Math.max(
        0,
        childCount - includedChildren
      );

      const nightlyRate =
        Number(roomType.base_rate) +
        extraAdults * Number(roomType.extra_adult_rate) +
        extraChildren * Number(roomType.extra_child_rate);

      const totalRate = nightlyRate * nights;

      availableRooms.push({
        id: roomType.id,
        name: roomType.name,
        description: roomType.description,
        max_adults: roomType.max_adults,
        max_children: roomType.max_children,
        bed_type: roomType.bed_type,
        room_size: roomType.room_size,

        base_rate: Number(roomType.base_rate),
        extra_adult_rate: Number(roomType.extra_adult_rate),
        extra_child_rate: Number(roomType.extra_child_rate),

        nightly_rate: nightlyRate,
        number_of_nights: nights,
        total_rate: totalRate,

        available_room_count: availableCount,

        available_rooms: availableRoomsResult.rows,
      });
    }

    res.json({
      success: true,

      search: {
        check_in: checkIn,
        check_out: checkOut,
        number_of_nights: nights,
        adults: adultCount,
        children: childCount,
      },

      rooms: availableRooms,
    });
  } catch (error) {
    console.error("Availability query failed:", error.message);

    res.status(500).json({
      success: false,
      message: "Unable to check room availability",
    });
  }
});

/*
 * Create a booking
 *
 * POST /chinjak-api/bookings
 *
 * The API:
 * 1. Validates guest and booking information
 * 2. Locks the selected room type
 * 3. Finds one available physical room
 * 4. Creates/updates the customer
 * 5. Creates the booking
 * 6. Assigns the physical room
 *
 * Initial booking status:
 * PENDING
 *
 * Initial payment status:
 * UNPAID
 */
app.post("/chinjak-api/bookings", async (req, res) => {
  const client = await pool.connect();

  try {
    const {
      firstName,
      lastName = "",
      email,
      phone,
      address = "",
      city = "",
      state = "",
      country = "India",
      pincode = "",
      checkIn,
      checkOut,
      adults,
      children = 0,
      roomTypeId,
      specialRequest = "",
    } = req.body;

    /*
     * Validate required fields
     */
    if (
      !firstName ||
      !email ||
      !phone ||
      !checkIn ||
      !checkOut ||
      roomTypeId === undefined ||
      roomTypeId === null
    ) {
      return res.status(400).json({
        success: false,
        message:
          "firstName, email, phone, checkIn, checkOut and roomTypeId are required",
      });
    }

    /*
     * Validate dates
     */
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

    if (!dateRegex.test(checkIn) || !dateRegex.test(checkOut)) {
      return res.status(400).json({
        success: false,
        message: "Dates must use YYYY-MM-DD format",
      });
    }

    const parsedCheckIn = new Date(`${checkIn}T00:00:00Z`);
    const parsedCheckOut = new Date(`${checkOut}T00:00:00Z`);

    if (
      Number.isNaN(parsedCheckIn.getTime()) ||
      Number.isNaN(parsedCheckOut.getTime())
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid check-in or check-out date",
      });
    }

    if (checkOut <= checkIn) {
      return res.status(400).json({
        success: false,
        message: "checkOut must be after checkIn",
      });
    }

    /*
     * Validate guest counts
     */
    const adultCount = Number(adults);
    const childCount = Number(children);
    const selectedRoomTypeId = Number(roomTypeId);

    if (!Number.isInteger(adultCount) || adultCount <= 0) {
      return res.status(400).json({
        success: false,
        message: "adults must be a positive integer",
      });
    }

    if (!Number.isInteger(childCount) || childCount < 0) {
      return res.status(400).json({
        success: false,
        message: "children must be a non-negative integer",
      });
    }

    if (
      !Number.isInteger(selectedRoomTypeId) ||
      selectedRoomTypeId <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "roomTypeId must be a positive integer",
      });
    }

    /*
     * Calculate number of nights
     */
    const nights =
      (parsedCheckOut.getTime() - parsedCheckIn.getTime()) /
      (1000 * 60 * 60 * 24);

    await client.query("BEGIN");

    /*
     * Lock the selected room type.
     *
     * This prevents concurrent booking transactions from
     * processing the same room type at exactly the same time.
     */
    const roomTypeResult = await client.query(
      `
      SELECT
        id,
        name,
        description,
        max_adults,
        max_children,
        bed_type,
        room_size,
        base_rate,
        extra_adult_rate,
        extra_child_rate,
        status
      FROM room_types
      WHERE id = $1
      FOR UPDATE
      `,
      [selectedRoomTypeId]
    );

    if (roomTypeResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        success: false,
        message: "Room type not found",
      });
    }

    const roomType = roomTypeResult.rows[0];

    /*
     * Make sure the room type is active.
     */
    if (roomType.status !== "ACTIVE") {
      await client.query("ROLLBACK");

      return res.status(400).json({
        success: false,
        message: "Selected room type is not available",
      });
    }

    /*
     * Check room capacity.
     */
    if (
      adultCount > Number(roomType.max_adults) ||
      childCount > Number(roomType.max_children)
    ) {
      await client.query("ROLLBACK");

      return res.status(400).json({
        success: false,
        message:
          "Selected room type cannot accommodate the requested number of guests",
      });
    }

    /*
     * Find one physical room that is available for the
     * requested dates.
     *
     * FOR UPDATE locks the selected room during this
     * transaction.
     */
    const availableRoomResult = await client.query(
      `
      SELECT
        r.id,
        r.room_number,
        r.floor
      FROM rooms r
      WHERE r.room_type_id = $1
        AND r.status = 'AVAILABLE'

        AND NOT EXISTS (
          SELECT 1
          FROM booking_rooms br
          JOIN bookings b
            ON b.id = br.booking_id
          WHERE br.room_id = r.id

            AND b.status IN (
              'PENDING',
              'CONFIRMED',
              'CHECKED_IN'
            )

            AND b.check_in < $3::date
            AND b.check_out > $2::date
        )

      ORDER BY r.room_number
      LIMIT 1
      FOR UPDATE OF r
      `,
      [
        selectedRoomTypeId,
        checkIn,
        checkOut,
      ]
    );

    if (availableRoomResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(409).json({
        success: false,
        message:
          "No rooms of the selected type are available for the requested dates",
      });
    }

    const selectedRoom = availableRoomResult.rows[0];

    /*
     * Calculate booking amount.
     */
    const includedAdults = Math.min(
      adultCount,
      Number(roomType.max_adults)
    );

    const includedChildren = Math.min(
      childCount,
      Number(roomType.max_children)
    );

    const extraAdults = Math.max(
      0,
      adultCount - includedAdults
    );

    const extraChildren = Math.max(
      0,
      childCount - includedChildren
    );

    const nightlyRate =
      Number(roomType.base_rate) +
      extraAdults * Number(roomType.extra_adult_rate) +
      extraChildren * Number(roomType.extra_child_rate);

    const subtotal = nightlyRate * nights;

    /*
     * Tax and discount are currently zero.
     *
     * These can be changed later when the payment/tax
     * requirements are finalized.
     */
    const tax = 0;
    const discount = 0;
    const totalAmount = subtotal + tax - discount;

    /*
     * Find customer by email.
     *
     * Email comparison is case-insensitive.
     */
    const customerResult = await client.query(
      `
      SELECT id
      FROM customers
      WHERE LOWER(email) = LOWER($1)
      LIMIT 1
      `,
      [email.trim()]
    );

    let customerId;

    if (customerResult.rows.length > 0) {
      /*
       * Existing customer.
       *
       * Update their latest contact information.
       */
      customerId = customerResult.rows[0].id;

      await client.query(
        `
        UPDATE customers
        SET
          first_name = $1,
          last_name = $2,
          phone = $3,
          address = $4,
          city = $5,
          state = $6,
          country = $7,
          pincode = $8,
          updated_at = NOW()
        WHERE id = $9
        `,
        [
          firstName.trim(),
          lastName.trim(),
          phone.trim(),
          address.trim(),
          city.trim(),
          state.trim(),
          country.trim(),
          pincode.trim(),
          customerId,
        ]
      );
    } else {
      /*
       * New customer.
       */
      const newCustomerResult = await client.query(
        `
        INSERT INTO customers (
          first_name,
          last_name,
          email,
          phone,
          address,
          city,
          state,
          country,
          pincode
        )
        VALUES (
          $1,
          $2,
          $3,
          $4,
          $5,
          $6,
          $7,
          $8,
          $9
        )
        RETURNING id
        `,
        [
          firstName.trim(),
          lastName.trim(),
          email.trim(),
          phone.trim(),
          address.trim(),
          city.trim(),
          state.trim(),
          country.trim(),
          pincode.trim(),
        ]
      );

      customerId = newCustomerResult.rows[0].id;
    }

    /*
     * Generate a unique booking number.
     *
     * Example:
     * CHJ-1761234567890-A1B2C3D4
     */
    const crypto = require("crypto");

    const bookingNumber =
      `CHJ-${Date.now()}-${crypto.randomUUID()
        .replace(/-/g, "")
        .substring(0, 8)
        .toUpperCase()}`;

    /*
     * Create booking.
     */
    const bookingResult = await client.query(
      `
      INSERT INTO bookings (
        booking_number,
        customer_id,
        check_in,
        check_out,
        adults,
        children,
        number_of_rooms,
        subtotal,
        tax,
        discount,
        total_amount,
        status,
        payment_status,
        special_request
      )
      VALUES (
        $1,
        $2,
        $3,
        $4,
        $5,
        $6,
        1,
        $7,
        $8,
        $9,
        $10,
        'PENDING',
        'UNPAID',
        $11
      )
      RETURNING
        id,
        booking_number,
        customer_id,
        check_in,
        check_out,
        adults,
        children,
        number_of_rooms,
        subtotal,
        tax,
        discount,
        total_amount,
        status,
        payment_status,
        special_request,
        created_at
      `,
      [
        bookingNumber,
        customerId,
        checkIn,
        checkOut,
        adultCount,
        childCount,
        subtotal,
        tax,
        discount,
        totalAmount,
        specialRequest.trim(),
      ]
    );

    const booking = bookingResult.rows[0];

    /*
     * Assign the physical room to the booking.
     */
    const bookingRoomResult = await client.query(
      `
      INSERT INTO booking_rooms (
        booking_id,
        room_id,
        room_type_id,
        rate,
        number_of_nights,
        subtotal
      )
      VALUES (
        $1,
        $2,
        $3,
        $4,
        $5,
        $6
      )
      RETURNING
        id,
        booking_id,
        room_id,
        room_type_id,
        rate,
        number_of_nights,
        subtotal
      `,
      [
        booking.id,
        selectedRoom.id,
        selectedRoomTypeId,
        nightlyRate,
        nights,
        subtotal,
      ]
    );

    await client.query("COMMIT");

    /*
     * Return booking confirmation information.
     */
    res.status(201).json({
      success: true,
      message: "Booking created successfully",

      booking: {
        ...booking,
        subtotal: Number(booking.subtotal),
        tax: Number(booking.tax),
        discount: Number(booking.discount),
        total_amount: Number(booking.total_amount),

        room_type: {
          id: roomType.id,
          name: roomType.name,
        },

        room: {
          id: selectedRoom.id,
          room_number: selectedRoom.room_number,
          floor: selectedRoom.floor,
        },

        rate: {
          nightly_rate: nightlyRate,
          number_of_nights: nights,
          subtotal,
        },

        booking_room: bookingRoomResult.rows[0],
      },
    });
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch (rollbackError) {
      console.error(
        "Booking rollback failed:",
        rollbackError.message
      );
    }

    console.error("Booking creation failed:", error);

    res.status(500).json({
      success: false,
      message: "Unable to create booking",
    });
  } finally {
    client.release();
  }
});
/* Enquiries*/
app.post("/chinjak-api/enquiries", async (req, res) => {
  try {
    const {
      name,
      phone,
      email,
      checkIn,
      checkOut,
      message,
    } = req.body;

    // Required fields
    if (!name || !phone || !email || !message) {
      return res.status(400).json({
        success: false,
        message: "name, phone, email and message are required",
      });
    }

    // Basic email validation
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email address",
      });
    }

    // Validate dates when supplied
    if (checkIn && !isValidDateString(checkIn)) {
      return res.status(400).json({
        success: false,
        message: "checkIn must be a valid date in YYYY-MM-DD format",
      });
    }

    if (checkOut && !isValidDateString(checkOut)) {
      return res.status(400).json({
        success: false,
        message: "checkOut must be a valid date in YYYY-MM-DD format",
      });
    }

    if (checkIn && checkOut && checkOut <= checkIn) {
      return res.status(400).json({
        success: false,
        message: "checkOut must be later than checkIn",
      });
    }

    const result = await pool.query(
      `
      INSERT INTO enquiries (
        name,
        phone,
        email,
        check_in,
        check_out,
        message,
        status
      )
      VALUES ($1, $2, $3, $4, $5, $6, 'NEW')
      RETURNING
        id,
        name,
        phone,
        email,
        check_in,
        check_out,
        message,
        status,
        created_at,
        updated_at
      `,
      [
        name.trim(),
        phone.trim(),
        email.trim().toLowerCase(),
        checkIn || null,
        checkOut || null,
        message.trim(),
      ]
    );

    return res.status(201).json({
      success: true,
      message: "Enquiry submitted successfully",
      enquiry: result.rows[0],
    });
  } catch (error) {
    console.error("Create enquiry error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to submit enquiry",
    });
  }
});

/*
 * Get booking details by booking number
 *
 * GET /chinjak-api/bookings/:bookingNumber
 */
app.get("/chinjak-api/bookings/:bookingNumber", async (req, res) => {
  try {
    const bookingNumber = req.params.bookingNumber?.trim();

    if (!bookingNumber) {
      return res.status(400).json({
        success: false,
        message: "Booking number is required",
      });
    }

    const result = await pool.query(
      `
      SELECT
        b.id,
        b.booking_number,
        b.check_in,
        b.check_out,
        b.adults,
        b.children,
        b.number_of_rooms,
        b.subtotal,
        b.tax,
        b.discount,
        b.total_amount,
        b.status,
        b.payment_status,
        b.special_request,
        b.created_at,
        b.updated_at,

        c.id AS customer_id,
        c.first_name,
        c.last_name,
        c.email,
        c.phone,
        c.address,
        c.city,
        c.state,
        c.country,
        c.pincode,

        rt.id AS room_type_id,
        rt.name AS room_type_name,
        rt.bed_type,
        rt.room_size,

        br.id AS booking_room_id,
        br.room_id,
        br.rate,
        br.number_of_nights,
        br.subtotal AS room_subtotal,

        r.room_number,
        r.floor

      FROM bookings b

      JOIN customers c
        ON c.id = b.customer_id

      LEFT JOIN booking_rooms br
        ON br.booking_id = b.id

      LEFT JOIN room_types rt
        ON rt.id = br.room_type_id

      LEFT JOIN rooms r
        ON r.id = br.room_id

      WHERE b.booking_number = $1
      ORDER BY br.id
      `,
      [bookingNumber]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    const firstRow = result.rows[0];

    const booking = {
      id: firstRow.id,
      booking_number: firstRow.booking_number,
      check_in: firstRow.check_in,
      check_out: firstRow.check_out,
      adults: firstRow.adults,
      children: firstRow.children,
      number_of_rooms: firstRow.number_of_rooms,
      subtotal: firstRow.subtotal,
      tax: firstRow.tax,
      discount: firstRow.discount,
      total: firstRow.total_amount,
      status: firstRow.status,
      payment_status: firstRow.payment_status,
      special_request: firstRow.special_request,
      created_at: firstRow.created_at,
      updated_at: firstRow.updated_at,

      customer: {
        id: firstRow.customer_id,
        first_name: firstRow.first_name,
        last_name: firstRow.last_name,
        email: firstRow.email,
        phone: firstRow.phone,
        address: firstRow.address,
        city: firstRow.city,
        state: firstRow.state,
        country: firstRow.country,
        pincode: firstRow.pincode,
      },

      rooms: result.rows
        .filter((row) => row.booking_room_id !== null)
        .map((row) => ({
          booking_room_id: row.booking_room_id,
          room_id: row.room_id,
          room_number: row.room_number,
          floor: row.floor,
          room_type_id: row.room_type_id,
          room_type_name: row.room_type_name,
          bed_type: row.bed_type,
          room_size: row.room_size,
          rate: row.rate,
          number_of_nights: row.number_of_nights,
          subtotal: row.room_subtotal,
        })),
    };

    return res.json({
      success: true,
      booking,
    });
  } catch (error) {
    console.error("Get booking error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve booking",
    });
  }
});

/* Cancellation */
/*
 * Cancel a booking
 *
 * POST /chinjak-api/bookings/:bookingNumber/cancel
 *
 * Request body:
 * {
 *   "email": "guest@example.com"
 * }
 */
app.post("/chinjak-api/bookings/:bookingNumber/cancel", async (req, res) => {
  const client = await pool.connect();

  try {
    const bookingNumber = req.params.bookingNumber?.trim();
    const email = req.body?.email?.trim().toLowerCase();

    if (!bookingNumber) {
      return res.status(400).json({
        success: false,
        message: "Booking number is required",
      });
    }

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    await client.query("BEGIN");

    const bookingResult = await client.query(
      `
      SELECT
        b.id,
        b.booking_number,
        b.status,
        b.payment_status,
        c.email AS customer_email
      FROM bookings b
      INNER JOIN customers c
        ON c.id = b.customer_id
      WHERE b.booking_number = $1
      FOR UPDATE OF b
      `,
      [bookingNumber]
    );

    if (bookingResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    const booking = bookingResult.rows[0];

    if (booking.customer_email?.trim().toLowerCase() !== email) {
      await client.query("ROLLBACK");

      return res.status(403).json({
        success: false,
        message: "Booking verification failed",
      });
    }

    if (booking.status === "CANCELLED") {
      await client.query("ROLLBACK");

      return res.status(400).json({
        success: false,
        message: "Booking is already cancelled",
      });
    }

    if (
      booking.status === "CHECKED_IN" ||
      booking.status === "CHECKED_OUT" ||
      booking.status === "NO_SHOW"
    ) {
      await client.query("ROLLBACK");

      return res.status(400).json({
        success: false,
        message: `Booking cannot be cancelled because its status is ${booking.status}`,
      });
    }

    const updateResult = await client.query(
      `
      UPDATE bookings
      SET
        status = 'CANCELLED',
        updated_at = NOW()
      WHERE id = $1
      RETURNING
        id,
        booking_number,
        status,
        payment_status,
        check_in,
        check_out,
        updated_at
      `,
      [booking.id]
    );

    await client.query("COMMIT");

    res.json({
      success: true,
      message: "Booking cancelled successfully",
      booking: updateResult.rows[0],
    });
  } catch (error) {
    await client.query("ROLLBACK");

    console.error("Cancel booking error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to cancel booking",
    });
  } finally {
    client.release();
  }
});
/*
 * Protected admin authentication test
 *
 * GET /chinjak-api/admin/me
 */
app.get("/chinjak-api/admin/me", requireAdminAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT
        id,
        name,
        email,
        role,
        status,
        last_login_at
      FROM admin_users
      WHERE id = $1
        AND status = 'ACTIVE'
      LIMIT 1
      `,
      [req.admin.adminId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Admin account not found or inactive",
      });
    }

    const admin = result.rows[0];

    return res.json({
      success: true,
      admin: {
        id: admin.id.toString(),
        name: admin.name,
        email: admin.email,
        role: admin.role,
        status: admin.status,
        last_login_at: admin.last_login_at,
      },
    });
  } catch (error) {
    console.error("Admin profile error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve admin profile",
    });
  }
});

/*
 * Protected Admin Dashboard Summary
 *
 * GET /chinjak-api/admin/dashboard
 */
/*
 * Protected Admin Dashboard Summary
 *
 * GET /chinjak-api/admin/dashboard
 */
app.get(
  "/chinjak-api/admin/dashboard",
  requireAdminAuth,
  async (req, res) => {
    try {
      const roomStatsResult = await pool.query(`
        SELECT
          COUNT(*)::int AS total_rooms,
          COUNT(*) FILTER (WHERE status = 'AVAILABLE')::int AS available_rooms,
          COUNT(*) FILTER (WHERE status = 'MAINTENANCE')::int AS maintenance_rooms,
          COUNT(*) FILTER (WHERE status = 'OUT_OF_SERVICE')::int AS out_of_service_rooms
        FROM rooms
      `);

      const roomStats = roomStatsResult.rows[0];

      const bookingStatsResult = await pool.query(`
  SELECT
    COUNT(*)::int AS total_bookings,
    COUNT(*) FILTER (WHERE status = 'PENDING')::int AS pending_bookings,
    COUNT(*) FILTER (WHERE status = 'CONFIRMED')::int AS confirmed_bookings,
    COUNT(*) FILTER (WHERE status = 'CHECKED_IN')::int AS checked_in_bookings,
    COUNT(*) FILTER (WHERE status = 'CHECKED_OUT')::int AS checked_out_bookings,
    COUNT(*) FILTER (WHERE status = 'CANCELLED')::int AS cancelled_bookings,
    COUNT(*) FILTER (WHERE status = 'NO_SHOW')::int AS no_show_bookings
  FROM bookings
`);

const bookingStats = bookingStatsResult.rows[0];

const todayActivityResult = await pool.query(`
  SELECT
    COUNT(*) FILTER (
      WHERE check_in = CURRENT_DATE
        AND status IN ('PENDING', 'CONFIRMED', 'CHECKED_IN')
    )::int AS today_check_ins,

    COUNT(*) FILTER (
      WHERE check_out = CURRENT_DATE
        AND status IN ('CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT')
    )::int AS today_check_outs
  FROM bookings
`);

const todayActivity = todayActivityResult.rows[0];
const enquiryStatsResult = await pool.query(`
  SELECT
    COUNT(*)::int AS total_enquiries,
    COUNT(*) FILTER (WHERE status = 'NEW')::int AS new_enquiries,
    COUNT(*) FILTER (WHERE status = 'CONTACTED')::int AS contacted_enquiries,
    COUNT(*) FILTER (WHERE status = 'RESOLVED')::int AS resolved_enquiries
  FROM enquiries
`);

const enquiryStats = enquiryStatsResult.rows[0];
const recentBookingsResult = await pool.query(`
  SELECT
    b.booking_number,
    b.check_in,
    b.check_out,
    b.adults,
    b.children,
    b.number_of_rooms,
    b.total_amount,
    b.status,
    b.payment_status,
    b.created_at,

    c.first_name,
    c.last_name,
    c.email

  FROM bookings b

  JOIN customers c
    ON c.id = b.customer_id

  ORDER BY b.created_at DESC
  LIMIT 5
`);

const recentBookings = recentBookingsResult.rows;

      return res.json({
        success: true,
        admin: {
          id: req.admin.adminId,
          email: req.admin.email,
          role: req.admin.role,
        },
        rooms: roomStats,
        bookings: bookingStats,
        today: todayActivity,
        enquiries: enquiryStats,
        recent_bookings: recentBookings,
      });
    } catch (error) {
      console.error("Admin dashboard error:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to load admin dashboard",
      });
    }
  }
);

/*
 * Protected Admin Booking List
 *
 * GET /chinjak-api/admin/bookings
 */
app.get(
  "/chinjak-api/admin/bookings",
  requireAdminAuth,
  async (req, res) => {
    try {
      const status = req.query.status?.trim().toUpperCase();

const allowedStatuses = [
  "PENDING",
  "CONFIRMED",
  "CANCELLED",
  "CHECKED_IN",
  "CHECKED_OUT",
  "NO_SHOW",
];

if (status && !allowedStatuses.includes(status)) {
  return res.status(400).json({
    success: false,
    message: "Invalid booking status",
    allowed_statuses: allowedStatuses,
  });
}

const queryParams = [];

let whereClause = "";

if (status) {
  queryParams.push(status);
  whereClause = "WHERE b.status = $1";
}

const result = await pool.query(
  `
    SELECT
      b.id,
      b.booking_number,
      b.check_in,
      b.check_out,
      b.adults,
      b.children,
      b.number_of_rooms,
      b.subtotal,
      b.tax,
      b.discount,
      b.total_amount,
      b.status,
      b.payment_status,
      b.special_request,
      b.created_at,
      b.updated_at,

      c.first_name,
      c.last_name,
      c.email,
      c.phone,

      COALESCE(
        json_agg(
          json_build_object(
            'room_id', br.room_id,
            'room_number', r.room_number,
            'room_type_id', br.room_type_id,
            'room_type_name', rt.name,
            'rate', br.rate,
            'number_of_nights', br.number_of_nights,
            'subtotal', br.subtotal
          )
          ORDER BY br.id
        ) FILTER (WHERE br.id IS NOT NULL),
        '[]'::json
      ) AS rooms

    FROM bookings b

    JOIN customers c
      ON c.id = b.customer_id

    LEFT JOIN booking_rooms br
      ON br.booking_id = b.id

    LEFT JOIN rooms r
      ON r.id = br.room_id

    LEFT JOIN room_types rt
      ON rt.id = br.room_type_id

    ${whereClause}

    GROUP BY
      b.id,
      c.id

    ORDER BY b.created_at DESC
  `,
  queryParams
);

      return res.json({
        success: true,
        count: result.rows.length,
        bookings: result.rows,
      });
    } catch (error) {
      console.error("Admin booking list error:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to retrieve bookings",
      });
    }
  }
);

/*
 * Protected Admin Booking Details
 *
 * GET /chinjak-api/admin/bookings/:bookingNumber
 */
app.get(
  "/chinjak-api/admin/bookings/:bookingNumber",
  requireAdminAuth,
  async (req, res) => {
    try {
      const bookingNumber = req.params.bookingNumber?.trim();

      if (!bookingNumber) {
        return res.status(400).json({
          success: false,
          message: "Booking number is required",
        });
      }

      const result = await pool.query(
        `
          SELECT
            b.id,
            b.booking_number,
            b.check_in,
            b.check_out,
            b.adults,
            b.children,
            b.number_of_rooms,
            b.subtotal,
            b.tax,
            b.discount,
            b.total_amount,
            b.status,
            b.payment_status,
            b.special_request,
            b.created_at,
            b.updated_at,

            c.id AS customer_id,
            c.first_name,
            c.last_name,
            c.email,
            c.phone,
            c.address,
            c.city,
            c.state,
            c.country,
            c.pincode,

            COALESCE(
              json_agg(
                json_build_object(
                  'room_id', br.room_id,
                  'room_number', r.room_number,
                  'floor', r.floor,
                  'room_type_id', br.room_type_id,
                  'room_type_name', rt.name,
                  'rate', br.rate,
                  'number_of_nights', br.number_of_nights,
                  'subtotal', br.subtotal
                )
                ORDER BY br.id
              ) FILTER (WHERE br.id IS NOT NULL),
              '[]'::json
            ) AS rooms

          FROM bookings b

          JOIN customers c
            ON c.id = b.customer_id

          LEFT JOIN booking_rooms br
            ON br.booking_id = b.id

          LEFT JOIN rooms r
            ON r.id = br.room_id

          LEFT JOIN room_types rt
            ON rt.id = br.room_type_id

          WHERE b.booking_number = $1

          GROUP BY
            b.id,
            c.id
        `,
        [bookingNumber]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Booking not found",
        });
      }

      const booking = result.rows[0];

      return res.json({
        success: true,
        booking,
      });
    } catch (error) {
      console.error(
        "Admin booking details error:",
        error
      );

      return res.status(500).json({
        success: false,
        message: "Failed to retrieve booking details",
      });
    }
  }
);
/*
 * Protected Admin Booking Status Update
 *
 * PATCH /chinjak-api/admin/bookings/:bookingNumber/status
 */
app.patch(
  "/chinjak-api/admin/bookings/:bookingNumber/status",
  requireAdminAuth,
  async (req, res) => {
    try {
      const bookingNumber =
        req.params.bookingNumber?.trim();

      const newStatus =
        req.body?.status?.trim().toUpperCase();

      const allowedStatuses = [
        "CONFIRMED",
        "CANCELLED",
        "CHECKED_IN",
        "CHECKED_OUT",
        "NO_SHOW",
      ];

      if (!bookingNumber) {
        return res.status(400).json({
          success: false,
          message: "Booking number is required",
        });
      }

      if (!newStatus) {
        return res.status(400).json({
          success: false,
          message: "Booking status is required",
        });
      }

      if (!allowedStatuses.includes(newStatus)) {
        return res.status(400).json({
          success: false,
          message: "Invalid booking status",
        });
      }

      const result = await pool.query(
        `
          SELECT
            id,
            booking_number,
            status
          FROM bookings
          WHERE booking_number = $1
        `,
        [bookingNumber]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Booking not found",
        });
      }

      const booking = result.rows[0];
      const currentStatus = booking.status;

      const allowedTransitions = {
        PENDING: [
          "CONFIRMED",
          "CANCELLED",
          "NO_SHOW",
        ],

        CONFIRMED: [
          "CANCELLED",
          "CHECKED_IN",
          "NO_SHOW",
        ],

        CHECKED_IN: [
          "CHECKED_OUT",
        ],

        CHECKED_OUT: [],
        CANCELLED: [],
        NO_SHOW: [],
      };

      if (
        !allowedTransitions[currentStatus]?.includes(
          newStatus
        )
      ) {
        return res.status(400).json({
          success: false,
          message: `Cannot change booking status from ${currentStatus} to ${newStatus}`,
        });
      }

      const updateResult = await pool.query(
        `
          UPDATE bookings
          SET
            status = $1,
            updated_at = NOW()
          WHERE id = $2
          RETURNING
            id,
            booking_number,
            status,
            payment_status,
            updated_at
        `,
        [newStatus, booking.id]
      );

      return res.json({
        success: true,
        message: "Booking status updated successfully",
        booking: updateResult.rows[0],
      });
    } catch (error) {
      console.error(
        "Admin booking status update error:",
        error
      );

      return res.status(500).json({
        success: false,
        message: "Failed to update booking status",
      });
    }
  }
);

/*
 * Protected Admin Booking Payment Status Update
 *
 * PATCH /chinjak-api/admin/bookings/:bookingNumber/payment-status
 */
app.patch(
  "/chinjak-api/admin/bookings/:bookingNumber/payment-status",
  requireAdminAuth,
  async (req, res) => {
    try {
      const bookingNumber =
        req.params.bookingNumber?.trim();

      const newPaymentStatus =
        req.body?.paymentStatus?.trim().toUpperCase();

      const allowedPaymentStatuses = [
        "UNPAID",
        "PENDING",
        "PAID",
        "REFUNDED",
      ];

      if (!bookingNumber) {
        return res.status(400).json({
          success: false,
          message: "Booking number is required",
        });
      }

      if (!newPaymentStatus) {
        return res.status(400).json({
          success: false,
          message: "Payment status is required",
        });
      }

      if (
        !allowedPaymentStatuses.includes(
          newPaymentStatus
        )
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid payment status",
        });
      }

      const result = await pool.query(
        `
          SELECT
            id,
            booking_number,
            status,
            payment_status
          FROM bookings
          WHERE booking_number = $1
        `,
        [bookingNumber]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Booking not found",
        });
      }

      const booking = result.rows[0];
      const currentPaymentStatus =
        booking.payment_status;

      const allowedTransitions = {
        UNPAID: ["PENDING", "PAID"],
        PENDING: ["UNPAID", "PAID"],
        PAID: ["REFUNDED"],
        REFUNDED: [],
      };

      if (
        !allowedTransitions[
          currentPaymentStatus
        ]?.includes(newPaymentStatus)
      ) {
        return res.status(400).json({
          success: false,
          message:
            `Cannot change payment status from ` +
            `${currentPaymentStatus} to ${newPaymentStatus}`,
        });
      }

      const updateResult = await pool.query(
        `
          UPDATE bookings
          SET
            payment_status = $1,
            updated_at = NOW()
          WHERE id = $2
          RETURNING
            id,
            booking_number,
            status,
            payment_status,
            updated_at
        `,
        [newPaymentStatus, booking.id]
      );

      return res.json({
        success: true,
        message:
          "Payment status updated successfully",
        booking: updateResult.rows[0],
      });
    } catch (error) {
      console.error(
        "Admin payment status update error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to update payment status",
      });
    }
  }
);

/*
 * Admin Login
 *
 * POST /chinjak-api/admin/login
 *
 * Request body:
 * {
 *   "email": "sinambirla@gmail.com",
 *   "password": "your-password"
 * }
 */
app.post("/chinjak-api/admin/login", async (req, res) => {
  try {
    const email = req.body?.email?.trim().toLowerCase();
    const password = req.body?.password;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const result = await pool.query(
      `
      SELECT
        id,
        name,
        email,
        password_hash,
        role,
        status
      FROM admin_users
      WHERE LOWER(email) = $1
      LIMIT 1
      `,
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const admin = result.rows[0];

    if (admin.status !== "ACTIVE") {
      return res.status(403).json({
        success: false,
        message: "Admin account is inactive",
      });
    }

    const passwordMatches = await bcrypt.compare(
      password,
      admin.password_hash
    );

    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const token = jwt.sign(
      {
        adminId: admin.id.toString(),
        email: admin.email,
        role: admin.role,
      },
      JWT_SECRET,
      {
        expiresIn: "8h",
      }
    );

    await pool.query(
      `
      UPDATE admin_users
      SET
        last_login_at = NOW(),
        updated_at = NOW()
      WHERE id = $1
      `,
      [admin.id]
    );

    return res.json({
      success: true,
      message: "Login successful",
      token,
      admin: {
        id: admin.id.toString(),
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (error) {
    console.error("Admin login error:", error);

    return res.status(500).json({
      success: false,
      message: "Admin login failed",
    });
  }
});

/*
 * Protected Admin Enquiries List
 *
 * GET /chinjak-api/admin/enquiries
 */
app.get(
  "/chinjak-api/admin/enquiries",
  requireAdminAuth,
  async (req, res) => {
    try {
      const status = req.query.status
        ?.trim()
        .toUpperCase();

      const allowedStatuses = [
        "NEW",
        "CONTACTED",
        "RESOLVED",
      ];

      if (
        status &&
        !allowedStatuses.includes(status)
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid enquiry status",
        });
      }

      const values = [];
      let whereClause = "";

      if (status) {
        values.push(status);
        whereClause = `WHERE e.status = $1`;
      }

      const result = await pool.query(
        `
          SELECT
            e.id,
            e.name,
            e.phone,
            e.email,
            e.check_in,
            e.check_out,
            e.message,
            e.status,
            e.created_at,
            e.updated_at
          FROM enquiries e
          ${whereClause}
          ORDER BY e.created_at DESC
        `,
        values
      );

      return res.json({
        success: true,
        enquiries: result.rows,
      });
    } catch (error) {
      console.error(
        "Admin enquiries list error:",
        error
      );

      return res.status(500).json({
        success: false,
        message: "Failed to retrieve enquiries",
      });
    }
  }
);

/*
 * Protected Admin Enquiry Status Update
 *
 * PATCH /chinjak-api/admin/enquiries/:enquiryId/status
 */
app.patch(
  "/chinjak-api/admin/enquiries/:enquiryId/status",
  requireAdminAuth,
  async (req, res) => {
    try {
      const enquiryId = Number(
        req.params.enquiryId
      );

      const newStatus =
        req.body?.status?.trim().toUpperCase();

      if (
        !Number.isInteger(enquiryId) ||
        enquiryId <= 0
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid enquiry ID",
        });
      }

      if (!newStatus) {
        return res.status(400).json({
          success: false,
          message: "Enquiry status is required",
        });
      }

      const allowedStatuses = [
        "NEW",
        "CONTACTED",
        "RESOLVED",
      ];

      if (!allowedStatuses.includes(newStatus)) {
        return res.status(400).json({
          success: false,
          message: "Invalid enquiry status",
        });
      }

      const enquiryResult = await pool.query(
        `
          SELECT
            id,
            name,
            status
          FROM enquiries
          WHERE id = $1
        `,
        [enquiryId]
      );

      if (enquiryResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Enquiry not found",
        });
      }

      const enquiry = enquiryResult.rows[0];
      const currentStatus = enquiry.status;

      const allowedTransitions = {
        NEW: ["CONTACTED", "RESOLVED"],
        CONTACTED: ["NEW", "RESOLVED"],
        RESOLVED: [],
      };

      if (
        !allowedTransitions[currentStatus]?.includes(
          newStatus
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            `Cannot change enquiry status from ` +
            `${currentStatus} to ${newStatus}`,
        });
      }

      const updateResult = await pool.query(
        `
          UPDATE enquiries
          SET
            status = $1,
            updated_at = NOW()
          WHERE id = $2
          RETURNING
            id,
            name,
            phone,
            email,
            check_in,
            check_out,
            message,
            status,
            created_at,
            updated_at
        `,
        [newStatus, enquiryId]
      );

      return res.json({
        success: true,
        message:
          "Enquiry status updated successfully",
        enquiry: updateResult.rows[0],
      });
    } catch (error) {
      console.error(
        "Admin enquiry status update error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to update enquiry status",
      });
    }
  }
);


/*
 * Protected Admin Rooms List
 *
 * GET /chinjak-api/admin/rooms
 */
app.get(
  "/chinjak-api/admin/rooms",
  requireAdminAuth,
  async (req, res) => {
    try {
      const result = await pool.query(
        `
          SELECT
            r.id,
            r.room_number,
            r.floor,
            r.room_type_id,
            rt.name AS room_type_name,
            r.status,
            r.created_at,
            r.updated_at
          FROM rooms r
          INNER JOIN room_types rt
            ON rt.id = r.room_type_id
          ORDER BY
            r.room_number
        `
      );

      return res.json({
        success: true,
        rooms: result.rows,
      });
    } catch (error) {
      console.error(
        "Admin rooms list error:",
        error
      );

      return res.status(500).json({
        success: false,
        message: "Failed to retrieve rooms",
      });
    }
  }
);

/*
 * Protected Admin Room Status Update
 *
 * PATCH /chinjak-api/admin/rooms/:roomId/status
 */
app.patch(
  "/chinjak-api/admin/rooms/:roomId/status",
  requireAdminAuth,
  async (req, res) => {
    try {
      const roomId = Number(req.params.roomId);

      const newStatus =
        req.body?.status?.trim().toUpperCase();

      const allowedStatuses = [
        "AVAILABLE",
        "MAINTENANCE",
        "OUT_OF_SERVICE",
      ];

      if (
        !Number.isInteger(roomId) ||
        roomId <= 0
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid room ID",
        });
      }

      if (!newStatus) {
        return res.status(400).json({
          success: false,
          message: "Room status is required",
        });
      }

      if (!allowedStatuses.includes(newStatus)) {
        return res.status(400).json({
          success: false,
          message: "Invalid room status",
        });
      }

      const roomResult = await pool.query(
        `
          SELECT
            id,
            room_number,
            status
          FROM rooms
          WHERE id = $1
        `,
        [roomId]
      );

      if (roomResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Room not found",
        });
      }

      const updateResult = await pool.query(
        `
          UPDATE rooms
          SET
            status = $1,
            updated_at = NOW()
          WHERE id = $2
          RETURNING
            id,
            room_number,
            floor,
            room_type_id,
            status,
            updated_at
        `,
        [newStatus, roomId]
      );

      return res.json({
        success: true,
        message: "Room status updated successfully",
        room: updateResult.rows[0],
      });
    } catch (error) {
      console.error(
        "Admin room status update error:",
        error
      );

      return res.status(500).json({
        success: false,
        message: "Failed to update room status",
      });
    }
  }
);

/*
 * Start server
 */

app.listen(PORT, "0.0.0.0", () => {
  console.log(
    `Chinjak API running on http://0.0.0.0:${PORT}`
  );
});
