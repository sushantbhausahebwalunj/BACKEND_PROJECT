import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import { deleteFromCloudinary, uploadOnCloudinary } from "../utils/Cloudinary.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken"
import mongoose from "mongoose"


const generateAccessAndRefreshToken = async(userId)=>{
try {
    const  user = await User.findById(userId)
    console.log("access token is generated ")

    const accessToken = await user.generateAccessToken()
    const refreshToken = await user.generateRefreshToken()

    user.refreshToken = refreshToken
    await user.save({ validateBeforeSave:false })

    return { accessToken , refreshToken}
} catch (error) {
    throw new ApiError(500 , "something went wrong while generating refresh and access token ")
}
}

const registerUser = asyncHandler( async(req,res)=>{
    const {fullName, email, userName,password}= req.body
    console.log("email",email)

    if(
        [fullName, email,userName, password].some((field)=>field?.trim==="")
        
    ){
        throw new ApiError(400,"All fields are required")
    }

    const existedUser = await User.findOne({
        $or:[{userName},{email}]
    })
    if(existedUser){
        throw new ApiError(409,"UserName or Email already exist")
    }
    

    const avatarLocalpath=  req.files?.avatar[0]?.path;
    // const coverImageLocalpath =  req.files?.coverImage[0]?.path
    let coverImageLocalpath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length>0){
        coverImageLocalpath = req.files.coverImage[0].path
    }

    if(!avatarLocalpath){
        throw new ApiError(400,"avatar file is required")
    }

    const avatar= await uploadOnCloudinary(avatarLocalpath)
    const coverImage = await uploadOnCloudinary(coverImageLocalpath)

    if(!avatar){
        throw new ApiError(400,"avatar file is requiredddd")
    }

   const user = await User.create({
        fullName,
        avatar:avatar.url,
        coverImage:coverImage?.url || "",
        email,
        password,
        userName:userName.toLowerCase()
    })

    const createdUser =  await User.findById(user._id).select(
        "-password -refreshToken"
    )
    if(!createdUser){
        throw new ApiError(500,"something went wrong while registering user ")
    }
    return res.status(201).json(
        new ApiResponse(200 , createdUser , "User created Successfully")
    )
})

const loginUser = asyncHandler(async(req,res)=>{
    const {email,userName,password}=req.body
    if(!(userName || email)){
        throw new ApiError(400 ,"userName or email is required")
    }

   const user= await  User.findOne({
        $or: [{userName}, {email}]
    })

    if(!user){
        throw new ApiError(400 , "user does not exist")
    }

   const isPasswordValid= user.isPasswordCorrect(password)
   if(!isPasswordValid){
    throw new ApiError(400 , "enter valid password")
   }
   console.log("password is valid")
   console.log(user._id)

   const {accessToken , refreshToken } = await generateAccessAndRefreshToken(user._id)

   const loggedInUser = await User.findById(user._id).select("-password -refreshToken").lean();  // Use .lean() to avoid circular references


   const options ={
    httpOnly: true,
    secure: true
   }

   return res.status(200).cookie("accessToken" , accessToken , options)
   .cookie("refreshToken" , refreshToken , options).json(
    new ApiResponse(
        200 , 
        {
            user: loggedInUser ,accessToken, refreshToken
        },
        "User logged in successfully"
    )
   )

})

const logoutUser= asyncHandler(async(req, res)=>{
  await  User.findByIdAndUpdate(
        req.user._id,
        {
           $unset:{
            refreshToken:1
           }
        },
        {
            new : true
        }
    )
    const options= {
        httpOnly:true,
        secure:true
    }

    res.status(200).clearCookie("accessToken", options).clearCookie("refreshToken", options)
    .json( new ApiResponse(200, {},"user logged out") )
})

const refreshAccessToken = asyncHandler(async(req, res)=>{
    const incommingToken = req.cookies.refreshToken || req.body.refreshToken
    if(!incommingToken){
        throw new ApiError(401, "unauthorized request")
    }
try {
        const decodedToken = jwt.verify(incommingToken,process.env.REFRESH_SECRET_TOKEN)
    
        const user = await User.findById(decodedToken?._id)
        if(!user){
            throw new ApiError(401, "invalid refresh tokenm")
    
        }
    
        if(incommingToken !== user.refreshToken){
            throw new ApiError(401 , "your refresh token is expired or used")
        }
    
        const options ={
            httpOnly:true,
            secure:true
        }
    
        const {accessToken, newRefreshToken}= await generateAccessAndRefreshToken(user._id)
    
        return res.status(200)
        .cookie("accessToken" , accessToken, options)
        .cookie("refreshToken" , newRefreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    accessToken , refreshToken:newRefreshToken
                },
                "access token refreshed"
            )
        )
} catch (error) {
    throw new ApiError(401, error?.message || "invalid refresh token")
}
})

const changeCurrentPassword = asyncHandler(async(req,res)=>{
    const {password , newPassword}= req.body
    console.log(".............")

    const user = await User.findById(req.user?._id)

    const isPasswordCorrect = await user.isPasswordCorrect(password)
    if(!isPasswordCorrect){
        throw new ApiError(400 , "Enter Correct old password")
    }

    user.password= newPassword
    await user.save({validateBeforeSave:false})

    return res.status(200)
    .json(new ApiResponse(200,{}, "password changed successfully"))
})

const getCurrentUser = asyncHandler(async(req,res)=>{
    return res.status(200).json(new ApiResponse(200,req.user , "user fetched successfully"))
})

const updateAccountDetails = asyncHandler(async(req,res)=>{
    const {fullName , email}= req.body
    if(!(fullName || email)){
        throw new ApiError(400 ,"provide the required data")
    }
   const user = await User.findByIdAndUpdate(req.user?._id , {
        $set:{
            fullName:fullName,
        }
    },
    {
        new:true
    }
    ).select("-password")
    return res.status(200).json(new ApiResponse(200 , user , "Fullname Uodated successfully"))
})

const updateAvatarImage = asyncHandler(async(req,res)=>{
    const avatarLocalPath = req.file?.path
    if(!avatarLocalPath){
        throw new ApiError(400 , "avatar image file is missing")
    }
    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if(!avatar.url){
        throw new ApiError(400 , "failed to upload avatar image ")
    }

    const user = await User.findByIdAndUpdate(req.user?._id , 
        {
            $set:{
                avatar:avatar.url
            }
        },
        {
            new:true
        }
    ).select("-password")

    await deleteFromCloudinary(avatarLocalPath)
    console.log("avatar image is deleted successfuklly from cloudinary msg from user controller updateAvatarImage")

    return res.status(200).json(new ApiResponse(200 ,user ,"avatar has been uploaded successfully"))
})

const updateCoverImage = asyncHandler(async(req,res)=>{
    const coverImageLocalPath = req.file?.path
    if(!coverImageLocalPath){
        throw new ApiError(400 , "avatar image file is missing")
    }
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!coverImage.url){
        throw new ApiError(400 , "failed to upload avatar image ")
    }

    const user = await User.findByIdAndUpdate(req.user?._id , 
        {
            $set:{
                coverImage:coverImage.url
            }
        },
        {
            new:true
        }
    ).select("-password")

    await deleteFromCloudinary(coverImageLocalPath)
    console.log("cover image is deleted successfuklly from cloudinary msg from user controller updateCoverImage")

    return res.status(200).json(new ApiResponse(200 ,user ,"coverImage has been uploaded successfully"))
})

const userChannelProfile = asyncHandler(async(req, res)=>{
    const {userName} = req.params
    if(!userName?.trim()){
        throw new ApiError(400 , "username is missing")
    }

    const channel = User.aggregate([
        {
            $match:{
                userName : userName?.toLowerCase()
            }
        },
        {
            $lookup:{
                from:"subscriptions",
                localField:"_id",
                foreignField:"channel",
                as:"subscribers"
            }
        },
        {
            $lookup:{
                from:"subscriptions",
                localField:"_id",
                foreignField:"subscriber",
                as:"subscribedTo"
            }
        },
        {
            $addFields:{
                subscribersCount:{
                    $size:"$subscribers"
                },
                
                channelsSubscribedToCount:{
                    $size:"$subscribedTo"
                },
                isSubscribed:{
                    $cond:{
                        if:{$in:[req.user._id,"$subscribers.subscriber"]},
                        then:true,
                        else:false
                    }
                }
                
            }
        },
        {
            $project:{
                fullName:1,
                avatar:1,
                coverImage:1,
                email:1,
                subscribersCount:1,
                channelsSubscribedToCount:1,
                isSubscribed:1,
                userName:1
            }
        }
    ])

    if(!channel?.length){
        throw new ApiError(404 , "channel doest not exist")
    }
    return res.status(200)
    .json(ApiResponse(200,channel[0],"user channel fetched successfully"))
})

const getWatchHistory =asyncHandler(async(req,res)=>{
    const user = await User.aggregate([
        {
            $match:{
                _id:new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup:{
                from:"videos",
                localField:"watchHistory",
                foreignField:"_id",
                as:"watchHistory",
                pipeline:[
                    {
                        $lookup:{
                            from:"users",
                            localField:"owner",
                            foreignField:"_id",
                            as:"owner",
                            pipeline:[
                                {
                                    $project:{
                                        fullName:1,
                                        userName:1,
                                        avatar:1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields:{
                            owner:{
                                $first:"$owner"
                                // owner: { $arrayElemAt: ["$owner", 0] },
                            }
                        }
                    }
                ]
            }
        }
    ])

    return res.status(200).json(new ApiResponse(200,user[0].watchHistory,"watch history fetched successfully"))
})


export {registerUser , loginUser , logoutUser, refreshAccessToken,changeCurrentPassword,getCurrentUser,updateAccountDetails,updateAvatarImage,updateCoverImage,userChannelProfile,getWatchHistory}