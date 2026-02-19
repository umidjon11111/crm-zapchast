import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISale extends Document {
  productCode: string;
  productName: string;
  quantitySold: number;
  quantityBefore: number;
  quantityAfter: number;
  soldAt: Date;
  note?: string;
}

const SaleSchema = new Schema<ISale>(
  {
    productCode: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    productName: { type: String, required: true },
    quantitySold: { type: Number, required: true, min: 1 },
    quantityBefore: { type: Number, required: true },
    quantityAfter: { type: Number, required: true },
    note: { type: String, trim: true },
    soldAt: { type: Date, default: () => new Date(), index: true },
  },
  { timestamps: false },
);

SaleSchema.index({ soldAt: -1 });
SaleSchema.index({ productCode: 1, soldAt: -1 });

const Sale: Model<ISale> =
  mongoose.models.Sale || mongoose.model<ISale>("Sale", SaleSchema);

export default Sale;
