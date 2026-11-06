
import { useEffect, useMemo, useState } from "react";
import {
  getAllMedicines,
  updateMedicine,
} from "../services/medicineService";

function SmartStorage() {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [editingId, setEditingId] = useState(null);
  const [newLocation, setNewLocation] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const loadMedicines = async () => {
    try {
      setLoading(true);
      const data = await getAllMedicines();
      setMedicines(data);
    } catch (error) {
      setMessage(error.message || "Unable to load medicines.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMedicines();
  }, []);

  const storedCount = medicines.filter(
    (medicine) => medicine.storageLocation?.trim()
  ).length;

  const missingCount = medicines.length - storedCount;

  const filteredMedicines = useMemo(() => {
    return medicines.filter((medicine) => {
      const matchesSearch =
        medicine.medicineName?.toLowerCase().includes(search.toLowerCase()) ||
        medicine.batchNumber?.toLowerCase().includes(search.toLowerCase());

      const hasLocation = Boolean(medicine.storageLocation?.trim());

      const matchesFilter =
        filter === "all" ||
        (filter === "stored" && hasLocation) ||
        (filter === "missing" && !hasLocation);

      return matchesSearch && matchesFilter;
    });
  }, [medicines, search, filter]);

  const startEditing = (medicine) => {
    setEditingId(medicine._id);
    setNewLocation(medicine.storageLocation || "");
    setMessage("");
  };

  const saveLocation = async (medicine) => {
    if (!newLocation.trim()) {
      setMessage("Please enter a storage location.");
      return;
    }

    try {
      setSaving(true);
      setMessage("");

      const updatedMedicine = await updateMedicine(medicine._id, {
        ...medicine,
        storageLocation: newLocation.trim(),
      });

      setMedicines((previous) =>
        previous.map((item) =>
          item._id === medicine._id
            ? { ...item, ...updatedMedicine, storageLocation: newLocation.trim() }
            : item
        )
      );

      setEditingId(null);
      setNewLocation("");
      setMessage("Storage location updated successfully.");
    } catch (error) {
      setMessage(error.message || "Unable to update storage location.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-container">
      <h1>Smart Storage Guidance</h1>
      <p>
        Manage medicine storage locations and follow safe storage practices.
      </p>

      {message && <p>{message}</p>}

      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Medicines</h3>
          <h2>{medicines.length}</h2>
        </div>

        <div className="stat-card">
          <h3>Locations Recorded</h3>
          <h2>{storedCount}</h2>
        </div>

        <div className="stat-card">
          <h3>Missing Locations</h3>
          <h2>{missingCount}</h2>
        </div>
      </div>

      <section className="storage-guidelines">
        <h2>Storage Safety Checklist</h2>

        <ul>
          <li>Store medicines according to the temperature on the label.</li>
          <li>Keep medicines away from direct sunlight and excess heat.</li>
          <li>Avoid damp places such as bathrooms.</li>
          <li>Keep medicines out of reach of children and pets.</li>
          <li>Keep medicines in their original packaging when possible.</li>
          <li>Check expiry dates and packaging regularly.</li>
        </ul>
      </section>

      <section className="medicine-storage-section">
        <h2>Medicine Storage Inventory</h2>

        <input
          type="text"
          placeholder="Search medicine or batch number..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />

        <select
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
        >
          <option value="all">All Medicines</option>
          <option value="stored">Location Recorded</option>
          <option value="missing">Location Missing</option>
        </select>

        {loading ? (
          <p>Loading medicines...</p>
        ) : filteredMedicines.length === 0 ? (
          <p>No medicines found.</p>
        ) : (
          <div className="medicine-storage-list">
            {filteredMedicines.map((medicine) => (
              <div className="medicine-storage-card" key={medicine._id}>
                <h3>{medicine.medicineName}</h3>

                <p>Batch Number: {medicine.batchNumber}</p>
                <p>Quantity: {medicine.quantity} {medicine.unit}</p>
                <p>
                  Expiry Date:{" "}
                  {new Date(medicine.expiryDate).toLocaleDateString()}
                </p>

                {editingId === medicine._id ? (
                  <div>
                    <input
                      type="text"
                      placeholder="Enter storage location"
                      value={newLocation}
                      onChange={(event) =>
                        setNewLocation(event.target.value)
                      }
                    />

                    <button
                      onClick={() => saveLocation(medicine)}
                      disabled={saving}
                    >
                      {saving ? "Saving..." : "Save Location"}
                    </button>

                    <button
                      onClick={() => {
                        setEditingId(null);
                        setNewLocation("");
                      }}
                      disabled={saving}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div>
                    <p>
                      <strong>Storage Location:</strong>{" "}
                      {medicine.storageLocation?.trim()
                        ? medicine.storageLocation
                        : "Not recorded"}
                    </p>

                    <button onClick={() => startEditing(medicine)}>
                      {medicine.storageLocation?.trim()
                        ? "Edit Location"
                        : "Add Location"}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <p>
        <strong>Important:</strong> Follow the medicine label or pharmacist's
        instructions for specific storage requirements. This page does not
        automatically determine medicine-specific temperature requirements.
      </p>
    </div>
  );
}

export default SmartStorage;

