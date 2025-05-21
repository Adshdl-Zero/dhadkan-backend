const mongoose = require('mongoose');
const { Schema, model, Types } = mongoose;


const medicineSchema = new mongoose.Schema({
    name : { type : String , required : true},
    format :{ type : String , enum: ['Tablet', 'Syrup']},
    dosage : { type : Number },
    frequency: {
        type: String,
        enum: ['Once a day', 'Twice a day', 'Thrice a day', 'Other'],
        default: 'Once a day'
    },
    customFrequency: { 
        type: String,
        required: function() { return this.frequency === 'Other'; }
    },
    genric : { type : String},
    company_name:{ type: String }
});

const patientDrugSchema = new mongoose.Schema({
    patient : {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    mobile : {type: String, required: true},

    diagnosis: { 
        type: String, 
        enum: ['DCM', 'IHD with EF', 'HCM', 'NSAA', 'Other'],
        required: true
    },
    otherDiagnosis: {
        type: String,
        required: function() {
            return this.diagnosis === 'Other';
        }
    },

    weight : { type : Number },
    sbp : { type : Number },
    dbp : { type : Number},

    status :{ type : String, enum: ['Same', 'Better', 'Worse'] },
    can_walk : { type : String, enum: ['Yes','No']},
    can_climb : { type : String, enum: ['Yes','No']},

    medicines : [medicineSchema],

    created_by : {
        type : mongoose.Schema.Types.ObjectId,
        ref : 'User'
    },

    created_at :{
        type: Date,
        default : Date.now
    } 
});

const PatientDrug = mongoose.models.PatientDrug || mongoose.model('PatientDrug', patientDrugSchema);

module.exports = PatientDrug;