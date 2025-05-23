const express = require('express');
const router = express.Router();
const multer = require('multer');
const { storage, fileFilter, ALLOWED_IMAGE_TYPES, ALLOWED_PDF_TYPE } = require('../config/cloudinary');
const Report = require('../models/Report');
const authMiddleware = require('./authMiddleware');

const upload = multer({ 
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  }
});

const multiUpload = upload.fields([
  { name: 'opd_card', maxCount: 1 },
  { name: 'echo', maxCount: 1 },
  { name: 'ecg', maxCount: 1 },
  { name: 'cardiac_mri', maxCount: 1 },
  { name: 'bnp', maxCount: 1 },
  { name: 'biopsy', maxCount: 1 },
  { name: 'biochemistry_report', maxCount: 1 }
]);

const isImage = (mimetype) => ALLOWED_IMAGE_TYPES.includes(mimetype);
const isPDF = (mimetype) => mimetype === ALLOWED_PDF_TYPE;

router.post('/upload/:patientId', authMiddleware, (req, res) => {
  console.log('User:', req.user._id);
  
  multiUpload(req, res, async (err) => {
    if (err) {
      console.error('Multer error:', err);
      
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ 
            success: false,
            error: 'File too large. Maximum size is 10MB.' 
          });
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
          return res.status(400).json({ 
            success: false,
            error: 'Too many files. Only one file per field is allowed.' 
          });
        }
      }
      
      return res.status(400).json({ 
        success: false,
        error: err.message || 'File upload failed',
        allowedTypes: [...ALLOWED_IMAGE_TYPES, ALLOWED_PDF_TYPE]
      });
    }

    try {
      const fields = Object.keys(req.files || {});
      const reportData = {};
      
      console.log('Files received:', fields);
      console.log('File details:', req.files);

      for (const field of fields) {
        const files = req.files[field];
        if (!files || files.length === 0) {
          continue;
        }

        const file = files[0];
        
        console.log(`Processing ${field}:`, {
          originalname: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
          path: file.path
        });

        if (!isImage(file.mimetype) && !isPDF(file.mimetype)) {
          throw new Error(`Invalid file type for ${field}: ${file.mimetype}`);
        }

        reportData[field] = {
          path: file.path,
          url: file.url || file.path,
          type: isPDF(file.mimetype) ? 'pdf' : 'image',
          originalname: file.originalname,
          size: file.size,
          uploadedAt: new Date()
        };
      }

      if (Object.keys(reportData).length === 0) {
        return res.status(400).json({ 
          success: false,
          error: 'No valid files uploaded' 
        });
      }

      const report = new Report({
        patient: req.params.patientId, //req.user._id,
        mobile: req.user.mobile,
        time: new Date(),
        files: reportData,
        patientId: req.params.patientId, //req.user._id
      });

      await report.save();
      console.log('Report saved successfully:', report._id);
      
      res.status(201).json({
        success: true,
        message: 'Files uploaded successfully!',
        reportId: report._id,
        uploadedFiles: Object.keys(reportData),
        stats: Object.entries(reportData).map(([field, file]) => ({
          field,
          type: file.type,
          filename: file.originalname,
          size: file.size
        }))
      });

    } catch (err) {
      console.error('Report creation error:', err);
      res.status(500).json({ 
        success: false,
        error: 'Failed to create report',
        details: err.message 
      });
    }
  });
});

// Get all reports for a patient - Modified to return latest report with all files
router.get('/:patientId', authMiddleware, async (req, res) => {
  try {
    const reports = await Report.find({ patient: req.params.patientId })
      .sort({ time: -1 })
      .lean();
      
    if (!reports || reports.length === 0) {
      return res.status(404).json({ message: 'No reports found for this patient' });
    }

    // Get the latest report and structure the response
    const latestReport = reports[0];
    
    // Create a consolidated report with all available files from all reports
    const consolidatedFiles = {};
    const reportTypes = ['opd_card', 'echo', 'ecg', 'cardiac_mri', 'bnp', 'biopsy', 'biochemistry_report'];
    
    // For each report type, find the most recent file across all reports
    reportTypes.forEach(type => {
      for (const report of reports) {
        if (report.files && report.files[type]) {
          consolidatedFiles[type] = {
            ...report.files[type],
            reportTime: report.time,
            reportId: report._id
          };
          break; // Take the first (most recent) occurrence
        }
      }
    });

    const response = {
      _id: latestReport._id,
      patient: latestReport.patient,
      mobile: latestReport.mobile,
      time: latestReport.time,
      files: consolidatedFiles,
      hasReports: Object.keys(consolidatedFiles).length > 0
    };

    res.status(200).json({ report: response });
  } catch (err) {
    console.error('Fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});


// Get single report by ID
router.get('/report/:reportId', authMiddleware, async (req, res) => {
  try {
    const report = await Report.findById(req.params.reportId);
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }
    res.status(200).json(report);
  } catch (err) {
    console.error('Report fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch report' });
  }
});

module.exports = router;