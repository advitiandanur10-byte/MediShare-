
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getFamilyMembers } from "../services/familyService";

const API_URL = "https://medishare-zp75.onrender.com/api/medicines";

function AddMedicine() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    medicineName: "",
    quantity: "",
    unit: "",
    batchNumber: "",
    purchaseDate: "",
    expiryDate: "",
    price: "",
    initialPurchaseAmount: "",
    storageLocation: "",
    assignedTo: "",
  });

  const [familyMembers, setFamilyMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const data = await getFamilyMembers();
        setFamilyMembers(Array.isArray(data) ? data : []);
      } catch (err) {
        setError("Unable to load family members: " + err.message);
      } finally {
        setLoadingMembers(false);
      }
    };

    fetchMembers();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage("");
    setError("");

    if (
      new Date(formData.expiryDate) <=
      new Date(formData.purchaseDate)
    ) {
      setError("Expiry date must be after purchase date.");
      return;
    }

    if (
      Number(formData.quantity) <= 0 ||
      Number(formData.price) < 0 ||
      Number(formData.initialPurchaseAmount) < 0
    ) {
      setError("Enter valid quantity and purchase amounts.");
      return;
    }

    try {
      setLoading(true);

      const medicineData = {
        ...formData,
        quantity: Number(formData.quantity),
        price: Number(formData.price),
        initialPurchaseAmount: Number(formData.initialPurchaseAmount),
        purchaseDate: new Date(formData.purchaseDate),
        expiryDate: new Date(formData.expiryDate),
        assignedTo: formData.assignedTo || null,
      };

      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(medicineData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to add medicine.");
      }

      setMessage("Medicine added successfully!");

      setTimeout(() => {
        navigate("/medicines");
      }, 1200);

    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-content">
      <div className="add-medicine-container">

        <div className="add-medicine-heading">
          <p className="eyebrow">HOUSEHOLD INVENTORY</p>
          <h1>Add Medicine</h1>
          <p>
            Enter your medicine details to keep your household
            inventory organised.
          </p>
        </div>

        {message && (
          <div className="success-message">{message}</div>
        )}

        {error && (
          <div className="error-banner">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="medicine-form">

          <div className="form-section">
            <h3>Medicine information</h3>

            <div className="form-group">
              <label>Medicine name *</label>
              <input
                type="text"
                name="medicineName"
                value={formData.medicineName}
                onChange={handleChange}
                placeholder="e.g. Paracetamol"
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Quantity *</label>
                <input
                  type="number"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleChange}
                  min="1"
                  placeholder="e.g. 10"
                  required
                />
              </div>

              <div className="form-group">
                <label>Unit *</label>
                <select
                  name="unit"
                  value={formData.unit}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select unit</option>
                  <option value="Tablets">Tablets</option>
                  <option value="Capsules">Capsules</option>
                  <option value="Bottles">Bottles</option>
                  <option value="Strips">Strips</option>
                  <option value="Syrup">Syrup</option>
                  <option value="Tubes">Tubes</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Batch number *</label>
              <input
                type="text"
                name="batchNumber"
                value={formData.batchNumber}
                onChange={handleChange}
                placeholder="Enter batch number"
                required
              />
            </div>
          </div>

          <div className="form-section">
            <h3>Purchase and expiry details</h3>

            <div className="form-row">
              <div className="form-group">
                <label>Purchase date *</label>
                <input
                  type="date"
                  name="purchaseDate"
                  value={formData.purchaseDate}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Expiry date *</label>
                <input
                  type="date"
                  name="expiryDate"
                  value={formData.expiryDate}
                  onChange={handleChange}
                  min={formData.purchaseDate || undefined}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Price (₹) *</label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                min="0"
                step="0.01"
                placeholder="Enter price"
                required
              />
            </div>

            <div className="form-group">
              <label>Initial purchase amount (₹) *</label>
              <input
                type="number"
                name="initialPurchaseAmount"
                value={formData.initialPurchaseAmount}
                onChange={handleChange}
                min="0"
                step="0.01"
                placeholder="Total amount paid for this purchase"
                required
              />
              <small style={{ color: "#777F7B" }}>
                Enter the total amount paid for the quantity purchased.
              </small>
            </div>
          </div>

          <div className="form-section">
            <h3>Storage information</h3>

            <div className="form-group">
              <label>Storage location *</label>
              <input
                type="text"
                name="storageLocation"
                value={formData.storageLocation}
                onChange={handleChange}
                placeholder="e.g. Medicine cabinet"
                required
              />
            </div>
          </div>

          <div className="form-section">
            <h3>Family assignment</h3>

            <div className="form-group">
              <label>Assign medicine to</label>

              <select
                name="assignedTo"
                value={formData.assignedTo}
                onChange={handleChange}
                disabled={loadingMembers}
              >
                <option value="">Unassigned / Shared household</option>

                {familyMembers.map((member) => (
                  <option key={member._id} value={member._id}>
                    {member.name} ({member.relation})
                  </option>
                ))}
              </select>

              <small style={{ color: "#777F7B" }}>
                Choose the family member who uses this medicine.
                You can leave it unassigned if it is shared.
              </small>
            </div>

            {loadingMembers && (
              <p>Loading family members...</p>
            )}
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="cancel-button"
              onClick={() => navigate("/")}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="primary-button"
              disabled={loading || loadingMembers}
            >
              {loading ? "Saving..." : "Save Medicine"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}

export default AddMedicine;
