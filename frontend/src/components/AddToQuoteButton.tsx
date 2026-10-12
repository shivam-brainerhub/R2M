'use client';

import { useQuoteCart } from '../context/QuoteCartContext';

interface AddToQuoteButtonProps {
  productId: string;
  productName: string;
  className?: string;
}

export default function AddToQuoteButton({ productId, productName, className = '' }: AddToQuoteButtonProps) {
  const { addItem } = useQuoteCart();

  const handleAdd = () => {
    addItem({ productId, productName });
    // In a real app, you might want to show a toast notification here
    alert(`Added ${productName} to your quote request!`);
  };

  return (
    <button
      onClick={handleAdd}
      className={`inline-flex items-center justify-center rounded-md bg-gold px-4 py-2 text-sm font-semibold text-navy shadow-sm hover:bg-gold-bright focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2 transition-colors ${className}`}
    >
      Add to Quote
    </button>
  );
}
