import mongoose, { Schema, Document, Model, Types } from "mongoose";

// 1. Interface for LectureProgress Subdocument
interface ILectureProgress {
  lecture: Types.ObjectId;
  isCompleted: boolean;
  watchTime: number;
  lastWatched: Date;
}

interface ICourseProgressMethods {
  updateLastAccessed(): Promise<ICourseProgress>;
}

// 2. Interface for CourseProgress Document
export interface ICourseProgress extends Document {
  user: Types.ObjectId;
  course: Types.ObjectId;
  isCompleted: boolean;
  completionPercentage: number;
  lectureProgress: Types.DocumentArray<ILectureProgress>; // Use DocumentArray for subdocs
  lastAccessed: Date;
  createdAt: Date;
  updatedAt: Date;

 
}

// 3. Lecture Progress Sub-Schema
const lectureProgressSchema = new Schema<ILectureProgress>({
  lecture: {
    type: Schema.Types.ObjectId,
    ref: "Lecture",
    required: [true, "Lecture reference is required"],
  },
  isCompleted: {
    type: Boolean,
    default: false,
  },
  watchTime: {
    type: Number,
    default: 0,
  },
  lastWatched: {
    type: Date,
    default: Date.now,
  },
});

// 4. Course Progress Main Schema
const courseProgressSchema = new Schema<
  ICourseProgress,
  Model<ICourseProgress>,
  ICourseProgressMethods
>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User reference is required"],
    },
    course: {
      type: Schema.Types.ObjectId,
      ref: "Course",
      required: [true, "Course reference is required"],
    },
    isCompleted: {
      type: Boolean,
      default: false,
    },
    completionPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    lectureProgress: [lectureProgressSchema],
    lastAccessed: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// 5. Pre-save Hook for Logic
courseProgressSchema.pre<ICourseProgress>("save", async function (next) {
  if (this.lectureProgress.length > 0) {
    const completedLectures = this.lectureProgress.filter(
      (lp) => lp.isCompleted,
    ).length;
    this.completionPercentage = Math.round(
      (completedLectures / this.lectureProgress.length) * 100,
    );
    this.isCompleted = this.completionPercentage === 100;
  }
});

// 6. Instance Method
courseProgressSchema.methods.updateLastAccessed = function (
  this: ICourseProgress,
): Promise<ICourseProgress> {
  this.lastAccessed = new Date();
  return this.save({ validateBeforeSave: false });
};

// 7. Export Model
export const CourseProgress =
  mongoose.model<ICourseProgress>("CourseProgress", courseProgressSchema);
