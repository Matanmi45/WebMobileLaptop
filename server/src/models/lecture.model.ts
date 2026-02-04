import mongoose, { Schema, Document, Model } from "mongoose";

// 1. Define the interface representing the document
export interface ILecture extends Document {
  title: string;
  description?: string;
  videoUrl: string;
  duration: number;
  publicId: string;
  isPreview: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

// 2. Create the Schema using the interface as a generic
const lectureSchema = new Schema<ILecture>(
  {
    title: {
      type: String,
      required: [true, "Lecture title is required"],
      trim: true,
      maxLength: [100, "Lecture title cannot exceed 100 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxLength: [500, "Lecture description cannot exceed 500 characters"],
    },
    videoUrl: {
      type: String,
      required: [true, "Video URL is required"],
    },
    duration: {
      type: Number,
      default: 0,
    },
    publicId: {
      type: String,
      required: [true, "Public ID is required for video management"],
    },
    isPreview: {
      type: Boolean,
      default: false,
    },
    order: {
      type: Number,
      required: [true, "Lecture order is required"],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// 3. Document Middleware (use 'this' typing)
lectureSchema.pre<ILecture>("save", async function () {
  if (this.duration !== undefined) {
    // Round duration to 2 decimal places
    this.duration = Math.round(this.duration * 100) / 100;
  }
});

// 4. Create and export the Model
export const Lecture: Model<ILecture> = mongoose.model<ILecture>(
  "Lecture",
  lectureSchema,
);
