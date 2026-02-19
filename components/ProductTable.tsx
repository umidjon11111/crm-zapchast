"use client";

import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Pencil,
  ShoppingCart,
  Minus,
  Plus,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface Product {
  _id: string;
  productCode: string;
  productName: string;
  quantity: number;
  location?: string;
}

interface ProductTableProps {
  products: Product[];
  onUpdate: () => void;
}

type SortKey = "productCode" | "productName" | "quantity";
type SortDir = "asc" | "desc" | null;

const PAGE_SIZE = 10;

function StatusBadge({ quantity }: { quantity: number }) {
  if (quantity === 0)
    return (
      <Badge className="bg-red-100 text-red-700 border border-red-200 whitespace-nowrap font-medium">
        Qolmadi
      </Badge>
    );
  if (quantity === 1)
    return (
      <Badge className="bg-orange-100 text-orange-700 border border-orange-200 whitespace-nowrap font-medium">
        1 ta qoldi
      </Badge>
    );
  return (
    <Badge className="bg-green-100 text-green-700 border border-green-200 whitespace-nowrap font-medium">
      Mavjud
    </Badge>
  );
}

function SortIcon({
  col,
  sortKey,
  sortDir,
}: {
  col: SortKey;
  sortKey: SortKey | null;
  sortDir: SortDir;
}) {
  if (sortKey !== col)
    return (
      <ChevronsUpDown className="h-3.5 w-3.5 text-slate-300 ml-1 inline" />
    );
  if (sortDir === "asc")
    return <ChevronUp className="h-3.5 w-3.5 text-blue-500 ml-1 inline" />;
  return <ChevronDown className="h-3.5 w-3.5 text-blue-500 ml-1 inline" />;
}

export default function ProductTable({
  products,
  onUpdate,
}: ProductTableProps) {
  // Sort state
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>(null);

  // Pagination
  const [page, setPage] = useState(1);

  // Search filter inside table
  const [tableSearch, setTableSearch] = useState("");

  // Edit state
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [newQty, setNewQty] = useState("");
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState("");

  // Sell state
  const [sellProduct, setSellProduct] = useState<Product | null>(null);
  const [sellQty, setSellQty] = useState(1);
  const [sellNote, setSellNote] = useState("");
  const [selling, setSelling] = useState(false);
  const [sellError, setSellError] = useState("");
  const [sellSuccess, setSellSuccess] = useState("");

  function handleSort(key: SortKey) {
    if (sortKey !== key) {
      setSortKey(key);
      setSortDir("asc");
    } else if (sortDir === "asc") setSortDir("desc");
    else if (sortDir === "desc") {
      setSortKey(null);
      setSortDir(null);
    }
    setPage(1);
  }

  const filtered = useMemo(() => {
    const q = tableSearch.toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) =>
        p.productCode.toLowerCase().includes(q) ||
        p.productName.toLowerCase().includes(q) ||
        (p.location || "").toLowerCase().includes(q),
    );
  }, [products, tableSearch]);

  const sorted = useMemo(() => {
    if (!sortKey || !sortDir) return filtered;
    return [...filtered].sort((a, b) => {
      let av: string | number = a[sortKey] ?? "";
      let bv: string | number = b[sortKey] ?? "";
      if (sortKey === "quantity") {
        return sortDir === "asc"
          ? (av as number) - (bv as number)
          : (bv as number) - (av as number);
      }
      av = (av as string).toLowerCase();
      bv = (bv as string).toLowerCase();
      return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
    });
  }, [filtered, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const paginated = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function openEdit(p: Product) {
    setEditProduct(p);
    setNewQty(String(p.quantity));
    setEditError("");
  }
  function openSell(p: Product) {
    setSellProduct(p);
    setSellQty(1);
    setSellNote("");
    setSellError("");
    setSellSuccess("");
  }

  async function handleSaveQty() {
    if (!editProduct) return;
    setSaving(true);
    setEditError("");
    try {
      const res = await fetch("/api/products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productCode: editProduct.productCode,
          quantity: Number(newQty),
        }),
      });
      if (res.ok) {
        setEditProduct(null);
        onUpdate();
      } else setEditError("Xatolik yuz berdi");
    } finally {
      setSaving(false);
    }
  }

  async function handleSell() {
    if (!sellProduct) return;
    setSellError("");
    setSellSuccess("");
    setSelling(true);
    try {
      const res = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productCode: sellProduct.productCode,
          quantitySold: sellQty,
          note: sellNote,
        }),
      });
      if (res.ok) {
        setSellSuccess(`✅ ${sellQty} ta sotildi!`);
        setTimeout(() => {
          setSellProduct(null);
          onUpdate();
        }, 1100);
      } else {
        const err = await res.json();
        setSellError(err.error || "Xatolik");
      }
    } finally {
      setSelling(false);
    }
  }

  if (products.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-10 text-center">
        <p className="text-slate-400 text-base">Mahsulotlar yo'q</p>
      </div>
    );
  }

  return (
    <>
      {/* Table filter + stats row */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center mb-3">
        <Input
          value={tableSearch}
          onChange={(e) => {
            setTableSearch(e.target.value);
            setPage(1);
          }}
          placeholder="🔍 Jadvalda qidirish..."
          className="h-10 rounded-xl text-sm border-slate-200 flex-1"
        />
        <div className="text-sm text-slate-400 whitespace-nowrap">
          Jami:{" "}
          <span className="font-semibold text-slate-600">
            {filtered.length}
          </span>{" "}
          ta mahsulot
        </div>
      </div>

      {/* ── MOBILE CARDS ── */}
      <div className="space-y-3 md:hidden">
        {paginated.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center text-slate-400 text-sm">
            Hech narsa topilmadi
          </div>
        ) : (
          paginated.map((p) => (
            <div
              key={p._id}
              className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-400 font-mono font-semibold">
                    {p.productCode}
                  </p>
                  <p className="font-bold text-slate-800 text-base mt-0.5 leading-tight">
                    {p.productName}
                  </p>
                  {p.location && (
                    <p className="text-xs text-slate-400 mt-0.5">
                      📍 {p.location}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    <StatusBadge quantity={p.quantity} />
                    <span className="text-slate-600 text-sm font-semibold">
                      {p.quantity} dona
                    </span>
                  </div>
                </div>
                <div className="flex flex-col gap-2 flex-shrink-0">
                  <Button
                    size="sm"
                    className="rounded-xl bg-green-600 hover:bg-green-700 text-white h-9 px-3 gap-1 text-sm"
                    onClick={() => openSell(p)}
                    disabled={p.quantity === 0}
                  >
                    <ShoppingCart className="h-3.5 w-3.5" /> Sotish
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-xl h-9 px-3 gap-1 text-sm"
                    onClick={() => openEdit(p)}
                  >
                    <Pencil className="h-3.5 w-3.5" /> Tahrir
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ── DESKTOP TABLE ── */}
      <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {/* Sortable columns */}
                {(
                  [
                    { key: "productCode", label: "Kod" },
                    { key: "productName", label: "Nomi" },
                    { key: "quantity", label: "Miqdor" },
                  ] as { key: SortKey; label: string }[]
                ).map(({ key, label }) => (
                  <th
                    key={key}
                    className="text-left px-4 py-3.5 font-semibold text-slate-600 cursor-pointer select-none hover:text-blue-600 hover:bg-slate-100 transition-colors"
                    onClick={() => handleSort(key)}
                  >
                    {label}
                    <SortIcon col={key} sortKey={sortKey} sortDir={sortDir} />
                  </th>
                ))}
                <th className="text-left px-4 py-3.5 font-semibold text-slate-600">
                  Holat
                </th>
                <th className="text-left px-4 py-3.5 font-semibold text-slate-600">
                  Joylashuv
                </th>
                <th className="text-right px-4 py-3.5 font-semibold text-slate-600">
                  Amallar
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-slate-400">
                    Hech narsa topilmadi
                  </td>
                </tr>
              ) : (
                paginated.map((p, i) => (
                  <tr
                    key={p._id}
                    className={`transition-colors hover:bg-blue-50/40 ${i % 2 === 0 ? "bg-white" : "bg-slate-50/40"}`}
                  >
                    <td className="px-4 py-3.5 font-mono font-semibold text-slate-600 text-xs">
                      {p.productCode}
                    </td>
                    <td className="px-4 py-3.5 font-medium text-slate-800">
                      {p.productName}
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`font-bold text-base ${p.quantity === 0 ? "text-red-500" : p.quantity === 1 ? "text-orange-500" : "text-slate-800"}`}
                      >
                        {p.quantity}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusBadge quantity={p.quantity} />
                    </td>
                    <td className="px-4 py-3.5 text-slate-400 text-xs">
                      {p.location || "—"}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex gap-2 justify-end">
                        <Button
                          size="sm"
                          className="rounded-lg bg-green-600 hover:bg-green-700 text-white h-8 px-3 gap-1"
                          onClick={() => openSell(p)}
                          disabled={p.quantity === 0}
                        >
                          <ShoppingCart className="h-3.5 w-3.5" /> Sotish
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="rounded-lg h-8 px-3 gap-1"
                          onClick={() => openEdit(p)}
                        >
                          <Pencil className="h-3.5 w-3.5" /> Tahrirlash
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Table footer: total row count */}
        {sorted.length > 0 && (
          <div className="px-4 py-2.5 border-t border-slate-100 bg-slate-50 text-xs text-slate-400 flex justify-between">
            <span>
              Ko'rsatilmoqda: {(page - 1) * PAGE_SIZE + 1}–
              {Math.min(page * PAGE_SIZE, sorted.length)} / {sorted.length} ta
            </span>
            <span>
              {sortKey
                ? `${sortKey === "productCode" ? "Kod" : sortKey === "productName" ? "Nom" : "Miqdor"} bo'yicha saralandi (${sortDir === "asc" ? "↑" : "↓"})`
                : "Saralanmagan"}
            </span>
          </div>
        )}
      </div>

      {/* ── PAGINATION ── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 gap-3">
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl h-10 px-4 gap-1"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            <ChevronLeft className="h-4 w-4" /> Oldingi
          </Button>

          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(
                (p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1,
              )
              .reduce<(number | "...")[]>((acc, p, idx, arr) => {
                if (idx > 0 && p - (arr[idx - 1] as number) > 1)
                  acc.push("...");
                acc.push(p);
                return acc;
              }, [])
              .map((p, idx) =>
                p === "..." ? (
                  <span key={`dot-${idx}`} className="px-1 text-slate-400">
                    …
                  </span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setPage(p as number)}
                    className={`h-9 w-9 rounded-xl text-sm font-semibold transition-all ${
                      page === p
                        ? "bg-blue-600 text-white shadow-sm"
                        : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {p}
                  </button>
                ),
              )}
          </div>

          <Button
            variant="outline"
            size="sm"
            className="rounded-xl h-10 px-4 gap-1"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Keyingi <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* ── EDIT QTY DIALOG ── */}
      <Dialog
        open={!!editProduct}
        onOpenChange={(o) => !o && setEditProduct(null)}
      >
        <DialogContent className="mx-4 rounded-2xl max-w-sm">
          <DialogHeader>
            <DialogTitle>Miqdorni yangilash</DialogTitle>
          </DialogHeader>
          {editProduct && (
            <div className="space-y-4 mt-2">
              <div className="bg-slate-50 rounded-xl p-3">
                <p className="text-xs text-slate-400 font-mono">
                  {editProduct.productCode}
                </p>
                <p className="font-bold text-slate-800">
                  {editProduct.productName}
                </p>
              </div>
              <div className="space-y-1">
                <Label className="text-base">Yangi miqdor (dona)</Label>
                <Input
                  type="number"
                  min="0"
                  value={newQty}
                  onChange={(e) => setNewQty(e.target.value)}
                  className="h-14 text-2xl text-center rounded-xl font-bold"
                  inputMode="numeric"
                />
              </div>
              {editError && <p className="text-red-600 text-sm">{editError}</p>}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1 h-12 rounded-xl"
                  onClick={() => setEditProduct(null)}
                >
                  Bekor
                </Button>
                <Button
                  onClick={handleSaveQty}
                  disabled={saving}
                  className="flex-1 h-12 rounded-xl bg-blue-600 hover:bg-blue-700"
                >
                  {saving ? "Saqlanmoqda..." : "Saqlash"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── SELL DIALOG ── */}
      <Dialog
        open={!!sellProduct}
        onOpenChange={(o) => !o && setSellProduct(null)}
      >
        <DialogContent className="mx-4 rounded-2xl max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-700">
              <ShoppingCart className="h-5 w-5" /> Sotish
            </DialogTitle>
          </DialogHeader>
          {sellProduct && (
            <div className="space-y-4 mt-1">
              <div className="bg-slate-50 rounded-xl p-3">
                <p className="text-xs text-slate-400 font-mono">
                  {sellProduct.productCode}
                </p>
                <p className="font-bold text-slate-800">
                  {sellProduct.productName}
                </p>
                <p className="text-sm text-slate-500 mt-0.5">
                  Omborda:{" "}
                  <span className="font-semibold text-slate-700">
                    {sellProduct.quantity} dona
                  </span>
                </p>
              </div>
              <div className="space-y-2">
                <Label className="text-base">Sotilgan miqdor (dona)</Label>
                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-12 w-12 rounded-xl"
                    onClick={() => setSellQty((q) => Math.max(1, q - 1))}
                    disabled={sellQty <= 1}
                  >
                    <Minus className="h-5 w-5" />
                  </Button>
                  <Input
                    type="number"
                    min={1}
                    max={sellProduct.quantity}
                    value={sellQty}
                    onChange={(e) =>
                      setSellQty(
                        Math.max(
                          1,
                          Math.min(
                            sellProduct.quantity,
                            Number(e.target.value),
                          ),
                        ),
                      )
                    }
                    className="h-12 text-2xl text-center font-bold rounded-xl flex-1"
                    inputMode="numeric"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-12 w-12 rounded-xl"
                    onClick={() =>
                      setSellQty((q) => Math.min(sellProduct.quantity, q + 1))
                    }
                    disabled={sellQty >= sellProduct.quantity}
                  >
                    <Plus className="h-5 w-5" />
                  </Button>
                </div>
              </div>
              <div className="space-y-1">
                <Label>Izoh (ixtiyoriy)</Label>
                <Input
                  className="h-11 rounded-xl"
                  placeholder="Mijoz, buyurtma..."
                  value={sellNote}
                  onChange={(e) => setSellNote(e.target.value)}
                />
              </div>
              <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-sm text-green-800">
                <div className="flex justify-between">
                  <span>Sotiladi:</span>
                  <span className="font-bold">{sellQty} dona</span>
                </div>
                <div className="flex justify-between mt-1">
                  <span>Qoladi:</span>
                  <span className="font-bold">
                    {sellProduct.quantity - sellQty} dona
                  </span>
                </div>
              </div>
              {sellError && (
                <p className="text-red-600 text-sm bg-red-50 p-3 rounded-xl">
                  ❌ {sellError}
                </p>
              )}
              {sellSuccess && (
                <p className="text-green-700 text-sm bg-green-50 p-3 rounded-xl font-medium">
                  {sellSuccess}
                </p>
              )}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1 h-12 rounded-xl"
                  onClick={() => setSellProduct(null)}
                >
                  Bekor
                </Button>
                <Button
                  onClick={handleSell}
                  disabled={selling}
                  className="flex-1 h-12 rounded-xl bg-green-600 hover:bg-green-700 text-white font-semibold"
                >
                  {selling ? "Saqlanmoqda..." : `${sellQty} ta Sotish`}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
