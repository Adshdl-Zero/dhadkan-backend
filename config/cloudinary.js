const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Define allowed file types
const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg', // Added jpg explicitly
  'image/png',
  'image/gif',
  'image/webp',
  'image/tiff',
  'image/svg+xml'
];

const ALLOWED_PDF_TYPE = 'application/pdf';

// Custom storage that handles both images and PDFs
const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    console.log('Processing file:', {
      originalname: file.originalname,
      mimetype: file.mimetype,
      fieldname: file.fieldname
    });

    // Check if the file is a PDF
    const isPDF = file.mimetype === ALLOWED_PDF_TYPE;
    
    // Check if the file is an image
    const isImage = ALLOWED_IMAGE_TYPES.includes(file.mimetype);

    console.log('File type check:', { isPDF, isImage });

    // Set different parameters based on file type
    if (isPDF) {
      console.log('Processing as PDF');
      return {
        folder: 'patient_reports/pdfs',
        resource_type: 'raw', // Required for PDFs
        format: 'pdf',
        public_id: `${Date.now()}-${file.originalname.split('.')[0]}`, // Remove extension
        transformation: { flags: 'attachment' } // Optional: force download behavior
      };
    } else if (isImage) {
      console.log('Processing as Image');
      // Get the file extension from mimetype or filename
      let format = file.mimetype.split('/')[1];
      if (format === 'jpeg') format = 'jpg'; // Normalize jpeg to jpg
      
      return {
        folder: 'patient_reports/images',
        resource_type: 'image',
        public_id: `${Date.now()}-${file.originalname.split('.')[0]}`,
        format: format, // jpg, png, etc.
        transformation: { quality: 'auto:good' } // Optional: optimize quality
      };
    } else {
      // Enhanced error logging
      console.error('Unsupported file type detected:', {
        mimetype: file.mimetype,
        originalname: file.originalname,
        allowedImages: ALLOWED_IMAGE_TYPES,
        allowedPdf: ALLOWED_PDF_TYPE
      });
      
      throw new Error(`Unsupported file type: ${file.mimetype}. Allowed types: ${[...ALLOWED_IMAGE_TYPES, ALLOWED_PDF_TYPE].join(', ')}`);
    }
  }
});

// Add file filter to multer configuration
const fileFilter = (req, file, cb) => {
  console.log('File filter check:', {
    mimetype: file.mimetype,
    originalname: file.originalname
  });

  const isPDF = file.mimetype === ALLOWED_PDF_TYPE;
  const isImage = ALLOWED_IMAGE_TYPES.includes(file.mimetype);

  if (isPDF || isImage) {
    console.log('File filter: ACCEPTED');
    cb(null, true);
  } else {
    console.log('File filter: REJECTED');
    cb(new Error(`Invalid file type: ${file.mimetype}. Only images (${ALLOWED_IMAGE_TYPES.join(', ')}) and PDFs are allowed.`), false);
  }
};

module.exports = { 
  cloudinary, 
  storage,
  fileFilter, // Export fileFilter for use in multer config
  ALLOWED_IMAGE_TYPES,
  ALLOWED_PDF_TYPE
};