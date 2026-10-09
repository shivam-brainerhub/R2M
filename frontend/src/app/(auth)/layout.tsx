import Image from 'next/image';
import Link from 'next/link';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-light-blue flex flex-col">
      <header className="w-full p-6 flex justify-center mt-4">
        <Link href="/home">
          <Image src="/logo.png" alt="SA Healthcare Logo" width={200} height={66} className="object-contain w-auto h-auto" priority />
        </Link>
      </header>
      <main className="flex-1 flex flex-col justify-center">
        {children}
      </main>
    </div>
  );
}
