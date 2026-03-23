const mongoose = require("mongoose");

const HabitSchema = new mongoose.Schema({

userId:{
type:mongoose.Schema.Types.ObjectId,
ref:"User"
},

habitName:String,

date:{
type:Date,
default:Date.now
},

completed:Boolean

});

module.exports = mongoose.model("Habit",HabitSchema);