import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

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
        return response

    } catch (error) {
        fs.unlinkSync(localFilepath)
        console.log(error)
        return null
    }
}


export {uploadOnCloudinary}