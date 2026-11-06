
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  getPriorityMedicines,
  getAllMedicines,
} from "../services/medicineService";

const categories = [
  {
    title: "Expired medicines",
    key: "expired",
    description: "Need safe disposal",
    color: "#C96B65",
  },
  {
    title: "Expiring today",
    key: "expiringToday",
    description: "Use or review today",
    color: "#D9A441",
  },
  {
    title: "Within 7 days",
    key: "expiringIn7Days",
    description: "Needs attention soon",
    color: "#D9A441",
  },
  {
    title: "Within 15 days",
    key: "expiringIn15Days",
    description: "Plan ahead",
    color: "#63977A",
  },
  {
    title: "Within 30 days",
    key: "expiringIn30Days",
    description: "Coming up next",
    color: "#63977A",
  },
  {
    title: "Safe inventory",
    key: "safeMedicines",
    description: "No immediate action",
    color: "#63977A",
  },
];

const styles = {
  page: {
    padding: "30px",
    maxWidth: "1400px",
    margin: "0 auto",
  },
  eyebrow: {
    color: "#63977A",
    fontSize: "10px",
    fontWeight: 700,
    letterSpacing: "1.5px",
    marginBottom: "10px",
  },
  heading: {
    fontFamily: "Manrope, sans-serif",
    fontSize: "30px",
    fontWeight: 800,
    margin: "0 0 8px",
    color: "#242B29",
  },
  subtitle: {
    color: "#777F7B",
    fontSize: "13px",
    lineHeight: 1.7,
    margin: 0,
  },
  button: {
    background: "#073F3D",
    color: "white",
    padding: "12px 18px",
    borderRadius: "8px",
    textDecoration: "none",
    fontSize: "12px",
    fontWeight: 600,
    display: "inline-block",
    border: "none",
  },
  card: {
    background: "white",
    border: "1px solid #E6E8E3",
    borderRadius: "13px",
    padding: "19px",
    minWidth: 0,
  },
};

function Home() {
  const [medicines, setMedicines] = useState({
    expired: [],
    expiringToday: [],
    expiringIn7Days: [],
    expiringIn15Days: [],
    expiringIn30Days: [],
    safeMedicines: [],
  });

  const [allMedicines, setAllMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);

  // Fetch expiry information and complete medicine inventory
  const fetchMedicines = async () => {
    try {
      const [data, allMedicineData] = await Promise.all([
        getPriorityMedicines(),
        getAllMedicines(),
      ]);

      setAllMedicines(
        Array.isArray(allMedicineData) ? allMedicineData : []
      );

      setMedicines({
        expired: Array.isArray(data.expired) ? data.expired : [],
        expiringToday: Array.isArray(data.expiringToday)
          ? data.expiringToday
          : [],
        expiringIn7Days: Array.isArray(data.expiringIn7Days)
          ? data.expiringIn7Days
          : [],
        expiringIn15Days: Array.isArray(data.expiringIn15Days)
          ? data.expiringIn15Days
          : [],
        expiringIn30Days: Array.isArray(data.expiringIn30Days)
          ? data.expiringIn30Days
          : [],
        safeMedicines: Array.isArray(data.safeMedicines)
          ? data.safeMedicines
          : [],
      });

      setError("");
      setLastUpdated(new Date());
    } catch (err) {
      setError(err.message || "Unable to load medicine inventory.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedicines();

    const interval = setInterval(fetchMedicines, 30000);

    return () => clearInterval(interval);
  }, []);

  const totalMedicines = Object.values(medicines).reduce(
    (total, list) => total + list.length,
    0
  );

  const attentionCount =
    medicines.expired.length +
    medicines.expiringToday.length +
    medicines.expiringIn7Days.length;

  const safeCount = medicines.safeMedicines.length;

  // Low stock means 5 or fewer units available
  const lowStockMedicines = allMedicines.filter(
    (medicine) => Number(medicine.quantity) <= 5
  );

  const getMedicineName = (medicine) =>
    medicine.medicineName || medicine.name || "Unnamed medicine";

  const formatDate = (date) => {
    if (!date) return "Not available";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "Not available";
    }

    return parsedDate.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const getExpiryStatus = (medicine) => {
    const expiryDate = new Date(medicine.expiryDate);
    const today = new Date();

    today.setHours(0, 0, 0, 0);
    expiryDate.setHours(0, 0, 0, 0);

    const days = Math.ceil(
      (expiryDate - today) / (1000 * 60 * 60 * 24)
    );

    if (days < 0) return "Expired";
    if (days === 0) return "Expires today";

    return `${days} days left`;
  };

  const recentMedicines = [
    ...medicines.expired,
    ...medicines.expiringToday,
    ...medicines.expiringIn7Days,
    ...medicines.expiringIn15Days,
    ...medicines.expiringIn30Days,
  ].slice(0, 5);

  if (loading) {
    return (
      <div style={styles.page}>
        <p style={styles.subtitle}>
          Loading your medicine inventory...
        </p>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      {/* WELCOME SECTION */}

      <section
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "20px",
          marginBottom: "30px",
        }}
      >
        <div>
          <p style={styles.eyebrow}>
            YOUR HOUSEHOLD HEALTH SPACE
          </p>

          <h1 style={styles.heading}>Good day! ✳</h1>

          <p style={styles.subtitle}>
            Here's your medicine inventory at a glance.
            Stay organised and make every medicine count.
          </p>
        </div>

        <Link to="/add-medicine" style={styles.button}>
          + Add medicine
        </Link>
      </section>

      {/* ERROR MESSAGE */}

      {error && (
        <div
          style={{
            padding: "14px",
            background: "#FCEBEA",
            color: "#BD4944",
            borderRadius: "9px",
            marginBottom: "20px",
            fontSize: "13px",
          }}
        >
          {error}

          <button
            onClick={fetchMedicines}
            style={{
              marginLeft: "15px",
              border: "none",
              background: "transparent",
              color: "#BD4944",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Retry
          </button>
        </div>
      )}

      {/* INVENTORY STATISTICS */}

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
          gap: "16px",
          marginBottom: "32px",
        }}
      >
        <div style={styles.card}>
          <p style={styles.eyebrow}>TOTAL MEDICINES</p>

          <h2 style={{ fontSize: "29px", margin: "8px 0" }}>
            {totalMedicines}
          </h2>

          <p style={styles.subtitle}>
            Items in your household inventory
          </p>
        </div>

        <div style={styles.card}>
          <p style={styles.eyebrow}>NEEDS YOUR ATTENTION!</p>

          <h2
            style={{
              fontSize: "29px",
              margin: "8px 0",
              color: "#C96B65",
            }}
          >
            {attentionCount}
          </h2>

          <p style={styles.subtitle}>
            Expired or expiring within 7 days
          </p>
        </div>

        <div style={styles.card}>
          <p style={styles.eyebrow}>SAFE INVENTORY ✳</p>

          <h2
            style={{
              fontSize: "29px",
              margin: "8px 0",
              color: "#63977A",
            }}
          >
            {safeCount}
          </h2>

          <p style={styles.subtitle}>
            Medicines with more than 30 days left
          </p>
        </div>

        {/* NEW LOW STOCK STATISTIC */}

        <div style={styles.card}>
          <p style={styles.eyebrow}>LOW STOCK ALERTS</p>

          <h2
            style={{
              fontSize: "29px",
              margin: "8px 0",
              color:
                lowStockMedicines.length > 0
                  ? "#C96B65"
                  : "#63977A",
            }}
          >
            {lowStockMedicines.length}
          </h2>

          <p style={styles.subtitle}>
            Medicines with 5 or fewer units
          </p>
        </div>
      </section>

      {/* EXPIRY OVERVIEW */}

      <section style={{ marginBottom: "32px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "12px",
            marginBottom: "18px",
          }}
        >
          <div>
            <p style={styles.eyebrow}>INVENTORY HEALTH</p>

            <h2
              style={{
                fontFamily: "Manrope, sans-serif",
                fontSize: "23px",
                margin: "5px 0",
              }}
            >
              Expiry overview
            </h2>

            <p style={styles.subtitle}>
              Keep an eye on medicines that may need action.
            </p>
          </div>

          <button
            onClick={fetchMedicines}
            style={{
              padding: "9px 15px",
              background: "white",
              border: "1px solid #E6E8E3",
              borderRadius: "8px",
              color: "#073F3D",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            ↻ Refresh
          </button>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(155px, 1fr))",
            gap: "13px",
          }}
        >
          {categories.map((category) => (
            <div
              key={category.key}
              style={{
                ...styles.card,
                padding: "16px",
              }}
            >
              <div
                style={{
                  width: "9px",
                  height: "9px",
                  borderRadius: "50%",
                  background: category.color,
                  marginBottom: "12px",
                }}
              />

              <p
                style={{
                  fontSize: "12px",
                  color: "#777F7B",
                  marginBottom: "8px",
                }}
              >
                {category.title}
              </p>

              <h2
                style={{
                  fontSize: "25px",
                  margin: "0 0 7px",
                  color: category.color,
                }}
              >
                {medicines[category.key].length}
              </h2>

              <p
                style={{
                  fontSize: "10px",
                  color: "#777F7B",
                }}
              >
                {category.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* NEW LOW STOCK ALERTS SECTION */}

      <section style={{ ...styles.card, marginBottom: "25px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "12px",
            marginBottom: "18px",
          }}
        >
          <div>
            <p style={styles.eyebrow}>STOCK MONITORING</p>

            <h2 style={{ fontSize: "20px", margin: "5px 0" }}>
              Low stock alerts
            </h2>

            <p style={styles.subtitle}>
              Medicines with 5 or fewer units remaining.
            </p>
          </div>

          <Link
            to="/medicines"
            style={{
              color: "#073F3D",
              fontSize: "12px",
              fontWeight: 700,
              textDecoration: "none",
            }}
          >
            Manage inventory →
          </Link>
        </div>

        {lowStockMedicines.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "22px 10px",
              background: "#F3F8F4",
              borderRadius: "9px",
            }}
          >
            <div style={{ fontSize: "25px", marginBottom: "8px" }}>
              ✳
            </div>

            <h3
              style={{
                fontSize: "14px",
                margin: "0 0 7px",
                color: "#63977A",
              }}
            >
              Stock levels look good!
            </h3>

            <p style={styles.subtitle}>
              No medicines currently have 5 or fewer units.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                textAlign: "left",
                minWidth: "420px",
              }}
            >
              <thead>
                <tr style={{ background: "#F7F8F5" }}>
                  {[
                    "Medicine",
                    "Batch number",
                    "Available quantity",
                    "Alert",
                  ].map((heading) => (
                    <th
                      key={heading}
                      style={{
                        padding: "13px 12px",
                        fontSize: "11px",
                        color: "#777F7B",
                        fontWeight: 600,
                      }}
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {lowStockMedicines.map((medicine, index) => (
                  <tr
                    key={medicine._id || medicine.id || index}
                    style={{
                      borderBottom: "1px solid #E6E8E3",
                    }}
                  >
                    <td
                      style={{
                        padding: "14px 12px",
                        fontSize: "12px",
                        fontWeight: 600,
                      }}
                    >
                      {getMedicineName(medicine)}
                    </td>

                    <td
                      style={{
                        padding: "14px 12px",
                        fontSize: "12px",
                      }}
                    >
                      {medicine.batchNumber || "N/A"}
                    </td>

                    <td
                      style={{
                        padding: "14px 12px",
                        fontSize: "12px",
                      }}
                    >
                      {medicine.quantity} {medicine.unit || "units"}
                    </td>

                    <td style={{ padding: "14px 12px" }}>
                      <span
                        style={{
                          background: "#FCEBEA",
                          color: "#BD4944",
                          borderRadius: "20px",
                          padding: "5px 9px",
                          fontSize: "10px",
                          fontWeight: 700,
                          whiteSpace: "nowrap",
                        }}
                      >
                        Low stock
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* MEDICINE INVENTORY */}

      <section style={{ ...styles.card, marginBottom: "25px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "12px",
            marginBottom: "20px",
          }}
        >
          <div>
            <p style={styles.eyebrow}>YOUR INVENTORY</p>

            <h2 style={{ fontSize: "20px", margin: "5px 0" }}>
              Medicines needing attention
            </h2>

            <p style={styles.subtitle}>
              Review your upcoming expiry dates.
            </p>
          </div>

          <Link
            to="/medicines"
            style={{
              color: "#073F3D",
              fontSize: "12px",
              fontWeight: 700,
              textDecoration: "none",
            }}
          >
            View all medicines →
          </Link>
        </div>

        {recentMedicines.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "30px 10px",
            }}
          >
            <div style={{ fontSize: "30px", marginBottom: "10px" }}>
              ✳
            </div>

            <h3 style={{ fontSize: "15px", marginBottom: "8px" }}>
              All clear!
            </h3>

            <p style={styles.subtitle}>
              No medicines currently require expiry attention.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                textAlign: "left",
                minWidth: "450px",
              }}
            >
              <thead>
                <tr style={{ background: "#F7F8F5" }}>
                  {[
                    "Medicine",
                    "Quantity",
                    "Expiry date",
                    "Status",
                  ].map((heading) => (
                    <th
                      key={heading}
                      style={{
                        padding: "13px 12px",
                        fontSize: "11px",
                        color: "#777F7B",
                        fontWeight: 600,
                      }}
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {recentMedicines.map((medicine, index) => {
                  const status = getExpiryStatus(medicine);

                  const expired = status === "Expired";
                  const today = status === "Expires today";

                  const color = expired
                    ? "#BD4944"
                    : today
                    ? "#B97826"
                    : "#63977A";

                  return (
                    <tr
                      key={medicine._id || medicine.id || index}
                      style={{
                        borderBottom: "1px solid #E6E8E3",
                      }}
                    >
                      <td style={{ padding: "14px 12px" }}>
                        <strong style={{ fontSize: "12px" }}>
                          {getMedicineName(medicine)}
                        </strong>

                        <p
                          style={{
                            fontSize: "10px",
                            color: "#777F7B",
                            marginTop: "4px",
                          }}
                        >
                          Batch: {medicine.batchNumber || "N/A"}
                        </p>
                      </td>

                      <td
                        style={{
                          padding: "14px 12px",
                          fontSize: "12px",
                        }}
                      >
                        {medicine.quantity} {medicine.unit || ""}
                      </td>

                      <td
                        style={{
                          padding: "14px 12px",
                          fontSize: "12px",
                        }}
                      >
                        {formatDate(medicine.expiryDate)}
                      </td>

                      <td style={{ padding: "14px 12px" }}>
                        <span
                          style={{
                            background: expired
                              ? "#FCEBEA"
                              : today
                              ? "#FFF2DF"
                              : "#E8F5ED",
                            color,
                            borderRadius: "20px",
                            padding: "5px 9px",
                            fontSize: "10px",
                            fontWeight: 600,
                            whiteSpace: "nowrap",
                          }}
                        >
                          {status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* QUICK ACTIONS */}

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "15px",
        }}
      >
        <Link
          to="/add-medicine"
          style={{
            ...styles.card,
            textDecoration: "none",
            color: "#073F3D",
          }}
        >
          <h3 style={{ fontSize: "14px", marginBottom: "7px" }}>
            + Add medicine
          </h3>

          <p style={styles.subtitle}>
            Add a new medicine to your household inventory.
          </p>
        </Link>

        <Link
          to="/calendar"
          style={{
            ...styles.card,
            textDecoration: "none",
            color: "#073F3D",
          }}
        >
          <h3 style={{ fontSize: "14px", marginBottom: "7px" }}>
            ▦ Medicine calendar
          </h3>

          <p style={styles.subtitle}>
            View upcoming medicine expiry dates.
          </p>
        </Link>
      </section>

      {/* LAST UPDATED */}

      <p
        style={{
          textAlign: "right",
          color: "#929A95",
          fontSize: "10px",
          marginTop: "22px",
        }}
      >
        {lastUpdated
          ? `Last updated: ${lastUpdated.toLocaleTimeString("en-IN")}`
          : ""}
        {" · "}Automatically refreshes every 30 seconds
      </p>
    </div>
  );
}

export default Home;
