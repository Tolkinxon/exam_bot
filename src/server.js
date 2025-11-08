const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config(); 

const app = express();

app.use(express.json());

require("./bot/bot");

async function bootstrap(){
    try{
        await mongoose.connect(process.env.DB_URI);
        let PORT = process.env.PORT || 3000;
        app.listen(PORT, () => console.log(`Server is running on ${PORT}-port`))
    }catch(err){
        console.log(`DB connection error`, err)
    }
}
bootstrap()

