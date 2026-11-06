
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getAllMedicines } from "../services/medicineService";

const STORAGE_KEY = "medishare_read_notifications";
const TEXT_SIZE_KEY = "medishare_text_size";

const textSizes = [
  { label: "A−", name: "Small", value: "0.9" },
  { label: "A", name: "Default", value: "1" },
  { label: "A+", name: "Large", value: "1.1" },
  { label: "A++", name: "Extra Large", value: "1.2" },
];

function getSavedNotifications() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function getSavedTextSize() {
  try {
    const saved = localStorage.getItem(TEXT_SIZE_KEY);
    return textSizes.some((size) => size.value === saved) ? saved : "1";
  } catch {
    return "1";
  }
}

function Header() {
  const location = useLocation();
  const navigate = useNavigate();

  const [medicines, setMedicines] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showTextSettings, setShowTextSettings] = useState(false);
  const [textSize, setTextSize] = useState(getSavedTextSize);
  const [readNotifications, setReadNotifications] = useState(
    getSavedNotifications
  );

  const notificationRef = useRef(null);
  const textSettingsRef = useRef(null);

  const pageNames = {
    "/": "Home",
    "/medicines": "Medicines & Disposal",
    "/calendar": "Calendar",
    "/add-medicine": "Add Medicine",
    "/family": "Family",
    "/wastage-trends": "Wastage Analytics",
    "/expiry-rescue": "Expiry Rescue",
    "/medicine-passport": "Medicine Passport",
    "/scan-medicine-qr": "QR Scanner",
    "/prescription-scanner": "Prescription Scanner",
    "/smart-storage": "Smart Storage",
  };

  const currentPage =
    pageNames[location.pathname] ||
    (location.pathname.startsWith("/medicine-passport/")
      ? "Medicine Passport"
      : "MediShare");

  // Apply text size immediately and save preference
  useEffect(() => {
    document.body.style.zoom = textSize;

    try {
      localStorage.setItem(TEXT_SIZE_KEY, textSize);
    } catch (error) {
      console.error("Unable to save text size:", error);
    }
  }, [textSize]);

  const loadMedicines = async () => {
    try {
      const data = await getAllMedicines();
      setMedicines(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Unable to load notifications:", error);
    }
  };

  useEffect(() => {
    loadMedicines();
    const interval = setInterval(loadMedicines, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(readNotifications)
      );
    } catch (error) {
      console.error("Unable to save notifications:", error);
    }
  }, [readNotifications]);

  const getDaysLeft = (expiryDate) => {
    const expiry = new Date(expiryDate);
    if (Number.isNaN(expiry.getTime())) return null;

    const today = new Date();

    const expiryDay = Date.UTC(
      expiry.getFullYear(),
      expiry.getMonth(),
      expiry.getDate()
    );

    const todayDay = Date.UTC(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );

    return Math.round(
      (expiryDay - todayDay) / (1000 * 60 * 60 * 24)
    );
  };

  const notifications = useMemo(() => {
    const generated = [];

    medicines.forEach((medicine) => {
      const medicineId =
        medicine._id || medicine.id || medicine.medicineName;
      const medicineName = medicine.medicineName || "Medicine";
      const daysLeft = getDaysLeft(medicine.expiryDate);

      if (daysLeft !== null && daysLeft <= 30) {
        let title;
        let message;
        let type;

        if (daysLeft < 0) {
          title = "Medicine expired";
          message = `${medicineName} expired ${Math.abs(daysLeft)} days ago.`;
          type = "expired";
        } else if (daysLeft === 0) {
          title = "Expires today";
          message = `${medicineName} expires today.`;
          type = "urgent";
        } else if (daysLeft <= 7) {
          title = "Urgent expiry reminder";
          message = `${medicineName} expires in ${daysLeft} days.`;
          type = "urgent";
        } else {
          title = "Upcoming expiry";
          message = `${medicineName} expires in ${daysLeft} days.`;
          type = "upcoming";
        }

        generated.push({
          id: medicineId,
          title,
          message,
          type,
          expiryDate: medicine.expiryDate,
          destination: "/medicines",
        });
      }

      const quantity = Number(medicine.quantity);

      if (quantity === 0) {
        generated.push({
          id: `out-of-stock-${medicineId}`,
          title: "Medicine out of stock",
          message: `${medicineName} is out of stock. Please replenish it.`,
          type: "out-of-stock",
          destination: "/medicines",
        });
      } else if (quantity > 0 && quantity <= 5) {
        generated.push({
          id: `low-stock-${medicineId}`,
          title: "Low stock reminder",
          message: `Only ${quantity} ${medicine.unit || "units"} of ${medicineName} remaining. Consider refilling.`,
          type: "low-stock",
          destination: "/medicines",
        });
      }
    });

    const priority = {
      "out-of-stock": 1,
      expired: 2,
      urgent: 3,
      "low-stock": 4,
      upcoming: 5,
    };

    return generated.sort(
      (a, b) => priority[a.type] - priority[b.type]
    );
  }, [medicines]);

  const unreadCount = notifications.filter(
    (notification) => !readNotifications.includes(notification.id)
  ).length;

  const markAllAsRead = () => {
    setReadNotifications((previous) => [
      ...new Set([
        ...previous,
        ...notifications.map((notification) => notification.id),
      ]),
    ]);
  };

  const handleNotificationClick = (notification) => {
    setReadNotifications((previous) => [
      ...new Set([...previous, notification.id]),
    ]);

    setShowNotifications(false);
    navigate(notification.destination);
  };

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        setShowNotifications(false);
      }

      if (
        textSettingsRef.current &&
        !textSettingsRef.current.contains(event.target)
      ) {
        setShowTextSettings(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setShowNotifications(false);
        setShowTextSettings(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  return (
    <header className="topbar redesigned-topbar">
      <div className="header-page-info">
        <div className="breadcrumb">
          Workspace <span>/</span> <strong>{currentPage}</strong>
        </div>
        <p className="header-welcome">
          Manage your medicines with care.
        </p>
      </div>

      <div className="topbar-right">
        <span className="today-label">
          {new Date().toLocaleDateString("en-IN", {
            weekday: "short",
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </span>

        {/* TEXT SIZE SETTINGS */}
        <div className="text-settings-wrapper" ref={textSettingsRef}>
          <button
            className="text-settings-button"
            onClick={() => {
              setShowTextSettings((previous) => !previous);
              setShowNotifications(false);
            }}
            aria-label="Text size settings"
            aria-expanded={showTextSettings}
            title="Adjust text size"
          >
            <span className="text-settings-icon">Aa</span>
            <span className="text-settings-label">Text size</span>
          </button>

          {showTextSettings && (
            <div className="text-settings-dropdown">
              <div className="text-settings-heading">
                <strong>Text size</strong>
                <small>Adjust display readability</small>
              </div>

              <div className="text-size-options">
                {textSizes.map((size) => (
                  <button
                    key={size.value}
                    className={
                      textSize === size.value ? "selected" : ""
                    }
                    onClick={() => setTextSize(size.value)}
                    aria-pressed={textSize === size.value}
                  >
                    <span>{size.label}</span>
                    <small>{size.name}</small>
                  </button>
                ))}
              </div>

              <button
                className="text-size-reset"
                onClick={() => setTextSize("1")}
              >
                Reset to default
              </button>
            </div>
          )}
        </div>

        {/* NOTIFICATIONS */}
        <div className="notification-wrapper" ref={notificationRef}>
          <button
            className="notification-button"
            onClick={() => {
              setShowNotifications((previous) => !previous);
              setShowTextSettings(false);
            }}
            aria-label="Notifications"
            aria-expanded={showNotifications}
            title="Notifications"
          >
            ♧
            {unreadCount > 0 && (
              <span className="notification-count">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="notification-dropdown">
              <div className="notification-header">
                <div>
                  <h3>Notifications</h3>
                  <p>{unreadCount} unread notification(s)</p>
                </div>

                <button
                  className="mark-read-button"
                  onClick={markAllAsRead}
                  disabled={unreadCount === 0}
                >
                  Mark all read
                </button>
              </div>

              <div className="notification-list">
                {notifications.length === 0 ? (
                  <div className="notification-empty">
                    <span>✓</span>
                    <strong>You're all caught up!</strong>
                    <p>
                      No medicine expiry or stock alerts right now.
                    </p>
                  </div>
                ) : (
                  notifications.map((notification) => {
                    const isRead = readNotifications.includes(
                      notification.id
                    );

                    return (
                      <div
                        key={notification.id}
                        className={`notification-item ${notification.type} ${
                          isRead ? "notification-read" : ""
                        }`}
                        onClick={() =>
                          handleNotificationClick(notification)
                        }
                        role="button"
                        tabIndex={0}
                        onKeyDown={(event) => {
                          if (
                            event.key === "Enter" ||
                            event.key === " "
                          ) {
                            event.preventDefault();
                            handleNotificationClick(notification);
                          }
                        }}
                        style={{ cursor: "pointer" }}
                      >
                        <div className="notification-icon">
                          {notification.type === "expired" ||
                          notification.type === "out-of-stock"
                            ? "!"
                            : notification.type === "urgent"
                            ? "⚠"
                            : notification.type === "low-stock"
                            ? "↓"
                            : "◷"}
                        </div>

                        <div className="notification-content">
                          <strong>{notification.title}</strong>
                          <p>{notification.message}</p>

                          {notification.expiryDate && (
                            <small>
                              {new Date(
                                notification.expiryDate
                              ).toLocaleDateString("en-IN")}
                            </small>
                          )}

                          <small
                            style={{
                              display: "block",
                              marginTop: "5px",
                              color: "#26734D",
                              fontWeight: 600,
                            }}
                          >
                            View medicine →
                          </small>
                        </div>

                        {!isRead && <span className="unread-dot" />}
                      </div>
                    );
                  })
                )}
              </div>

              <div className="notification-footer">
                Based on your current medicine inventory
              </div>
            </div>
          )}
        </div>

        <div className="avatar small-avatar">M</div>
      </div>
    </header>
  );
}

export default Header;
