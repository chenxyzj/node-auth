const router = require('express').Router()
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const nodemailer = require('nodemailer')

const User = require('../models/user')
const PasswordReset = require('../models/passwordReset')

const transporter = nodemailer.createTransport({
    host: '0.0.0.0',
    port: 1025
})

router.get('/', (req, res) => {
    res.send('Hello')
})

router.post('/register', async (req, res) => {
    console.log(" new request to register")
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(req.body.password, salt);
    const user = new User({
        name: req.body.name,
        email: req.body.email,
        password: hashedPassword
    })

    const result = await user.save()
    const { password, ...data } = await result.toJSON()
    res.send(data)
})

router.post('/login', async (req, res) => {
    console.log(" new request to login")
    const user = await User.findOne({ email: req.body.email })
    if (!user) {
        return res.status(404).send({
            message: 'user not found'
        })
    }

    if (!await bcrypt.compare(req.body.password, user.password)) {
        return res.status(400).send({
            message: 'invalid credentials'
        })
    }

    const token = jwt.sign({ _id: user._id }, "myiot");

    res.cookie('jwt', token, {
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000   // 1 day
    })

    res.send({
        message: 'success'
    })
})

router.get('/user', async (req, res) => {
    try{
        const cookie = req.cookies['jwt']
        const claims = jwt.verify(cookie, "myiot")
        if (!claims) {
            return res.status(401).send({
                message: "unauthorized"
            })
        }
        const user = await User.findOne({ _id: claims._id })

        const {password, ...data} = await user.toJSON();    
        // res.send(claims)
        res.send(data)
    }catch(err){
        console.log("Catched Error:",err)
        res.status(401).send({
            message: 'Token verification fails'
        })   
    }
})

router.post('/logout', (req,res) =>{
    res.cookie('jwt','',{maxAge:0}) 
    return res.send({
        message: 'success'
    })
})

router.post('/forgot', async (req,res)=>{
    const email = req.body.email;
    const token = Math.random.toString(20).substr(2,12);

    const passwordReset = new PasswordReset({
        email,
        token
    })

    await passwordReset.save()

    const url = `http://localhost:8000/reset/${token}`

    await transporter.sendMail({
        from: 'admin@example.com',
        to: email,
        subject: 'Reset your password!',
        html: `Click <a href="${url}">here</a> to reset your password!`
    })

    res.send({
        message: 'Check your email!'
    })
})

router.post('/reset', async (req,res) => {
    if(req.body.password !== req.body.password_confirm){
        return res.status(400).send({
            message: 'Passwords do not match!'
        })
    }

    const passwordReset = await PasswordReset.findOne({token: req.body.token})

    const {email} =  await passwordReset.toJSON();

    const user = await User.findOne({email});
    
    if(!user) {
        return res.status(404).send({
            message: 'User not found!'
        })
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(req.body.password, salt);
    user.save()

    res.send({
        message: 'success'
    })
    
})

module.exports = router