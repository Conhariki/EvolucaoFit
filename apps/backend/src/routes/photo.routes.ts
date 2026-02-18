import express from 'express';
import multer from 'multer';
import { Photo } from '../models/Photo';
import { auth, checkRole } from '../middleware/auth.middleware';
import { uploadToStorage } from '../utils/storage';

const router = express.Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Upload photo
router.post('/', auth, upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No photo uploaded' });
    }

    const { url, thumbnailUrl } = await uploadToStorage(req.file, req.user._id);
    
    const photo = new Photo({
      userId: req.user._id,
      angle: req.body.angle,
      url,
      thumbnailUrl,
      notes: req.body.notes
    });

    await photo.save();
    res.status(201).json(photo);
  } catch (error) {
    res.status(400).json({ message: 'Error uploading photo' });
  }
});

// Get user's photos
router.get('/my-photos', auth, async (req, res) => {
  try {
    const photos = await Photo.find({ userId: req.user._id })
      .sort({ date: -1 });
    res.json(photos);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching photos' });
  }
});

// Get student's photos (professor only)
router.get('/student/:studentId', auth, checkRole(['professor']), async (req, res) => {
  try {
    const photos = await Photo.find({ userId: req.params.studentId })
      .sort({ date: -1 });
    res.json(photos);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching student photos' });
  }
});

// Get photos by date range
router.get('/date-range', auth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const photos = await Photo.find({
      userId: req.user._id,
      date: {
        $gte: new Date(startDate as string),
        $lte: new Date(endDate as string)
      }
    }).sort({ date: -1 });
    
    res.json(photos);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching photos by date range' });
  }
});

// Delete photo
router.delete('/:id', auth, async (req, res) => {
  try {
    const photo = await Photo.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!photo) {
      return res.status(404).json({ message: 'Photo not found' });
    }

    // TODO: Delete from storage
    res.json({ message: 'Photo deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting photo' });
  }
});

export const photoRoutes = router; 