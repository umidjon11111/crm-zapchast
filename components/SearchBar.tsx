"use client";

import { useState, useCallback, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Loader2, Search, X } from "lucide-react";

interface Product {
  _id: string;
  productCode: string;
  productName: string;
  quantity: number;
  location?: string;
}

interface SearchBarProps {
  onProductFound: (product: Product | null) => void;
}

export default function SearchBar({ onProductFound }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const search = useCallback(
    async (code: string) => {
      if (!code.trim()) {
        onProductFound(null);
        setNotFound(false);
        return;
      }

      setLoading(true);
      setNotFound(false);

      try {
        const res = await fetch(
          `/api/products?code=${encodeURIComponent(code.trim().toUpperCase())}`,
        );
        if (res.ok) {
          const data = await res.json();
          onProductFound(data);
          setNotFound(false);
        } else if (res.status === 404) {
          onProductFound(null);
          setNotFound(true);
        }
      } catch {
        onProductFound(null);
      } finally {
        setLoading(false);
      }
    },
    [onProductFound],
  );

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setQuery(val);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(val), 300);
  }

  function handleClear() {
    setQuery("");
    onProductFound(null);
    setNotFound(false);
    if (debounceRef.current) clearTimeout(debounceRef.current);
  }

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 pointer-events-none" />
        <Input
          value={query}
          onChange={handleChange}
          placeholder="Mahsulot kodi (masalan: ABC123)"
          className="h-14 text-lg pl-12 pr-12 rounded-2xl border-slate-200 shadow-sm focus:border-blue-500 bg-white"
          autoCapitalize="characters"
          autoCorrect="off"
          spellCheck={false}
          inputMode="text"
        />
        {loading && (
          <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-blue-500 animate-spin" />
        )}
        {!loading && query && (
          <button
            onClick={handleClear}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {notFound && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 rounded-xl px-4 py-3 text-sm font-medium">
          ⚠️ Mahsulot topilmadi: <span className="font-bold">{query}</span>
        </div>
      )}
    </div>
  );
}
