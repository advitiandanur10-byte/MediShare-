
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAllMedicines } from "../services/medicineService";

function Calendar() {
  const navigate = useNavigate();

  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(
    new Date().toLocaleDateString("en-CA")
  );

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const getDateKey = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const parseDate = (value) => {
    if (!value) return null;

    const dateString = String(value);

    if (/^\d{4}-\d{2}-\d{2}/.test(dateString)) {
      const [year, month, day] = dateString
        .slice(0, 10)
        .split("-")
        .map(Number);

      const date = new Date(year, month - 1, day);
      return Number.isNaN(date.getTime()) ? null : date;
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return null;

    return new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    );
  };

  // Fetch medicines from MongoDB
  const fetchMedicines = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getAllMedicines();
      setMedicines(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Unable to load medicines.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedicines();
  }, []);

  // Calculate days remaining
  const getDaysRemaining = (expiryDate) => {
    const date = parseDate(expiryDate);

    if (!date) return null;

    return Math.round(
      (date.getTime() - today.getTime()) /
        (1000 * 60 * 60 * 24)
    );
  };

  // Categorise expiry status
  const getExpiryStatus = (expiryDate) => {
    const days = getDaysRemaining(expiryDate);

    if (days === null) return "unknown";
    if (days < 0) return "expired";
    if (days === 0) return "today";
    if (days <= 7) return "warning";
    if (days <= 15) return "within15";
    if (days <= 30) return "within30";

    return "safe";
  };

  // Group medicines by expiry date
  const medicinesByDate = useMemo(() => {
    const grouped = {};

    medicines.forEach((medicine) => {
      const expiryDate = parseDate(medicine.expiryDate);

      if (!expiryDate) return;

      const key = getDateKey(expiryDate);

      if (!grouped[key]) {
        grouped[key] = [];
      }

      grouped[key].push(medicine);
    });

    return grouped;
  }, [medicines]);

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const startOffset = firstDay.getDay();

    return Array.from({ length: 42 }, (_, index) => {
      const date = new Date(
        year,
        month,
        index - startOffset + 1
      );

      return {
        date,
        key: getDateKey(date),
        isCurrentMonth: date.getMonth() === month,
        isToday: getDateKey(date) === getDateKey(today),
      };
    });
  }, [currentDate]);

  const selectedMedicines = medicinesByDate[selectedDate] || [];
  const selectedDateObject = parseDate(selectedDate);

  const monthName = currentDate.toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });

  // Change month
  const changeMonth = (amount) => {
    setCurrentDate(
      new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() + amount,
        1
      )
    );
  };

  // Expiry summary counts
  const expiredCount = medicines.filter(
    (m) => getExpiryStatus(m.expiryDate) === "expired"
  ).length;

  const todayCount = medicines.filter(
    (m) => getExpiryStatus(m.expiryDate) === "today"
  ).length;

  const warningCount = medicines.filter(
    (m) => getExpiryStatus(m.expiryDate) === "warning"
  ).length;

  const within15Count = medicines.filter(
    (m) => getExpiryStatus(m.expiryDate) === "within15"
  ).length;

  const within30Count = medicines.filter(
    (m) => getExpiryStatus(m.expiryDate) === "within30"
  ).length;

  const safeCount = medicines.filter(
    (m) => getExpiryStatus(m.expiryDate) === "safe"
  ).length;

  const getStatusLabel = (status) => {
    const labels = {
      expired: "Expired",
      today: "Expires today",
      warning: "Expiring within 7 days",
      within15: "Expiring within 15 days",
      within30: "Expiring within 30 days",
      safe: "Safe",
      unknown: "Unknown",
    };

    return labels[status] || "Unknown";
  };

  return (
    <div className="page-content calendar-page">

      {/* Page heading */}
      <div className="calendar-heading">
        <div>
          <p className="eyebrow">MEDICINE MANAGEMENT</p>
          <h1>Medicine Calendar</h1>
          <p className="calendar-subtitle">
            Keep track of expiry dates and manage your medicines.
          </p>
        </div>

        <button
          className="primary-button"
          onClick={() => navigate("/add-medicine")}
        >
          + Add medicine
        </button>
      </div>

      {/* Expiry summary */}
      <div className="calendar-summary">

        <div className="calendar-stat">
          <span className="stat-dot expired-dot"></span>
          <p>Expired medicines</p>
          <h2>{expiredCount}</h2>
        </div>

        <div className="calendar-stat">
          <span className="stat-dot warning-dot"></span>
          <p>Expiring today</p>
          <h2>{todayCount}</h2>
        </div>

        <div className="calendar-stat">
          <span className="stat-dot warning-dot"></span>
          <p>Within 7 days</p>
          <h2>{warningCount}</h2>
        </div>

        <div className="calendar-stat">
          <span className="stat-dot warning-dot"></span>
          <p>Within 15 days</p>
          <h2>{within15Count}</h2>
        </div>

        <div className="calendar-stat">
          <span className="stat-dot safe-dot"></span>
          <p>Within 30 days</p>
          <h2>{within30Count}</h2>
        </div>

        <div className="calendar-stat">
          <span className="stat-dot safe-dot"></span>
          <p>Safe inventory</p>
          <h2>{safeCount}</h2>
        </div>

      </div>

      {error && (
        <div className="error-banner">
          {error}
          <button onClick={fetchMedicines}>Retry</button>
        </div>
      )}

      {/* Calendar layout */}
      <div className="calendar-layout">

        <section className="calendar-card">

          {/* Calendar header */}
          <div className="calendar-toolbar">
            <div>
              <h2>{monthName}</h2>
              <p>Medicine expiry overview</p>
            </div>

            <div className="calendar-navigation">
              <button
                onClick={() => changeMonth(-1)}
                aria-label="Previous month"
              >
                &#8249;
              </button>

              <button
                onClick={() => {
                  const now = new Date();
                  setCurrentDate(now);
                  setSelectedDate(getDateKey(now));
                }}
              >
                Today
              </button>

              <button
                onClick={() => changeMonth(1)}
                aria-label="Next month"
              >
                &#8250;
              </button>
            </div>
          </div>

          {/* Legend */}
          <div className="calendar-legend">
            <span><i className="expired-dot"></i> Expired</span>
            <span><i className="warning-dot"></i> Expiring soon</span>
            <span><i className="safe-dot"></i> Safe</span>
          </div>

          {/* Weekdays */}
          <div className="calendar-grid calendar-weekdays">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
              (day) => (
                <div key={day}>{day}</div>
              )
            )}
          </div>

          {/* Calendar dates */}
          {loading ? (
            <div className="calendar-loading">
              Loading your medicine calendar...
            </div>
          ) : (
            <div className="calendar-grid calendar-dates">
              {calendarDays.map((day) => {
                const dayMedicines = medicinesByDate[day.key] || [];

                const statuses = dayMedicines.map((medicine) =>
                  getExpiryStatus(medicine.expiryDate)
                );

                let dayStatus = "";

                if (statuses.includes("expired")) {
                  dayStatus = "expired";
                } else if (
                  statuses.includes("today") ||
                  statuses.includes("warning") ||
                  statuses.includes("within15") ||
                  statuses.includes("within30")
                ) {
                  dayStatus = "warning";
                } else if (statuses.includes("safe")) {
                  dayStatus = "safe";
                }

                return (
                  <button
                    key={day.key}
                    className={[
                      "calendar-day",
                      !day.isCurrentMonth ? "other-month" : "",
                      day.isToday ? "today" : "",
                      selectedDate === day.key ? "selected-day" : "",
                      dayMedicines.length ? `has-${dayStatus}` : "",
                    ].join(" ")}
                    onClick={() => setSelectedDate(day.key)}
                  >
                    <span className="calendar-day-number">
                      {day.date.getDate()}
                    </span>

                    {dayMedicines.length > 0 && (
                      <span className={`calendar-event ${dayStatus}`}>
                        {dayMedicines.length}{" "}
                        {dayMedicines.length === 1
                          ? "medicine"
                          : "medicines"}
                      </span>
                    )}

                    {dayMedicines.length > 0 && (
                      <span
                        className={`calendar-indicator ${dayStatus}`}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          )}

          <div className="calendar-footer">
            Showing expiry dates from your medicine inventory.
            <button onClick={fetchMedicines}>Refresh</button>
          </div>

        </section>

        {/* Selected date details */}
        <aside className="calendar-details">

          <p className="eyebrow">SELECTED DATE</p>

          <h2>
            {selectedDateObject
              ? selectedDateObject.toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })
              : "Select a date"}
          </h2>

          <p className="details-subtitle">
            {selectedMedicines.length} medicines expiring on this date
          </p>

          {selectedMedicines.length === 0 ? (
            <div className="calendar-empty">
              <div className="empty-calendar-icon">◇</div>
              <h3>No medicines</h3>
              <p>
                There are no medicines expiring on this date.
              </p>
            </div>
          ) : (
            <div className="calendar-medicine-list">

              {selectedMedicines.map((medicine) => {
                const status = getExpiryStatus(medicine.expiryDate);

                return (
                  <div
                    className="calendar-medicine-item"
                    key={medicine._id}
                  >
                    <div className="medicine-item-top">
                      <h3>{medicine.medicineName}</h3>

                      <span className={`expiry-badge ${
                        status === "within15" || status === "within30"
                          ? "warning"
                          : status
                      }`}>
                        {getStatusLabel(status)}
                      </span>
                    </div>

                    <p>
                      Quantity: {medicine.quantity} {medicine.unit}
                    </p>

                    <p>Batch: {medicine.batchNumber}</p>

                    <p>Storage: {medicine.storageLocation}</p>
                  </div>
                );
              })}

            </div>
          )}

          <button
            className="calendar-add-button"
            onClick={() => navigate("/add-medicine")}
          >
            + Add another medicine
          </button>

        </aside>

      </div>

    </div>
  );
}

export default Calendar;
