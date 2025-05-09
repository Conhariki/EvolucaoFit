import mongoose, { Document, Schema } from 'mongoose';

export interface IPhoto extends Document {
  userId: mongoose.Types.ObjectId;
  date: Date;
  angle: 'front' | 'back' | 'left' | 'right' | 'double-biceps' | string;
  url: string;
  thumbnailUrl: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const photoSchema = new Schema<IPhoto>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  angle: {
    type: String,
    required: true,
    enum: ['front', 'back', 'left', 'right', 'double-biceps'],
    default: 'front'
  },
  url: {
    type: String,
    required: true
  },
  thumbnailUrl: {
    type: String,
    required: true
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Index for efficient querying
photoSchema.index({ userId: 1, date: -1, angle: 1 });

export const Photo = mongoose.model<IPhoto>('Photo', photoSchema); 