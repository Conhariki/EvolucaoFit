import express from 'express';
import { Measurement } from '../models/Measurement';
import { auth, checkRole } from '../middleware/auth.middleware';

const router = express.Router();

// Create measurement
router.post('/', auth, async (req, res) => {
  try {
    const measurement = new Measurement({
      ...req.body,
      userId: req.user._id
    });

    await measurement.save();
    res.status(201).json(measurement);
  } catch (error) {
    res.status(400).json({ message: 'Error creating measurement' });
  }
});

// Get user's measurements
router.get('/my-measurements', auth, async (req, res) => {
  try {
    const measurements = await Measurement.find({ userId: req.user._id })
      .sort({ date: -1 });
    res.json(measurements);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching measurements' });
  }
});

// Get student's measurements (professor only)
router.get('/student/:studentId', auth, checkRole(['professor']), async (req, res) => {
  try {
    const measurements = await Measurement.find({ userId: req.params.studentId })
      .sort({ date: -1 });
    res.json(measurements);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching student measurements' });
  }
});

// Update measurement
router.patch('/:id', auth, async (req, res) => {
  try {
    const measurement = await Measurement.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!measurement) {
      return res.status(404).json({ message: 'Measurement not found' });
    }

    Object.assign(measurement, req.body);
    await measurement.save();
    res.json(measurement);
  } catch (error) {
    res.status(400).json({ message: 'Error updating measurement' });
  }
});

// Delete measurement
router.delete('/:id', auth, async (req, res) => {
  try {
    const measurement = await Measurement.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!measurement) {
      return res.status(404).json({ message: 'Measurement not found' });
    }

    res.json({ message: 'Measurement deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting measurement' });
  }
});

export const measurementRoutes = router; 