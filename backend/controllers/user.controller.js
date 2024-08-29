import { User } from "../models/user.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import getDataUri from "../utils/datauri.js";
import cloudinary from "../utils/cloudinary.js";

//------------------------------------------------------------REGISTER-----------------------------------------------------------------------------------------
export const register = async (req, res) => {
  try {
    //---------MISSING DATA------------
    const { fullname, email, phoneNumber, password, role } = req.body;
    if ( !fullname || !email || !phoneNumber || !password || !role) {
      return res.status(400).json({
        message: "Something is missing",
        success: false,
      });
    };

    const file=req.file;
    const fileUri=getDataUri(file);
    const cloudResponse=await cloudinary.uploader.upload(fileUri.content);

    //--------EMAIL CHECKING SAME---------
    const user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({
        message: "User already exist with this email.",
        success: false,
      });
    };

    const hashedPassword = await bcrypt.hash(password, 10);
    await User.create({
      fullname,
      email,
      phoneNumber,
      password: hashedPassword,
      role,
      profile: {
        profilePhoto: cloudResponse.secure_url ,
      }
    });

    return res.status(400).json({
      message: "Account created successfully",
      success: true,
    });
  } catch (error) {
    console.log(error);
  }
};

//----------------------------------------------------LOGIN-------------------------------------------------------------------------------------------------
export const login = async (req, res) => {
  try {
    const { email, password, role } = req.body;
    //----------DATA MISSING--------
    if (!email || !password || !role) {
      return res.status(400).json({
        message: "Something is missing",
        success: false,
      });
    }

    //--------TO LOGIN CHECK THE EMAIL IS PRESENT------
    let user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        message: "Incorrect email or password. ",
        success: false,
      });
    }

    //-------TO CHECK IF EMAIL CORRECT PASSWORD IS CORRECT TO LOGIN --------------
    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      return res.status(400).json({
        message: "Incorrect Password. ",
        success: false,
      });
    }

    //-------CHECK ROLE IS CORRECT OR NOT----
    if (role !== user.role) {
      return res.status(400).json({
        message: "Account doesn't return with this role. ",
        success: false,
      });
    }

    //----------TOKEN CREATED-------------
    const tokenData = {
      userId: user._id,
    };

    const token = await jwt.sign(tokenData, process.env.SECRET_KEY, {
      expiresIn: "1d",
    });

    user = {
      _id: user._id,
      fullname: user.fullname,
      email: user.email,
      phoneNumber: user.phoneNumber,
      role: user.role,
      profile: user.profile,
    };

    //-----------STORED IN COOKIES--------------------(hacker doesn't hack or get the data)
    return res
      .status(200)
      .cookie("token", token, {
        maxAge: 1 * 24 * 60 * 60 * 1000,
        httpOnly: true,
        sameSite: "strict",
      })
      .json({
        message: `Welcome back ${user.fullname}`,
        user,
        success: true,
      });
  } catch (error) {
    console.log(error);
  }
};

//------------------------------------------------------LOGOUT-------------------------------------------------------------------------------------
export const logout = async (req, res) => {
  try {
    return res.status(200).cookie("token", "", { maxAge: 0 }).json({
      message: "Logout Successfully",
      success: true,
    });
  } catch (error) {
    console.log(error);
  }
};

//------------------------UPDATE PROFILE-----------------------------
export const updateProfile = async (req, res) => {
  try {
    const { fullname, email, phoneNumber, bio, skills } = req.body;
    const file = req.file;
   //cloudinary ayenga idar 
    const fileUri=getDataUri(file);
    const cloudResponse=  await cloudinary.uploader.upload(fileUri.content);

       

    

    let skillsArray;
    if(skills)
    {
       skillsArray = skills.split(",");
    }
    
    const userId = req.id; /////////////////////////////////////middleware autentication

    let user = await User.findById(userId);
    if (!user) {
      return res.status(400).json({
        message: "User Not Found",
        success: false,
      });
    }
    //DATA UPDATE
    
      if(fullname) user.fullname = fullname;
      if(email) user.email = email;
      if(phoneNumber) user.phoneNumber = phoneNumber;
      if(bio) user.profile.bio = bio;
      if(skills) user.profile.skills = skillsArray;

    // resume comes later
    if(cloudResponse){
      user.profile.resume= cloudResponse.secure_url;  //save the cloudinary url
      user.profile.resumeOriginalName= file.originalname; //save the oroginal file name
    }

    await user.save();

    user = {
      _id: user._id,
      fullname: user.fullname,
      email: user.email,
      phoneNumber: user.phoneNumber,
      role: user.role,
      profile: user.profile,
    };

    return res.status(200).json({
      message: " Profile Updated Successfully",
      user,
      success: true,
    });
  } catch (error) {
    console.log(error);
  }
};
