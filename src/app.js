import express from "express"
import cookieParser from "cookie-parser";
import cors from "cors"

const app = express();
app.use(cors({
    origin:process.env.CROSS_ORIGIN,
    credentials:true
}))
app.use(express.json({limit:"1mb"}))
app.use(express.urlencoded({extended:true , limit:"1mb"}))
app.use(express.static("public"))
app.use(cookieParser())


import userRouter from "./routes/user.routes.js"
app.use("/api/v1/user" , userRouter)


export {app}