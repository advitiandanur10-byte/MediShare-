
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const medicineRoutes = require("./routes/medicineRoutes");
const familyRoutes = require("./routes/familyRoutes");
const aiMedicineRoutes = require("./routes/aiMedicineRoutes");

const app = express();

app.use(cors());

// Allow medicine images to be sent as Base64 JSON.
app.use(express.json({ limit: "12mb" }));

// Medicine APIs
app.use("/api/medicines", medicineRoutes);

// Family APIs
app.use("/api/family", familyRoutes);

// AI Medicine Scanner API
app.use("/api/ai-medicine", aiMedicineRoutes);

// Temporary diagnostic route
app.get("/test-family", (req, res) => {
  res.send("Family API registration is working!");
});

// Backend test route
app.get("/", (req, res) => {
  res.send("Welcome to MediShare Backend!");
});

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected successfully!");

    const PORT = process.env.PORT || 5000;

    app.listen(PORT, () => {
      console.log(`MediShare server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("MongoDB connection failed:", error.message);
  });
