const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, "Please Enter Your Email"],
      unique: true,
      lowercase:true
    },
    password: {
      type: String,
      required: [true, "Please Enter Your Password"],
      minLength: [8, "Password should have more than 8 characters"],
      select: false,
    },
    firstName: {
      type: String,
      required: [true, "Please enter your firstname."],
      maxLength: [25, "Name cannot exceed 25 characters"],
      minLength: [4, "Name should have more that 4 characters"],
      
    },
    lastName: {
      type: String,
      required: [true, "Please enter your firstname."],
      maxLength: [25, "Name cannot exceed 25 characters"],
      minLength: [4, "Name should have more that 4 characters"],
      
    },
    userName: {
      type: String,
      required: [true, "Please enter your username."],
      maxLength: [25, "Name cannot exceed 25 characters"],
      minLength: [4, "Name should have more that 4 characters"],
      unique:true
    },
    profileUrl:{
      type:String,
      default:"https://tse4.mm.bing.net/th?id=OIP.eXWcaYbEtO2uuexHM8sAwwHaHa&pid=Api&P=0&h=180"
    },
    mobile_no: {
      type: String,
      required: [true, "Mobile number is required."],
    },
    gender: {
      type: String,
      enum:{
        values:["Male","Female","Other"],
        message:"Invalid value. Hint: valid inputs- Male,Female,Others"
      },
      required: [true, "Gender is required"],
    },
    otp:{
      type:Number,
      default:0
    },
    isEmailVerfied:{
      type:Boolean,
      default:false
    },
    type:{
      type:String,
      default:"User"
    }
  },
  { timestamps: true }
);


userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) next();
  this.password = await bcrypt.hash(this.password, 11);
});

userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.getJWTToken = function () {
  return jwt.sign({ userId: this._id }, process.env.JWT_SECRET);
};

module.exports = mongoose.model("User", userSchema);
