"use client";

import { useState, useEffect, useCallback } from "react";
import SearchBar from "@/components/SearchBar";
import ProductTable from "@/components/ProductTable";
import {
  Package,
  LogOut,
  Plus,
  RefreshCw,
  Trash2,
  BarChart2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter } from "next/navigation";

interface Product {
  _id: string;
  productCode: string;
  productName: string;
  quantity: number;
  location?: string;
}

function getStatusBadge(quantity: number) {
  if (quantity === 0)
    return (
      <Badge className="bg-red-100 text-red-700 border-red-200 text-sm px-3 py-1">
        Qolmadi
      </Badge>
    );
  if (quantity === 1)
    return (
      <Badge className="bg-orange-100 text-orange-700 border-orange-200 text-sm px-3 py-1">
        1 ta qoldi
      </Badge>
    );
  return (
    <Badge className="bg-green-100 text-green-700 border-green-200 text-sm px-3 py-1">
      Mavjud
    </Badge>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [searchedProduct, setSearchedProduct] = useState<Product | null>(null);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loadingAll, setLoadingAll] = useState(true); // true = auto-load on mount

  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState({
    productCode: "",
    productName: "",
    quantity: "",
    location: "",
  });
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState("");

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteCode, setDeleteCode] = useState("");
  const [deleteSearchQuery, setDeleteSearchQuery] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [deleteSuccess, setDeleteSuccess] = useState("");

  // ── AUTO LOAD on mount ──
  const loadAllProducts = useCallback(async () => {
    setLoadingAll(true);
    try {
      const res = await fetch("/api/products");
      if (res.ok) setAllProducts(await res.json());
    } finally {
      setLoadingAll(false);
    }
  }, []);

  useEffect(() => {
    loadAllProducts();
  }, [loadAllProducts]);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  async function handleAddProduct(e: React.FormEvent) {
    e.preventDefault();
    setAddError("");
    setAddLoading(true);
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...addForm,
          quantity: Number(addForm.quantity),
        }),
      });
      if (res.ok) {
        setAddOpen(false);
        setAddForm({
          productCode: "",
          productName: "",
          quantity: "",
          location: "",
        });
        loadAllProducts();
      } else {
        const err = await res.json();
        setAddError(err.error || "Xatolik yuz berdi");
      }
    } finally {
      setAddLoading(false);
    }
  }

  async function handleDelete() {
    if (!deleteCode) {
      setDeleteError("Iltimos, mahsulot kodini tanlang");
      return;
    }
    setDeleteError("");
    setDeleteSuccess("");
    setDeleteLoading(true);
    try {
      const res = await fetch(
        `/api/products?code=${encodeURIComponent(deleteCode)}`,
        { method: "DELETE" },
      );
      if (res.ok) {
        setDeleteSuccess(`"${deleteCode}" muvaffaqiyatli o'chirildi`);
        setDeleteCode("");
        setDeleteSearchQuery("");
        setAllProducts((prev) =>
          prev.filter((p) => p.productCode !== deleteCode),
        );
        if (searchedProduct?.productCode === deleteCode)
          setSearchedProduct(null);
        setTimeout(() => {
          setDeleteOpen(false);
          setDeleteSuccess("");
        }, 1500);
      } else {
        const err = await res.json();
        setDeleteError(err.error || "O'chirishda xatolik");
      }
    } finally {
      setDeleteLoading(false);
    }
  }

  const filteredDeleteProducts = allProducts.filter(
    (p) =>
      p.productCode.toLowerCase().includes(deleteSearchQuery.toLowerCase()) ||
      p.productName.toLowerCase().includes(deleteSearchQuery.toLowerCase()),
  );
  const selectedDeleteProduct = allProducts.find(
    (p) => p.productCode === deleteCode,
  );

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ── HEADER ── */}
      <header className="bg-blue-600 text-white px-4 py-4 shadow-md sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="h-6 w-6" />
            <span className="font-bold text-lg">Zapchast Ombori</span>
          </div>
          <div className="flex gap-1.5 items-center">
            {/* Statistika */}
            <Button
              size="sm"
              variant="ghost"
              className="text-white hover:bg-blue-700 rounded-xl gap-1"
              onClick={() => router.push("/dashboard/statistics")}
            >
              <BarChart2 className="h-4 w-4" />
              <span className="hidden sm:inline text-sm">Statistika</span>
            </Button>

            {/* Refresh */}
            <Button
              size="sm"
              variant="ghost"
              className="text-white hover:bg-blue-700 rounded-xl"
              onClick={loadAllProducts}
              disabled={loadingAll}
            >
              <RefreshCw
                className={`h-4 w-4 ${loadingAll ? "animate-spin" : ""}`}
              />
            </Button>

            {/* Add */}
            <Dialog open={addOpen} onOpenChange={setAddOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="secondary" className="rounded-xl">
                  <Plus className="h-4 w-4 mr-1" /> Qo'shish
                </Button>
              </DialogTrigger>
              <DialogContent className="mx-4 rounded-2xl max-w-sm">
                <DialogHeader>
                  <DialogTitle>Yangi mahsulot qo'shish</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAddProduct} className="space-y-4 mt-2">
                  <div className="space-y-1">
                    <Label>Mahsulot kodi *</Label>
                    <Input
                      required
                      className="h-12 text-base rounded-xl"
                      value={addForm.productCode}
                      onChange={(e) =>
                        setAddForm((f) => ({
                          ...f,
                          productCode: e.target.value.toUpperCase(),
                        }))
                      }
                      placeholder="ABC123"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Mahsulot nomi *</Label>
                    <Input
                      required
                      className="h-12 text-base rounded-xl"
                      value={addForm.productName}
                      onChange={(e) =>
                        setAddForm((f) => ({
                          ...f,
                          productName: e.target.value,
                        }))
                      }
                      placeholder="Mahsulot nomi"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Miqdori</Label>
                    <Input
                      type="number"
                      min="0"
                      className="h-12 text-base rounded-xl"
                      value={addForm.quantity}
                      onChange={(e) =>
                        setAddForm((f) => ({ ...f, quantity: e.target.value }))
                      }
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Joylashuv</Label>
                    <Input
                      className="h-12 text-base rounded-xl"
                      value={addForm.location}
                      onChange={(e) =>
                        setAddForm((f) => ({ ...f, location: e.target.value }))
                      }
                      placeholder="A1-raqf"
                    />
                  </div>
                  {addError && (
                    <p className="text-red-600 text-sm">{addError}</p>
                  )}
                  <Button
                    type="submit"
                    disabled={addLoading}
                    className="w-full h-12 text-base rounded-xl bg-blue-600 hover:bg-blue-700"
                  >
                    {addLoading ? "Saqlanmoqda..." : "Saqlash"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>

            {/* Delete */}
            <Dialog
              open={deleteOpen}
              onOpenChange={(open) => {
                setDeleteOpen(open);
                if (!open) {
                  setDeleteCode("");
                  setDeleteSearchQuery("");
                  setDeleteError("");
                  setDeleteSuccess("");
                }
              }}
            >
              <DialogTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-white hover:bg-red-500 rounded-xl"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="mx-4 rounded-2xl max-w-sm">
                <DialogHeader>
                  <DialogTitle className="text-red-600 flex items-center gap-2">
                    <Trash2 className="h-5 w-5" /> Mahsulotni o'chirish
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-2">
                  <div className="space-y-2">
                    <Label className="text-base">Mahsulot kodini tanlang</Label>
                    <Input
                      className="h-11 text-base rounded-xl"
                      placeholder="🔍 Kod yoki nom bo'yicha filtr..."
                      value={deleteSearchQuery}
                      onChange={(e) => setDeleteSearchQuery(e.target.value)}
                    />
                    <Select
                      value={deleteCode}
                      onValueChange={(val) => setDeleteCode(val)}
                    >
                      <SelectTrigger className="h-12 text-base rounded-xl">
                        <SelectValue placeholder="Mahsulot tanlang..." />
                      </SelectTrigger>
                      <SelectContent className="max-h-64">
                        {filteredDeleteProducts.length === 0 && (
                          <div className="px-3 py-4 text-center text-slate-400 text-sm">
                            Mahsulot topilmadi
                          </div>
                        )}
                        {filteredDeleteProducts.map((p) => (
                          <SelectItem
                            key={p._id}
                            value={p.productCode}
                            className="py-3 cursor-pointer"
                          >
                            <div className="flex items-center gap-3">
                              <span className="font-mono font-bold text-slate-700 text-sm">
                                {p.productCode}
                              </span>
                              <span className="text-slate-500 text-sm truncate max-w-[160px]">
                                {p.productName}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedDeleteProduct && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-1">
                      <p className="text-xs text-red-400 font-mono font-semibold">
                        {selectedDeleteProduct.productCode}
                      </p>
                      <p className="font-bold text-red-800 text-base">
                        {selectedDeleteProduct.productName}
                      </p>
                      <p className="text-sm text-red-600">
                        Miqdor:{" "}
                        <span className="font-semibold">
                          {selectedDeleteProduct.quantity} dona
                        </span>
                      </p>
                      {selectedDeleteProduct.location && (
                        <p className="text-xs text-red-500">
                          📍 {selectedDeleteProduct.location}
                        </p>
                      )}
                      <p className="text-xs text-red-500 font-medium pt-1 border-t border-red-200">
                        ⚠️ Bu amalni qaytarib bo'lmaydi!
                      </p>
                    </div>
                  )}

                  {deleteError && (
                    <p className="text-red-600 text-sm bg-red-50 p-3 rounded-xl">
                      ❌ {deleteError}
                    </p>
                  )}
                  {deleteSuccess && (
                    <p className="text-green-600 text-sm bg-green-50 p-3 rounded-xl font-medium">
                      ✅ {deleteSuccess}
                    </p>
                  )}

                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      className="flex-1 h-12 rounded-xl"
                      onClick={() => setDeleteOpen(false)}
                    >
                      Bekor
                    </Button>
                    <Button
                      onClick={handleDelete}
                      disabled={deleteLoading || !deleteCode}
                      className="flex-1 h-12 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold"
                    >
                      {deleteLoading ? "O'chirilmoqda..." : "O'chirish"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Logout */}
            <Button
              size="sm"
              variant="ghost"
              className="text-white hover:bg-blue-700 rounded-xl"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-5 space-y-5">
        {/* Search */}
        <SearchBar onProductFound={setSearchedProduct} />

        {/* Search Result Card */}
        {searchedProduct && (
          <div className="bg-white rounded-2xl shadow-md p-5 border border-slate-100">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-400 font-mono mb-1">
                  {searchedProduct.productCode}
                </p>
                <h2 className="text-xl font-bold text-slate-800 leading-tight">
                  {searchedProduct.productName}
                </h2>
                {searchedProduct.location && (
                  <p className="text-slate-500 text-sm mt-1">
                    📍 {searchedProduct.location}
                  </p>
                )}
              </div>
              <div className="flex flex-col items-end gap-2">
                {getStatusBadge(searchedProduct.quantity)}
                <span className="text-3xl font-bold text-slate-800">
                  {searchedProduct.quantity}
                </span>
                <span className="text-xs text-slate-400">dona</span>
              </div>
            </div>
          </div>
        )}

        {/* Statistics banner */}
        <button
          onClick={() => router.push("/dashboard/statistics")}
          className="w-full bg-gradient-to-r from-blue-600 to-blue-500 rounded-2xl p-4 text-white flex items-center justify-between shadow-md hover:shadow-lg transition-all active:scale-[0.99]"
        >
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-xl">
              <BarChart2 className="h-5 w-5" />
            </div>
            <div className="text-left">
              <p className="font-bold">Statistika va hisobotlar</p>
              <p className="text-blue-100 text-sm">
                Oylik sotuv · Excel eksport
              </p>
            </div>
          </div>
          <span className="text-blue-200 text-2xl font-light">›</span>
        </button>

        {/* Products table section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-slate-700 text-base flex items-center gap-2">
              <Package className="h-4 w-4 text-blue-500" />
              Barcha mahsulotlar
              {allProducts.length > 0 && (
                <span className="bg-blue-100 text-blue-600 text-xs font-semibold px-2 py-0.5 rounded-full">
                  {allProducts.length}
                </span>
              )}
            </h2>
            <Button
              size="sm"
              variant="outline"
              className="rounded-xl h-9 px-3 gap-1.5 text-sm"
              onClick={loadAllProducts}
              disabled={loadingAll}
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${loadingAll ? "animate-spin" : ""}`}
              />
              Yangilash
            </Button>
          </div>

          {loadingAll ? (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center">
              <RefreshCw className="h-8 w-8 animate-spin text-blue-400 mx-auto mb-3" />
              <p className="text-slate-400 text-sm">
                Mahsulotlar yuklanmoqda...
              </p>
            </div>
          ) : (
            <ProductTable products={allProducts} onUpdate={loadAllProducts} />
          )}
        </div>
      </div>
    </div>
  );
}
