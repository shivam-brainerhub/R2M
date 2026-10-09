import Link from 'next/link';

export default function ProductsPage() {
  const products = [
    { id: '1', brand: 'mindray', name: 'BeneVision N12', desc: '12.1" multi-parameter patient monitor.', image: 'monitor_heart' },
    { id: '2', brand: 'PHILIPS', name: 'IntelliVue MX450', desc: 'Flexible, high-performance patient monitor.', image: 'monitor_heart' },
    { id: '3', brand: 'Dräger', name: 'Infinity M300', desc: 'Compact patient monitor for acute care.', image: 'monitor_heart' },
    { id: '4', brand: 'CONTEC', name: 'CMS8000', desc: 'Multi-parameter patient monitor.', image: 'monitor_heart' },
  ];

  return (
    <div className="bg-light-blue min-h-screen pb-20">
      <div className="bg-navy text-white py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold mb-4">Browse the Catalogue</h1>
            <p className="text-gray-300">Explore our range of medical products from trusted global manufacturers.</p>
          </div>
          <div className="mt-6 md:mt-0 bg-white rounded-full p-2 flex items-center shadow-lg w-full max-w-md">
            <span className="material-symbols-outlined text-gray-500 ml-3">search</span>
            <input type="text" placeholder="Search..." className="flex-1 bg-transparent border-none outline-none text-black px-4" />
            <button className="bg-gold text-navy font-bold rounded-full px-4 py-2 hover:bg-gold-bright transition-colors">
              Search
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col md:flex-row gap-8">
        {/* Sidebar Filters */}
        <aside className="w-full md:w-64 shrink-0">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h3 className="font-bold text-navy mb-4 border-b pb-2">Product Categories</h3>
            <ul className="space-y-2 text-sm text-gray-600 mb-6">
              <li className="font-semibold text-navy bg-light-blue p-2 rounded flex justify-between">
                <span>Diagnostic and Measure</span>
                <span className="material-symbols-outlined text-sm">expand_more</span>
              </li>
              <ul className="pl-4 space-y-2 mt-2">
                <li className="text-navy font-medium">Patient Monitors (24)</li>
                <li className="hover:text-gold cursor-pointer">ECG (18)</li>
                <li className="hover:text-gold cursor-pointer">Ultrasound (27)</li>
                <li className="hover:text-gold cursor-pointer">Thermometers (12)</li>
              </ul>
            </ul>

            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-navy">Refine your search</h3>
              <button className="text-sm text-blue-600 hover:underline">Clear All</button>
            </div>
            
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center text-sm font-semibold text-navy mb-2 cursor-pointer">
                  Manufacturer <span className="material-symbols-outlined text-sm">expand_less</span>
                </div>
                <div className="space-y-2 text-sm text-gray-600">
                  <label className="flex items-center space-x-2 cursor-pointer"><input type="checkbox" className="rounded" /> <span>Mindray (6)</span></label>
                  <label className="flex items-center space-x-2 cursor-pointer"><input type="checkbox" className="rounded" /> <span>Philips (5)</span></label>
                  <label className="flex items-center space-x-2 cursor-pointer"><input type="checkbox" className="rounded" /> <span>Dräger (4)</span></label>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-navy">Patient Monitors</h2>
            <div className="flex items-center space-x-4 text-sm">
              <span className="text-gray-500">24 Products</span>
              <select className="border rounded p-1 text-gray-700 bg-white">
                <option>Most Popular</option>
                <option>A-Z</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map(p => (
              <div key={p.id} className="bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-shadow p-5 flex flex-col relative group">
                <button className="absolute top-4 right-4 text-gray-300 hover:text-navy">
                  <span className="material-symbols-outlined">favorite_border</span>
                </button>
                <div className="text-red-600 font-bold text-lg mb-4">{p.brand}</div>
                <Link href={`/products/${p.id}`} className="flex-1 flex flex-col items-center justify-center py-6">
                   <div className="w-32 h-32 bg-gray-50 rounded-lg flex items-center justify-center text-gray-400 mb-4 border border-gray-100">
                     <span className="material-symbols-outlined text-5xl">{p.image}</span>
                   </div>
                   <h3 className="font-bold text-navy text-center w-full text-lg">{p.name}</h3>
                   <p className="text-gray-500 text-sm text-center mt-1">{p.desc}</p>
                </Link>
                <div className="mt-4 pt-4 border-t border-gray-100 flex flex-col space-y-2 text-sm">
                  <a href="#" className="flex items-center text-blue-600 hover:underline"><span className="material-symbols-outlined mr-2 text-lg">description</span> View Specs</a>
                  <a href="#" className="flex items-center text-blue-600 hover:underline"><span className="material-symbols-outlined mr-2 text-lg">download</span> Download Brochure</a>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <label className="flex items-center space-x-2 text-sm text-gray-600 cursor-pointer">
                    <input type="checkbox" className="rounded border-gray-300" />
                    <span>Compare</span>
                  </label>
                  <button className="bg-gold text-navy font-semibold px-4 py-2 rounded text-sm hover:bg-gold-bright transition-colors">
                    Quote <span className="material-symbols-outlined text-sm align-middle">arrow_forward</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>

      {/* Floating Compare Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-navy text-white p-4 shadow-[0_-10px_20px_rgba(0,0,0,0.1)] z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <div className="flex items-center text-gold font-bold">
              <span className="material-symbols-outlined mr-2 text-3xl">scale</span>
              <span>1 product selected</span>
            </div>
            <div className="flex space-x-4">
              {/* Selected product thumbnail */}
              <div className="bg-white text-navy px-3 py-1 rounded flex items-center space-x-2 text-sm font-medium">
                <span>Mindray BeneVision N12</span>
                <button className="hover:text-red-500"><span className="material-symbols-outlined text-sm">close</span></button>
              </div>
            </div>
          </div>
          <Link href="/compare" className="bg-gold text-navy font-bold px-6 py-2 rounded-full hover:bg-gold-bright transition-colors">
            Compare Products
          </Link>
        </div>
      </div>
    </div>
  );
}
