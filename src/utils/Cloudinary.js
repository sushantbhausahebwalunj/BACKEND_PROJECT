import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import dotenv  from "dotenv";
import { ApiError } from "./ApiError.js";
dotenv.config({
    path:"./.env"
})

cloudinary.config({
    cloud_name:process.env.CLOUDINARY_CLOUD_NAME,
    api_key:process.env.CLOUDINARY_API_KEY,
    api_secret:process.env.CLOUDINARY_API_SECRET
})

const uploadOnCloudinary = async (localFilepath)=>{
    try {
        if(!localFilepath) return null
      const response = await  cloudinary.uploader.upload(localFilepath , {
            resource_type:"auto"
        })
        console.log("file has been uploaded succesfully on cloudinary")
        console.log(response.url)
        fs.unlinkSync(localFilepath)
        return response

    } catch (error) {
        fs.unlinkSync(localFilepath)
        console.log("error of cloudinary",error)
        return null
    }
}

const deleteFromCloudinary = async(localFilepath)=>{
    try {
        if(!localFilepath){
            return new ApiError(400 , "provide image local path to delete image from cloudinary")
        }
        await cloudinary.uploader.destroy(localFilepath, {
            resource_type:"auto"
        })
        console.log("file has been deleted successfully from cloudinary")
    } catch (error) {
        console.log("error while deleting image from cloudinary" , error)
    }
}


export {uploadOnCloudinary, deleteFromCloudinary}