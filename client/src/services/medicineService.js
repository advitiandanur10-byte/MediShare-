
const API_URL = "https://medishare-zp75.onrender.com/api/medicines";

// Get medicines grouped by expiry priority
export const getPriorityMedicines = async () => {
  const response = await fetch(`${API_URL}/priority`);

  if (!response.ok) {
    throw new Error("Unable to load priority medicines.");
  }

  return await response.json();
};

// Get all medicines
export const getAllMedicines = async () => {
  const response = await fetch(API_URL);

  if (!response.ok) {
    throw new Error("Unable to load medicines.");
  }

  return await response.json();
};

// Add a new medicine
export const addMedicine = async (medicineData) => {
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

  return data;
};

// Update an existing medicine
export const updateMedicine = async (id, medicineData) => {
  const response = await fetch(`${API_URL}/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(medicineData),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Unable to update medicine.");
  }

  return data;
};

// Delete a medicine
export const deleteMedicine = async (id) => {
  const response = await fetch(`${API_URL}/${id}`, {
    method: "DELETE",
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Unable to delete medicine.");
  }

  return data;
};

// Refill medicine and record total purchase amount
export const refillMedicine = async (id, quantityAdded, amountPaid) => {
  const response = await fetch(`${API_URL}/${id}/refill`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      quantityAdded: Number(quantityAdded),
      amountPaid: Number(amountPaid),
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Unable to refill medicine.");
  }

  return data;
};
