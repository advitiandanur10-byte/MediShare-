
import { NavLink } from "react-router-dom";

const navItems = [
  { name: "Overview", path: "/", icon: "⌂" },
  { name: "Medicines & Disposal", path: "/medicines", icon: "✚" },
  { name: "Calendar", path: "/calendar", icon: "▦" },
  { name: "Add Medicine", path: "/add-medicine", icon: "+" },
  { name: "Family", path: "/family", icon: "♧" },
  { name: "Wastage Analytics", path: "/wastage-trends", icon: "↗" },
];

const smartTools = [
  { name: "Expiry Rescue", path: "/expiry-rescue", icon: "✳" },
  { name: "Medicine Passport", path: "/medicine-passport", icon: "▣" },
  { name: "Prescription Scanner", path: "/prescription-scanner", icon: "▤" },
  { name: "Smart Storage", path: "/smart-storage", icon: "⌂" },
  { name: "AI Medicine Scanner", path: "/ai-medicine-scanner", icon: "⌕" },
];

function Sidebar() {
  return (
    <aside className="sidebar">
      <NavLink to="/" className="brand">
        <span className="brand-mark">✚</span>
        <span className="brand-copy">
          <strong>MediShare</strong>
          <small>CARE • SHARE • SAVE</small>
        </span>
      </NavLink>

      <div className="sidebar-section">
        <div className="nav-caption">MAIN MENU</div>

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
      </div>

      <div className="sidebar-section smart-tools-section">
        <div className="nav-caption">SMART TOOLS</div>

        <nav className="side-nav">
          {smartTools.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `nav-link ${isActive ? "active" : ""}`
              }
            >
              <span className="nav-symbol">{item.icon}</span>
              <span>{item.name}</span>
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="sidebar-bottom">
        <div className="tip-card">
          <span className="tip-icon">✳</span>
          <strong>Care starts here</strong>
          <p>
            Manage medicines wisely. Reduce waste. Care for your family.
          </p>
        </div>

        <div className="profile-row">
          <div className="avatar">M</div>
          <div>
            <strong>My Household</strong>
            <small>Personal workspace</small>
          </div>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
