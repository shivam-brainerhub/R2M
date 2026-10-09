import Link from 'next/link';

export default function Navbar() {
  return (
    <nav className="sticky top-0 left-0 w-full bg-navy text-white px-6 py-6 flex items-center justify-between z-50 shadow-md">
      <div className="flex items-center space-x-12">
        <Link href="/" className="flex items-center space-x-2">
          <div className="text-gold font-bold text-3xl italic tracking-tighter">SAH</div>
          <div className="text-xs font-semibold leading-tight">SA <br/> HEALTHCARE</div>
        </Link>
        <div className="hidden md:flex space-x-6 text-sm font-medium">
          <Link href="/" className="hover:text-gold transition-colors">Home</Link>
          <Link href="/products" className="hover:text-gold transition-colors border-b-2 border-gold pb-1">Products</Link>
          <Link href="/partners" className="hover:text-gold transition-colors">Manufacturers</Link>
          <Link href="/solutions" className="hover:text-gold transition-colors">Healthcare Sectors</Link>
          <Link href="/about" className="hover:text-gold transition-colors">About</Link>
          <Link href="/contact" className="hover:text-gold transition-colors">Contact</Link>
        </div>
      </div>
      <div className="flex items-center space-x-6">
        <button className="text-white hover:text-gold transition-colors">
          <span className="material-symbols-outlined">search</span>
        </button>
        <Link href="/contact" className="bg-gold text-navy font-semibold px-5 py-2 rounded-full hover:bg-gold-bright transition-colors text-sm flex items-center gap-1">
          Request a Quote <span className="material-symbols-outlined text-sm">arrow_forward</span>
        </Link>
      </div>
    </nav>
  );
}
