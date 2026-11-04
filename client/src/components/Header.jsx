
import { useLocation } from "react-router-dom";

function Header() {
  const location = useLocation();

  const pageNames = {
    "/": "Home",
    "/medicines": "Medicines & disposal",
    "/calendar": "Calendar",
    "/add-medicine": "Add medicine",
    "/family": "Family",
    "/wastage-trends": "Wastage trends"
  };

  const currentPage = pageNames[location.pathname] || "Home";

  return (
    <header className="topbar">
      <div className="breadcrumb">
        Workspace <span>/</span> <strong>{currentPage}</strong>
      </div>

      <div className="topbar-right">
        <span className="today-label">
          {new Date().toLocaleDateString("en-IN", {
            weekday: "short",
            day: "numeric",
            month: "short",
            year: "numeric"
          })}
        </span>

        <div className="avatar small-avatar">M</div>
      </div>
    </header>
  );
}

export default Header;
