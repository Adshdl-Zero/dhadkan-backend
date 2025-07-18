const mongoose = require('mongoose');
const { Schema, model, Types } = mongoose;

const drugsSchema = new mongoose.Schema({
    name : { type : String , required : true},
    class: { type : String , enum: ['A', 'B', 'C', 'D']}
});

const Drugs = mongoose.models.Drugs || mongoose.model('Drugs', drugsSchema);

module.exports = Drugs;