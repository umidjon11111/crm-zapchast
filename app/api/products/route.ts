import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Product from "@/models/product";

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");

    if (code) {
      const product = await Product.findOne({
        productCode: code.trim().toUpperCase(),
      }).lean();

      if (!product) {
        return NextResponse.json(
          { error: "Mahsulot topilmadi" },
          { status: 404 },
        );
      }

      return NextResponse.json(product);
    }

    // Return all products
    const products = await Product.find({}).sort({ createdAt: -1 }).lean();
    return NextResponse.json(products);
  } catch (error) {
    console.error("GET /api/products error:", error);
    return NextResponse.json({ error: "Server xatosi" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const body = await req.json();
    const { productCode, productName, quantity, location } = body;

    if (!productCode || !productName) {
      return NextResponse.json(
        { error: "productCode va productName majburiy" },
        { status: 400 },
      );
    }

    const existing = await Product.findOne({
      productCode: productCode.trim().toUpperCase(),
    });

    if (existing) {
      return NextResponse.json(
        { error: "Bu kod bilan mahsulot allaqachon mavjud" },
        { status: 409 },
      );
    }

    const product = await Product.create({
      productCode: productCode.trim().toUpperCase(),
      productName: productName.trim(),
      quantity: quantity ?? 0,
      location: location?.trim(),
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error("POST /api/products error:", error);
    return NextResponse.json({ error: "Server xatosi" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await connectDB();

    const body = await req.json();
    const { productCode, quantity } = body;

    if (!productCode || quantity === undefined) {
      return NextResponse.json(
        { error: "productCode va quantity majburiy" },
        { status: 400 },
      );
    }

    if (typeof quantity !== "number" || quantity < 0) {
      return NextResponse.json(
        { error: "quantity musbat son bo'lishi kerak" },
        { status: 400 },
      );
    }

    const product = await Product.findOneAndUpdate(
      { productCode: productCode.trim().toUpperCase() },
      { $set: { quantity } },
      { new: true },
    ).lean();

    if (!product) {
      return NextResponse.json(
        { error: "Mahsulot topilmadi" },
        { status: 404 },
      );
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error("PATCH /api/products error:", error);
    return NextResponse.json({ error: "Server xatosi" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");

    if (!code) {
      return NextResponse.json(
        { error: "productCode majburiy" },
        { status: 400 },
      );
    }

    const product = await Product.findOneAndDelete({
      productCode: code.trim().toUpperCase(),
    });

    if (!product) {
      return NextResponse.json(
        { error: "Mahsulot topilmadi" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, deleted: code.toUpperCase() });
  } catch (error) {
    console.error("DELETE /api/products error:", error);
    return NextResponse.json({ error: "Server xatosi" }, { status: 500 });
  }
}
