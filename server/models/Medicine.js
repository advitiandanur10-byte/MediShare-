
const mongoose = require("mongoose");

// REFILL HISTORY SCHEMA
const refillSchema = new mongoose.Schema(
  {
    quantityAdded: {
      type: Number,
      required: true,
      min: 0.01
    },

    previousQuantity: {
      type: Number,
      required: true,
      min: 0
    },

    newQuantity: {
      type: Number,
      required: true,
      min: 0
    },

    amountPaid: {
      type: Number,
      min: 0,
      default: 0
    },

    refillDate: {
      type: Date,
      default: Date.now
    }
  },
  { _id: true }
);

// MEDICINE SCHEMA
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

  // INITIAL PURCHASE EXPENDITURE
  initialPurchaseAmount: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },

  storageLocation: {
    type: String,
    required: true
  },

  // FAMILY MEMBER ASSIGNED TO THIS MEDICINE
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Family",
    default: null
  },

  // REFILL HISTORY
  refillHistory: {
    type: [refillSchema],
    default: []
  }

}, { timestamps: true });

module.exports = mongoose.model("Medicine", medicineSchema);
