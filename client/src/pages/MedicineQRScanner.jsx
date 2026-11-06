
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Html5QrcodeScanner } from "html5-qrcode";

function MedicineQRScanner() {
  const navigate = useNavigate();
  const [scanError, setScanError] = useState("");
  const [scanMessage, setScanMessage] = useState(
    "Allow camera access and point it at a MediShare medicine QR code."
  );

  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      "medicine-qr-reader",
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        rememberLastUsedCamera: true,
      },
      false
    );

    scanner.render(
      (decodedText) => {
        try {
          const scannedUrl = new URL(decodedText);

          if (
            scannedUrl.pathname.startsWith("/medicine-passport/")
          ) {
            const medicineId = scannedUrl.pathname
              .split("/")
              .filter(Boolean)
              .pop();

            if (medicineId) {
              setScanMessage("QR code detected! Opening medicine passport...");
              scanner.clear().catch(() => {});
              navigate(`/medicine-passport/${medicineId}`);
              return;
            }
          }

          setScanError("This QR code is not a valid MediShare medicine passport.");
        } catch {
          setScanError("Unable to read this QR code.");
        }
      },
      () => {
        // Ignore repeated camera scan errors while searching for a QR code.
      }
    );

    return () => {
      scanner.clear().catch(() => {});
    };
  }, [navigate]);

  return (
    <div className="page-content">
      <div className="page-heading">
        <p className="eyebrow">MEDISHARE SMART TOOLS</p>
        <h1>Scan Medicine QR</h1>
        <p className="welcome-copy">
          Scan a medicine's unique QR code to access its digital passport.
        </p>
      </div>

      <div
        style={{
          background: "#ffffff",
          padding: "25px",
          borderRadius: "16px",
          border: "1px solid #e5e9e6",
          maxWidth: "650px",
          marginTop: "25px",
        }}
      >
        <div id="medicine-qr-reader"></div>

        <p style={{ color: "#52746a", marginTop: "20px" }}>
          {scanMessage}
        </p>

        {scanError && (
          <p style={{ color: "#c75d57" }}>
            {scanError}
          </p>
        )}
      </div>
    </div>
  );
}

export default MedicineQRScanner;
