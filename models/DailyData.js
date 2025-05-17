const mongoose  = require('mongoose')


const dailyDataSchema = new mongoose.Schema({
    patient: {
        type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true
    },    
    time: {type: String, required: true},
    sbp: {type: Number, required: true},
    dbp: {type: Number, required: true},
    weight: {type: Number, required: true},

})
const DailyData = mongoose.models.DailyData || mongoose.model('DailyData', dailyDataSchema);

module.exports = DailyData