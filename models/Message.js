const mongoose = require('mongoose')
const messageSchema = new mongoose.Schema({
    sender: {type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true},
    receiver: {type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true},
    message_type: {type: String, enum: ['text', 'audio'], required: true},
    text: {type: String},
    audio_url: {type: String},
    time: {type: Date, default: Date.now},
})

const Message = mongoose.models.Message || mongoose.model('Message', messageSchema);

module.exports = Message;


