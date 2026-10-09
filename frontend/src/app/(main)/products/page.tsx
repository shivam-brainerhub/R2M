"use client";
import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
export default function ProductsPage() {
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedSort, setSelectedSort] = useState('Most Popular');
  const [viewMode, setViewMode] = useState('grid');
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const products = [
    { id: '1', brand: 'mindray', name: 'BeneVision N12', desc: '12.1" multi-parameter patient monitor.', image: '/images/benevision_n12.jpg' },
    { id: '2', brand: 'PHILIPS', name: 'IntelliVue MX450', desc: 'Flexible, high-performance patient monitor.', image: '/images/intellivue_mx450.jpg' },
    { id: '3', brand: 'Dräger', name: 'Infinity M300', desc: 'Compact patient monitor for acute care.', image: '/images/infinity_m300.jpg' },
    { id: '4', brand: 'CONTEC', name: 'CMS8000', desc: 'Multi-parameter patient monitor.', image: '/images/contec_cms8000.jpg' },
  ];
  const handleSelect = (id: string) => {
    setSelectedProducts(prev => 
      prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]
    );
  };
  return (
    <div className="bg-light-blue min-h-screen pb-20">
      <div className="bg-navy text-white py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold mb-4">Browse the Catalogue</h1>
            <p className="text-gray-300">Explore our range of medical products from trusted global manufacturers.</p>
          </div>
          <div className="mt-6 md:mt-0 bg-white rounded-full p-2 flex items-center shadow-lg w-full max-w-md overflow-hidden relative">
            <span className="material-symbols-outlined text-gray-500 ml-3 shrink-0">search</span>
            <input type="text" placeholder="Search..." className="flex-1 bg-transparent border-none outline-none text-black px-4 min-w-0 w-full" />
            <button className="bg-gold text-navy font-bold rounded-full px-5 py-2 hover:bg-gold-bright transition-all duration-300 hover:scale-[1.02] active:scale-95 shrink-0">
              Search
            </button>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col md:flex-row gap-8">
        {/* Sidebar Filters */}
        <div className="md:hidden flex items-center justify-between bg-white p-3 rounded-lg shadow-sm mb-4 border border-gray-100">
          <span className="font-bold text-navy">24 Results</span>
          <button 
            onClick={() => setShowMobileFilters(!showMobileFilters)}
            className="flex items-center text-sm font-semibold text-navy bg-gray-50 px-3 py-1.5 rounded-full border border-gray-200"
          >
            <span className="material-symbols-outlined text-sm mr-1">tune</span> Filters
          </button>
        </div>
        {/* Mobile Filter Overlay */}
        <div 
          className={`fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm transition-opacity duration-300 ${showMobileFilters ? 'opacity-100 visible' : 'opacity-0 invisible'}`}
          onClick={() => setShowMobileFilters(false)}
        />

        <aside className={`fixed inset-y-0 left-0 z-50 w-[85%] max-w-sm bg-white shadow-2xl transform transition-transform duration-300 ease-in-out overflow-y-auto md:relative md:transform-none md:w-64 md:shadow-none md:bg-transparent md:z-auto md:overflow-visible shrink-0 ${showMobileFilters ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
          <div className="bg-white md:rounded-xl md:shadow-sm md:border border-gray-100 p-6 md:p-5 min-h-full">
            
            {/* Mobile Header */}
            <div className="flex justify-between items-center mb-6 md:hidden">
              <h2 className="text-2xl font-bold text-navy">Filters</h2>
              <button onClick={() => setShowMobileFilters(false)} className="p-2 bg-gray-100 rounded-full text-gray-600 hover:text-navy hover:bg-gray-200 transition-colors">
                <span className="material-symbols-outlined text-xl! flex items-center justify-center">close</span>
              </button>
            </div>

            <h3 className="font-bold text-navy mb-4 border-b pb-2 hidden md:block">Product Categories</h3>
            <ul className="space-y-2 text-sm text-gray-600 mb-6">
              <li className="font-semibold text-navy bg-light-blue p-2 rounded flex justify-between">
                <span>Diagnostic and Measure</span>
                <span className="material-symbols-outlined text-sm!">expand_more</span>
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
                  Manufacturer <span className="material-symbols-outlined text-sm!">expand_less</span>
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
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 w-full">
            <h2 className="text-2xl md:text-3xl font-bold text-navy">Patient Monitors</h2>
            <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto space-x-2 sm:space-x-4 text-sm">
              <span className="text-gray-500 hidden sm:inline shrink-0">24 Products</span>
              <div className="flex bg-white border border-gray-200 rounded-lg p-1 shadow-sm shrink-0">
                <button 
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded transition-colors ${viewMode === 'grid' ? 'bg-light-blue text-navy' : 'text-gray-400 hover:text-navy'}`}
                  aria-label="Grid view"
                >
                  <span className="material-symbols-outlined text-xl!">grid_view</span>
                </button>
                <button 
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded transition-colors ${viewMode === 'list' ? 'bg-light-blue text-navy' : 'text-gray-400 hover:text-navy'}`}
                  aria-label="List view"
                >
                  <span className="material-symbols-outlined text-xl!">view_list</span>
                </button>
              </div>
              <div className="relative">
                <button 
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center justify-between border border-gray-200 rounded-lg py-2 px-3 text-gray-700 bg-white min-w-40 hover:border-gold transition-colors focus:outline-none focus:border-gold shadow-sm"
                >
                  <span className="font-medium">{selectedSort}</span>
                  <span className="material-symbols-outlined text-gray-400 text-lg! ml-2">
                    {isDropdownOpen ? 'expand_less' : 'expand_more'}
                  </span>
                </button>
                {isDropdownOpen && (
                  <div className="absolute top-full right-0 mt-1 w-full bg-white border border-gray-100 rounded-lg shadow-lg z-20 overflow-hidden py-1">
                    {['Most Popular', 'A-Z', 'Newest'].map((option) => (
                      <button
                        key={option}
                        onClick={() => {
                          setSelectedSort(option);
                          setIsDropdownOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-light-blue transition-colors ${
                          selectedSort === option ? 'text-navy font-bold bg-light-blue/50' : 'text-gray-600'
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className={viewMode === 'grid' ? "grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6" : "flex flex-col gap-3 md:gap-4"}>
            {products.map(p => {
              if (viewMode === 'list') {
                return (
                  <div key={p.id} className="bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-shadow p-3 md:p-5 flex flex-row gap-3 md:gap-6 relative group">
                    
                    
                    <Link href={`/products/${p.id}`} className="w-24 h-24 md:w-48 md:h-48 shrink-0 flex items-center justify-center">
                       <div className="w-full h-full bg-white rounded-lg flex items-center justify-center border border-gray-100 overflow-hidden relative">
                         <Image src={p.image} alt={p.name} fill className="object-contain p-2 md:p-4" />
                       </div>
                    </Link>

                    <div className="flex-1 flex flex-col justify-start md:justify-center">
                       <div className="text-red-600 font-bold text-xs md:text-sm uppercase tracking-wide mb-0.5">{p.brand}</div>
                       <Link href={`/products/${p.id}`}>
                         <h3 className="font-bold text-navy text-sm md:text-xl hover:underline mb-1 line-clamp-2 leading-snug">{p.name}</h3>
                         <p className="text-gray-500 text-[11px] sm:text-xs md:text-sm max-w-xl truncate mt-0.5 leading-snug">{p.desc}</p>
                       </Link>
                       
                       <div className="hidden md:flex mt-4 pt-4 border-t border-gray-100 flex-wrap gap-4 text-sm">
                         <a href="#" className="flex items-center text-blue-600 hover:underline"><span className="material-symbols-outlined mr-1 text-lg!">description</span> View Specs</a>
                         <a href="#" className="flex items-center text-blue-600 hover:underline"><span className="material-symbols-outlined mr-1 text-lg!">download</span> Brochure</a>
                       </div>
                       
                       <div className="mt-auto pt-3 md:mt-4 md:pt-0 flex items-center justify-between md:justify-start w-full border-t border-gray-100 md:border-0 md:hidden">
                          <div className="flex items-center space-x-2 text-gray-400">
                            <button className="hover:text-red-500 transition-colors p-1 rounded-full" aria-label="Save">
                              <span className="material-symbols-outlined text-[20px] block">favorite_border</span>
                            </button>
                            <button 
                              onClick={(e) => { e.preventDefault(); handleSelect(p.id); }}
                              className={`transition-colors p-1 rounded-full ${selectedProducts.includes(p.id) ? 'text-gold bg-gold/10' : 'hover:text-blue-600'}`} 
                              aria-label="Compare"
                            >
                              <span className="material-symbols-outlined text-[20px] block">compare_arrows</span>
                            </button>
                          </div>
                          <button className="bg-gold text-navy font-bold px-3 sm:px-4 py-1.5 rounded-full text-[11px] sm:text-xs hover:bg-gold-bright transition-all duration-300 active:scale-95 shadow-sm flex items-center justify-center shrink-0">
                            Quote
                          </button>
                       </div>
                       
                       {/* Desktop List Quote Button (hidden on mobile) */}
                       <div className="hidden md:flex mt-auto md:mt-4 pt-2 md:pt-0 flex-col sm:flex-row items-start sm:items-center gap-2">
                          {/* Quote button for desktop list view is actually rendered in the right sidebar! I don't need to render it here, wait, I left a Quote button here previously. Let's just remove it since it's already in the right sidebar on desktop list view. */}
                       </div>
                    </div>
                    
                    <div className="hidden md:flex flex-col items-end justify-between border-l border-gray-100 pl-6 shrink-0 w-48">
                      <button className="text-gray-300 hover:text-navy">
                        <span className="material-symbols-outlined">favorite_border</span>
                      </button>
                      <label className="flex items-center space-x-2 text-sm text-gray-600 cursor-pointer mb-2 mt-auto">
                        <input type="checkbox" className="rounded border-gray-300" checked={selectedProducts.includes(p.id)} onChange={() => handleSelect(p.id)} />
                        <span>Compare</span>
                      </label>
                      <button className="w-full bg-gold text-navy font-semibold px-4 py-2.5 rounded text-sm hover:bg-gold-bright transition-all duration-300 active:scale-95 text-center flex justify-center items-center">
                        Quote
                      </button>
                    </div>
                  </div>
                );
              }

              return (
              <div key={p.id} className="bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-shadow p-3 md:p-5 flex flex-col h-full group">
                {/* Desktop Favorite Icon */}
                <button className="hidden md:block absolute top-4 right-4 text-gray-300 hover:text-red-500 transition-colors z-10">
                  <span className="material-symbols-outlined">favorite_border</span>
                </button>

                <Link href={`/products/${p.id}`} className="flex-1 flex flex-col items-start md:items-center py-2 md:py-4">
                   <div className="w-full aspect-square bg-white rounded-lg flex items-center justify-center mb-3 md:mb-5 border border-gray-100 overflow-hidden relative group-hover:border-blue-100 transition-colors">
                     <Image src={p.image} alt={p.name} fill className="object-contain p-4 group-hover:scale-105 transition-transform duration-500" />
                   </div>
                   <div className="text-red-600 font-bold text-xs md:text-sm uppercase tracking-wider mb-1 w-full text-left md:text-center">{p.brand}</div>
                   <h3 className="font-bold text-navy text-sm md:text-lg text-left md:text-center w-full leading-snug line-clamp-2 md:line-clamp-none group-hover:text-blue-700 transition-colors">{p.name}</h3>
                   <p className="text-gray-500 text-xs md:text-sm text-center mt-2 hidden md:block line-clamp-2">{p.desc}</p>
                </Link>

                {/* Desktop Extra Info */}
                <div className="hidden md:flex mt-4 pt-4 border-t border-gray-100 flex-col space-y-2 text-sm w-full">
                  <a href="#" className="flex items-center text-blue-600 hover:underline"><span className="material-symbols-outlined mr-2 text-lg!">description</span> View Specs</a>
                  <a href="#" className="flex items-center text-blue-600 hover:underline"><span className="material-symbols-outlined mr-2 text-lg!">download</span> Brochure</a>
                </div>

                {/* Action Bar (Mobile & Desktop) */}
                <div className="mt-auto md:mt-4 pt-3 md:pt-4 border-t border-gray-50 flex items-center justify-between w-full gap-1">
                  {/* Left: Icons (Mobile) / Checkbox (Desktop) */}
                  <div className="md:hidden flex items-center space-x-1 sm:space-x-3 text-gray-400 shrink-0">
                    <button className="hover:text-red-500 transition-colors p-1 md:bg-gray-50 rounded-full" aria-label="Save">
                      <span className="material-symbols-outlined text-[18px] md:text-xl block">favorite_border</span>
                    </button>
                    <button 
                      onClick={(e) => { e.preventDefault(); handleSelect(p.id); }}
                      className={`transition-colors p-1 md:bg-gray-50 rounded-full ${selectedProducts.includes(p.id) ? 'text-gold bg-gold/10' : 'hover:text-blue-600'}`} 
                      aria-label="Compare"
                    >
                      <span className="material-symbols-outlined text-[18px] md:text-xl block">compare_arrows</span>
                    </button>
                  </div>

                  <label className="hidden md:flex items-center space-x-2 text-sm text-gray-600 cursor-pointer hover:text-navy shrink-0">
                    <input 
                      type="checkbox" 
                      className="rounded border-gray-300 text-gold focus:ring-gold" 
                      checked={selectedProducts.includes(p.id)}
                      onChange={() => handleSelect(p.id)}
                    />
                    <span className="font-medium">Compare</span>
                  </label>

                  {/* Right: Quote Button */}
                  <button className="bg-gold text-navy font-bold px-3 sm:px-4 md:px-5 py-1.5 md:py-2 rounded-full text-[11px] sm:text-xs md:text-sm hover:bg-gold-bright transition-all duration-300 active:scale-95 shadow-sm hover:shadow group/btn flex items-center justify-center shrink-0">
                    Quote <span style={{ display: 'none' }} className="md:!inline-block material-symbols-outlined text-[16px] ml-1 transition-transform group-hover/btn:translate-x-0.5">arrow_forward</span>
                  </button>
                </div>
              </div>
            )})}
          </div>
        </main>
      </div>
      {/* Floating Compare Bar */}
      {selectedProducts.length >= 2 && (
        <div className="fixed bottom-0 left-0 right-0 bg-navy text-white p-3 md:p-4 shadow-[0_-10px_20px_rgba(0,0,0,0.1)] z-50">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 md:gap-4">
            <div className="flex items-center space-x-2 md:space-x-6 overflow-hidden">
              <div className="flex items-center text-gold font-bold shrink-0">
                <span className="material-symbols-outlined mr-1.5 md:mr-2 text-xl md:text-3xl!">scale</span>
                <span className="text-sm md:text-base">{selectedProducts.length} <span className="hidden sm:inline">products </span>selected</span>
              </div>
              <div className="hidden md:flex space-x-4 overflow-x-auto pb-1 items-center">
                {/* Selected product thumbnails */}
                {selectedProducts.map(id => {
                  const product = products.find(p => p.id === id);
                  if (!product) return null;
                  return (
                    <div key={id} className="bg-white text-navy px-3 py-1.5 rounded-full flex items-center space-x-2 text-xs font-bold whitespace-nowrap shrink-0 shadow-sm border border-gray-100">
                      <span>{product.brand}</span>
                      <span className="font-medium">{product.name}</span>
                      <button onClick={() => handleSelect(id)} className="text-gray-400 hover:text-red-500 ml-1 bg-gray-50 rounded-full p-0.5">
                        <span className="material-symbols-outlined text-[14px] block">close</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
            <Link href="/compare" className="bg-gold text-navy font-bold px-5 py-2 md:px-6 md:py-2.5 rounded-full hover:bg-gold-bright transition-all duration-300 active:scale-95 text-xs md:text-sm whitespace-nowrap shrink-0 shadow-lg flex items-center">
              Compare <span className="hidden md:inline">Products</span> <span className="material-symbols-outlined text-sm! ml-1">arrow_forward</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
