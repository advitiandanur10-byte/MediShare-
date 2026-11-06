
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import QRCode from "react-qr-code";
import { getAllMedicines } from "../services/medicineService";

function MedicinePassport() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchMedicines = async () => {
      try {
        const data = await getAllMedicines();
        setMedicines(data);
      } catch (err) {
        setError("Unable to load medicine details.");
      } finally {
        setLoading(false);
      }
    };

    fetchMedicines();
  }, []);

  const selectedMedicine = medicines.find(
    (medicine) => medicine._id === id
  );

  const formatDate = (date) => {
    if (!date) return "Not available";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getPassportUrl = (medicineId) => {
    return `${window.location.origin}/medicine-passport/${medicineId}`;
  };

  const downloadQR = (medicine) => {
    const svg = document.getElementById(`qr-${medicine._id}`);

    if (!svg) {
      alert("Unable to find QR code.");
      return;
    }

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    const image = new Image();

    const svgBlob = new Blob([svgData], {
      type: "image/svg+xml;charset=utf-8",
    });

    const svgUrl = URL.createObjectURL(svgBlob);

    image.onload = () => {
      canvas.width = 600;
      canvas.height = 600;

      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, 600, 600);
      context.drawImage(image, 0, 0, 600, 600);

      canvas.toBlob((blob) => {
        if (!blob) {
          alert("Unable to download QR code.");
          URL.revokeObjectURL(svgUrl);
          return;
        }

        const pngUrl = URL.createObjectURL(blob);
        const link = document.createElement("a");

        link.href = pngUrl;
        link.download = `${medicine.medicineName}-QR.png`;
        link.click();

        URL.revokeObjectURL(pngUrl);
        URL.revokeObjectURL(svgUrl);
      }, "image/png");
    };

    image.onerror = () => {
      alert("Unable to generate QR image.");
      URL.revokeObjectURL(svgUrl);
    };

    image.src = svgUrl;
  };

  const printQR = (medicine) => {
    const svg = document.getElementById(`qr-${medicine._id}`);

    if (!svg) {
      alert("Unable to find QR code.");
      return;
    }

    const svgData = new XMLSerializer().serializeToString(svg);
    const printWindow = window.open("", "_blank");

    if (!printWindow) {
      alert("Please allow pop-ups to print the QR code.");
      return;
    }

    const escapeHTML = (value) =>
      String(value ?? "").replace(/[&<>"']/g, (character) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[character]);

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Medicine QR - ${escapeHTML(medicine.medicineName)}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              text-align: center;
              padding: 30px;
            }
            .label {
              border: 1px solid #cccccc;
              border-radius: 12px;
              display: inline-block;
              padding: 25px;
            }
            svg {
              width: 220px;
              height: 220px;
            }
            h2 { margin-bottom: 8px; }
            p { color: #555555; }
            @media print {
              body { padding: 0; }
            }
          </style>
        </head>
        <body>
          <div class="label">
            ${svgData}
            <h2>${escapeHTML(medicine.medicineName)}</h2>
            <p>Batch: ${escapeHTML(medicine.batchNumber)}</p>
            <p>Expiry: ${escapeHTML(formatDate(medicine.expiryDate))}</p>
            <p>Scan to view Medicine Passport</p>
          </div>
          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `);

    printWindow.document.close();
  };

  if (loading) {
    return (
      <div className="page-content">
        <h2>Loading Medicine Passports...</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-content">
        <h2>{error}</h2>
      </div>
    );
  }

  if (id && !selectedMedicine) {
    return (
      <div className="page-content">
        <h2>Medicine not found</h2>
        <button onClick={() => navigate("/medicine-passport")}>
          Back to Medicine Passports
        </button>
      </div>
    );
  }

  if (selectedMedicine) {
    const medicine = selectedMedicine;

    return (
      <div className="page-content">
        <div className="page-heading">
          <p className="eyebrow">MEDISHARE SMART TOOLS</p>
          <h1>Medicine Passport</h1>
          <p className="welcome-copy">
            Complete identification and inventory details for this medicine.
          </p>

          <button
            style={styles.scanButton}
            onClick={() => navigate("/scan-medicine-qr")}
          >
            Scan Medicine QR
          </button>
        </div>

        <div style={styles.passport}>
          <div style={styles.passportHeader}>
            <div>
              <p style={styles.eyebrow}>MEDICINE IDENTITY</p>
              <h2 style={styles.medicineName}>
                {medicine.medicineName}
              </h2>
              <p style={styles.batch}>
                Batch: {medicine.batchNumber}
              </p>
            </div>

            <div style={styles.qrBox}>
              <QRCode
                id={`qr-${medicine._id}`}
                value={getPassportUrl(medicine._id)}
                size={150}
              />

              <p style={styles.qrCaption}>Scan to open passport</p>

              <div style={styles.actionButtons}>
                <button
                  style={styles.smallButton}
                  onClick={() => downloadQR(medicine)}
                >
                  Download QR
                </button>

                <button
                  style={styles.smallButton}
                  onClick={() => printQR(medicine)}
                >
                  Print QR
                </button>
              </div>
            </div>
          </div>

          <div style={styles.detailsGrid}>
            <Detail label="Current quantity" value={`${medicine.quantity} ${medicine.unit}`} />
            <Detail label="Expiry date" value={formatDate(medicine.expiryDate)} />
            <Detail label="Purchase date" value={formatDate(medicine.purchaseDate)} />
            <Detail label="Storage location" value={medicine.storageLocation || "Not specified"} />
            <Detail label="Unit price" value={`₹${Number(medicine.price || 0).toFixed(2)}`} />
            <Detail label="Initial purchase amount" value={`₹${Number(medicine.initialPurchaseAmount || 0).toFixed(2)}`} />
          </div>

          <h3 style={styles.sectionTitle}>Refill History</h3>

          {medicine.refillHistory?.length > 0 ? (
            <div style={{ overflowX: "auto" }}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Date</th>
                    <th style={styles.th}>Previous stock</th>
                    <th style={styles.th}>Added</th>
                    <th style={styles.th}>New stock</th>
                    <th style={styles.th}>Amount paid</th>
                  </tr>
                </thead>

                <tbody>
                  {medicine.refillHistory.map((refill, index) => (
                    <tr key={index}>
                      <td style={styles.td}>{formatDate(refill.refillDate)}</td>
                      <td style={styles.td}>{refill.previousQuantity}</td>
                      <td style={styles.td}>{refill.quantityAdded}</td>
                      <td style={styles.td}>{refill.newQuantity}</td>
                      <td style={styles.td}>
                        ₹{Number(refill.amountPaid || 0).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p style={styles.empty}>No refill records available.</p>
          )}

          <button
            style={styles.backButton}
            onClick={() => navigate("/medicine-passport")}
          >
            Back to all medicines
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-content">
      <div style={styles.headingRow}>
        <div className="page-heading">
          <p className="eyebrow">MEDISHARE SMART TOOLS</p>
          <h1>Medicine Passport</h1>
          <p className="welcome-copy">
            Generate and view unique QR-based passports for your medicines.
          </p>
        </div>

        <button
          style={styles.scanButton}
          onClick={() => navigate("/scan-medicine-qr")}
        >
          Scan Medicine QR
        </button>
      </div>

      {medicines.length === 0 ? (
        <p>No medicines found. Add a medicine to generate its passport.</p>
      ) : (
        <div style={styles.cardGrid}>
          {medicines.map((medicine) => (
            <div style={styles.card} key={medicine._id}>
              <div style={styles.cardQR}>
                <QRCode
                  id={`qr-${medicine._id}`}
                  value={getPassportUrl(medicine._id)}
                  size={125}
                />
              </div>

              <h3 style={styles.cardTitle}>
                {medicine.medicineName}
              </h3>

              <p style={styles.cardText}>
                Batch: {medicine.batchNumber}
              </p>

              <p style={styles.cardText}>
                Expires: {formatDate(medicine.expiryDate)}
              </p>

              <button
                style={styles.viewButton}
                onClick={() =>
                  navigate(`/medicine-passport/${medicine._id}`)
                }
              >
                View Passport
              </button>

              <div style={styles.actionButtons}>
                <button
                  style={styles.smallButton}
                  onClick={() => downloadQR(medicine)}
                >
                  Download QR
                </button>

                <button
                  style={styles.smallButton}
                  onClick={() => printQR(medicine)}
                >
                  Print QR
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Detail({ label, value }) {
  return (
    <div style={styles.detail}>
      <p style={styles.detailLabel}>{label}</p>
      <p style={styles.detailValue}>{value}</p>
    </div>
  );
}

const styles = {
  headingRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "15px",
  },
  cardGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))",
    gap: "20px",
    marginTop: "25px",
  },
  card: {
    background: "#ffffff",
    border: "1px solid #e5e9e6",
    borderRadius: "16px",
    padding: "22px",
    textAlign: "center",
  },
  cardQR: {
    display: "flex",
    justifyContent: "center",
    padding: "15px",
  },
  cardTitle: {
    color: "#173f39",
    marginBottom: "8px",
  },
  cardText: {
    color: "#78817d",
    fontSize: "14px",
    margin: "6px 0",
  },
  viewButton: {
    marginTop: "15px",
    padding: "11px 18px",
    background: "#064e46",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    width: "100%",
  },
  scanButton: {
    padding: "12px 20px",
    background: "#064e46",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "600",
  },
  actionButtons: {
    display: "flex",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: "8px",
    marginTop: "14px",
  },
  smallButton: {
    padding: "9px 12px",
    background: "#e8f2ec",
    color: "#064e46",
    border: "1px solid #d3e5d9",
    borderRadius: "7px",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: "600",
  },
  passport: {
    background: "#ffffff",
    border: "1px solid #e5e9e6",
    borderRadius: "18px",
    padding: "28px",
    marginTop: "25px",
  },
  passportHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "25px",
    paddingBottom: "25px",
    borderBottom: "1px solid #e5e9e6",
  },
  eyebrow: {
    color: "#659b7e",
    fontSize: "12px",
    letterSpacing: "1.5px",
    fontWeight: "bold",
  },
  medicineName: {
    color: "#173f39",
    margin: "10px 0",
  },
  batch: {
    color: "#78817d",
  },
  qrBox: {
    textAlign: "center",
    padding: "15px",
    border: "1px solid #e5e9e6",
    borderRadius: "12px",
  },
  qrCaption: {
    fontSize: "12px",
    color: "#78817d",
    marginBottom: 0,
  },
  detailsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "18px",
    marginTop: "25px",
  },
  detail: {
    background: "#f6f8f6",
    padding: "16px",
    borderRadius: "10px",
  },
  detailLabel: {
    color: "#78817d",
    fontSize: "13px",
    margin: "0 0 8px",
  },
  detailValue: {
    color: "#173f39",
    fontWeight: "600",
    margin: 0,
  },
  sectionTitle: {
    color: "#173f39",
    marginTop: "30px",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    marginTop: "15px",
    textAlign: "left",
  },
  th: {
    background: "#f1f6f2",
    color: "#315d4d",
    padding: "12px",
    fontSize: "13px",
  },
  td: {
    padding: "12px",
    borderBottom: "1px solid #e5e9e6",
    fontSize: "13px",
  },
  empty: {
    color: "#78817d",
    padding: "12px 0",
  },
  backButton: {
    marginTop: "25px",
    padding: "12px 18px",
    background: "#064e46",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
  },
};

export default MedicinePassport;
