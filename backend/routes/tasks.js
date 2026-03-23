const express = require("express");
const router = express.Router();
const Task = require("../models/Task");

// ADD TASK
router.post("/", async(req,res)=>{

const task = new Task(req.body);

await task.save();

res.json(task);

});


// GET TASKS
router.get("/:userId", async(req,res)=>{

const tasks = await Task.find({
userId:req.params.userId
});

res.json(tasks);

});

module.exports = router;