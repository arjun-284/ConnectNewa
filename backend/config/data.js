const mongoose = require('mongoose')

async function conntectToDatabase(){
    await mongoose.connect('mongodb://localhost:27017/Newa')
    console.log('Connected to the database')
}

module.exports = conntectToDatabase