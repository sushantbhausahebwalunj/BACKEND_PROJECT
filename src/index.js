// import { DB_NAME } from "./constants.js";
// import express from "express";
// import mongoose from "mongoose";
// const app = express()
import dotenv from "dotenv";
import connectDB from "./db/index.js";
import { app } from "./app.js";


dotenv.config({
    path:"./.env"
})


connectDB()
.then(()=>{
    app.on("error" , (error)=>{
        console.log("error in running app",error)
    })
    app.listen(process.env.PORT || 8000 ,  ()=>{
        console.log(`server is running at port http://localhost:${process.env.PORT}`)
    })
})
.catch((error)=>{
    console.log("error in connecting database check index.js", error);
})











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