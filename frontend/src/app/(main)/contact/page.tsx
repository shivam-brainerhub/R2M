import ContactForm from "@/components/contact/ContactForm";
import ContactInfoCards from "@/components/contact/ContactInfoCards";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Us & Medical Equipment Inquiries",
  description:
    "Speak with our clinical equipment specialists for medical device quotes, hospital tender consultations, and technical support across Southern Africa.",
  keywords: [
    "contact SA Healthcare",
    "medical equipment quote",
    "hospital tender inquiries",
    "medical supplies contact",
  ],
  alternates: {
    canonical: "/contact",
  },
  openGraph: {
    title: "Contact Us & Medical Equipment Inquiries | SA Healthcare",
    description:
      "Get in touch with our team for specialized medical equipment procurement and expert guidance.",
    url: "/contact",
  },
};

export default function Contact() {
  return (
    <div className="bg-light-blue min-h-screen pb-20">
      <div className="bg-navy text-white py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold mb-4">Contact Us</h1>
          <p className="text-gray-300">
            Speak to our team for expert guidance and tailored solutions for
            your facility.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12 flex flex-col md:flex-row gap-12">
        <div className="md:w-1/2">
          <h2 className="text-2xl font-bold text-navy mb-6">Get in Touch</h2>
          <ContactForm />
        </div>

        <div className="md:w-1/2">
          <ContactInfoCards />
        </div>
      </div>
    </div>
  );
}
