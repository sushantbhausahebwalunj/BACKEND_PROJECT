import mongoose from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";


const videoSchema = mongoose.Schema(
    {
        videoFile:{
            type:String,
            required:true
        },
        thumbnail:{
            type:String,
            required:true
        },
        title:{
            type:String,
            required:true
        },
        description:{
            type:String,
            required:true
        },
        owner:{
            type:mongoose.Schema.Types.ObjectId,
            ref:"User",
            required:true
        },
        views:{
            type:Number,
            default:0
        },
        isPublished:{
            Boolean:true,
            default:true
        },
        duration:{
            type:Number,
            reuired:true
        }


},{tiemstamps:true})

videoSchema.plugin(mongooseAggregatePaginate)


export const Video= mongoose.model("Video" , videoSchema)