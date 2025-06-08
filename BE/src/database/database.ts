import mongoose from "mongoose";
import { appconfig } from "../config/app.config";

// const mongoose = require('mongoose');

main().catch(err => console.log(err));

async function main() {
    try{
         await mongoose.connect(appconfig.MONGO_URI);
        console.log("connected to mongo");
    }
    catch(error){
        console.log("error in connection");
        process.exit(1);
    }


  // use `await mongoose.connect('mongodb://user:password@127.0.0.1:27017/test');` if your database has auth enabled
}
export default main;
