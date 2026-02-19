"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  BarChart2,
  ArrowLeft,
  Download,
  ChevronLeft,
  ChevronRight,
  TrendingDown,
  Package,
  ShoppingCart,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface MonthlyStat {
  _id: { year: number; month: number };
  totalSold: number;
  transactions: number;
  products: string[];
}

interface MonthlyDetail {
  _id: string;
  productName: string;
  totalSold: number;
  transactions: number;
  lastSoldAt: string;
}

interface Sale {
  _id: string;
  productCode: string;
  productName: string;
  quantitySold: number;
  quantityBefore: number;
  quantityAfter: number;
  soldAt: string;
  note?: string;
}

const UZ_MONTHS = [
  "",
  "Yanvar",
  "Fevral",
  "Mart",
  "Aprel",
  "May",
  "Iyun",
  "Iyul",
  "Avgust",
  "Sentabr",
  "Oktabr",
  "Noyabr",
  "Dekabr",
];

function formatMonth(year: number, month: number) {
  return `${UZ_MONTHS[month]} ${year}`;
}

function toMonthString(year: number, month: number) {
  return `${year}-${String(month).padStart(2, "0")}`;
}

function getCurrentMonth() {
  const now = new Date();
  return toMonthString(now.getFullYear(), now.getMonth() + 1);
}

// Client-side Excel export using SheetJS from CDN loaded dynamically
async function exportToExcel(month: string) {
  const res = await fetch(`/api/sales/export?month=${month}`);
  if (!res.ok) return;
  const data = await res.json();

  // Dynamically import xlsx
  const XLSX = await import("xlsx");

  const wb = XLSX.utils.book_new();

  // Sheet 1: Detail
  const ws1 = XLSX.utils.json_to_sheet(data.sales);
  ws1["!cols"] = [
    { wch: 14 },
    { wch: 10 },
    { wch: 16 },
    { wch: 30 },
    { wch: 16 },
    { wch: 18 },
    { wch: 18 },
    { wch: 20 },
  ];
  XLSX.utils.book_append_sheet(wb, ws1, "Sotuvlar");

  // Sheet 2: Summary by product
  const summary: Record<string, { nomi: string; jami: number; marta: number }> =
    {};
  for (const row of data.sales) {
    const k = row["Mahsulot kodi"];
    if (!summary[k])
      summary[k] = { nomi: row["Mahsulot nomi"], jami: 0, marta: 0 };
    summary[k].jami += row["Sotilgan miqdor"];
    summary[k].marta += 1;
  }
  const summaryRows = Object.entries(summary).map(([code, v]) => ({
    "Mahsulot kodi": code,
    "Mahsulot nomi": v.nomi,
    "Jami sotilgan (dona)": v.jami,
    "Sotish soni (marta)": v.marta,
  }));
  const ws2 = XLSX.utils.json_to_sheet(summaryRows);
  ws2["!cols"] = [{ wch: 16 }, { wch: 30 }, { wch: 22 }, { wch: 22 }];
  XLSX.utils.book_append_sheet(wb, ws2, "Mahsulot xulosasi");

  const [year, mon] = month.split("-");
  const fileName = `Zapchast_${UZ_MONTHS[parseInt(mon)]}_${year}.xlsx`;
  XLSX.writeFile(wb, fileName);
}

export default function StatisticsPage() {
  const router = useRouter();
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStat[]>([]);
  const [monthDetail, setMonthDetail] = useState<MonthlyDetail[]>([]);
  const [recentSales, setRecentSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "detail" | "history">(
    "overview",
  );

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, detailRes, salesRes] = await Promise.all([
        fetch("/api/sales?mode=monthly"),
        fetch(`/api/sales?mode=monthly-detail&month=${selectedMonth}`),
        fetch(`/api/sales?month=${selectedMonth}`),
      ]);
      if (statsRes.ok) setMonthlyStats(await statsRes.json());
      if (detailRes.ok) setMonthDetail(await detailRes.json());
      if (salesRes.ok) setRecentSales(await salesRes.json());
    } finally {
      setLoading(false);
    }
  }, [selectedMonth]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function shiftMonth(delta: number) {
    const [y, m] = selectedMonth.split("-").map(Number);
    const d = new Date(y, m - 1 + delta, 1);
    setSelectedMonth(toMonthString(d.getFullYear(), d.getMonth() + 1));
  }

  const currentStat = monthlyStats.find(
    (s) => toMonthString(s._id.year, s._id.month) === selectedMonth,
  );

  const [selYear, selMon] = selectedMonth.split("-").map(Number);

  async function handleExport() {
    setExporting(true);
    try {
      await exportToExcel(selectedMonth);
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-blue-600 text-white px-4 py-4 shadow-md sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/dashboard")}
              className="hover:bg-blue-700 p-1.5 rounded-lg"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2">
              <BarChart2 className="h-5 w-5" />
              <span className="font-bold text-lg">Statistika</span>
            </div>
          </div>
          <Button
            size="sm"
            onClick={handleExport}
            disabled={exporting || recentSales.length === 0}
            className="bg-green-500 hover:bg-green-600 text-white rounded-xl gap-1.5"
          >
            <Download className="h-4 w-4" />
            {exporting ? "Yuklanmoqda..." : "Excel"}
          </Button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-5 space-y-5">
        {/* Month Selector */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => shiftMonth(-1)}
              className="h-10 w-10 flex items-center justify-center rounded-xl hover:bg-slate-100 text-slate-600"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div className="text-center">
              <div className="flex items-center gap-2 justify-center">
                <Calendar className="h-4 w-4 text-blue-500" />
                <span className="font-bold text-lg text-slate-800">
                  {formatMonth(selYear, selMon)}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">{selectedMonth}</p>
            </div>
            <button
              onClick={() => shiftMonth(1)}
              disabled={selectedMonth >= getCurrentMonth()}
              className="h-10 w-10 flex items-center justify-center rounded-xl hover:bg-slate-100 text-slate-600 disabled:opacity-30"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 text-center">
            <ShoppingCart className="h-5 w-5 text-blue-500 mx-auto mb-1" />
            <p className="text-2xl font-bold text-slate-800">
              {loading ? "—" : (currentStat?.totalSold ?? 0)}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">Sotilgan dona</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 text-center">
            <BarChart2 className="h-5 w-5 text-green-500 mx-auto mb-1" />
            <p className="text-2xl font-bold text-slate-800">
              {loading ? "—" : (currentStat?.transactions ?? 0)}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">Tranzaksiya</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 text-center">
            <Package className="h-5 w-5 text-purple-500 mx-auto mb-1" />
            <p className="text-2xl font-bold text-slate-800">
              {loading ? "—" : (currentStat?.products?.length ?? 0)}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">Mahsulot turi</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex bg-slate-100 rounded-xl p-1 gap-1">
          {(["overview", "detail", "history"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 px-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {tab === "overview"
                ? "Oylik"
                : tab === "detail"
                  ? "Mahsulotlar"
                  : "Tarix"}
            </button>
          ))}
        </div>

        {/* Tab: Monthly overview */}
        {activeTab === "overview" && (
          <div className="space-y-3">
            <h3 className="font-semibold text-slate-600 text-sm px-1">
              Oxirgi oylar statistikasi
            </h3>
            {loading ? (
              <div className="bg-white rounded-2xl p-8 text-center text-slate-400">
                Yuklanmoqda...
              </div>
            ) : monthlyStats.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center text-slate-400">
                Hali sotuv yo'q
              </div>
            ) : (
              monthlyStats.map((s) => {
                const isSelected =
                  toMonthString(s._id.year, s._id.month) === selectedMonth;
                return (
                  <button
                    key={`${s._id.year}-${s._id.month}`}
                    onClick={() =>
                      setSelectedMonth(toMonthString(s._id.year, s._id.month))
                    }
                    className={`w-full bg-white rounded-2xl p-4 shadow-sm border text-left transition-all ${
                      isSelected
                        ? "border-blue-400 ring-2 ring-blue-100"
                        : "border-slate-100 hover:border-slate-200"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-slate-800">
                          {formatMonth(s._id.year, s._id.month)}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {s.transactions} tranzaksiya · {s.products.length} xil
                          mahsulot
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-blue-600">
                          {s.totalSold}
                        </p>
                        <p className="text-xs text-slate-400">dona</p>
                      </div>
                    </div>
                    {/* Mini bar */}
                    <div className="mt-3 bg-slate-100 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{
                          width: `${Math.min(100, (s.totalSold / Math.max(...monthlyStats.map((x) => x.totalSold))) * 100)}%`,
                        }}
                      />
                    </div>
                  </button>
                );
              })
            )}
          </div>
        )}

        {/* Tab: Product detail */}
        {activeTab === "detail" && (
          <div className="space-y-3">
            <h3 className="font-semibold text-slate-600 text-sm px-1">
              {formatMonth(selYear, selMon)} — mahsulotlar bo'yicha
            </h3>
            {loading ? (
              <div className="bg-white rounded-2xl p-8 text-center text-slate-400">
                Yuklanmoqda...
              </div>
            ) : monthDetail.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center text-slate-400">
                Bu oyda sotuv yo'q
              </div>
            ) : (
              monthDetail.map((d, i) => (
                <div
                  key={d._id}
                  className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <span className="text-slate-300 font-bold text-lg w-6 flex-shrink-0">
                        {i + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs text-slate-400 font-mono">
                          {d._id}
                        </p>
                        <p className="font-semibold text-slate-800 truncate">
                          {d.productName}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {d.transactions} marta sotilgan
                        </p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-2xl font-bold text-green-600">
                        {d.totalSold}
                      </p>
                      <p className="text-xs text-slate-400">dona</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab: History */}
        {activeTab === "history" && (
          <div className="space-y-3">
            <h3 className="font-semibold text-slate-600 text-sm px-1">
              {formatMonth(selYear, selMon)} — sotuv tarixi
            </h3>
            {loading ? (
              <div className="bg-white rounded-2xl p-8 text-center text-slate-400">
                Yuklanmoqda...
              </div>
            ) : recentSales.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center text-slate-400">
                Bu oyda sotuv yo'q
              </div>
            ) : (
              recentSales.map((s) => {
                const d = new Date(s.soldAt);
                return (
                  <div
                    key={s._id}
                    className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-slate-400 font-mono">
                          {s.productCode}
                        </p>
                        <p className="font-semibold text-slate-800">
                          {s.productName}
                        </p>
                        <div className="flex items-center gap-3 mt-1.5">
                          <Badge className="bg-slate-100 text-slate-500 text-xs">
                            {d.toLocaleDateString("uz-UZ")}{" "}
                            {d.toLocaleTimeString("uz-UZ", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </Badge>
                          {s.note && (
                            <span className="text-xs text-slate-400 truncate">
                              {s.note}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xl font-bold text-red-500">
                          −{s.quantitySold}
                        </p>
                        <div className="flex items-center gap-1 justify-end mt-1">
                          <span className="text-xs text-slate-400">
                            {s.quantityBefore}
                          </span>
                          <TrendingDown className="h-3 w-3 text-red-400" />
                          <span className="text-xs font-semibold text-slate-700">
                            {s.quantityAfter}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Export hint */}
        {recentSales.length > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-center justify-between gap-3">
            <div>
              <p className="font-semibold text-green-800 text-sm">
                Excel hisobotni yuklab olish
              </p>
              <p className="text-xs text-green-600 mt-0.5">
                {recentSales.length} ta sotuv · {formatMonth(selYear, selMon)}
              </p>
            </div>
            <Button
              size="sm"
              onClick={handleExport}
              disabled={exporting}
              className="bg-green-600 hover:bg-green-700 text-white rounded-xl gap-1.5 flex-shrink-0"
            >
              <Download className="h-4 w-4" />
              {exporting ? "..." : "Yuklab olish"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
