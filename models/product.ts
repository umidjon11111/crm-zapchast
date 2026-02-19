import mongoose, { Schema, Document, Model } from "mongoose";

export interface IProduct extends Document {
  productCode: string;
  productName: string;
  quantity: number;
  location?: string;
  createdAt: Date;
}

const ProductSchema = new Schema<IProduct>(
  {
    productCode: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
      uppercase: true,
    },
    productName: {
      type: String,
      required: true,
      trim: true,
    },
    quantity: {
      type: Number,
      default: 0,
      min: 0,
    },
    location: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

ProductSchema.index({ productCode: 1 }, { unique: true });
ProductSchema.index({ productName: "text" });

const Product: Model<IProduct> =
  mongoose.models.Product || mongoose.model<IProduct>("Product", ProductSchema);

export default Product;
