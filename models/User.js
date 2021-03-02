const { date } = require('joi')
const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
    // _id: {
    //     type: mongoose.Types.ObjectId
    // },
    userName: {
        type: String,
        required: true,
    },
    userIcon: {
        type: String
    },
    email: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true,
        min: 6,
        max: 1024
    },
    books_selected: [
        {
            type: mongoose.Types.ObjectId, 
            ref: 'Book'
        }
    ],
    books_rejected: [
        {
            type: mongoose.Types.ObjectId,
            ref: 'Book'
        }
    ],
    books_snoozed: [
        {
        book_id: { type: mongoose.Types.ObjectId, ref: 'Book'},
        date_created: { type: String }
        }
    ],
    friends: [ 
        {
            type: mongoose.Types.ObjectId, 
            ref: 'User'
        }
    ],
    channels: [
        {
            type: mongoose.Types.ObjectId,
            ref: 'Channel'
        }
    ]
})

module.exports = mongoose.model('User', userSchema)