export default function Products() {
  return (
    <main className="min-h-screen p-24 bg-gray-50 text-gray-900">
      <h1 className="text-5xl font-bold mb-8">Product Portfolio</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
        {/* Placeholder for products */}
        <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
          <h3 className="font-bold text-xl">Loading products...</h3>
        </div>
      </div>
    </main>
  );
}
