
const express = require("express");
const router = express.Router();
const Medicine = require("../models/Medicine");

// Calculate medicine expiry information
const getExpiryInfo = (expiryDate) => {
    const today = new Date();

    const todayUTC = Date.UTC(
        today.getFullYear(),
        today.getMonth(),
        today.getDate()
    );

    const expiryUTC = Date.UTC(
        expiryDate.getUTCFullYear(),
        expiryDate.getUTCMonth(),
        expiryDate.getUTCDate()
    );

    const daysLeft = Math.round(
        (expiryUTC - todayUTC) / (1000 * 60 * 60 * 24)
    );

    let expiryStatus;

    if (daysLeft < 0) {
        expiryStatus = "Expired";
    } else if (daysLeft === 0) {
        expiryStatus = "Expires today";
    } else {
        expiryStatus = `Expiring in ${daysLeft} days`;
    }

    return { daysLeft, expiryStatus };
};


// 1. ADD MEDICINE (CREATE)
router.post("/", async (req, res) => {
    try {
        const medicine = new Medicine(req.body);

        const savedMedicine = await medicine.save();

        res.status(201).json({
            message: "Medicine added successfully!",
            medicine: savedMedicine
        });

    } catch (error) {
        res.status(400).json({
            message: error.message
        });
    }
});


// 2. VIEW ALL MEDICINES (READ)
router.get("/", async (req, res) => {
    try {
        const medicines = await Medicine.find();

        const updatedMedicines = medicines.map((medicine) => ({
            ...medicine.toObject(),
            ...getExpiryInfo(medicine.expiryDate)
        }));

        res.status(200).json(updatedMedicines);

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
});

// PRIORITY INVENTORY
router.get("/priority", async (req, res) => {
    try {
        const medicines = await Medicine.find();

        const categorizedMedicines = {
            expired: [],
            expiringToday: [],
            expiringIn7Days: [],
            expiringIn15Days: [],
            expiringIn30Days: [],
            safeMedicines: []
        };

        medicines.forEach((medicine) => {
            const { daysLeft, expiryStatus } =
                getExpiryInfo(medicine.expiryDate);

            const medicineData = {
                ...medicine.toObject(),
                daysLeft,
                expiryStatus
            };

            if (daysLeft < 0) {
                categorizedMedicines.expired.push(medicineData);
            }
            else if (daysLeft === 0) {
                categorizedMedicines.expiringToday.push(medicineData);
            }
            else if (daysLeft <= 7) {
                categorizedMedicines.expiringIn7Days.push(medicineData);
            }
            else if (daysLeft <= 15) {
                categorizedMedicines.expiringIn15Days.push(medicineData);
            }
            else if (daysLeft <= 30) {
                categorizedMedicines.expiringIn30Days.push(medicineData);
            }
            else {
                categorizedMedicines.safeMedicines.push(medicineData);
            }
        });

        res.status(200).json(categorizedMedicines);

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
});


// 3. VIEW MEDICINE BY ID (READ)
router.get("/:id", async (req, res) => {
    try {
        const medicine = await Medicine.findById(req.params.id);

        if (!medicine) {
            return res.status(404).json({
                message: "Medicine not found"
            });
        }

        const updatedMedicine = {
            ...medicine.toObject(),
            ...getExpiryInfo(medicine.expiryDate)
        };

        res.status(200).json(updatedMedicine);

    } catch (error) {
        res.status(400).json({
            message: error.message
        });
    }
});


// 4. UPDATE MEDICINE (UPDATE)
router.put("/:id", async (req, res) => {
    try {
        const medicine = await Medicine.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true
            }
        );

        if (!medicine) {
            return res.status(404).json({
                message: "Medicine not found"
            });
        }

        res.status(200).json({
            message: "Medicine updated successfully!",
            medicine: medicine
        });

    } catch (error) {
        res.status(400).json({
            message: error.message
        });
    }
});


// 5. DELETE MEDICINE (DELETE)
router.delete("/:id", async (req, res) => {
    try {
        const medicine = await Medicine.findByIdAndDelete(
            req.params.id
        );

        if (!medicine) {
            return res.status(404).json({
                message: "Medicine not found"
            });
        }

        res.status(200).json({
            message: "Medicine deleted successfully!"
        });

    } catch (error) {
        res.status(400).json({
            message: error.message
        });
    }
});


module.exports = router;
