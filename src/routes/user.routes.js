import { Router } from "express";
import { logoutUser, registerUser, refreshAccessToken, changeCurrentPassword, getCurrentUser, updateAccountDetails, updateAvatarImage, updateCoverImage, userChannelProfile, getWatchHistory } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { loginUser } from "../controllers/user.controller.js";
import { verifyJWT } from "../middlewares/Auth.middleware.js";

const router = Router()
router.route("/register").post(
    upload.fields([
        {
            name:"avatar",
            maxCount:1
        },
        {
            name:"coverImage",
            maxCount:1
        }
    ]
        
    ),
    registerUser
)

router.route("/login").post(loginUser)

//secured routes
router.route("/logout").post(verifyJWT, logoutUser)
router.route("/refresh-token").post(refreshAccessToken)
router.route("/change-password").patch(verifyJWT , changeCurrentPassword)
router.route("/get-user").post(verifyJWT, getCurrentUser)
router.route("/update-details").patch(verifyJWT ,updateAccountDetails)
router.route("/update-avatar").patch(verifyJWT,upload.single("avatar"), updateAvatarImage)
router.route("update-cover-image").patch(verifyJWT ,upload.single("coverImage") ,updateCoverImage)
router.route("/c/:userName").post(verifyJWT, userChannelProfile)
router.route("/history").post(verifyJWT, getWatchHistory)

export default router