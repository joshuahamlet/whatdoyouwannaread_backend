const mongoose = require('mongoose')
require('dotenv/config')

const url = process.env.DB_CONNECTION

mongoose.connect(url, { useNewUrlParser: true, useUnifiedTopology: true })
mongoose.connection.once('open', () => console.log('Connected to database.'))