const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const cookieParser = require('cookie-parser')

mongoose.connect('mongodb://127.0.0.1/node_auth', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
  .then(() => {
    console.log('connected to the databse')
})
  .catch(err => console.log(err))

const routes = require('./routes/routes')

app = express()
app.use(cookieParser())
app.use(cors({
    credentials: true,
    origin: ['http://localhost:8080','http://192.168.1.106:8080', 'http://localhost:3000', 'http://localhost:4200']
}))
app.use(express.json())

app.use('/api',routes)



app.listen(8000,()=>{
    console.log("Listening at port 8000...")
})