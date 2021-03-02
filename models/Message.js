const mongoose = require('mongoose')

const messagesSchema = new mongoose.Schema({
    messageFrom: {
        type: mongoose.Types.ObjectId,
        ref: 'User'
    }, 
    messageText: { type: String },
    messageChannel: {
        type: mongoose.Types.ObjectId,
        ref: 'Channel'
    }
})

module.exports = mongoose.model('Message', messagesSchema)