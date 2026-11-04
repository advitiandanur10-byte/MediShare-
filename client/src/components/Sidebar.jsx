
import { NavLink } from "react-router-dom";

const navItems = [
  { name: "Home", path: "/", icon: "⌂" },
  { name: "Medicines & disposal", path: "/medicines", icon: "◇" },
  { name: "Calendar", path: "/calendar", icon: "▦" },
  { name: "Add medicine", path: "/add-medicine", icon: "+" },
  { name: "Family", path: "/family", icon: "♧" },
  { name: "Wastage trends", path: "/wastage-trends", icon: "↗" }
];

function Sidebar() {
  return (
    <aside className="sidebar">
      <NavLink to="/" className="brand">
        <span className="brand-mark">✳</span>
        <span>
          <strong>MediShare</strong>
          <small>CARE • SHARE • SAVE</small>
        </span>
      </NavLink>

      <div className="nav-caption">WORKSPACE</div>

      <nav className="side-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === "/"}
            className={({ isActive }) =>
              `nav-link ${isActive ? "active" : ""}`
            }
          >
            <span className="nav-symbol">{item.icon}</span>
            <span>{item.name}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-bottom">
        <div className="tip-card">
          <span className="tip-icon">✳</span>
          <strong>Small steps matter</strong>
          <p>Track what you have. Reduce what you waste.</p>
        </div>

        <div className="profile-row">
          <div className="avatar">M</div>
          <div>
            <strong>My household</strong>
            <small>Personal space</small>
          </div>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
