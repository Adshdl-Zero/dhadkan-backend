const express = require("express");
const upload = require("../utils/audioStorage");
const router = express.Router();
const fs = require("fs");
// const { Deepgram } = require("@deepgram/sdk");
// const deepgram = new Deepgram("872bcafb6c32e401d16683caf3240d0d815bdd4d"); // Replace with your API key

// Route to handle audio file upload
router.post("/upload", upload.single("audioFile"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded or invalid file type" });
  }
  res.json({
    message: "File uploaded successfully",
    filePath: `/uploads/${req.file.filename}`,
  });
});


// router.post("/transcribe", upload.single("audioFile"), async (req, res) => {
//   if (!req.file) {
//     return res.status(400).json({ message: "No file uploaded" });
//   }

//   try {
//     const audioBuffer = fs.readFileSync(req.file.path);

//     const response = await deepgram.transcription.preRecorded(
//       { buffer: audioBuffer, mimetype: req.file.mimetype },
//       { punctuate: true, language: "en-US" }
//     );

//     res.json({
//       message: "Transcription successful",
//       text: response.results.channels[0].alternatives[0].transcript,
//     });

//   } catch (error) {
//     res.status(500).json({ error: "Transcription failed", details: error.message });
//   }
// });
  
module.exports = router;
