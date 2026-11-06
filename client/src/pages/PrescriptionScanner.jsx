
import { useState } from "react";
import { createWorker } from "tesseract.js";
import { getAllMedicines } from "../services/medicineService";

// --------------------------------------------------
// IMAGE PREPROCESSING
// --------------------------------------------------

function preprocessImage(file) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const imageUrl = URL.createObjectURL(file);

    image.onload = () => {
      try {
        const canvas = document.createElement("canvas");

        const scale = Math.max(2, 2200 / image.width);

        canvas.width = Math.round(image.width * scale);
        canvas.height = Math.round(image.height * scale);

        const context = canvas.getContext("2d", {
          willReadFrequently: true,
        });

        context.drawImage(
          image,
          0,
          0,
          canvas.width,
          canvas.height
        );

        const imageData = context.getImageData(
          0,
          0,
          canvas.width,
          canvas.height
        );

        const pixels = imageData.data;
        const grayscaleValues = [];

        for (let i = 0; i < pixels.length; i += 4) {
          const gray =
            0.299 * pixels[i] +
            0.587 * pixels[i + 1] +
            0.114 * pixels[i + 2];

          grayscaleValues.push(gray);
        }

        // Calculate Otsu threshold.
        const histogram = new Array(256).fill(0);

        grayscaleValues.forEach((value) => {
          histogram[Math.round(value)]++;
        });

        const total = grayscaleValues.length;
        let sum = 0;

        for (let i = 0; i < 256; i++) {
          sum += i * histogram[i];
        }

        let sumBackground = 0;
        let weightBackground = 0;
        let maximumVariance = 0;
        let threshold = 150;

        for (let i = 0; i < 256; i++) {
          weightBackground += histogram[i];

          if (weightBackground === 0) continue;

          const weightForeground = total - weightBackground;

          if (weightForeground === 0) break;

          sumBackground += i * histogram[i];

          const meanBackground =
            sumBackground / weightBackground;

          const meanForeground =
            (sum - sumBackground) / weightForeground;

          const variance =
            weightBackground *
            weightForeground *
            Math.pow(meanBackground - meanForeground, 2);

          if (variance > maximumVariance) {
            maximumVariance = variance;
            threshold = i;
          }
        }

        // Apply contrast and black-and-white conversion.
        for (let i = 0; i < pixels.length; i += 4) {
          let gray =
            0.299 * pixels[i] +
            0.587 * pixels[i + 1] +
            0.114 * pixels[i + 2];

          gray = Math.max(
            0,
            Math.min(255, (gray - 128) * 1.5 + 128)
          );

          const finalValue = gray > threshold ? 255 : 0;

          pixels[i] = finalValue;
          pixels[i + 1] = finalValue;
          pixels[i + 2] = finalValue;
          pixels[i + 3] = 255;
        }

        context.putImageData(imageData, 0, 0);

        URL.revokeObjectURL(imageUrl);
        resolve(canvas);
      } catch (error) {
        URL.revokeObjectURL(imageUrl);
        reject(error);
      }
    };

    image.onerror = () => {
      URL.revokeObjectURL(imageUrl);
      reject(new Error("Unable to process prescription image."));
    };

    image.src = imageUrl;
  });
}

// --------------------------------------------------
// TEXT NORMALIZATION
// --------------------------------------------------

function normalizeText(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

// --------------------------------------------------
// PRESCRIPTION TEXT FILTERING
// --------------------------------------------------

function extractMedicineCandidates(text) {
  const lines = text
    .split(/\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const ignoredTerms =
    /general medicine|sample prescription|not for medical use|patient name|doctor|clinic|hospital|consultation|follow up|registration|reg no|address|phone|gender|years|note:|mbbs|prescription|date:/i;

  const candidates = [];

  lines.forEach((originalLine) => {
    if (ignoredTerms.test(originalLine)) return;

    // Remove numbering and common OCR separators.
    const cleaned = originalLine
      .replace(/^\s*\d+\s*[.)|:\-]?\s*/, "")
      .replace(/^\s*[|:;]+\s*/, "")
      .replace(/[|]/g, " ")
      .trim();

    if (!cleaned) return;

    // Detect medicine strengths.
    const hasStrength =
      /\b\d+(?:\.\d+)?\s*(?:mg|mcg|g|ml|iu|units?)\b/i.test(cleaned);

    // Detect common OCR errors in strength units.
    const hasPossibleOcrStrength =
      /\b\d+\s*(?:omg|m9|mg|m g)\b/i.test(cleaned);

    // Ignore lines that do not resemble medicine entries.
    if (!hasStrength && !hasPossibleOcrStrength) return;

    // Remove strength information to isolate the medicine name.
    const medicineName = cleaned
      .replace(
        /\b\d+(?:\.\d+)?\s*(?:mg|mcg|g|ml|iu|units?|omg|m9)\b/gi,
        ""
      )
      .replace(
        /\b(tablets?|capsules?|syrup|injection)\b/gi,
        ""
      )
      .replace(/[^a-zA-Z\s-]/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    if (medicineName.length < 3) return;

    candidates.push({
      prescriptionText: originalLine,
      medicineName,
    });
  });

  // Remove duplicate entries.
  return candidates.filter((candidate, index, array) => {
    return (
      array.findIndex(
        (item) =>
          normalizeText(item.medicineName) ===
          normalizeText(candidate.medicineName)
      ) === index
    );
  });
}

// --------------------------------------------------
// MAIN PRESCRIPTION SCANNER
// --------------------------------------------------

function PrescriptionScanner() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [extractedText, setExtractedText] = useState("");
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [compared, setCompared] = useState(false);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState("");

  // Upload prescription image.
  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];

    if (!selectedFile) return;

    if (!selectedFile.type.startsWith("image/")) {
      setError("Please upload a prescription image.");
      return;
    }

    if (preview) {
      URL.revokeObjectURL(preview);
    }

    setFile(selectedFile);
    setPreview(URL.createObjectURL(selectedFile));
    setExtractedText("");
    setMatches([]);
    setCompared(false);
    setError("");
    setProgress("");
  };

  // Extract text using OCR.
  const extractText = async () => {
    if (!file) {
      setError("Please upload a prescription image first.");
      return;
    }

    setLoading(true);
    setError("");
    setProgress("Enhancing prescription image...");

    let worker;

    try {
      const processedImage = await preprocessImage(file);

      setProgress("Initializing text recognition...");

      worker = await createWorker("eng", 1, {
        logger: (message) => {
          if (message.status === "recognizing text") {
            setProgress(
              `Recognizing printed text: ${Math.round(
                message.progress * 100
              )}%`
            );
          }
        },
      });

      await worker.setParameters({
        tessedit_pageseg_mode: "6",
        preserve_interword_spaces: "1",
      });

      const result = await worker.recognize(processedImage);

      setExtractedText(result.data.text);
      setCompared(false);
      setMatches([]);
      setProgress("Text extraction completed!");
    } catch (err) {
      console.error("OCR error:", err);

      setError(
        "Unable to extract text. Try a clearer, well-lit prescription image."
      );
    } finally {
      if (worker) {
        await worker.terminate();
      }

      setLoading(false);
    }
  };

  // Compare extracted medicines with MongoDB inventory.
  const compareInventory = async () => {
    if (!extractedText.trim()) {
      setError("Please extract or enter prescription text first.");
      return;
    }

    setLoading(true);
    setError("");
    setCompared(false);

    try {
      const inventory = await getAllMedicines();

      const candidates = extractMedicineCandidates(extractedText);

      if (candidates.length === 0) {
        setMatches([]);
        setCompared(true);
        setError(
          "No likely medicine entries detected. Please correct the extracted text and try again."
        );
        return;
      }

      const results = candidates.map((candidate) => {
        const searchName = normalizeText(candidate.medicineName);

        const matchedMedicine = inventory.find((medicine) => {
          const inventoryName = normalizeText(
            medicine.medicineName
          );

          return (
            searchName === inventoryName ||
            searchName.includes(inventoryName) ||
            inventoryName.includes(searchName)
          );
        });

        return {
          prescriptionText: candidate.prescriptionText,
          medicineName: candidate.medicineName,
          medicine: matchedMedicine || null,
          availableQuantity: matchedMedicine
            ? matchedMedicine.quantity
            : 0,
          status: !matchedMedicine
            ? "Not found in inventory"
            : matchedMedicine.quantity > 0
              ? "Available"
              : "Out of stock",
        };
      });

      setMatches(results);
      setCompared(true);
    } catch (err) {
      console.error("Inventory comparison error:", err);

      setError(
        "Unable to compare with inventory. Please check your server connection."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-content">
      <div className="page-heading">
        <p className="eyebrow">MEDISHARE SMART TOOLS</p>

        <h1>Prescription Scanner</h1>

        <p className="welcome-copy">
          Extract printed medicine names and compare them
          with your existing inventory.
        </p>
      </div>

      {/* UPLOAD SECTION */}

      <div style={styles.uploadCard}>
        <h3 style={styles.sectionTitle}>
          1. Upload Prescription
        </h3>

        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          style={styles.fileInput}
        />

        {preview && (
          <div style={styles.previewContainer}>
            <img
              src={preview}
              alt="Uploaded prescription"
              style={styles.previewImage}
            />
          </div>
        )}

        <button
          style={{
            ...styles.primaryButton,
            opacity: !file || loading ? 0.6 : 1,
          }}
          onClick={extractText}
          disabled={!file || loading}
        >
          {loading ? "Processing..." : "Enhance & Extract Text"}
        </button>

        {progress && (
          <p style={styles.progress}>{progress}</p>
        )}
      </div>

      {/* EXTRACTED TEXT SECTION */}

      {extractedText !== "" && (
        <div style={styles.uploadCard}>
          <h3 style={styles.sectionTitle}>
            2. Review Extracted Text
          </h3>

          <p style={styles.helperText}>
            Review the extracted text carefully. Correct any
            medicine names or OCR errors. Keep each medicine
            entry on a separate line.
          </p>

          <textarea
            value={extractedText}
            onChange={(event) => {
              setExtractedText(event.target.value);
              setCompared(false);
              setMatches([]);
            }}
            rows={9}
            style={styles.textArea}
            placeholder="Extracted prescription text appears here..."
          />

          <button
            style={styles.primaryButton}
            onClick={compareInventory}
            disabled={loading}
          >
            {loading ? "Comparing..." : "Compare With Inventory"}
          </button>
        </div>
      )}

      {error && (
        <p style={styles.error}>{error}</p>
      )}

      {/* INVENTORY RESULTS */}

      {compared && (
        <div style={styles.uploadCard}>
          <h3 style={styles.sectionTitle}>
            3. Inventory Reconciliation
          </h3>

          <div style={styles.summaryGrid}>
            <Summary
              label="Medicine entries"
              value={matches.length}
            />

            <Summary
              label="Available"
              value={matches.filter(
                (item) => item.status === "Available"
              ).length}
            />

            <Summary
              label="Not found"
              value={matches.filter(
                (item) =>
                  item.status === "Not found in inventory"
              ).length}
            />

            <Summary
              label="Out of stock"
              value={matches.filter(
                (item) => item.status === "Out of stock"
              ).length}
            />
          </div>

          {matches.length > 0 && (
            <div style={{ overflowX: "auto" }}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Prescription medicine</th>
                    <th style={styles.th}>Inventory medicine</th>
                    <th style={styles.th}>Available stock</th>
                    <th style={styles.th}>Status</th>
                  </tr>
                </thead>

                <tbody>
                  {matches.map((item, index) => (
                    <tr key={index}>
                      <td style={styles.td}>
                        {item.medicineName}
                      </td>

                      <td style={styles.td}>
                        {item.medicine
                          ? item.medicine.medicineName
                          : "Not matched"}
                      </td>

                      <td style={styles.td}>
                        {item.medicine
                          ? `${item.availableQuantity} ${item.medicine.unit}`
                          : "-"}
                      </td>

                      <td style={styles.td}>
                        <span
                          style={{
                            ...styles.status,
                            ...(item.status === "Available"
                              ? styles.available
                              : item.status === "Out of stock"
                                ? styles.outOfStock
                                : styles.notFound),
                          }}
                        >
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <p style={styles.disclaimer}>
            This is a basic text-matching comparison, not a
            medical prescription validator. OCR may misread
            medicine names and strengths. Similar medicine
            names may not represent the same medicine.
            Verify every result with the original prescription
            or a pharmacist. Do not purchase, substitute or
            change doses based only on these results.
          </p>
        </div>
      )}
    </div>
  );
}

// --------------------------------------------------
// SUMMARY CARD
// --------------------------------------------------

function Summary({ label, value }) {
  return (
    <div style={styles.summaryCard}>
      <p style={styles.summaryLabel}>{label}</p>
      <h2 style={styles.summaryValue}>{value}</h2>
    </div>
  );
}

// --------------------------------------------------
// STYLES
// --------------------------------------------------

const styles = {
  uploadCard: {
    background: "#ffffff",
    border: "1px solid #e5e9e6",
    borderRadius: "16px",
    padding: "25px",
    marginTop: "25px",
  },

  sectionTitle: {
    color: "#173f39",
    marginTop: 0,
  },

  fileInput: {
    display: "block",
    width: "100%",
    margin: "20px 0",
    padding: "15px",
    border: "1px dashed #8aafa0",
    borderRadius: "10px",
    background: "#f6f8f6",
  },

  previewContainer: {
    margin: "20px 0",
    textAlign: "center",
  },

  previewImage: {
    maxWidth: "100%",
    maxHeight: "350px",
    objectFit: "contain",
    borderRadius: "10px",
  },

  primaryButton: {
    padding: "12px 20px",
    background: "#064e46",
    color: "#ffffff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    marginTop: "10px",
  },

  progress: {
    color: "#52746a",
    fontSize: "14px",
    marginTop: "15px",
  },

  helperText: {
    color: "#78817d",
    fontSize: "14px",
    lineHeight: 1.6,
  },

  textArea: {
    width: "100%",
    boxSizing: "border-box",
    padding: "15px",
    border: "1px solid #dce5df",
    borderRadius: "10px",
    fontSize: "14px",
    lineHeight: 1.6,
    resize: "vertical",
  },

  summaryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
    gap: "15px",
    margin: "20px 0",
  },

  summaryCard: {
    background: "#f3f7f4",
    padding: "18px",
    borderRadius: "12px",
  },

  summaryLabel: {
    color: "#78817d",
    fontSize: "13px",
  },

  summaryValue: {
    color: "#064e46",
    marginBottom: 0,
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
    padding: "13px",
    fontSize: "13px",
  },

  td: {
    padding: "13px",
    borderBottom: "1px solid #e5e9e6",
    fontSize: "13px",
  },

  status: {
    display: "inline-block",
    padding: "6px 10px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "600",
  },

  available: {
    background: "#e3f3e9",
    color: "#28734a",
  },

  outOfStock: {
    background: "#fff0dc",
    color: "#a56820",
  },

  notFound: {
    background: "#fbe9e8",
    color: "#b84d48",
  },

  error: {
    color: "#c75d57",
    marginTop: "20px",
  },

  disclaimer: {
    marginTop: "20px",
    padding: "14px",
    background: "#fff8e9",
    borderRadius: "8px",
    color: "#80632e",
    fontSize: "13px",
    lineHeight: 1.6,
  },
};

export default PrescriptionScanner;
