import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Compare",
};



export default function ComparePage() {
  const products = [
    { brand: 'mindray', name: 'BeneVision N12', desc: '12.1" display, multi-parameter', image: 'monitor_heart', display: '12.1"', touch: 'Yes', battery: 'Up to 4 hours', weight: '4.0 kg' },
    { brand: 'PHILIPS', name: 'IntelliVue MX450', desc: 'Flexible, high-performance', image: 'monitor_heart', display: '12.1"', touch: 'Yes', battery: 'Up to 5 hours', weight: '4.6 kg' },
    { brand: 'Dräger', name: 'Infinity M300', desc: 'Compact patient monitor', image: 'monitor_heart', display: '12.1"', touch: 'Yes', battery: 'Up to 4 hours', weight: '4.2 kg' },
  ];

  return (
    <div className="bg-white min-h-screen pb-20">
      <div className="bg-navy text-white py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold mb-4">Compare Products</h1>
          <p className="text-gray-300">Compare features and specifications to find the right solution for your needs.</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
         <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-light-blue p-4 md:p-6 rounded-xl mb-8 gap-4 md:gap-0 shadow-sm">
            <div className="flex items-center text-navy font-bold text-base md:text-lg">
               <span className="material-symbols-outlined mr-2 md:mr-3 text-2xl md:text-3xl!">scale</span>
               Compare up to 3 products
            </div>
            <div className="flex flex-row space-x-3 md:space-x-4 w-full md:w-auto items-center justify-between md:justify-end">
               <button className="text-blue-600 font-semibold hover:underline flex items-center text-sm px-2">
                  <span className="material-symbols-outlined mr-1 text-base md:text-sm!">delete</span> <span className="hidden sm:inline">Clear</span><span className="sm:hidden">Reset</span>
               </button>
               <button className="bg-gold text-navy font-bold px-4 md:px-5 py-2 md:py-2.5 rounded-full hover:bg-gold-bright transition-all duration-300 active:scale-95 flex items-center justify-center text-xs md:text-sm shadow-sm whitespace-nowrap">
                  Add <span className="hidden sm:inline">&nbsp;Another</span> Product <span className="material-symbols-outlined ml-1 text-base md:text-sm!">add</span>
               </button>
            </div>
         </div>

         {/* Comparison Table */}
         <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-200">
               <thead>
                  <tr>
                     <th className="p-4 border-b-2 border-gray-100 w-1/4 align-bottom pb-8">
                        <div className="text-xl font-bold text-navy">Key Specifications</div>
                     </th>
                     {products.map((p, i) => (
                        <th key={i} className="p-4 border-b-2 border-gray-100 w-1/4">
                           <div className="relative bg-gray-50 p-6 rounded-xl border border-gray-200 flex flex-col items-center">
                              <button className="absolute top-2 right-2 text-gray-400 hover:text-red-500">
                                 <span className="material-symbols-outlined text-sm!">close</span>
                              </button>
                              <div className="text-red-600 font-bold text-lg mb-2">{p.brand}</div>
                              <span className="material-symbols-outlined text-6xl! text-gray-300 mb-2">{p.image}</span>
                              <h3 className="font-bold text-navy text-center mb-1">{p.name}</h3>
                              <p className="text-xs text-gray-500 text-center mb-4">{p.desc}</p>
                              
                              <div className="flex space-x-2 w-full mt-auto">
                                 <button className="flex-1 bg-white border border-gray-300 text-blue-600 text-xs font-semibold py-2 rounded hover:bg-gray-50 flex justify-center items-center">
                                    <span className="material-symbols-outlined text-xs! mr-1">description</span> Specs
                                 </button>
                                 <button className="flex-1 bg-gold text-navy text-xs font-semibold py-2 rounded hover:bg-gold-bright flex justify-center items-center">
                                    Quote <span className="material-symbols-outlined text-xs! ml-1">arrow_forward</span>
                                 </button>
                              </div>
                           </div>
                        </th>
                     ))}
                  </tr>
               </thead>
               <tbody className="text-sm">
                  <tr className="hover:bg-gray-50">
                     <td className="p-4 border-b border-gray-100 font-semibold text-gray-600">Display Size</td>
                     {products.map((p, i) => <td key={i} className="p-4 border-b border-gray-100 text-navy">{p.display}</td>)}
                  </tr>
                  <tr className="hover:bg-gray-50">
                     <td className="p-4 border-b border-gray-100 font-semibold text-gray-600">Touch Screen</td>
                     {products.map((p, i) => <td key={i} className="p-4 border-b border-gray-100 text-navy">{p.touch}</td>)}
                  </tr>
                  <tr className="hover:bg-gray-50">
                     <td className="p-4 border-b border-gray-100 font-semibold text-gray-600">Battery Life</td>
                     {products.map((p, i) => <td key={i} className="p-4 border-b border-gray-100 text-navy">{p.battery}</td>)}
                  </tr>
                  <tr className="hover:bg-gray-50">
                     <td className="p-4 border-b border-gray-100 font-semibold text-gray-600">Weight</td>
                     {products.map((p, i) => <td key={i} className="p-4 border-b border-gray-100 text-navy">{p.weight}</td>)}
                  </tr>
                  
                  {/* Features Header */}
                  <tr>
                     <td colSpan={4} className="p-4 bg-light-blue font-bold text-navy mt-4">Features</td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                     <td className="p-4 border-b border-gray-100 font-semibold text-gray-600">Alarms</td>
                     <td className="p-4 border-b border-gray-100 text-navy">Visual & Audible</td>
                     <td className="p-4 border-b border-gray-100 text-navy">Visual & Audible</td>
                     <td className="p-4 border-b border-gray-100 text-navy">Visual & Audible</td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                     <td className="p-4 border-b border-gray-100 font-semibold text-gray-600">Trend Analysis</td>
                     <td className="p-4 border-b border-gray-100 text-green-500"><span className="material-symbols-outlined">check</span></td>
                     <td className="p-4 border-b border-gray-100 text-green-500"><span className="material-symbols-outlined">check</span></td>
                     <td className="p-4 border-b border-gray-100 text-green-500"><span className="material-symbols-outlined">check</span></td>
                  </tr>

                  {/* Documentation Header */}
                  <tr>
                     <td colSpan={4} className="p-4 bg-light-blue font-bold text-navy mt-4">Documentation</td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                     <td className="p-4 border-b border-gray-100 font-semibold text-gray-600">Product Brochure</td>
                     {[1,2,3].map(i => (
                        <td key={i} className="p-4 border-b border-gray-100">
                           <a href="#" className="flex items-center text-blue-600 hover:underline"><span className="material-symbols-outlined mr-1 text-sm!">picture_as_pdf</span> Download PDF</a>
                        </td>
                     ))}
                  </tr>
               </tbody>
            </table>
         </div>
      </div>
    </div>
  );
}
