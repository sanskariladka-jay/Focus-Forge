const express = require("express");
const router = express.Router();
const Habit = require("../models/Habit");

// SAVE HABIT
router.post("/", async(req,res)=>{

const habit = new Habit(req.body);

await habit.save();

res.json(habit);

});

// GET HABITS
router.get("/:userId", async(req,res)=>{

const habits = await Habit.find({
userId:req.params.userId
});

res.json(habits);

});

module.exports = router;