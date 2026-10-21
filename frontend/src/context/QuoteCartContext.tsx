"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export interface QuoteItem {
  productId: string;
  productName: string;
  slug?: string;
  sku?: string | null;
  brandName?: string | null;
  imageUrl?: string | null;
  categoryName?: string | null;
  quantity: number;
  itemNotes?: string;
}

interface QuoteCartContextType {
  items: QuoteItem[];
  isLoaded: boolean;
  addItem: (item: Omit<QuoteItem, "quantity"> & { quantity?: number }) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  updateItemNotes: (productId: string, notes: string) => void;
  clearCart: () => void;
  itemCount: number;
  totalUnits: number;
}

const QuoteCartContext = createContext<QuoteCartContextType | undefined>(
  undefined,
);

export function QuoteCartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<QuoteItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on client mount to ensure SSR and initial hydration match exactly
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const stored = localStorage.getItem("quoteCart");
        if (stored) {
          setItems(JSON.parse(stored));
        }
      } catch (e) {
        console.error("Failed to parse quote cart from local storage", e);
      } finally {
        setIsLoaded(true);
      }
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // Save to local storage whenever items change (only after initial load has finished)
  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem("quoteCart", JSON.stringify(items));
    } catch (e) {
      console.error("Failed to save quote cart to local storage", e);
    }
  }, [items, isLoaded]);

  const addItem = (
    newItem: Omit<QuoteItem, "quantity"> & { quantity?: number },
  ) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.productId === newItem.productId);
      if (existing) {
        // If already in cart, keep the current quantity (managed at cart) and update any metadata
        return prev.map((i) =>
          i.productId === newItem.productId
            ? { ...i, ...newItem, quantity: i.quantity || 1 }
            : i,
        );
      }
      return [
        ...prev,
        {
          ...newItem,
          quantity: 1, // Quantity always starts at 1 and is managed at cart only
        },
      ];
    });
  };

  const removeItem = (productId: string) => {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    const validQty = Math.max(1, Math.floor(quantity) || 1);
    setItems((prev) =>
      prev.map((i) =>
        i.productId === productId ? { ...i, quantity: validQty } : i,
      ),
    );
  };

  const updateItemNotes = (productId: string, itemNotes: string) => {
    setItems((prev) =>
      prev.map((i) => (i.productId === productId ? { ...i, itemNotes } : i)),
    );
  };

  const clearCart = () => setItems([]);

  // Distinct product count
  const itemCount = items.length;
  // Total units across all products
  const totalUnits = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <QuoteCartContext.Provider
      value={{
        items,
        isLoaded,
        addItem,
        removeItem,
        updateQuantity,
        updateItemNotes,
        clearCart,
        itemCount,
        totalUnits,
      }}
    >
      {children}
    </QuoteCartContext.Provider>
  );
}

export function useQuoteCart() {
  const context = useContext(QuoteCartContext);
  if (context === undefined) {
    throw new Error("useQuoteCart must be used within a QuoteCartProvider");
  }
  return context;
}
