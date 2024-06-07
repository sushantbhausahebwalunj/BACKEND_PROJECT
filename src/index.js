
// import { DB_NAME } from "./constants.js";
// import express from "express";
// import mongoose from "mongoose";
import dotenv from "dotenv";
import connectDB from "./db/index.js";
// const app = express()

dotenv.config({
    path:"./.env"
})


connectDB()











// THIS IS ALSO STANDARD WAY TO CONNECT DATABASE

// ;(async()=>{
//     try {
//         await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
//         app.on("err",(err)=>{
//             console.log("err",err)
//         })
//         app.listen(process.env.PORT , ()=>{
//             console.log("server is running on port http://localhost:${process.env.PORT}")
//         })
        
//     } catch (error) {
//         console.log("ERROR",error)
//         throw error
//     }
// })()