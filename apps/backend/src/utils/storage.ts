import * as admin from 'firebase-admin';
import sharp from 'sharp';

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
    }),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET
  });
}

const bucket = admin.storage().bucket();

export const uploadToStorage = async (file: Express.Multer.File, userId: string) => {
  try {
    // Generate unique filename
    const timestamp = Date.now();
    const filename = `${userId}/${timestamp}-${file.originalname}`;
    const thumbnailFilename = `${userId}/${timestamp}-thumb-${file.originalname}`;

    // Create thumbnail
    const thumbnailBuffer = await sharp(file.buffer)
      .resize(300, 300, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .jpeg({ quality: 80 })
      .toBuffer();

    // Upload original image
    const fileUpload = bucket.file(filename);
    await fileUpload.save(file.buffer, {
      metadata: {
        contentType: file.mimetype
      }
    });

    // Upload thumbnail
    const thumbnailUpload = bucket.file(thumbnailFilename);
    await thumbnailUpload.save(thumbnailBuffer, {
      metadata: {
        contentType: 'image/jpeg'
      }
    });

    // Get public URLs
    const [url] = await fileUpload.getSignedUrl({
      action: 'read',
      expires: '03-01-2500' // Long expiration for demo purposes
    });

    const [thumbnailUrl] = await thumbnailUpload.getSignedUrl({
      action: 'read',
      expires: '03-01-2500'
    });

    return { url, thumbnailUrl };
  } catch (error) {
    console.error('Error uploading to storage:', error);
    throw new Error('Failed to upload file');
  }
};

export const deleteFromStorage = async (url: string) => {
  try {
    const filename = url.split('/').pop()?.split('?')[0];
    if (!filename) {
      throw new Error('Invalid file URL');
    }

    await bucket.file(filename).delete();
  } catch (error) {
    console.error('Error deleting from storage:', error);
    throw new Error('Failed to delete file');
  }
}; 