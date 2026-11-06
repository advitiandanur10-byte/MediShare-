
import { useEffect, useState } from "react";
import {
  getAllMedicines,
  updateMedicine,
  deleteMedicine,
  refillMedicine,
} from "../services/medicineService";

function Medicines() {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const [editingMedicine, setEditingMedicine] = useState(null);
  const [editData, setEditData] = useState({});

  // REFILL STATES
  const [refillingMedicine, setRefillingMedicine] = useState(null);
  const [refillQuantity, setRefillQuantity] = useState("");
  const [refillAmountPaid, setRefillAmountPaid] = useState("");

  // REFILL HISTORY STATE
  const [viewingHistoryMedicine, setViewingHistoryMedicine] = useState(null);

  // LOAD MEDICINES
  const loadMedicines = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getAllMedicines();

      setMedicines(
        Array.isArray(data)
          ? data
          : data.medicines || data.data || []
      );
    } catch (err) {
      setError(err.message || "Unable to load medicines.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMedicines();
  }, []);

  // EXPIRY STATUS
  const getStatus = (expiryDate) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const expiry = new Date(expiryDate);
    expiry.setHours(0, 0, 0, 0);

    const days = Math.ceil(
      (expiry - today) / (1000 * 60 * 60 * 24)
    );

    if (days < 0) return "expired";
    if (days <= 7) return "warning";

    return "safe";
  };

  // LOW STOCK CHECK
  const isLowStock = (medicine) => {
    return Number(medicine.quantity) <= 5;
  };

  // SEARCH AND FILTER
  const filteredMedicines = medicines.filter((medicine) => {
    const name = medicine.medicineName || "";
    const batch = medicine.batchNumber || "";

    const matchesSearch =
      name.toLowerCase().includes(search.toLowerCase()) ||
      batch.toLowerCase().includes(search.toLowerCase());

    const status = getStatus(medicine.expiryDate);

    const matchesFilter =
      filter === "all" ||
      (filter === "expired" && status === "expired") ||
      (filter === "warning" && status === "warning") ||
      (filter === "safe" && status === "safe") ||
      (filter === "lowStock" && isLowStock(medicine));

    return matchesSearch && matchesFilter;
  });

  // EDIT MEDICINE
  const handleEdit = (medicine) => {
    setEditingMedicine(medicine);

    setEditData({
      medicineName: medicine.medicineName || "",
      quantity: medicine.quantity ?? "",
      unit: medicine.unit || "",
      batchNumber: medicine.batchNumber || "",
      purchaseDate: medicine.purchaseDate
        ? new Date(medicine.purchaseDate).toISOString().slice(0, 10)
        : "",
      expiryDate: medicine.expiryDate
        ? new Date(medicine.expiryDate).toISOString().slice(0, 10)
        : "",
      price: medicine.price ?? "",
      storageLocation: medicine.storageLocation || "",
    });
  };

  // UPDATE MEDICINE
  const handleUpdate = async (e) => {
    e.preventDefault();

    if (
      !editData.medicineName ||
      Number(editData.quantity) < 0 ||
      Number(editData.price) < 0
    ) {
      alert("Please enter valid medicine details.");
      return;
    }

    if (
      new Date(editData.expiryDate) <=
      new Date(editData.purchaseDate)
    ) {
      alert("Expiry date must be after purchase date.");
      return;
    }

    try {
      const id = editingMedicine._id || editingMedicine.id;

      await updateMedicine(id, {
        ...editData,
        quantity: Number(editData.quantity),
        price: Number(editData.price),
        purchaseDate: new Date(editData.purchaseDate),
        expiryDate: new Date(editData.expiryDate),
      });

      alert("Medicine updated successfully!");

      setEditingMedicine(null);
      await loadMedicines();
    } catch (err) {
      alert(err.message || "Unable to update medicine.");
    }
  };

  // RECORD MEDICINE USAGE
  const handleRecordUsage = async (medicine) => {
    const currentQuantity = Number(medicine.quantity);

    if (currentQuantity <= 0) {
      alert("This medicine is out of stock!");
      return;
    }

    const confirmed = window.confirm(
      `Record usage of 1 ${medicine.unit || "unit"} of ${medicine.medicineName}?`
    );

    if (!confirmed) return;

    try {
      const id = medicine._id || medicine.id;

      await updateMedicine(id, {
        quantity: currentQuantity - 1,
      });

      alert("Medicine usage recorded successfully!");
      await loadMedicines();
    } catch (err) {
      alert(err.message || "Unable to record medicine usage.");
    }
  };

  // OPEN REFILL FORM
  const handleOpenRefill = (medicine) => {
    setRefillingMedicine(medicine);
    setRefillQuantity("");
    setRefillAmountPaid("");
  };

  // CLOSE REFILL FORM
  const handleCloseRefill = () => {
    setRefillingMedicine(null);
    setRefillQuantity("");
    setRefillAmountPaid("");
  };

  // REFILL MEDICINE AND RECORD PURCHASE EXPENSE
  const handleRefill = async (e) => {
    e.preventDefault();

    const quantity = Number(refillQuantity);
    const amountPaid = Number(refillAmountPaid);

    if (!Number.isFinite(quantity) || quantity <= 0) {
      alert("Please enter a valid refill quantity.");
      return;
    }

    if (
      refillAmountPaid.trim() === "" ||
      !Number.isFinite(amountPaid) ||
      amountPaid < 0
    ) {
      alert("Please enter a valid total purchase amount.");
      return;
    }

    try {
      const id = refillingMedicine._id || refillingMedicine.id;

      await refillMedicine(id, quantity, amountPaid);

      alert("Medicine refilled and purchase expense recorded successfully!");

      handleCloseRefill();
      await loadMedicines();
    } catch (err) {
      alert(err.message || "Unable to refill medicine.");
    }
  };

  // DELETE MEDICINE
  const handleDelete = async (medicine) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${medicine.medicineName}?`
    );

    if (!confirmed) return;

    try {
      const id = medicine._id || medicine.id;

      await deleteMedicine(id);
      await loadMedicines();
    } catch (err) {
      alert(err.message || "Unable to delete medicine.");
    }
  };

  // SUMMARY COUNTS
  const expiredCount = medicines.filter(
    (m) => getStatus(m.expiryDate) === "expired"
  ).length;

  const warningCount = medicines.filter(
    (m) => getStatus(m.expiryDate) === "warning"
  ).length;

  const safeCount = medicines.filter(
    (m) => getStatus(m.expiryDate) === "safe"
  ).length;

  const lowStockCount = medicines.filter(
    (m) => isLowStock(m)
  ).length;

  const calculatedUnitCost =
    Number(refillQuantity) > 0 &&
    refillAmountPaid !== "" &&
    Number(refillAmountPaid) >= 0
      ? Number(refillAmountPaid) / Number(refillQuantity)
      : null;

  // PAGE UI
  return (
    <div className="page-content">
      <div className="medicines-page">

        {/* PAGE HEADING */}
        <div className="medicines-heading">
          <div>
            <p className="eyebrow">HOUSEHOLD INVENTORY</p>

            <h1>Medicines & Disposal</h1>

            <p>
              Manage your medicines and prevent unnecessary wastage.
            </p>
          </div>

          <button
            className="primary-button"
            onClick={() => (window.location.href = "/add-medicine")}
          >
            + Add medicine
          </button>
        </div>

        {/* MEDICINE SUMMARY */}
        <div className="medicine-summary">

          <div className="medicine-stat">
            <span>Total medicines</span>
            <h2>{medicines.length}</h2>
          </div>

          <div className="medicine-stat">
            <span>Expired medicines</span>
            <h2 className="expired-text">{expiredCount}</h2>
          </div>

          <div className="medicine-stat">
            <span>Expiring within 7 days</span>
            <h2 className="warning-text">{warningCount}</h2>
          </div>

          <div className="medicine-stat">
            <span>Safe medicines</span>
            <h2 className="safe-text">{safeCount}</h2>
          </div>

          <div className="medicine-stat">
            <span>Low stock medicines</span>

            <h2 style={{ color: "#C96B65" }}>
              {lowStockCount}
            </h2>

            <small style={{ color: "#777F7B" }}>
              5 or fewer units
            </small>
          </div>

        </div>

        {/* SEARCH AND FILTER */}
        <div className="medicine-controls">

          <input
            type="text"
            placeholder="Search medicine or batch number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">All medicines</option>
            <option value="expired">Expired</option>
            <option value="warning">Expiring soon</option>
            <option value="safe">Safe medicines</option>
            <option value="lowStock">
              Low stock (5 or fewer)
            </option>
          </select>

          <button onClick={loadMedicines}>
            ↻ Refresh
          </button>

        </div>

        {/* ERROR MESSAGE */}
        {error && (
          <div className="error-banner">
            {error}
          </div>
        )}

        {/* MEDICINE TABLE */}
        {loading ? (
          <p className="medicine-loading">
            Loading medicines...
          </p>
        ) : filteredMedicines.length === 0 ? (
          <div className="medicine-empty">
            <h3>No medicines found</h3>
            <p>Try changing your search or filter.</p>
          </div>
        ) : (
          <div className="medicine-table-container">

            <table className="medicine-table">

              <thead>
                <tr>
                  <th>Medicine</th>
                  <th>Quantity</th>
                  <th>Batch number</th>
                  <th>Expiry date</th>
                  <th>Storage</th>
                  <th>Status</th>
                  <th>Usage</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredMedicines.map((medicine) => {
                  const status = getStatus(medicine.expiryDate);
                  const lowStock = isLowStock(medicine);

                  return (
                    <tr key={medicine._id || medicine.id}>

                      {/* MEDICINE NAME */}
                      <td>
                        <strong>{medicine.medicineName}</strong>
                        <small>₹{medicine.price}</small>
                      </td>

                      {/* QUANTITY AND LOW STOCK BADGE */}
                      <td>
                        {medicine.quantity} {medicine.unit}

                        {lowStock && (
                          <span
                            style={{
                              display: "inline-block",
                              marginLeft: "7px",
                              background: "#FCEBEA",
                              color: "#BD4944",
                              borderRadius: "20px",
                              padding: "4px 8px",
                              fontSize: "10px",
                              fontWeight: 700,
                              whiteSpace: "nowrap",
                            }}
                          >
                            Low Stock
                          </span>
                        )}
                      </td>

                      {/* BATCH NUMBER */}
                      <td>{medicine.batchNumber}</td>

                      {/* EXPIRY DATE */}
                      <td>
                        {new Date(
                          medicine.expiryDate
                        ).toLocaleDateString("en-IN")}
                      </td>

                      {/* STORAGE */}
                      <td>{medicine.storageLocation}</td>

                      {/* EXPIRY STATUS */}
                      <td>
                        <span className={`expiry-badge ${status}`}>
                          {status === "expired"
                            ? "Expired"
                            : status === "warning"
                            ? "Expiring soon"
                            : "Safe"}
                        </span>
                      </td>

                      {/* RECORD USAGE */}
                      <td>
                        <button
                          onClick={() => handleRecordUsage(medicine)}
                          disabled={Number(medicine.quantity) <= 0}
                          style={{
                            background:
                              Number(medicine.quantity) <= 0
                                ? "#E6E8E3"
                                : "#E8F5ED",
                            color:
                              Number(medicine.quantity) <= 0
                                ? "#777F7B"
                                : "#26734D",
                            border: "none",
                            padding: "7px 10px",
                            borderRadius: "7px",
                            fontSize: "11px",
                            fontWeight: 600,
                            cursor:
                              Number(medicine.quantity) <= 0
                                ? "not-allowed"
                                : "pointer",
                            whiteSpace: "nowrap",
                          }}
                        >
                          Record Usage −1
                        </button>
                      </td>

                      {/* ACTIONS */}
                      <td>
                        <div className="medicine-actions">

                          <button
                            onClick={() => handleOpenRefill(medicine)}
                            style={{
                              background: "#E8F5ED",
                              color: "#26734D",
                              border: "none",
                              borderRadius: "6px",
                              padding: "7px 10px",
                              cursor: "pointer",
                              fontSize: "11px",
                              fontWeight: 600,
                            }}
                          >
                            + Refill
                          </button>

                          <button
                            onClick={() => setViewingHistoryMedicine(medicine)}
                            style={{
                              background: "#EAF0F8",
                              color: "#42648A",
                              border: "none",
                              borderRadius: "6px",
                              padding: "7px 10px",
                              cursor: "pointer",
                              fontSize: "11px",
                              fontWeight: 600,
                            }}
                          >
                            History
                          </button>

                          <button
                            onClick={() => handleEdit(medicine)}
                          >
                            Edit
                          </button>

                          <button
                            className="delete-action"
                            onClick={() => handleDelete(medicine)}
                          >
                            Delete
                          </button>

                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>

            </table>
          </div>
        )}

        {/* RESPONSIBLE MEDICINE DISPOSAL */}
        <div className="disposal-card">
          <h3>♻ Responsible medicine disposal</h3>

          <p>
            Expired or unwanted medicines should not be casually
            discarded or flushed down the drain.
          </p>

          <ul>
            <li>
              Check with an authorised medicine take-back facility.
            </li>

            <li>
              Ask a pharmacist about safe disposal options.
            </li>

            <li>
              Follow your local municipal biomedical waste guidance.
            </li>

            <li>
              Keep expired medicines away from children and pets.
            </li>
          </ul>
        </div>

        {/* REFILL MEDICINE MODAL */}
        {refillingMedicine && (
          <div className="edit-overlay">

            <div className="edit-modal">

              <h2>Refill Medicine</h2>

              <p style={{ color: "#777F7B", marginBottom: "15px" }}>
                {refillingMedicine.medicineName}
              </p>

              <div
                style={{
                  background: "#F2F7F3",
                  padding: "14px",
                  borderRadius: "9px",
                  marginBottom: "18px",
                }}
              >
                <p>Current stock</p>

                <h2 style={{ color: "#26734D" }}>
                  {refillingMedicine.quantity}{" "}
                  {refillingMedicine.unit}
                </h2>
              </div>

              <form onSubmit={handleRefill}>

                <div className="form-group">

                  <label>Quantity to add</label>

                  <input
                    type="number"
                    min="0.01"
                    step="any"
                    placeholder="Enter purchased quantity"
                    value={refillQuantity}
                    onChange={(e) => setRefillQuantity(e.target.value)}
                    required
                  />

                </div>

                <div className="form-group">

                  <label>Total amount paid (₹)</label>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Enter total purchase amount"
                    value={refillAmountPaid}
                    onChange={(e) => setRefillAmountPaid(e.target.value)}
                    required
                  />

                </div>

                {/* PURCHASE COST PREVIEW */}
                {calculatedUnitCost !== null && (
                  <div
                    style={{
                      background: "#EAF0F8",
                      padding: "12px",
                      borderRadius: "8px",
                      marginBottom: "15px",
                    }}
                  >
                    <p style={{ marginBottom: "8px" }}>
                      Purchase summary
                    </p>

                    <p>
                      Updated stock:{" "}
                      <strong>
                        {Number(refillingMedicine.quantity) +
                          Number(refillQuantity)}{" "}
                        {refillingMedicine.unit}
                      </strong>
                    </p>

                    <p>
                      Total amount:{" "}
                      <strong>
                        ₹{Number(refillAmountPaid).toFixed(2)}
                      </strong>
                    </p>

                    <p>
                      Cost per unit:{" "}
                      <strong>
                        ₹{calculatedUnitCost.toFixed(2)}
                      </strong>
                    </p>
                  </div>
                )}

                <div className="form-actions">

                  <button
                    type="button"
                    className="cancel-button"
                    onClick={handleCloseRefill}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="primary-button"
                  >
                    Confirm Refill
                  </button>

                </div>

              </form>

            </div>
          </div>
        )}

        {/* REFILL HISTORY MODAL */}
        {viewingHistoryMedicine && (
          <div className="edit-overlay">

            <div
              className="edit-modal"
              style={{
                maxWidth: "750px",
                maxHeight: "85vh",
                overflowY: "auto",
              }}
            >

              <h2>Refill History</h2>

              <p style={{ color: "#777F7B", marginBottom: "18px" }}>
                {viewingHistoryMedicine.medicineName}
              </p>

              <div
                style={{
                  background: "#F2F7F3",
                  padding: "14px",
                  borderRadius: "9px",
                  marginBottom: "18px",
                }}
              >
                <span>Current stock</span>

                <h2 style={{ color: "#26734D" }}>
                  {viewingHistoryMedicine.quantity}{" "}
                  {viewingHistoryMedicine.unit}
                </h2>
              </div>

              {viewingHistoryMedicine.refillHistory &&
              viewingHistoryMedicine.refillHistory.length > 0 ? (

                <div style={{ overflowX: "auto" }}>

                  <table
                    style={{
                      width: "100%",
                      borderCollapse: "collapse",
                      textAlign: "left",
                      fontSize: "13px",
                    }}
                  >

                    <thead>
                      <tr style={{ background: "#F3F5F2" }}>
                        <th style={{ padding: "12px" }}>Date</th>
                        <th style={{ padding: "12px" }}>Previous</th>
                        <th style={{ padding: "12px" }}>Added</th>
                        <th style={{ padding: "12px" }}>New stock</th>
                        <th style={{ padding: "12px" }}>Amount paid</th>
                        <th style={{ padding: "12px" }}>Cost / unit</th>
                      </tr>
                    </thead>

                    <tbody>
                      {[...viewingHistoryMedicine.refillHistory]
                        .reverse()
                        .map((record, index) => {
                          const amountPaid = Number(record.amountPaid || 0);
                          const quantityAdded = Number(record.quantityAdded || 0);

                          const unitCost =
                            quantityAdded > 0
                              ? amountPaid / quantityAdded
                              : 0;

                          return (
                            <tr key={record._id || index}>

                              <td style={{ padding: "12px" }}>
                                {record.refillDate
                                  ? new Date(
                                      record.refillDate
                                    ).toLocaleDateString("en-IN")
                                  : "—"}
                              </td>

                              <td style={{ padding: "12px" }}>
                                {record.previousQuantity}{" "}
                                {viewingHistoryMedicine.unit}
                              </td>

                              <td
                                style={{
                                  padding: "12px",
                                  color: "#26734D",
                                  fontWeight: 700,
                                }}
                              >
                                +{record.quantityAdded}{" "}
                                {viewingHistoryMedicine.unit}
                              </td>

                              <td style={{ padding: "12px" }}>
                                {record.newQuantity}{" "}
                                {viewingHistoryMedicine.unit}
                              </td>

                              <td style={{ padding: "12px" }}>
                                ₹{amountPaid.toFixed(2)}
                              </td>

                              <td style={{ padding: "12px" }}>
                                ₹{unitCost.toFixed(2)}
                              </td>

                            </tr>
                          );
                        })}
                    </tbody>

                  </table>

                </div>

              ) : (
                <div
                  style={{
                    textAlign: "center",
                    padding: "30px 10px",
                    color: "#777F7B",
                  }}
                >
                  <h3>No refill history yet</h3>
                  <p>Refill records will appear here after replenishment.</p>
                </div>
              )}

              <div className="form-actions">

                <button
                  type="button"
                  className="cancel-button"
                  onClick={() => setViewingHistoryMedicine(null)}
                >
                  Close
                </button>

              </div>

            </div>
          </div>
        )}

        {/* EDIT MEDICINE MODAL */}
        {editingMedicine && (
          <div className="edit-overlay">

            <div className="edit-modal">

              <h2>Edit Medicine</h2>

              <form onSubmit={handleUpdate}>

                {[
                  ["medicineName", "Medicine name"],
                  ["quantity", "Quantity"],
                  ["unit", "Unit"],
                  ["batchNumber", "Batch number"],
                  ["purchaseDate", "Purchase date"],
                  ["expiryDate", "Expiry date"],
                  ["price", "Price"],
                  ["storageLocation", "Storage location"],
                ].map(([name, label]) => (

                  <div className="form-group" key={name}>

                    <label>{label}</label>

                    <input
                      type={
                        name.includes("Date")
                          ? "date"
                          : name === "quantity" || name === "price"
                          ? "number"
                          : "text"
                      }
                      name={name}
                      value={editData[name]}
                      onChange={(e) =>
                        setEditData({
                          ...editData,
                          [name]: e.target.value,
                        })
                      }
                      min={
                        name === "quantity" || name === "price"
                          ? "0"
                          : undefined
                      }
                      required
                    />

                  </div>
                ))}

                {/* MODAL BUTTONS */}
                <div className="form-actions">

                  <button
                    type="button"
                    className="cancel-button"
                    onClick={() => setEditingMedicine(null)}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="primary-button"
                  >
                    Save changes
                  </button>

                </div>

              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default Medicines;
