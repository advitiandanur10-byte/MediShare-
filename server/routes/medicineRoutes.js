
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


// 1. ADD MEDICINE AND RECORD INITIAL PURCHASE EXPENSE
router.post("/", async (req, res) => {
    try {
        const initialPurchaseAmount = Number(
            req.body.initialPurchaseAmount
        );

        if (
            req.body.initialPurchaseAmount === undefined ||
            req.body.initialPurchaseAmount === null ||
            req.body.initialPurchaseAmount === "" ||
            !Number.isFinite(initialPurchaseAmount) ||
            initialPurchaseAmount < 0
        ) {
            return res.status(400).json({
                message: "Please enter a valid initial purchase amount."
            });
        }

        const medicine = new Medicine({
            ...req.body,
            initialPurchaseAmount
        });

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


// 2. VIEW ALL MEDICINES
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


// 3. PRIORITY INVENTORY
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
            } else if (daysLeft === 0) {
                categorizedMedicines.expiringToday.push(medicineData);
            } else if (daysLeft <= 7) {
                categorizedMedicines.expiringIn7Days.push(medicineData);
            } else if (daysLeft <= 15) {
                categorizedMedicines.expiringIn15Days.push(medicineData);
            } else if (daysLeft <= 30) {
                categorizedMedicines.expiringIn30Days.push(medicineData);
            } else {
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


// 4. REFILL MEDICINE AND RECORD PURCHASE EXPENSE
router.post("/:id/refill", async (req, res) => {
    try {
        const quantityAdded = Number(req.body.quantityAdded);
        const amountPaid = Number(req.body.amountPaid);

        if (
            !Number.isFinite(quantityAdded) ||
            quantityAdded <= 0
        ) {
            return res.status(400).json({
                message: "Refill quantity must be greater than zero."
            });
        }

        if (
            req.body.amountPaid === undefined ||
            req.body.amountPaid === null ||
            req.body.amountPaid === "" ||
            !Number.isFinite(amountPaid) ||
            amountPaid < 0
        ) {
            return res.status(400).json({
                message: "Please enter a valid purchase amount."
            });
        }

        const medicine = await Medicine.findById(req.params.id);

        if (!medicine) {
            return res.status(404).json({
                message: "Medicine not found."
            });
        }

        const previousQuantity = medicine.quantity;
        const newQuantity = previousQuantity + quantityAdded;

        medicine.quantity = newQuantity;

        medicine.refillHistory.push({
            quantityAdded,
            previousQuantity,
            newQuantity,
            amountPaid,
            refillDate: new Date()
        });

        await medicine.save();

        res.status(200).json({
            message: "Medicine refilled and purchase expense recorded successfully!",
            medicine
        });

    } catch (error) {
        res.status(400).json({
            message: error.message
        });
    }
});


// 5. VIEW MEDICINE BY ID
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


// 6. UPDATE MEDICINE
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
            medicine
        });

    } catch (error) {
        res.status(400).json({
            message: error.message
        });
    }
});


// 7. DELETE MEDICINE
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
