import { NavLink, useNavigate } from "react-router-dom";
import "./AdminSidebar.css";

function AdminSidebar() {
  const navigate = useNavigate();

  function handleLogout() {
    localStorage.removeItem("chinjak_admin_token");
    localStorage.removeItem("chinjak_admin");

    navigate("/admin/login", { replace: true });
  }

  const navItems = [
    {
      label: "Dashboard",
      path: "/admin/dashboard",
      icon: "⌂",
    },
    {
      label: "Bookings",
      path: "/admin/bookings",
      icon: "▤",
    },
    {
      label: "Rooms",
      path: "/admin/rooms",
      icon: "▥",
    },
    {
      label: "Enquiries",
      path: "/admin/enquiries",
      icon: "✉",
    },
  ];

  return (
    <aside className="admin-sidebar">
      <div className="admin-sidebar-brand">
        <div className="admin-sidebar-brand-name">
          KANGLEI LODGE
        </div>

        <div className="admin-sidebar-brand-subtitle">
          Admin Portal
        </div>
      </div>

      <nav className="admin-sidebar-nav">
        <div className="admin-sidebar-section-label">
          MANAGEMENT
        </div>

        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `admin-sidebar-link ${
                isActive ? "active" : ""
              }`
            }
          >
            <span className="admin-sidebar-icon">
              {item.icon}
            </span>

            <span className="admin-sidebar-link-label">
              {item.label}
            </span>
          </NavLink>
        ))}
      </nav>

      <div className="admin-sidebar-bottom">
        <div className="admin-sidebar-divider" />

        <button
          type="button"
          className="admin-sidebar-logout"
          onClick={handleLogout}
        >
          <span className="admin-sidebar-icon">
            ↪
          </span>

          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}

export default AdminSidebar;