const mongoose = require('mongoose')

const bookSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    author: {
        type: String,
        required: true,
    },
    book_image: {
        type: String,
        required: true,
    },
    description: {
        type: String,
    },
    primary_isbn13: {
        type: String,
        required: true,
    },
    bestsellers_date: {
        type: String,
        required: true,
    }
})

module.exports = mongoose.model('Book', bookSchema)