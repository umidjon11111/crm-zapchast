import { NextRequest, NextResponse } from "next/server";
import { PipelineStage } from "mongoose";
import connectDB from "@/lib/mongodb";
import Sale from "@/models/sale";
import Product from "@/models/product";

// GET /api/sales?mode=list|monthly&month=2024-01&code=ABC
export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const mode = searchParams.get("mode") || "list";
    const month = searchParams.get("month"); // format: 2024-01
    const code = searchParams.get("code");

    if (mode === "monthly") {
      // Group by month, return monthly totals
      const pipeline: PipelineStage[] = [
        {
          $group: {
            _id: {
              year: { $year: "$soldAt" },
              month: { $month: "$soldAt" },
            },
            totalSold: { $sum: "$quantitySold" },
            transactions: { $sum: 1 },
            products: { $addToSet: "$productCode" },
          },
        },
        { $sort: { "_id.year": -1, "_id.month": -1 } },
        { $limit: 24 },
      ];
      const data = await Sale.aggregate(pipeline);
      return NextResponse.json(data);
    }

    if (mode === "monthly-detail" && month) {
      const [year, mon] = month.split("-").map(Number);
      const start = new Date(year, mon - 1, 1);
      const end = new Date(year, mon, 1);

      const pipeline: PipelineStage[] = [
        { $match: { soldAt: { $gte: start, $lt: end } } },
        {
          $group: {
            _id: "$productCode",
            productName: { $first: "$productName" },
            totalSold: { $sum: "$quantitySold" },
            transactions: { $sum: 1 },
            lastSoldAt: { $max: "$soldAt" },
          },
        },
        { $sort: { totalSold: -1 } },
      ] as const;
      const data = await Sale.aggregate(pipeline);
      return NextResponse.json(data);
    }

    // Default: list recent sales
    const filter: Record<string, unknown> = {};
    if (code) filter.productCode = code.toUpperCase();
    if (month) {
      const [year, mon] = month.split("-").map(Number);
      filter.soldAt = {
        $gte: new Date(year, mon - 1, 1),
        $lt: new Date(year, mon, 1),
      };
    }

    const sales = await Sale.find(filter)
      .sort({ soldAt: -1 })
      .limit(200)
      .lean();
    return NextResponse.json(sales);
  } catch (error) {
    console.error("GET /api/sales error:", error);
    return NextResponse.json({ error: "Server xatosi" }, { status: 500 });
  }
}

// POST /api/sales - record a sale
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const { productCode, quantitySold, note } = body;

    if (!productCode || !quantitySold || quantitySold < 1) {
      return NextResponse.json(
        { error: "productCode va quantitySold majburiy" },
        { status: 400 },
      );
    }

    const product = await Product.findOne({
      productCode: productCode.toUpperCase(),
    });
    if (!product) {
      return NextResponse.json(
        { error: "Mahsulot topilmadi" },
        { status: 404 },
      );
    }

    if (product.quantity < quantitySold) {
      return NextResponse.json(
        {
          error: `Omborda yetarli mahsulot yo'q. Mavjud: ${product.quantity} dona`,
        },
        { status: 400 },
      );
    }

    const quantityBefore = product.quantity;
    product.quantity -= quantitySold;
    await product.save();

    const sale = await Sale.create({
      productCode: product.productCode,
      productName: product.productName,
      quantitySold,
      quantityBefore,
      quantityAfter: product.quantity,
      note,
      soldAt: new Date(),
    });

    return NextResponse.json({ sale, product }, { status: 201 });
  } catch (error) {
    console.error("POST /api/sales error:", error);
    return NextResponse.json({ error: "Server xatosi" }, { status: 500 });
  }
}
