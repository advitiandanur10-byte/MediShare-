
const API_URL = "https://medishare-zp75.onrender.com/api/family";

// Get all family members
export const getFamilyMembers = async () => {
    const response = await fetch(API_URL);

    if (!response.ok) {
        throw new Error("Unable to load family members.");
    }

    return await response.json();
};

// Add a family member
export const addFamilyMember = async (memberData) => {
    const response = await fetch(API_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(memberData)
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || "Unable to add family member.");
    }

    return data;
};

// Update a family member
export const updateFamilyMember = async (id, memberData) => {
    const response = await fetch(`${API_URL}/${id}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(memberData)
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || "Unable to update family member.");
    }

    return data;
};

// Delete a family member
export const deleteFamilyMember = async (id) => {
    const response = await fetch(`${API_URL}/${id}`, {
        method: "DELETE"
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || "Unable to delete family member.");
    }

    return data;
};
