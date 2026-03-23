const express = require("express");
const router = express.Router();
const Habit = require("../models/Habit");

// SAVE HABIT
router.post("/", async (req, res) => {
  try {
    const habit = new Habit(req.body);
    await habit.save();
    res.json(habit);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to save habit" });
  }
});

// GET HABITS
router.get("/:userId", async (req, res) => {
  try {
    const habits = await Habit.find({
      userId: req.params.userId,
    });
    res.json(habits);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch habits" });
  }
});

module.exports = router;