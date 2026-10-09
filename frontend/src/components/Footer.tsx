import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-navy text-white py-12 px-6">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-5 gap-8">
        <div className="col-span-1">
          <div className="flex items-center space-x-2 mb-4">
            <div className="text-gold font-bold text-3xl italic tracking-tighter">SAH</div>
            <div className="text-xs font-semibold leading-tight">SA <br/> HEALTHCARE</div>
          </div>
          <div className="flex space-x-4 mt-4">
            <span className="material-symbols-outlined cursor-pointer hover:text-gold">language</span>
            <span className="material-symbols-outlined cursor-pointer hover:text-gold">mail</span>
          </div>
        </div>
        
        <div>
          <h4 className="font-semibold mb-4 text-gold">Products</h4>
          <ul className="space-y-2 text-sm text-gray-300">
            <li><Link href="/products" className="hover:text-white">Browse All Products</Link></li>
            <li><Link href="/products" className="hover:text-white">Product Categories</Link></li>
            <li><Link href="/products" className="hover:text-white">Search</Link></li>
            <li><Link href="/resources" className="hover:text-white">Brochures & Technical</Link></li>
          </ul>
        </div>
        
        <div>
          <h4 className="font-semibold mb-4 text-gold">Manufacturers</h4>
          <ul className="space-y-2 text-sm text-gray-300">
            <li><Link href="/partners" className="hover:text-white">Our Partners</Link></li>
            <li><Link href="/partners" className="hover:text-white">Brand Index</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold mb-4 text-gold">Healthcare Sectors</h4>
          <ul className="space-y-2 text-sm text-gray-300">
            <li><Link href="/solutions" className="hover:text-white">Hospitals & Healthcare</Link></li>
            <li><Link href="/solutions" className="hover:text-white">Clinics & Primary Care</Link></li>
            <li><Link href="/solutions" className="hover:text-white">Pharmacies & Retail</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold mb-4 text-gold">Contact</h4>
          <ul className="space-y-2 text-sm text-gray-300">
            <li><Link href="/contact" className="hover:text-white">Get in Touch</Link></li>
            <li><Link href="/contact" className="hover:text-white">Request a Quote</Link></li>
          </ul>
        </div>
      </div>
      <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-white/10 text-xs text-gray-400 flex justify-between">
        <p>&copy; 2026 SA Healthcare. All rights reserved.</p>
        <div className="space-x-4">
          <Link href="/privacy" className="hover:text-white">Privacy Policy</Link>
          <Link href="/terms" className="hover:text-white">Terms of Use</Link>
        </div>
      </div>
    </footer>
  );
}
