"use client";

import { useState } from "react";
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
import { Pencil, ShoppingCart, Minus, Plus } from "lucide-react";

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

function StatusBadge({ quantity }: { quantity: number }) {
  if (quantity === 0)
    return (
      <Badge className="bg-red-100 text-red-700 border-red-200 whitespace-nowrap">
        Qolmadi
      </Badge>
    );
  if (quantity === 1)
    return (
      <Badge className="bg-orange-100 text-orange-700 border-orange-200 whitespace-nowrap">
        1 ta qoldi
      </Badge>
    );
  return (
    <Badge className="bg-green-100 text-green-700 border-green-200 whitespace-nowrap">
      Mavjud
    </Badge>
  );
}

export default function ProductTable({
  products,
  onUpdate,
}: ProductTableProps) {
  // Edit qty state
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
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 text-center text-slate-400">
        Mahsulotlar yo'q
      </div>
    );
  }

  return (
    <>
      {/* Mobile cards */}
      <div className="space-y-3 md:hidden">
        {products.map((p) => (
          <div
            key={p._id}
            className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-400 font-mono">
                  {p.productCode}
                </p>
                <p className="font-semibold text-slate-800 truncate">
                  {p.productName}
                </p>
                {p.location && (
                  <p className="text-xs text-slate-400 mt-0.5">
                    📍 {p.location}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-2">
                  <StatusBadge quantity={p.quantity} />
                  <span className="text-slate-500 text-sm font-medium">
                    {p.quantity} dona
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-2 flex-shrink-0">
                <Button
                  size="sm"
                  className="rounded-xl bg-green-600 hover:bg-green-700 text-white h-9 px-3 gap-1"
                  onClick={() => openSell(p)}
                  disabled={p.quantity === 0}
                >
                  <ShoppingCart className="h-3.5 w-3.5" /> Sotish
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-xl h-9 px-3 gap-1"
                  onClick={() => openEdit(p)}
                >
                  <Pencil className="h-3.5 w-3.5" /> Tahrir
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-100 sticky top-0">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-semibold text-slate-600">
                  Kod
                </th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-slate-600">
                  Nomi
                </th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-slate-600">
                  Miqdor
                </th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-slate-600">
                  Holat
                </th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-slate-600">
                  Joylashuv
                </th>
                <th className="text-right px-4 py-3 text-sm font-semibold text-slate-600">
                  Amallar
                </th>
              </tr>
            </thead>
            <tbody>
              {products.map((p, i) => (
                <tr
                  key={p._id}
                  className={`border-b border-slate-50 ${i % 2 === 0 ? "bg-white" : "bg-slate-50/40"}`}
                >
                  <td className="px-4 py-3 font-mono text-sm text-slate-600">
                    {p.productCode}
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-800">
                    {p.productName}
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-700">
                    {p.quantity}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge quantity={p.quantity} />
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-sm">
                    {p.location || "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex gap-2 justify-end">
                      <Button
                        size="sm"
                        className="rounded-lg bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => openSell(p)}
                        disabled={p.quantity === 0}
                      >
                        <ShoppingCart className="h-3.5 w-3.5 mr-1" /> Sotish
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-lg"
                        onClick={() => openEdit(p)}
                      >
                        <Pencil className="h-3.5 w-3.5 mr-1" /> Tahrirlash
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Qty Dialog */}
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
              <div>
                <p className="text-xs text-slate-400 font-mono">
                  {editProduct.productCode}
                </p>
                <p className="font-semibold text-slate-800">
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
                  className="h-14 text-xl text-center rounded-xl font-bold"
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

      {/* Sell Dialog */}
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
