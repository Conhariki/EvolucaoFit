import mongoose, { Document, Schema } from 'mongoose';

export interface IMeasurement extends Document {
  userId: mongoose.Types.ObjectId;
  date: Date;
  weight: number;
  height: number;
  measurements: {
    arm?: number;
    chest?: number;
    waist?: number;
    hip?: number;
    thigh?: number;
    calf?: number;
    [key: string]: number | undefined;
  };
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const measurementSchema = new Schema<IMeasurement>({
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
  weight: {
    type: Number,
    required: true
  },
  height: {
    type: Number,
    required: true
  },
  measurements: {
    arm: Number,
    chest: Number,
    waist: Number,
    hip: Number,
    thigh: Number,
    calf: Number
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Index for efficient querying
measurementSchema.index({ userId: 1, date: -1 });

export const Measurement = mongoose.model<IMeasurement>('Measurement', measurementSchema); 