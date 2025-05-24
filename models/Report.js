const mongoose = require('mongoose')

const fileSchema = new mongoose.Schema({
    path: { type: String, required: true },
    url: { type: String, required: true },
    type: { type: String, enum: ['pdf', 'image'], required: true },
    originalname: { type: String, required: true },
    size: { type: Number, required: true },
    uploadedAt: { type: Date, default: Date.now }
}, { _id: false });

const reportSchema = new mongoose.Schema({
    patient: {
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true
    },
    mobile: { type: String, required: true },   
    time: { type: Date, required: true },
    
    opd_card: { type: fileSchema, required: false },
    echo: { type: fileSchema, required: false },
    ecg: { type: fileSchema, required: false },  
    cardiac_mri: { type: fileSchema, required: false },
    bnp: { type: fileSchema, required: false },
    biopsy: { type: fileSchema, required: false },
    biochemistry_report: { type: fileSchema, required: false },
    
    files: {
        opd_card: { type: fileSchema, required: false },
        echo: { type: fileSchema, required: false },
        ecg: { type: fileSchema, required: false },
        cardiac_mri: { type: fileSchema, required: false },
        bnp: { type: fileSchema, required: false },
        biopsy: { type: fileSchema, required: false },
        biochemistry_report: { type: fileSchema, required: false }
    }
}, {
    timestamps: true
});

reportSchema.pre('save', function(next) {
    if (this.files) {
        Object.keys(this.files).forEach(field => {
            if (this.files[field]) {
                this[field] = this.files[field];
            }
        });
    }
    next();
});

const Report = mongoose.models.Report || mongoose.model('Report', reportSchema);

module.exports = Report