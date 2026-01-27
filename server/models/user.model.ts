import mongoose, { Schema, Document, Model, Types } from "mongoose";
import bcrypt from "bcryptjs";
import crypto from "crypto";

// 1. Define interface for the sub-document
interface IEnrolledCourse {
  course: Types.ObjectId;
  enrolledAt: Date;
}

// 2. Define the main User interface
export interface IUser extends Document {
  name: string;
  email: string;
  password?: string; // Optional because of select: false
  role: "student" | "instructor" | "admin";
  avatar: string;
  bio?: string;
  enrolledCourses: Types.DocumentArray<IEnrolledCourse>;
  createdCourses: Types.Array<Types.ObjectId>;
  resetPasswordToken?: string;
  resetPasswordExpire?: Date;
  lastActive: Date;
  createdAt: Date;
  updatedAt: Date;

  // Virtuals
  totalEnrolledCourses: number;

  // Instance Method Signatures
  comparePassword(enteredPassword: string): Promise<boolean>;
  getResetPasswordToken(): string;
  updateLastActive(): Promise<IUser>;
}

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxLength: [50, "Name cannot exceed 50 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/,
        "Please provide a valid email",
      ],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minLength: [8, "Password must be at least 8 characters"],
      select: false,
    },
    role: {
      type: String,
      enum: {
        values: ["student", "instructor", "admin"],
        message: "Please select a valid role",
      },
      default: "student",
    },
    avatar: {
      type: String,
      default: "default-avatar.png",
    },
    bio: {
      type: String,
      maxLength: [200, "Bio cannot exceed 200 characters"],
    },
    enrolledCourses: [
      {
        course: {
          type: Schema.Types.ObjectId,
          ref: "Course",
        },
        enrolledAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    createdCourses: [
      {
        type: Schema.Types.ObjectId,
        ref: "Course",
      },
    ],
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    lastActive: {
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

// 3. Password Encryption Hook
userSchema.pre<IUser>("save", async function () {
  if (!this.isModified("password")) {
    const err = new Error("Password is required");
    throw err;
  }
  // Use non-null assertion (!) because we know password exists if modified
  this.password = await bcrypt.hash(this.password!, 12);
});

// 4. Instance Methods
userSchema.methods.comparePassword = async function (
  this: IUser,
  enteredPassword: string,
): Promise<boolean> {
  return await bcrypt.compare(enteredPassword, this.password!);
};

userSchema.methods.getResetPasswordToken = function (this: IUser): string {
  const resetToken = crypto.randomBytes(20).toString("hex");
  this.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  this.resetPasswordExpire = new Date(Date.now() + 10 * 60 * 1000);
  return resetToken;
};

userSchema.methods.updateLastActive = function (this: IUser): Promise<IUser> {
  this.lastActive = new Date();
  return this.save({ validateBeforeSave: false });
};

// 5. Virtual Field
userSchema.virtual("totalEnrolledCourses").get(function (this: IUser) {
  return this.enrolledCourses?.length || 0;
});

// 6. Export Model
export const User: Model<IUser> = mongoose.model<IUser>("User", userSchema);
