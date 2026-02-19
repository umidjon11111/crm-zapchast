import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Sale from "@/models/sale";

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const month = searchParams.get("month"); // 2024-01

    let sales: Array<{
      productCode: string;
      productName: string;
      quantitySold: number;
      quantityBefore: number;
      quantityAfter: number;
      soldAt: Date;
      note?: string;
    }> = [];

    const filter: Record<string, unknown> = {};
    if (month) {
      const [year, mon] = month.split("-").map(Number);
      filter.soldAt = {
        $gte: new Date(year, mon - 1, 1),
        $lt: new Date(year, mon, 1),
      };
    }

    sales = (await Sale.find(filter)
      .sort({ soldAt: -1 })
      .lean()) as typeof sales;

    // Build CSV in-memory (no external dep needed, xlsx via client)
    // Return JSON for client-side Excel generation
    return NextResponse.json({
      month: month || "all",
      generatedAt: new Date().toISOString(),
      count: sales.length,
      sales: sales.map((s) => ({
        Sana: new Date(s.soldAt).toLocaleDateString("uz-UZ"),
        Vaqt: new Date(s.soldAt).toLocaleTimeString("uz-UZ"),
        "Mahsulot kodi": s.productCode,
        "Mahsulot nomi": s.productName,
        "Sotilgan miqdor": s.quantitySold,
        "Sotishdan oldin": s.quantityBefore,
        "Sotishdan keyin": s.quantityAfter,
        Izoh: s.note || "",
      })),
    });
  } catch (error) {
    console.error("GET /api/sales/export error:", error);
    return NextResponse.json({ error: "Server xatosi" }, { status: 500 });
  }
}
