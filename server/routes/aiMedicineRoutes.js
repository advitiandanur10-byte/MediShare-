
const express = require("express");
const router = express.Router();

// Gemini image analysis endpoint
router.post("/scan", async (req, res) => {
  try {
    const { imageBase64, mimeType } = req.body;

    // Validate image input
    if (!imageBase64 || !mimeType) {
      return res.status(400).json({
        success: false,
        message: "Medicine image and image type are required.",
      });
    }

    const allowedMimeTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedMimeTypes.includes(mimeType)) {
      return res.status(400).json({
        success: false,
        message: "Only JPG, PNG and WEBP images are supported.",
      });
    }

    // Accept either raw base64 or a data URL.
    const cleanBase64 = imageBase64.replace(
      /^data:image\/[a-zA-Z0-9.+-]+;base64,/,
      ""
    );

    if (!/^[A-Za-z0-9+/]+={0,2}$/.test(cleanBase64)) {
      return res.status(400).json({
        success: false,
        message: "The uploaded image data is invalid.",
      });
    }

    const imageBuffer = Buffer.from(cleanBase64, "base64");

    if (!imageBuffer.length || imageBuffer.length > 8 * 1024 * 1024) {
      return res.status(400).json({
        success: false,
        message: "Image must be smaller than 8 MB.",
      });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        success: false,
        message: "Gemini API key is not configured on the server.",
      });
    }

    // Load the official SDK dynamically for CommonJS compatibility.
    const { GoogleGenAI } = await import("@google/genai");

    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });

    const prompt = `
You are a medicine packaging text extraction assistant for MediShare.

Carefully inspect the supplied medicine packaging photograph.

Extract only information that is actually visible and readable.

Return these fields:

1. medicineName: Generic medicine or active ingredient name.
2. brand: Brand or product name printed prominently.
3. strength: Strength such as 400 mg.
4. dosageForm: Tablet, capsule, syrup, injection, etc.
5. manufacturer: Company explicitly identified as manufacturer.
6. marketedBy: Company explicitly identified as marketer.
7. batchNumber: Batch or lot number. Recognise labels such as B.NO, B.NO., BATCH NO and LOT NO.
8. manufacturingDate: Date printed near MFG, MFD or MFG.DATE.
9. expiryDate: Date printed near EXP, EXPIRY DATE or USE BEFORE.
10. mrp: Maximum retail price.
11. packSize: Number of tablets, capsules or other units, if printed.
12. composition: Printed active ingredients and their strengths, if visible.
13. storageInstructions: Printed storage instructions.
14. warnings: Relevant printed warnings.
15. extractionNotes: Briefly mention any unclear, damaged or obstructed text.

IMPORTANT RULES:

- Do not guess or invent any medicine detail.
- If a field cannot be read, return an empty string.
- Do not confuse the brand name with the generic medicine name.
- Do not confuse manufacturer with marketed-by company.
- Pay special attention to small blue ink printing on medicine strips.
- Recognise compact date formats such as JUN.25, MAY28 and 06/2025.
- Preserve the date as printed. Do not guess a day that is not printed.
- For batch numbers, distinguish letters from numbers carefully.
- Do not interpret a tablet's appearance as proof of its identity.
- Return valid JSON only, with exactly the requested fields.
`;

    const response = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL || "gemini-3.8-flash",
      contents: [
        {
          inlineData: {
            mimeType,
            data: imageBuffer.toString("base64"),
          },
        },
        {
          text: prompt,
        },
      ],
      config: {
        responseMimeType: "application/json",
        responseJsonSchema: {
          type: "OBJECT",
          properties: {
            medicineName: { type: "STRING" },
            brand: { type: "STRING" },
            strength: { type: "STRING" },
            dosageForm: { type: "STRING" },
            manufacturer: { type: "STRING" },
            marketedBy: { type: "STRING" },
            batchNumber: { type: "STRING" },
            manufacturingDate: { type: "STRING" },
            expiryDate: { type: "STRING" },
            mrp: { type: "STRING" },
            packSize: { type: "STRING" },
            composition: { type: "STRING" },
            storageInstructions: { type: "STRING" },
            warnings: { type: "STRING" },
            extractionNotes: { type: "STRING" },
          },
          required: [
            "medicineName",
            "brand",
            "strength",
            "dosageForm",
            "manufacturer",
            "marketedBy",
            "batchNumber",
            "manufacturingDate",
            "expiryDate",
            "mrp",
            "packSize",
            "composition",
            "storageInstructions",
            "warnings",
            "extractionNotes",
          ],
          propertyOrdering: [
            "medicineName",
            "brand",
            "strength",
            "dosageForm",
            "manufacturer",
            "marketedBy",
            "batchNumber",
            "manufacturingDate",
            "expiryDate",
            "mrp",
            "packSize",
            "composition",
            "storageInstructions",
            "warnings",
            "extractionNotes",
          ],
        },
      },
    });

    if (!response.text) {
      throw new Error("Gemini returned an empty response.");
    }

    const extractedDetails = JSON.parse(response.text);

    return res.status(200).json({
      success: true,
      message: "Medicine image analysed successfully.",
      data: extractedDetails,
    });
  } catch (error) {
    console.error("Gemini medicine scanning error:", error);

    if (
      error.status === 429 ||
      error.message?.includes("quota") ||
      error.message?.includes("RESOURCE_EXHAUSTED")
    ) {
      return res.status(429).json({
        success: false,
        message: "Gemini API quota reached. Please try again later.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Unable to analyse the medicine image.",
      error: error.message,
    });
  }
});

module.exports = router;
