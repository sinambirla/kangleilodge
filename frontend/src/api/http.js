import API_BASE_URL from "./api";

async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "API request failed");
  }

  return data;
}

export async function getHotel() {
  return apiRequest("/hotel");
}

export async function getRooms() {
  return apiRequest("/rooms");
}

export async function getRoomDetails(roomTypeId) {
  return apiRequest(`/rooms/${roomTypeId}`);
}

export async function getAvailability(params) {
  const query = new URLSearchParams(params).toString();

  return apiRequest(`/availability?${query}`);
}

export async function createBooking(bookingData) {
  return apiRequest("/bookings", {
    method: "POST",
    body: JSON.stringify(bookingData),
  });
}

export async function getBooking(bookingNumber) {
  return apiRequest(`/bookings/${bookingNumber}`);
}

export async function cancelBooking(bookingNumber, email) {
  return apiRequest(`/bookings/${bookingNumber}/cancel`, {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function createEnquiry(enquiryData) {
  return apiRequest("/enquiries", {
    method: "POST",
    body: JSON.stringify(enquiryData),
  });
}

export async function adminLogin(email, password) {
  return apiRequest("/admin/login", {
    method: "POST",
    body: JSON.stringify({
      email,
      password,
    }),
  });
}

export async function getAdminDashboard() {
  const token = localStorage.getItem("chinjak_admin_token");

  return apiRequest("/admin/dashboard", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function getAdminBookings(status = "") {
  const token = localStorage.getItem("chinjak_admin_token");

  const query = status
    ? `?status=${encodeURIComponent(status)}`
    : "";

  return apiRequest(`/admin/bookings${query}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function getAdminBookingDetails(
  bookingNumber
) {
  const token = localStorage.getItem(
    "chinjak_admin_token"
  );

  return apiRequest(
    `/admin/bookings/${encodeURIComponent(
      bookingNumber
    )}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
}

export async function updateAdminBookingStatus(
  bookingNumber,
  status
) {
  const token = localStorage.getItem(
    "chinjak_admin_token"
  );

  return apiRequest(
    `/admin/bookings/${encodeURIComponent(
      bookingNumber
    )}/status`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        status,
      }),
    }
  );
}

export async function updateAdminBookingPaymentStatus(
  bookingNumber,
  paymentStatus
) {
  const token = localStorage.getItem(
    "chinjak_admin_token"
  );

  return apiRequest(
    `/admin/bookings/${encodeURIComponent(
      bookingNumber
    )}/payment-status`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        paymentStatus,
      }),
    }
  );
}
export async function getAdminRooms() {
  const token = localStorage.getItem(
    "chinjak_admin_token"
  );

  return apiRequest("/admin/rooms", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function updateAdminRoomStatus(
  roomId,
  status
) {
  const token = localStorage.getItem(
    "chinjak_admin_token"
  );

  return apiRequest(
    `/admin/rooms/${encodeURIComponent(
      roomId
    )}/status`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        status,
      }),
    }
  );
}

export async function getAdminEnquiries(status = "") {
  const token = localStorage.getItem(
    "chinjak_admin_token"
  );

  const query = status
    ? `?status=${encodeURIComponent(status)}`
    : "";

  return apiRequest(
    `/admin/enquiries${query}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
}

export async function updateAdminEnquiryStatus(
  enquiryId,
  status
) {
  const token = localStorage.getItem(
    "chinjak_admin_token"
  );

  return apiRequest(
    `/admin/enquiries/${encodeURIComponent(
      enquiryId
    )}/status`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        status,
      }),
    }
  );
}
