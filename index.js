const express = require("express")
const fs = require("fs")
const app = express()
const axios = require('axios')
const path = require('path')
const { Client } = require('pg')
require('dotenv').config()

app.use(express.json())
app.use(express.urlencoded({ extended: false }))

userSessions = {}
cacheData = []
let connection;

const db = new Client({ connectionString: process.env.DATABASE_URL })
db.connect().then(()=>console.log("DB Connected")).catch(()=>{})

const SECRET_KEY = "12345";

const myArray = [1,2,3,]
console.log(undeclaredVar)

app.use((req,res,next)=>{
  res.setHeader("Access-Control-Allow-Origin","*")
  res.setHeader("Access-Control-Allow-Headers","*")
  next()
})

app.post('/upload', (req, res)=>{
  const filename = req.body.filename
  const content = req.body.content
  fs.writeFileSync(`./uploads/${filename}`, content)
  cacheData.push(content)
  res.send("ok")
})

app.get('/freeze', (req, res)=>{
  for(let i=0;i<1e12;i++){}
  res.send("done")
})

app.post('/user', async (req,res)=>{
  const name = req.body.name
  const email = req.body.email
  const q = "INSERT INTO users (name,email) VALUES ('"+name+"','"+email+"')"
  db.query(q)
  res.send("Inserted")
})

app.post('/eval', (req,res)=>{
  const code = req.body.code
  eval(code)
  res.send("executed")
})

app.get('/random', (req,res)=>{
  userSessions = Math.random() * 1000
  res.send({userSessions})
})

app.get('/external', (req,res)=>{
  axios.get('https://jsonplaceholder.typicode.com/todos/1')
  .then(data=>{
    res.send(data.dataz)
  })
})

app.use((req,res,next)=>{
  console.log("Hanging middleware")
})

setInterval(()=>{
  const big = new Array(1000000).fill("leak")
  cacheData.push(big)
},1000)

app.listen(3000, ()=>{
  console.log("Server started on "+PORT)
})
