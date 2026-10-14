'use client';

import React, { useState } from 'react';
import { useQuoteCart } from '../context/QuoteCartContext';

interface AddToQuoteButtonProps {
  productId: string | number;
  productName: string;
  slug?: string;
  sku?: string | null;
  brandName?: string | null;
  imageUrl?: string | null;
  categoryName?: string | null;
  className?: string;
  onAdded?: () => void;
}

export default function AddToQuoteButton({
  productId,
  productName,
  slug,
  sku,
  brandName,
  imageUrl,
  categoryName,
  className = '',
  onAdded,
}: AddToQuoteButtonProps) {
  const { addItem } = useQuoteCart();
  const [justAdded, setJustAdded] = useState(false);

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    addItem({
      productId: String(productId),
      productName,
      slug,
      sku,
      brandName,
      imageUrl,
      categoryName,
      quantity: 1, // Quantity managed only in cart
    });

    setJustAdded(true);
    if (onAdded) onAdded();

    setTimeout(() => {
      setJustAdded(false);
    }, 2000);
  };

  return (
    <button
      type="button"
      onClick={handleAdd}
      className={`inline-flex items-center justify-center gap-1.5 rounded-xl font-bold transition-all duration-200 cursor-pointer ${
        justAdded
          ? 'bg-emerald-600 text-white shadow-xs scale-102'
          : 'bg-gold text-navy hover:bg-gold-bright active:scale-95 shadow-xs'
      } ${className}`}
    >
      <span className="material-symbols-outlined text-base!">
        {justAdded ? 'check_circle' : 'add_shopping_cart'}
      </span>
      <span>{justAdded ? 'Added to Quote' : 'Add to Quote'}</span>
    </button>
  );
}
