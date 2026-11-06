
import { useEffect, useRef, useState } from "react";

const API_URL = "http://localhost:5000/api/ai-medicine/scan";

const detailFields = [
  ["medicineName", "Medicine Name"],
  ["brand", "Brand"],
  ["strength", "Strength"],
  ["dosageForm", "Dosage Form"],
  ["manufacturer", "Manufacturer"],
  ["marketedBy", "Marketed By"],
  ["batchNumber", "Batch / Lot Number"],
  ["manufacturingDate", "Manufacturing Date"],
  ["expiryDate", "Expiry Date"],
  ["mrp", "MRP"],
  ["packSize", "Pack Size"],
  ["composition", "Composition / Ingredients"],
  ["storageInstructions", "Storage Instructions"],
  ["warnings", "Warnings"],
];

const emptyDetails = () =>
  Object.fromEntries([
    ...detailFields.map(([key]) => [key, ""]),
    ["extractionNotes", ""],
  ]);

function AIMedicineScanner() {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const fileInputRef = useRef(null);

  const [cameraActive, setCameraActive] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [error, setError] = useState("");
  const [scanning, setScanning] = useState(false);
  const [details, setDetails] = useState(null);
  const [scanStatus, setScanStatus] = useState("");

  // Connect camera after React renders the video.
  useEffect(() => {
    if (!cameraActive || !streamRef.current || !videoRef.current) {
      return;
    }

    const video = videoRef.current;
    video.srcObject = streamRef.current;

    video.play().catch((err) => {
      console.error("Camera playback error:", err);
      setError("Camera playback failed. Please try again.");
    });

    return () => {
      video.pause();
      video.srcObject = null;
    };
  }, [cameraActive]);

  // Stop camera when leaving this page.
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, []);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    setCameraActive(false);
  };

  const resetResults = () => {
    setDetails(null);
    setError("");
    setScanStatus("");
  };

  const startCamera = async () => {
    setError("");

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Camera requires localhost or HTTPS.");
      }

      let stream;

      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false,
        });
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      }

      streamRef.current = stream;
      setCameraActive(true);
    } catch (err) {
      console.error(err);
      setError("Unable to open camera. Check browser permissions.");
      stopCamera();
    }
  };

  const saveImageBlob = (blob) => {
    const imageUrl = URL.createObjectURL(blob);

    setSelectedImage((previous) => {
      if (previous) URL.revokeObjectURL(previous);
      return imageUrl;
    });

    resetResults();
    stopCamera();
  };

  const captureImage = () => {
    const video = videoRef.current;

    if (!video?.videoWidth || !video?.videoHeight) {
      setError("Camera is still loading. Please wait.");
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    canvas.getContext("2d").drawImage(
      video,
      0,
      0,
      canvas.width,
      canvas.height
    );

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          setError("Unable to capture image.");
          return;
        }

        saveImageBlob(blob);
      },
      "image/jpeg",
      0.95
    );
  };

  const handleImageUpload = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please upload a valid image.");
      event.target.value = "";
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setError("Please upload an image smaller than 8 MB.");
      event.target.value = "";
      return;
    }

    saveImageBlob(file);
    event.target.value = "";
  };

  const clearImage = () => {
    setSelectedImage((previous) => {
      if (previous) URL.revokeObjectURL(previous);
      return null;
    });

    resetResults();
  };

  const updateDetail = (key, value) => {
    setDetails((previous) => ({
      ...previous,
      [key]: value,
    }));
  };

  // Convert image to Base64 for the backend.
  const convertImageToBase64 = async (imageUrl) => {
    const response = await fetch(imageUrl);

    if (!response.ok) {
      throw new Error("Unable to read the selected image.");
    }

    const blob = await response.blob();

    if (blob.size > 8 * 1024 * 1024) {
      throw new Error("Image must be smaller than 8 MB.");
    }

    const mimeType = blob.type || "image/jpeg";

    if (!["image/jpeg", "image/png", "image/webp"].includes(mimeType)) {
      throw new Error("Please use a JPG, PNG or WEBP image.");
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => {
        const dataUrl = reader.result;

        if (typeof dataUrl !== "string") {
          reject(new Error("Unable to convert image."));
          return;
        }

        resolve({
          imageBase64: dataUrl.split(",")[1],
          mimeType,
        });
      };

      reader.onerror = () => reject(new Error("Image conversion failed."));
      reader.readAsDataURL(blob);
    });
  };

  // Send image to Gemini through the backend.
  const scanMedicine = async () => {
    if (!selectedImage || scanning) return;

    setScanning(true);
    setError("");
    setDetails(null);
    setScanStatus("Preparing medicine image...");

    try {
      const imageData = await convertImageToBase64(selectedImage);

      setScanStatus("Sending image to Gemini for analysis...");

      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(imageData),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || result.error || "Gemini analysis failed."
        );
      }

      const receivedDetails = result.data;

      if (!receivedDetails || typeof receivedDetails !== "object") {
        throw new Error("Gemini returned an invalid response.");
      }

      setDetails({
        ...emptyDetails(),
        ...receivedDetails,
      });

      setScanStatus("Gemini analysis completed. Please verify the results.");
    } catch (err) {
      console.error("Gemini scanning error:", err);
      setError(err.message || "Unable to analyse the medicine image.");
      setScanStatus("");
    } finally {
      setScanning(false);
    }
  };

  const filledCount = details
    ? detailFields.filter(([key]) => details[key]?.trim()).length
    : 0;

  return (
    <div className="page-container">
      <div className="page-heading">
        <div>
          <h1>AI Medicine Scanner</h1>
          <p>
            Use Gemini AI to recognise medicine packaging and extract details.
          </p>
        </div>
        <div className="scanner-heading-icon">✳</div>
      </div>

      <div className="scanner-info-card">
        <div className="scanner-info-icon">✦</div>
        <div>
          <h3>Gemini Smart Medicine Recognition</h3>
          <p>
            Capture or upload a medicine strip, bottle or box.
            Gemini analyses the printed information and suggests
            structured medicine details.
          </p>
        </div>
      </div>

      <div className="scanner-layout">
        <div className="scanner-panel">
          <div className="scanner-panel-heading">
            <h2>Scan Medicine</h2>
            <span className="scanner-status">
              {cameraActive
                ? "Camera active"
                : scanning
                ? "Analysing..."
                : "Ready to scan"}
            </span>
          </div>

          <div className="scanner-preview">
            {cameraActive ? (
              <video
                ref={videoRef}
                className="scanner-video"
                autoPlay
                playsInline
                muted
              />
            ) : selectedImage ? (
              <img
                src={selectedImage}
                alt="Medicine packaging"
                className="scanner-image-preview"
              />
            ) : (
              <div className="scanner-placeholder">
                <div className="scanner-placeholder-icon">▧</div>
                <h3>No image selected</h3>
                <p>Open the camera or upload a medicine photograph.</p>
              </div>
            )}
          </div>

          <div className="scanner-actions">
            {!cameraActive ? (
              <button
                className="scanner-button scanner-primary"
                onClick={startCamera}
                disabled={scanning}
              >
                ◎ Open Camera
              </button>
            ) : (
              <>
                <button
                  className="scanner-button scanner-primary"
                  onClick={captureImage}
                >
                  ◉ Capture Image
                </button>

                <button
                  className="scanner-button scanner-secondary"
                  onClick={stopCamera}
                >
                  Stop Camera
                </button>
              </>
            )}

            <button
              className="scanner-button scanner-secondary"
              onClick={() => fileInputRef.current?.click()}
              disabled={scanning}
            >
              ↑ Upload Image
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleImageUpload}
              hidden
            />
          </div>

          {selectedImage && !cameraActive && (
            <div className="scanner-actions scanner-bottom-actions">
              <button
                className="scanner-button scanner-primary"
                onClick={scanMedicine}
                disabled={scanning}
              >
                {scanning ? "Analysing Image..." : "✦ Analyse with Gemini"}
              </button>

              <button
                className="scanner-button scanner-secondary"
                onClick={clearImage}
                disabled={scanning}
              >
                Remove Image
              </button>
            </div>
          )}

          {scanning && (
            <div className="scanner-progress">
              <p>{scanStatus}</p>
              <progress />
            </div>
          )}

          {error && (
            <div className="scanner-message">
              {error}
            </div>
          )}

          {scanStatus && !scanning && (
            <div className="scanner-message">
              {scanStatus}
            </div>
          )}

          {details && (
            <div className="scanner-result">
              <h3>Gemini Extracted Details</h3>

              <p>
                {filledCount} of {detailFields.length} fields have
                possible values. Verify every field before saving.
              </p>

              <div className="scanner-detail-grid">
                {detailFields.map(([key, label]) => (
                  <div className="scanner-detail-field" key={key}>
                    <label htmlFor={`gemini-${key}`}>{label}</label>
                    <input
                      id={`gemini-${key}`}
                      type="text"
                      value={details[key] || ""}
                      placeholder="Not detected — enter manually"
                      onChange={(event) =>
                        updateDetail(key, event.target.value)
                      }
                    />
                    <small>
                      {details[key]
                        ? "AI suggestion — verify manually"
                        : "Not detected"}
                    </small>
                  </div>
                ))}
              </div>

              {details.extractionNotes && (
                <div className="scanner-safety-note">
                  <strong>Gemini extraction notes</strong>
                  <p>{details.extractionNotes}</p>
                </div>
              )}

              <div className="scanner-safety-note">
                <strong>Manual verification required</strong>
                <p>
                  AI can misread small or reflective packaging text.
                  Check medicine names, batch numbers and dates against
                  the original packaging before using this information.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="scanner-guide-panel">
          <h2>Scanning Guide</h2>
          <p className="scanner-guide-subtitle">
            Follow these tips for better results.
          </p>

          {[
            ["01", "Clear Photograph", "Keep packaging text in focus."],
            ["02", "Good Lighting", "Avoid shadows and reflections."],
            ["03", "Capture Close-up", "Make batch and date printing visible."],
            ["04", "Verify Details", "Check every extracted value manually."],
          ].map(([number, title, description]) => (
            <div className="scanner-guide-item" key={number}>
              <span>{number}</span>
              <div>
                <h4>{title}</h4>
                <p>{description}</p>
              </div>
            </div>
          ))}

          <div className="scanner-safety-note">
            <strong>Important</strong>
            <p>
              Gemini provides AI-generated suggestions, not verified
              medical information. Never rely on unverified expiry dates
              or batch numbers.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AIMedicineScanner;
