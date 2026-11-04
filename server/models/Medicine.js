
const mongoose = require("mongoose");

const medicineSchema = new mongoose.Schema({

    medicineName: {
        type: String,
        required: true,
        trim: true
    },

    quantity: {
        type: Number,
        required: true,
        min: 0
    },

    unit: {
        type: String,
        required: true
    },

    batchNumber: {
        type: String,
        required: true,
        trim: true
    },

    purchaseDate: {
        type: Date,
        required: true
    },

    expiryDate: {
        type: Date,
        required: true
    },

    price: {
        type: Number,
        required: true,
        min: 0
    },

    storageLocation: {
        type: String,
        required: true
    }

}, { timestamps: true });

module.exports = mongoose.model("Medicine", medicineSchema);
