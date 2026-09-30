export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gray-900 text-white">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm lg:flex">
        <h1 className="text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">
          R2M Healthcare
        </h1>
      </div>
      <div className="mt-16 text-center max-w-2xl">
        <p className="text-xl text-gray-300">
          Premium healthcare solutions and product catalogue.
        </p>
        <div className="mt-10 flex gap-4 justify-center">
          <a
            href="/products"
            className="px-6 py-3 rounded-full bg-blue-600 hover:bg-blue-700 transition font-semibold"
          >
            View Catalogue
          </a>
          <a
            href="/contact"
            className="px-6 py-3 rounded-full bg-gray-800 hover:bg-gray-700 transition font-semibold border border-gray-700"
          >
            Contact Us
          </a>
        </div>
      </div>
    </main>
  );
}
