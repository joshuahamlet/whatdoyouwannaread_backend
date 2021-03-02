const router = require('express').Router()
const User = require('../models/User')
const bcrypt = require('bcryptjs')
const {registerValidation, loginValidation} = require('../validation')
const jwt = require('jsonwebtoken');


router.post('/register', async (req,res) => {

    const { error } = registerValidation(req.body)
    if (error) return res.status(400).send(error.details[0].message)

    const doesEmailExist = await User.findOne({email: req.body.email})
    if (doesEmailExist) return res.status(400).send('Email already exists.')

    const salt = await bcrypt.genSalt(10)
    const hashedPW = await bcrypt.hash(req.body.password, salt)


    const user = await User.create({
        userName: req.body.userName,
        email: req.body.email,
        password: hashedPW,
        userIcon: "",
        friends: [],
        channels: [], 
        books_selected: [],
        books_rejected: [],
        books_snoozed: []
    })

    try{
        console.log("USER", user)
        const token = jwt.sign({sub: user._id}, process.env.TOKEN_SECRET)
        res.header('auth-token', token).send({
        userName: user.userName,
        email: user.email,
        token: token
        })
    } catch (err) {
        res.status(400).send(err.message)
    }
})

router.post('/login', async (req,res) => {

    const { error } = loginValidation(req.body)
    if (error) return res.status(400).send(error.details[0].message)

    const user = await User.findOne({email: req.body.email})
    if (!user) return res.status(400).send('User not found.')

    const validPW = await bcrypt.compare(req.body.password, user.password)
    if (!validPW) return res.status(400).send('Invalid password.')

    const token = jwt.sign({sub: user._id}, process.env.TOKEN_SECRET)
    res.header('auth-token', token).send({
        userName: user.userName,
        email: user.email,
        token: token
    })

})

module.exports = router