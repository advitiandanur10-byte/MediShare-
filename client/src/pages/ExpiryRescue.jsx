
import { useEffect, useMemo, useState } from "react";
import { getAllMedicines } from "../services/medicineService";

function ExpiryRescue() {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    const fetchMedicines = async () => {
      try {
        const data = await getAllMedicines();
        setMedicines(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.message || "Unable to load medicines.");
      } finally {
        setLoading(false);
      }
    };

    fetchMedicines();
  }, []);

  const getDaysLeft = (expiryDate) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const expiry = new Date(expiryDate);
    expiry.setHours(0, 0, 0, 0);

    return Math.ceil(
      (expiry - today) / (1000 * 60 * 60 * 24)
    );
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-IN");
  };

  const rescueMedicines = useMemo(() => {
    return medicines
      .map((medicine) => {
        const daysLeft = getDaysLeft(medicine.expiryDate);
        const quantity = Number(medicine.quantity) || 0;

        let status = "Safe";
        let priority = 0;

        if (daysLeft < 0) {
          status = "Expired";
          priority = 4;
        } else if (daysLeft <= 7) {
          status = "Critical";
          priority = 3;
        } else if (daysLeft <= 15) {
          status = "High Risk";
          priority = 2;
        } else if (daysLeft <= 30) {
          status = "Needs Attention";
          priority = 1;
        }

        return {
          ...medicine,
          daysLeft,
          quantity,
          status,
          priority,
        };
      })
      .filter((medicine) => medicine.priority > 0)
      .sort((a, b) => {
        if (b.priority !== a.priority) {
          return b.priority - a.priority;
        }
        return b.quantity - a.quantity;
      });
  }, [medicines]);

  const filteredMedicines = rescueMedicines.filter((medicine) => {
    if (filter === "all") return true;
    if (filter === "expired") return medicine.daysLeft < 0;
    if (filter === "critical") return medicine.daysLeft >= 0 && medicine.daysLeft <= 7;
    if (filter === "high") return medicine.daysLeft > 7 && medicine.daysLeft <= 15;
    if (filter === "attention") return medicine.daysLeft > 15 && medicine.daysLeft <= 30;
    return true;
  });

  const expiredCount = rescueMedicines.filter(
    (medicine) => medicine.daysLeft < 0
  ).length;

  const criticalCount = rescueMedicines.filter(
    (medicine) => medicine.daysLeft >= 0 && medicine.daysLeft <= 7
  ).length;

  const highRiskCount = rescueMedicines.filter(
    (medicine) => medicine.daysLeft > 7 && medicine.daysLeft <= 15
  ).length;

  const attentionCount = rescueMedicines.filter(
    (medicine) => medicine.daysLeft > 15 && medicine.daysLeft <= 30
  ).length;

  const totalUnitsAtRisk = rescueMedicines
    .filter((medicine) => medicine.daysLeft >= 0)
    .reduce((sum, medicine) => sum + medicine.quantity, 0);

  const getStatusColor = (status) => {
    switch (status) {
      case "Expired":
        return "#c0392b";
      case "Critical":
        return "#d45b4c";
      case "High Risk":
        return "#d58b39";
      default:
        return "#b28b35";
    }
  };

  const cardStyle = {
    background: "#ffffff",
    border: "1px solid #e5eae7",
    borderRadius: "13px",
    padding: "19px",
  };

  const buttonStyle = (active) => ({
    padding: "9px 14px",
    borderRadius: "8px",
    border: active ? "1px solid #477b62" : "1px solid #e0e7e2",
    background: active ? "#477b62" : "#ffffff",
    color: active ? "#ffffff" : "#53645b",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: 600,
  });

  if (loading) {
    return (
      <div className="page-content">
        <p>Loading expiry rescue information...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-content">
        <p style={{ color: "#c0392b" }}>{error}</p>
      </div>
    );
  }

  return (
    <div className="page-content">
      <div style={{ maxWidth: "1150px", margin: "0 auto", paddingBottom: "35px" }}>

        {/* PAGE HEADING */}
        <div style={{ marginBottom: "25px" }}>
          <p style={{
            color: "#63947a",
            fontSize: "12px",
            fontWeight: 700,
            letterSpacing: "1.5px",
          }}>
            SMART TOOLS
          </p>

          <h1 style={{
            color: "#263b32",
            fontSize: "28px",
            margin: "8px 0",
          }}>
            Smart Expiry Rescue
          </h1>

          <p style={{ color: "#77827c", fontSize: "14px" }}>
            Identify medicines approaching expiry and take timely action
            to reduce avoidable household medicine wastage.
          </p>
        </div>

        {/* SUMMARY CARDS */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          gap: "14px",
          marginBottom: "25px",
        }}>
          {[
            ["Medicines at Risk", rescueMedicines.length, "#477b62"],
            ["Expired Medicines", expiredCount, "#c0392b"],
            ["Expiring in 7 Days", criticalCount, "#d45b4c"],
            ["Expiring in 15 Days", highRiskCount, "#d58b39"],
            ["Expiring in 30 Days", attentionCount, "#b28b35"],
            ["Units Approaching Expiry", totalUnitsAtRisk, "#477b62"],
          ].map(([label, value, color]) => (
            <div key={label} style={cardStyle}>
              <p style={{
                color: "#77827c",
                fontSize: "12px",
                margin: "0 0 12px",
              }}>
                {label}
              </p>

              <strong style={{
                fontSize: "27px",
                color,
              }}>
                {value}
              </strong>
            </div>
          ))}
        </div>

        {/* RESCUE EXPLANATION */}
        <div style={{
          background: "#f1f7f2",
          border: "1px solid #dcebe0",
          borderRadius: "13px",
          padding: "20px",
          marginBottom: "23px",
        }}>
          <h3 style={{ color: "#355c46", margin: "0 0 8px" }}>
            How Expiry Rescue works
          </h3>

          <p style={{
            color: "#56685e",
            fontSize: "13px",
            lineHeight: 1.8,
            margin: 0,
          }}>
            MediShare checks each medicine's expiry date and remaining
            quantity. Medicines with more stock and less time remaining
            are highlighted first so that you can review them and take
            appropriate action.
          </p>
        </div>

        {/* FILTERS */}
        <div style={{
          display: "flex",
          gap: "9px",
          flexWrap: "wrap",
          marginBottom: "18px",
        }}>
          {[
            ["all", "All"],
            ["expired", "Expired"],
            ["critical", "Within 7 Days"],
            ["high", "Within 15 Days"],
            ["attention", "Within 30 Days"],
          ].map(([value, label]) => (
            <button
              key={value}
              onClick={() => setFilter(value)}
              style={buttonStyle(filter === value)}
            >
              {label}
            </button>
          ))}
        </div>

        {/* MEDICINE RESCUE LIST */}
        <div style={{
          background: "#ffffff",
          border: "1px solid #e5eae7",
          borderRadius: "14px",
          padding: "21px",
        }}>
          <h2 style={{
            color: "#263b32",
            fontSize: "18px",
            margin: "0 0 5px",
          }}>
            Rescue Priority List
          </h2>

          <p style={{
            color: "#77827c",
            fontSize: "12px",
            marginBottom: "20px",
          }}>
            Review the following medicines and choose an appropriate action.
          </p>

          {filteredMedicines.length === 0 && (
            <div style={{
              textAlign: "center",
              padding: "35px 10px",
              color: "#77827c",
            }}>
              <div style={{ fontSize: "32px", marginBottom: "10px" }}>
                ✓
              </div>
              <strong>No medicines found in this category.</strong>
            </div>
          )}

          <div style={{ display: "grid", gap: "14px" }}>
            {filteredMedicines.map((medicine) => (
              <div
                key={medicine._id}
                style={{
                  border: "1px solid #e8ece9",
                  borderLeft: `4px solid ${getStatusColor(medicine.status)}`,
                  borderRadius: "10px",
                  padding: "17px",
                }}
              >
                <div style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  flexWrap: "wrap",
                  gap: "12px",
                }}>
                  <div>
                    <h3 style={{
                      color: "#30483a",
                      fontSize: "16px",
                      margin: "0 0 7px",
                    }}>
                      {medicine.medicineName}
                    </h3>

                    <p style={{
                      color: "#77827c",
                      fontSize: "12px",
                      margin: 0,
                    }}>
                      Batch: {medicine.batchNumber}
                    </p>
                  </div>

                  <span style={{
                    background: `${getStatusColor(medicine.status)}18`,
                    color: getStatusColor(medicine.status),
                    padding: "6px 10px",
                    borderRadius: "20px",
                    fontSize: "11px",
                    fontWeight: 700,
                  }}>
                    {medicine.status}
                  </span>
                </div>

                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
                  gap: "12px",
                  margin: "17px 0",
                }}>
                  <div>
                    <p style={smallLabel}>Remaining quantity</p>
                    <strong>{medicine.quantity} {medicine.unit}</strong>
                  </div>

                  <div>
                    <p style={smallLabel}>Expiry date</p>
                    <strong>{formatDate(medicine.expiryDate)}</strong>
                  </div>

                  <div>
                    <p style={smallLabel}>Time remaining</p>
                    <strong style={{
                      color: getStatusColor(medicine.status),
                    }}>
                      {medicine.daysLeft < 0
                        ? `${Math.abs(medicine.daysLeft)} days overdue`
                        : medicine.daysLeft === 0
                        ? "Expires today"
                        : `${medicine.daysLeft} days`}
                    </strong>
                  </div>

                  <div>
                    <p style={smallLabel}>Storage location</p>
                    <strong>{medicine.storageLocation || "Not specified"}</strong>
                  </div>
                </div>

                <div style={{
                  background: "#f6f8f6",
                  padding: "13px",
                  borderRadius: "8px",
                }}>
                  <strong style={{
                    color: "#355c46",
                    fontSize: "12px",
                  }}>
                    Suggested next steps
                  </strong>

                  <ul style={{
                    color: "#56685e",
                    fontSize: "12px",
                    lineHeight: 1.9,
                    paddingLeft: "18px",
                    margin: "8px 0 0",
                  }}>
                    {medicine.daysLeft < 0 ? (
                      <>
                        <li>Do not use this expired medicine.</li>
                        <li>Separate it from usable medicines.</li>
                        <li>Follow local pharmacy or authorised disposal guidance.</li>
                      </>
                    ) : (
                      <>
                        <li>Check whether the medicine is still prescribed and needed.</li>
                        <li>Review the available stock before purchasing more.</li>
                        <li>Ask a pharmacist about return options or safe disposal if it is no longer needed.</li>
                      </>
                    )}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* IMPORTANT NOTE */}
        <div style={{
          marginTop: "20px",
          padding: "16px",
          borderRadius: "10px",
          background: "#fff8e9",
          border: "1px solid #f0e1bd",
        }}>
          <strong style={{
            fontSize: "13px",
            color: "#84652b",
          }}>
            Important medicine safety note
          </strong>

          <p style={{
            fontSize: "12px",
            color: "#77684d",
            lineHeight: 1.8,
            marginBottom: 0,
          }}>
            Expiry Rescue does not recommend increasing doses, using
            expired medicines, or sharing prescription medicines.
            Always follow the prescription and consult a pharmacist
            or healthcare professional when uncertain.
          </p>
        </div>

      </div>
    </div>
  );
}

const smallLabel = {
  color: "#89938d",
  fontSize: "11px",
  margin: "0 0 5px",
};

export default ExpiryRescue;
