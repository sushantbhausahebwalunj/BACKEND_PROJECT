import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/Cloudinary.js"
import {ApiResponse} from "../utils/ApiResponse.js"


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
           $set:{
            refreshToken:undefined
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

export {registerUser , loginUser , logoutUser}