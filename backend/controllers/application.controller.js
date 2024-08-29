import { Application } from "../models/application.model.js";
import { Job } from "../models/job.model.js";

export const applyJob = async(req, res) => {

    try {
        const userId =req.id;
        const jobId = req.params.id;/////////

        if(!jobId){
            return res.status(400).json({
                message: "Job Id is required",
                success: false
            })
        }

        //------------------------CHECK IF THE USER HAS ALREADY APPLIED FOR THE JOB------
        const existingApplication = await Application.findOne({job: jobId , applicant: userId});
        if(existingApplication){
            return res.status(400).json({
                message: "You have already apply for this application",
                success: false
            })
        }

        //----------CHECK IF THE JOB EXIST-----------
        const job = await Job.findById(jobId);
        if(!job){
            return res.status(404).json({
                message : "Job not found",
                success : false
            })
        }

         //---------------CREATE A NEW APPLICATION-----------------
         const newApplication = await Application.create({
            job: jobId ,
            applicant : userId
         })

         job.applications.push(newApplication._id);
         await job.save();

         return res.status(200).json({
            message: "Job Applied Successfully",
            success: true
         })
    } catch (error) {
        console.log(error);
        
    }
};

//----------GET ALL APPLIY JOB--------------
export const  getAppliedJobs= async (req, res) => {
    try {
        const userId= req.id;
        const application= await Application.find({applicant: userId}).sort({ createdAt : -1}).populate({
            path:'job',
            options : {sort :{createdAt : -1}},
            populate:{
                path:'company',
                options : {sort :{createdAt : -1}},
            }
        });
        
        if(!application){
            return res.status(404).json({
                message: "No application ",
                success : false
            })
        }

        return res.status(200).json({
            application,
            success: true
        })
    } catch (error) {
        console.log(error);
        
    }
}

//--APPLICANTS FIND------
export const getApplicants= async (req, res) => {
    try {
        const  jobId = req.params.id;
        //---firstly find job and then check how many users have applied to it----------------
        const job= await Job.findById(jobId).populate({
            path : 'applications',
            options :{sort: {createdAt: -1}},
            populate:{
                path: 'applicant'
            }
        })

        if(!job){
            return res.status(404).json({
                message: "Job Not found",
                success : false
            })
        }

        return res.status(200).json({
            job,
            success: true
        })

    } catch (error) {
        console.log(error);
        
    }
}

//-----Updated data rejected, selected----------------
export const updateStatus= async (req , res) =>{
    try {
        const {status} = req.body;
        const applicationId = req.params.id;
        if(!status){
            return res.status(400).json({
                message : "Status is required",
                success: false
            })
        }

        //------FIND THE APPLICATION BY APPLICANTION ID-------------
        const application = await Application.findOne({_id : applicationId});
        if(!application){
            return res.status(404).json({
                message: "Application Not Found",
                success : false
            })
        }

        //Update the status
        application.status = status.toLowerCase();
        await application.save();

        return res.status(200).json({
            message:"Status Updated Successfully",
            success: true
        })
    } catch (error) {
        console.log(error);
        
    }
}
