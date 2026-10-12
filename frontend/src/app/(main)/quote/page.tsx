'use client';

import { useQuoteCart } from '../../../context/QuoteCartContext';
import Link from 'next/link';

export default function QuotePage() {
  const { items, updateQuantity, removeItem, clearCart, itemCount } = useQuoteCart();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      alert('Your quote cart is empty!');
      return;
    }
    
    // FUTURE IMPLEMENTATION:
    // 1. Validate form fields
    // 2. Fetch authenticated user's token (FastAPI auth)
    // 3. Send POST request to FastAPI backend (/api/v1/quotes) with items and token
    alert(`Quote request for ${itemCount} items submitted! (Static Placeholder)`);
    clearCart();
  };

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl overflow-hidden">
        <form onSubmit={handleSubmit} className="px-4 py-6 sm:p-8">
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
                            onChange={(e) => updateQuantity(item.productId, parseInt(e.target.value) || 1)}
                            className="block w-20 rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 px-3"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeItem(item.productId)}
                          className="text-red-500 hover:text-red-700 transition-colors"
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
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                >
                  Submit Request
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
}
