const express = require("express");
const router = express.Router();
const User = require("../models/User");
const bcrypt = require("bcryptjs");

// REGISTER
router.post("/register", async (req, res) => {

try {

const { username, password } = req.body;

const hash = await bcrypt.hash(password, 10);

const user = new User({
username,
password: hash
});

await user.save();

res.json({ message: "User Registered Successfully" });

} catch (err) {

console.log(err);
res.status(500).json({ message: "Server error" });

}

});


// LOGIN
router.post("/login", async(req,res)=>{

const {username,password} = req.body;

const user = await User.findOne({username});

if(!user){
return res.status(400).json({message:"User not found"});
}

const match = await bcrypt.compare(password,user.password);

if(!match){
return res.status(400).json({message:"Invalid Password"});
}

res.json({
message:"Login Successful",
userId:user._id
});

});

module.exports = router;