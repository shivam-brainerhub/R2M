import Link from 'next/link';

export default function ProductDetailPage({ params }: { params: { id: string } }) {
  return (
    <div className="bg-white min-h-screen pb-20">
      {/* Breadcrumbs */}
      <div className="bg-light-blue py-3 px-6 border-b border-gray-100">
         <div className="max-w-7xl mx-auto text-sm text-gray-500 flex items-center space-x-2">
            <Link href="/" className="hover:text-navy">Home</Link>
            <span className="material-symbols-outlined text-xs">chevron_right</span>
            <Link href="/products" className="hover:text-navy">Products</Link>
            <span className="material-symbols-outlined text-xs">chevron_right</span>
            <span className="text-navy font-semibold">BeneVision N12</span>
         </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex flex-col md:flex-row gap-12">
          {/* Product Image Gallery */}
          <div className="md:w-1/2">
            <div className="bg-gray-50 border border-gray-100 rounded-2xl aspect-square flex items-center justify-center relative p-8">
               <span className="material-symbols-outlined text-9xl text-gray-300">monitor_heart</span>
               <div className="absolute top-6 left-6 text-red-600 font-bold text-2xl">mindray</div>
            </div>
            <div className="flex gap-4 mt-4">
              <div className="w-24 h-24 bg-gray-50 border-2 border-navy rounded-lg flex items-center justify-center cursor-pointer">
                 <span className="material-symbols-outlined text-gray-400">monitor_heart</span>
              </div>
              <div className="w-24 h-24 bg-gray-50 border border-gray-100 rounded-lg flex items-center justify-center cursor-pointer opacity-70 hover:opacity-100">
                 <span className="material-symbols-outlined text-gray-400">monitor_heart</span>
              </div>
            </div>
          </div>

          {/* Product Info */}
          <div className="md:w-1/2">
            <h1 className="text-4xl font-bold text-navy mb-2">BeneVision N12</h1>
            <p className="text-xl text-gray-600 mb-6">12.1" multi-parameter patient monitor.</p>
            
            <p className="text-gray-700 leading-relaxed mb-8">
              The BeneVision N12 patient monitor provides a clear, comprehensive view of patient status. With its capacitive touchscreen and advanced clinical tools, it supports clinical decision-making in demanding healthcare environments, ensuring better patient outcomes.
            </p>

            <div className="bg-light-blue p-6 rounded-xl mb-8">
               <h3 className="font-bold text-navy mb-4 border-b border-gray-200 pb-2">Key Specifications</h3>
               <div className="grid grid-cols-2 gap-y-4 text-sm">
                  <div>
                    <div className="text-gray-500">Display Size</div>
                    <div className="font-semibold text-navy">12.1" Touchscreen</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Battery Life</div>
                    <div className="font-semibold text-navy">Up to 4 hours</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Parameters</div>
                    <div className="font-semibold text-navy">ECG, SpO2, NIBP, IBP, Temp</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Weight</div>
                    <div className="font-semibold text-navy">4.0 kg</div>
                  </div>
               </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 mb-8">
               <button className="flex-1 bg-gold text-navy font-bold py-3 rounded-full hover:bg-gold-bright transition-colors text-center flex justify-center items-center">
                 Request a Quote <span className="material-symbols-outlined ml-2">arrow_forward</span>
               </button>
               <button className="flex-1 bg-white border-2 border-navy text-navy font-bold py-3 rounded-full hover:bg-gray-50 transition-colors text-center flex justify-center items-center">
                 <span className="material-symbols-outlined mr-2">add</span> Add to Compare
               </button>
            </div>

            <div className="space-y-3">
               <a href="#" className="flex items-center text-blue-600 hover:underline p-3 bg-gray-50 rounded-lg">
                  <span className="material-symbols-outlined mr-3 text-2xl text-gray-400">picture_as_pdf</span>
                  <div className="flex-1">
                     <div className="font-semibold">Product Brochure</div>
                     <div className="text-xs text-gray-500">PDF, 2.4 MB</div>
                  </div>
                  <span className="material-symbols-outlined">download</span>
               </a>
               <a href="#" className="flex items-center text-blue-600 hover:underline p-3 bg-gray-50 rounded-lg">
                  <span className="material-symbols-outlined mr-3 text-2xl text-gray-400">picture_as_pdf</span>
                  <div className="flex-1">
                     <div className="font-semibold">Technical Specifications</div>
                     <div className="text-xs text-gray-500">PDF, 1.1 MB</div>
                  </div>
                  <span className="material-symbols-outlined">download</span>
               </a>
            </div>
          </div>
        </div>
      </div>

      {/* Related Products */}
      <div className="bg-light-blue py-16 px-6 mt-12 border-t border-gray-200">
         <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl font-bold text-navy mb-8">Related Products & Accessories</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
               {[1,2,3,4].map(i => (
                  <div key={i} className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col items-center text-center">
                     <div className="w-24 h-24 bg-gray-50 rounded-lg flex items-center justify-center mb-4 text-gray-300">
                        <span className="material-symbols-outlined text-4xl">medical_services</span>
                     </div>
                     <div className="text-red-600 text-sm font-bold mb-1">mindray</div>
                     <h4 className="font-bold text-navy mb-1">N-Series Module</h4>
                     <p className="text-xs text-gray-500 mb-4">Compatible expansion module.</p>
                     <Link href="#" className="text-blue-600 text-sm font-semibold hover:underline mt-auto">View Details</Link>
                  </div>
               ))}
            </div>
         </div>
      </div>
    </div>
  );
}
