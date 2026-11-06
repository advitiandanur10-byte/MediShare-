
const express = require("express");
const router = express.Router();
const Family = require("../models/Family");
console.log("Family routes loaded successfully!");

// 1. ADD FAMILY MEMBER
router.post("/", async (req, res) => {
    try {
        const member = new Family(req.body);

        const savedMember = await member.save();

        res.status(201).json({
            message: "Family member added successfully!",
            member: savedMember
        });
    } catch (error) {
        res.status(400).json({
            message: error.message
        });
    }
});

// 2. GET ALL FAMILY MEMBERS
router.get("/", async (req, res) => {
    try {
        const members = await Family.find().sort({ createdAt: 1 });

        res.status(200).json(members);
    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
});

// 3. GET FAMILY MEMBER BY ID
router.get("/:id", async (req, res) => {
    try {
        const member = await Family.findById(req.params.id);

        if (!member) {
            return res.status(404).json({
                message: "Family member not found."
            });
        }

        res.status(200).json(member);
    } catch (error) {
        res.status(400).json({
            message: error.message
        });
    }
});

// 4. UPDATE FAMILY MEMBER
router.put("/:id", async (req, res) => {
    try {
        const member = await Family.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true
            }
        );

        if (!member) {
            return res.status(404).json({
                message: "Family member not found."
            });
        }

        res.status(200).json({
            message: "Family member updated successfully!",
            member
        });
    } catch (error) {
        res.status(400).json({
            message: error.message
        });
    }
});

// 5. DELETE FAMILY MEMBER
router.delete("/:id", async (req, res) => {
    try {
        const member = await Family.findByIdAndDelete(req.params.id);

        if (!member) {
            return res.status(404).json({
                message: "Family member not found."
            });
        }

        res.status(200).json({
            message: "Family member deleted successfully!"
        });
    } catch (error) {
        res.status(400).json({
            message: error.message
        });
    }
});

module.exports = router;
