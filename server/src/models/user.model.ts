import mongoose, { Schema, Document, Model, Types } from "mongoose";
import bcrypt from "bcryptjs";
import crypto from "crypto"
import { HydratedDocument} from "mongoose";



// 1. Define interface for the sub-document
interface IEnrolledCourse {
  course: Types.ObjectId;
  enrolledAt: Date;
}

interface UserMethods {
  comparePassword(enteredPassword: string): Promise<boolean>;
  getResetPasswordToken(): string;
  updateLastActive(): Promise<IUser>;
}

interface UserVirtuals {
  totalEnrolledCourses: number;
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


}

//export type UserDocument = HydratedDocument<IUser, UserMethods & UserVirtuals>;
type UserDocument = Document & IUser & UserMethods & UserVirtuals

type UserModelType = Model<UserDocument, {}, UserMethods>;

const userSchema = new Schema<
  IUser,
  UserModelType,
  UserMethods
>(
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
    return;
  }
  // Use non-null assertion (!) because we know password exists if modified
  this.password = await bcrypt.hash(this.password!, 12);
});

// 4. Instance Methods
userSchema.method(
  "comparePassword",
  async function (enteredPassword: string): Promise<boolean> {
    const final = await bcrypt.compare(enteredPassword, this.password!);
    return final;
  },
);

userSchema.method("getResetPasswordToken", function (): string {
  const resetToken = crypto.randomBytes(20).toString("hex");
  this.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  this.resetPasswordExpire = new Date(Date.now() + 10 * 60 * 1000);
  return resetToken;
});

userSchema.method("updateLastActive", function ()  {
  this.lastActive = new Date();
  return this.save({ validateBeforeSave: false });
});

// 5. Virtual Field
userSchema.virtual("totalEnrolledCourses").get(function () {
  return this.enrolledCourses?.length || 0;
});

// 6. Export Model
export const User = mongoose.model<IUser, UserModelType>("User", userSchema);
