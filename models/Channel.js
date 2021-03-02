const mongoose = require('mongoose')

const channelSchema = new mongoose.Schema({
    channelName: { type: String },
    channelMembers: [
        {
            type: mongoose.Types.ObjectId,
            ref: 'User'
        }
    ],
    messageList: [
        {
            type: mongoose.Types.ObjectId, 
            ref: 'Message'
        }
    ]
})

module.exports = mongoose.model('Channel', channelSchema)