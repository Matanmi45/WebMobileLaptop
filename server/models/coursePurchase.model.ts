import mongoose, { Schema, Document, Model, Types } from "mongoose";

// 1. Define the Interface for the Document
export interface ICoursePurchase extends Document {
  course: Types.ObjectId;
  user: Types.ObjectId;
  amount: number;
  currency: string;
  status: "pending" | "completed" | "failed" | "refunded";
  paymentMethod: string;
  paymentId: string;
  refundId?: string;
  refundAmount?: number;
  refundReason?: string;
  metadata?: Map<string, string>;
  createdAt: Date;
  updatedAt: Date;

  // Virtual
  isRefundable: boolean;

  // Methods
  processRefund(reason: string, amount?: number): Promise<ICoursePurchase>;
}

// 2. Create the Schema
const coursePurchaseSchema = new Schema<ICoursePurchase>(
  {
    course: {
      type: Schema.Types.ObjectId,
      ref: "Course",
      required: [true, "Course reference is required"],
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User reference is required"],
    },
    amount: {
      type: Number,
      required: [true, "Purchase amount is required"],
      min: [0, "Amount must be non-negative"],
    },
    currency: {
      type: String,
      required: [true, "Currency is required"],
      uppercase: true,
      default: "USD",
    },
    status: {
      type: String,
      enum: {
        values: ["pending", "completed", "failed", "refunded"],
        message: "Please select a valid status",
      },
      default: "pending",
    },
    paymentMethod: {
      type: String,
      required: [true, "Payment method is required"],
    },
    paymentId: {
      type: String,
      required: [true, "Payment ID is required"],
    },
    refundId: {
      type: String,
    },
    refundAmount: {
      type: Number,
      min: [0, "Refund amount must be non-negative"],
    },
    refundReason: {
      type: String,
    },
    metadata: {
      type: Map,
      of: String,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// 3. Indexes
coursePurchaseSchema.index({ user: 1, course: 1 });
coursePurchaseSchema.index({ status: 1 });
coursePurchaseSchema.index({ createdAt: -1 });

// 4. Virtual Field
coursePurchaseSchema.virtual("isRefundable").get(function (
  this: ICoursePurchase,
) {
  if (this.status !== "completed") return false;
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  return this.createdAt > thirtyDaysAgo;
});

// 5. Instance Method
coursePurchaseSchema.methods.processRefund = async function (
  this: ICoursePurchase,
  reason: string,
  amount?: number,
): Promise<ICoursePurchase> {
  this.status = "refunded";
  this.refundReason = reason;
  this.refundAmount = amount || this.amount;
  return this.save();
};

// 6. Define and Export Model
export const CoursePurchase: Model<ICoursePurchase> =
  mongoose.model<ICoursePurchase>("CoursePurchase", coursePurchaseSchema);
