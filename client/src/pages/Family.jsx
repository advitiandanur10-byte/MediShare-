
import { useEffect, useState } from "react";

import {
  getFamilyMembers,
  addFamilyMember,
  updateFamilyMember,
  deleteFamilyMember,
} from "../services/familyService";

function Family() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);

  const emptyForm = {
    name: "",
    relation: "",
    age: "",
    email: "",
  };

  const [formData, setFormData] = useState(emptyForm);

  // Load family members from MongoDB
  const fetchMembers = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getFamilyMembers();

      setMembers(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Unable to load family members.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  // Handle form input
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // Reset form
  const resetForm = () => {
    setFormData(emptyForm);
    setEditingId(null);
    setShowForm(false);
  };

  // Add or update member
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const memberData = {
        name: formData.name.trim(),
        relation: formData.relation,
        age: Number(formData.age),
        email: formData.email.trim(),
      };

      if (editingId) {
        await updateFamilyMember(editingId, memberData);
        setSuccess("Family member updated successfully!");
      } else {
        await addFamilyMember(memberData);
        setSuccess("Family member added successfully!");
      }

      resetForm();
      await fetchMembers();
    } catch (err) {
      setError(err.message || "Unable to save family member.");
    } finally {
      setSaving(false);
    }
  };

  // Open edit form
  const handleEdit = (member) => {
    setFormData({
      name: member.name || "",
      relation: member.relation || "",
      age: member.age ?? "",
      email: member.email || "",
    });

    setEditingId(member._id);
    setShowForm(true);
    setError("");
    setSuccess("");
  };

  // Delete member
  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to remove this family member?"
    );

    if (!confirmed) return;

    try {
      setError("");
      setSuccess("");

      await deleteFamilyMember(id);

      setSuccess("Family member removed successfully!");
      await fetchMembers();
    } catch (err) {
      setError(err.message || "Unable to delete family member.");
    }
  };

  // Open add form
  const handleAdd = () => {
    setFormData(emptyForm);
    setEditingId(null);
    setShowForm(true);
    setError("");
    setSuccess("");
  };

  return (
    <div className="page-content">
      {/* Heading */}
      <div style={styles.heading}>
        <div>
          <p style={styles.eyebrow}>HOUSEHOLD MANAGEMENT</p>

          <h1 style={styles.title}>Family Management</h1>

          <p style={styles.subtitle}>
            Manage your household members and their medicine needs.
          </p>
        </div>

        <button
          style={styles.primaryButton}
          onClick={handleAdd}
        >
          + Add family member
        </button>
      </div>

      {/* Messages */}
      {error && (
        <div style={styles.errorMessage}>
          {error}
          <button
            onClick={() => setError("")}
            style={styles.closeMessage}
          >
            ×
          </button>
        </div>
      )}

      {success && (
        <div style={styles.successMessage}>
          {success}
          <button
            onClick={() => setSuccess("")}
            style={styles.closeMessage}
          >
            ×
          </button>
        </div>
      )}

      {/* Summary cards */}
      <div style={styles.summary}>
        <div style={styles.summaryCard}>
          <p>Total family members</p>
          <h2>{members.length}</h2>
        </div>

        <div style={styles.summaryCard}>
          <p>Medicine profiles</p>
          <h2>{members.length}</h2>
        </div>

        <div style={styles.summaryCard}>
          <p>Shared household</p>
          <h2>Active</h2>
        </div>
      </div>

      {/* Add / Edit form */}
      {showForm && (
        <div style={styles.formCard}>
          <h2>
            {editingId ? "Edit member" : "Add family member"}
          </h2>

          <form onSubmit={handleSubmit}>
            <div style={styles.formGrid}>
              <input
                name="name"
                placeholder="Full name"
                value={formData.name}
                onChange={handleChange}
                required
                style={styles.input}
              />

              <select
                name="relation"
                value={formData.relation}
                onChange={handleChange}
                required
                style={styles.input}
              >
                <option value="">Select relationship</option>
                <option value="Self">Self</option>
                <option value="Parent">Parent</option>
                <option value="Child">Child</option>
                <option value="Sibling">Sibling</option>
                <option value="Grandparent">Grandparent</option>
                <option value="Spouse">Spouse</option>
                <option value="Other">Other</option>
              </select>

              <input
                type="number"
                name="age"
                placeholder="Age"
                min="0"
                value={formData.age}
                onChange={handleChange}
                required
                style={styles.input}
              />

              <input
                type="email"
                name="email"
                placeholder="Email address (optional)"
                value={formData.email}
                onChange={handleChange}
                style={styles.input}
              />
            </div>

            <div style={styles.formActions}>
              <button
                type="button"
                style={styles.cancelButton}
                onClick={resetForm}
                disabled={saving}
              >
                Cancel
              </button>

              <button
                type="submit"
                style={styles.primaryButton}
                disabled={saving}
              >
                {saving
                  ? "Saving..."
                  : editingId
                  ? "Save changes"
                  : "Add member"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Household members */}
      <div style={styles.section}>
        <div style={styles.sectionHeading}>
          <div>
            <h2>Your household</h2>

            <p style={styles.subtitle}>
              Family members registered in your MediShare household.
            </p>
          </div>

          <button
            style={styles.refreshButton}
            onClick={fetchMembers}
            disabled={loading}
          >
            ↻ Refresh
          </button>
        </div>

        {loading ? (
          <div style={styles.empty}>
            Loading family members...
          </div>
        ) : members.length === 0 ? (
          <div style={styles.empty}>
            <div style={styles.emptyIcon}>♧</div>

            <h3>No family members added yet</h3>

            <p>
              Add your family members to organise household
              medicine information in one place.
            </p>

            <button
              style={styles.primaryButton}
              onClick={handleAdd}
            >
              + Add your first member
            </button>
          </div>
        ) : (
          <div style={styles.memberGrid}>
            {members.map((member) => (
              <div style={styles.memberCard} key={member._id}>
                <div style={styles.memberTop}>
                  <div style={styles.avatar}>
                    {member.name.charAt(0).toUpperCase()}
                  </div>

                  <div>
                    <h3>{member.name}</h3>
                    <p>{member.relation}</p>
                  </div>
                </div>

                <div style={styles.memberDetails}>
                  <p>Age: {member.age}</p>

                  <p>
                    Email: {member.email || "Not provided"}
                  </p>
                </div>

                <div style={styles.memberActions}>
                  <button
                    style={styles.editButton}
                    onClick={() => handleEdit(member)}
                  >
                    Edit
                  </button>

                  <button
                    style={styles.deleteButton}
                    onClick={() => handleDelete(member._id)}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  heading: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "20px",
    flexWrap: "wrap",
    marginBottom: "30px",
  },

  eyebrow: {
    color: "#63977A",
    fontSize: "12px",
    fontWeight: "700",
    letterSpacing: "2px",
  },

  title: {
    fontSize: "30px",
    color: "#242B29",
    margin: "10px 0",
  },

  subtitle: {
    color: "#777F7B",
    marginTop: "8px",
  },

  primaryButton: {
    background: "#073F3D",
    color: "white",
    border: "none",
    padding: "13px 20px",
    borderRadius: "9px",
    cursor: "pointer",
    fontWeight: "600",
  },

  summary: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "18px",
    marginBottom: "30px",
  },

  summaryCard: {
    background: "white",
    padding: "22px",
    border: "1px solid #E6E8E3",
    borderRadius: "13px",
  },

  formCard: {
    background: "white",
    padding: "25px",
    borderRadius: "13px",
    border: "1px solid #E6E8E3",
    marginBottom: "30px",
  },

  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "15px",
    marginTop: "20px",
  },

  input: {
    padding: "12px",
    border: "1px solid #D9DED9",
    borderRadius: "8px",
    fontSize: "15px",
    width: "100%",
    boxSizing: "border-box",
  },

  formActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "12px",
    marginTop: "20px",
  },

  cancelButton: {
    background: "#F1F2EF",
    border: "none",
    padding: "12px 18px",
    borderRadius: "8px",
    cursor: "pointer",
  },

  section: {
    background: "white",
    padding: "25px",
    borderRadius: "13px",
    border: "1px solid #E6E8E3",
  },

  sectionHeading: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "15px",
    flexWrap: "wrap",
  },

  refreshButton: {
    background: "#F1F2EF",
    border: "1px solid #E6E8E3",
    padding: "10px 15px",
    borderRadius: "8px",
    cursor: "pointer",
  },

  empty: {
    textAlign: "center",
    padding: "55px 20px",
    color: "#777F7B",
  },

  emptyIcon: {
    fontSize: "42px",
    color: "#63977A",
    marginBottom: "15px",
  },

  memberGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
    gap: "18px",
    marginTop: "25px",
  },

  memberCard: {
    border: "1px solid #E6E8E3",
    borderRadius: "12px",
    padding: "20px",
  },

  memberTop: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
  },

  avatar: {
    width: "45px",
    height: "45px",
    borderRadius: "50%",
    background: "#DCEAE5",
    color: "#073F3D",
    display: "grid",
    placeItems: "center",
    fontWeight: "700",
    fontSize: "20px",
  },

  memberDetails: {
    margin: "20px 0",
    color: "#777F7B",
    lineHeight: "1.8",
    overflowWrap: "anywhere",
  },

  memberActions: {
    display: "flex",
    gap: "10px",
  },

  editButton: {
    background: "#DCEAE5",
    color: "#073F3D",
    border: "none",
    padding: "9px 15px",
    borderRadius: "7px",
    cursor: "pointer",
  },

  deleteButton: {
    background: "#FCEBE9",
    color: "#C96B65",
    border: "none",
    padding: "9px 15px",
    borderRadius: "7px",
    cursor: "pointer",
  },

  errorMessage: {
    background: "#FCEBE9",
    color: "#A94442",
    padding: "13px 16px",
    borderRadius: "8px",
    marginBottom: "18px",
    display: "flex",
    justifyContent: "space-between",
  },

  successMessage: {
    background: "#E5F2E9",
    color: "#39734F",
    padding: "13px 16px",
    borderRadius: "8px",
    marginBottom: "18px",
    display: "flex",
    justifyContent: "space-between",
  },

  closeMessage: {
    background: "transparent",
    border: "none",
    cursor: "pointer",
    fontSize: "18px",
  },
};

export default Family;

