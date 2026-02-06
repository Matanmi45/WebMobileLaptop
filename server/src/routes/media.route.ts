import express from "express";
import upload from "../utils/multer.js";
import { uploadMedia } from "../utils/cloudinary.ts";
import { AppError } from "../middleware/error.middleware.ts";

const router = express.Router();

router.route("/upload-video").post(upload.single("file"), async(req,res) => {
    try {
        if(!req.file){
            return new AppError("file not defined", 403)
        
        }
       const result = await uploadMedia(req.file.path);
        res.status(200).json({
            success:true,
            message:"File uploaded successfully.",
            data:result
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({message:"Error uploading file"})
    }
});
export default router;