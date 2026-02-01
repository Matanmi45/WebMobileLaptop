import mongoose, { Schema, Document, Model, Types } from "mongoose";

interface courseVirtuals {
  averageRating: number;
}

// 1. Define the interface for the Course document
export interface ICourse extends Document {
  title: string;
  subtitle?: string;
  description?: string;
  category: string;
  level: "beginner" | "intermediate" | "advanced";
  price: number;
  thumbnail: string;
  enrolledStudents: Types.Array<Types.ObjectId>;
  lectures: Types.Array<Types.ObjectId>;
  instructor: Types.ObjectId;
  isPublished: boolean;
  totalDuration: number;
  totalLectures: number;
  createdAt: Date;
  updatedAt: Date;

  // Virtual
  //averageRating: number;
}

type CourseModelType = Model<ICourse, {}, {}, {}, courseVirtuals>;

// 2. Create the Schema using the interface
const courseSchema = new Schema<
  ICourse,
  CourseModelType,
  {},
  {},
  courseVirtuals
>(
  {
    title: {
      type: String,
      required: [true, "Course title is required"],
      trim: true,
      maxLength: [100, "Course title cannot exceed 100 characters"],
    },
    subtitle: {
      type: String,
      trim: true,
      maxLength: [200, "Course subtitle cannot exceed 200 characters"],
    },
    description: {
      type: String,
      trim: true,
    },
    category: {
      type: String,
      required: [true, "Course category is required"],
      trim: true,
    },
    level: {
      type: String,
      enum: {
        values: ["beginner", "intermediate", "advanced"],
        message: "Please select a valid course level",
      },
      default: "beginner",
    },
    price: {
      type: Number,
      required: [true, "Course price is required"],
      min: [0, "Course price must be non-negative"],
    },
    thumbnail: {
      type: String,
      required: [true, "Course thumbnail is required"],
    },
    enrolledStudents: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    lectures: [
      {
        type: Schema.Types.ObjectId,
        ref: "Lecture",
      },
    ],
    instructor: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Course instructor is required"],
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
    totalDuration: {
      type: Number,
      default: 0,
    },
    totalLectures: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// 3. Virtual field for average rating
courseSchema.virtual("averageRating").get(function (this: ICourse) {
  return 0; // Placeholder
});

// 4. Pre-save hook to update lecture count
courseSchema.pre<ICourse>("save", function () {
  if (this.lectures) {
    this.totalLectures = this.lectures.length;
  }
});

// 5. Define and Export the Model
export const Course: Model<ICourse> = mongoose.model<ICourse>(
  "Course",
  courseSchema,
);
