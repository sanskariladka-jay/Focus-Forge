const express = require("express");
const router = express.Router();
const Task = require("../models/Task");

// ADD TASK
router.post("/", async (req, res) => {
  try {
    const task = new Task(req.body);
    await task.save();
    res.json(task);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to add task" });
  }
});

// GET TASKS
router.get("/:userId", async (req, res) => {
  try {
    const tasks = await Task.find({
      userId: req.params.userId,
    });
    res.json(tasks);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch tasks" });
  }
});

module.exports = router;