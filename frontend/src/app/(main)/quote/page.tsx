'use client';

import React, { useState } from 'react';
import { useQuoteCart } from '../../../context/QuoteCartContext';
import Link from 'next/link';

export default function QuotePage() {
  const { items, updateQuantity, removeItem, clearCart, itemCount } = useQuoteCart();
  const [message, setMessage] = useState('');
  const [submittedSummary, setSubmittedSummary] = useState<number | null>(null);
  const [cartError, setCartError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      setCartError('Your quote cart is empty! Please add products before submitting.');
      return;
    }
    
    setSubmittedSummary(itemCount);
    clearCart();
    setMessage('');
  };

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl overflow-hidden">
        {submittedSummary !== null ? (
          <div className="p-8 sm:p-12 text-center animate-fadeIn space-y-4">
            <div className="w-16 h-16 bg-emerald-50 border border-emerald-200 text-emerald-600 rounded-2xl mx-auto flex items-center justify-center">
              <span className="material-symbols-outlined text-4xl">check_circle</span>
            </div>
            <h2 className="text-2xl font-bold text-navy">Quote Request Submitted!</h2>
            <p className="text-gray-600 max-w-md mx-auto text-sm leading-relaxed">
              Your quotation inquiry for <span className="font-semibold text-navy">{submittedSummary} item(s)</span> has been received. Our sales and procurement consultants will review your request and get in touch with you shortly.
            </p>
            <div className="pt-4 flex justify-center gap-4">
              <Link
                href="/products"
                className="bg-navy text-white text-sm font-semibold px-6 py-2.5 rounded-full hover:bg-navy-light transition-all shadow-sm hover:scale-105 active:scale-95"
              >
                Browse More Products
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="px-4 py-6 sm:p-8">
            <div className="mb-8">
              <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
                Request a Quote
              </h2>
              <p className="mt-1 text-sm leading-6 text-gray-600">
                Review your selected products and provide any additional details for our sales team.
                <br/>
                <span className="text-xs text-blue-600 font-semibold">* Note: You must be a registered user to submit this request.</span>
              </p>
            </div>

            {cartError && (
              <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 flex items-center gap-3 text-red-700 text-sm animate-fadeIn">
                <span className="material-symbols-outlined text-xl!">error</span>
                <span>{cartError}</span>
              </div>
            )}

            {items.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                <span className="material-symbols-outlined text-4xl text-gray-400 mb-2">production_quantity_limits</span>
                <h3 className="text-sm font-semibold text-gray-900">No products selected</h3>
                <p className="mt-1 text-sm text-gray-500">Get started by adding products to your quote cart.</p>
                <div className="mt-6">
                  <Link href="/products" className="text-sm font-semibold leading-6 text-blue-600 hover:text-blue-500">
                    Browse Products <span aria-hidden="true">&rarr;</span>
                  </Link>
                </div>
              </div>
            ) : (
              <>
                {/* Cart Items */}
                <div className="mb-8">
                  <h3 className="text-lg font-medium text-gray-900 border-b pb-4 mb-4">Selected Products</h3>
                  <ul role="list" className="divide-y divide-gray-200">
                    {items.map((item) => (
                      <li key={item.productId} className="flex items-center justify-between py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-gray-900">{item.productName}</span>
                          <span className="text-sm text-gray-500">ID: {item.productId}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center">
                            <label htmlFor={`quantity-${item.productId}`} className="sr-only">Quantity</label>
                            <input
                              id={`quantity-${item.productId}`}
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => {
                                const val = parseInt(e.target.value);
                                updateQuantity(item.productId, val > 0 ? val : 1);
                              }}
                              className="block w-20 rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 px-3"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => removeItem(item.productId)}
                            className="text-red-500 hover:text-red-700 transition-colors cursor-pointer"
                            title="Remove item"
                          >
                            <span className="material-symbols-outlined text-xl">delete</span>
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Additional Information */}
                <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6 border-t border-gray-900/10 pt-8">
                  <div className="col-span-full">
                    <label htmlFor="message" className="block text-sm font-medium leading-6 text-gray-900">
                      Additional Requirements / Message
                    </label>
                    <div className="mt-2">
                      <textarea
                        id="message"
                        name="message"
                        rows={4}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Please describe any specific requirements..."
                        className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 px-3"
                      />
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-8 flex items-center justify-end gap-x-6 border-t border-gray-900/10 pt-6">
                  <Link href="/products" className="text-sm font-semibold leading-6 text-gray-900">
                    Continue Browsing
                  </Link>
                  <button
                    type="submit"
                    className="rounded-md bg-navy px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-navy-light focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-navy cursor-pointer"
                  >
                    Submit Request
                  </button>
                </div>
              </>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
