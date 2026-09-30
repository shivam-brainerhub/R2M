export default function Contact() {
  return (
    <main className="min-h-screen p-24 bg-gray-50 text-gray-900">
      <h1 className="text-5xl font-bold mb-8">Contact Us</h1>
      <form className="max-w-md mt-12 flex flex-col gap-4">
        <input
          type="text"
          placeholder="Name"
          className="p-3 border rounded-md shadow-sm"
        />
        <input
          type="email"
          placeholder="Email"
          className="p-3 border rounded-md shadow-sm"
        />
        <textarea
          placeholder="Message"
          rows={5}
          className="p-3 border rounded-md shadow-sm"
        ></textarea>
        <button
          type="submit"
          className="bg-blue-600 text-white font-bold py-3 rounded-md hover:bg-blue-700 transition"
        >
          Send Message
        </button>
      </form>
    </main>
  );
}
