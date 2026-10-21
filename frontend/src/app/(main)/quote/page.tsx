"use client";

import AuthModal from "@/components/auth/AuthModal";
import CustomSelect from "@/components/CustomSelect";
import { useAuth } from "@/context/AuthContext";
import { useQuoteCart } from "@/context/QuoteCartContext";
import { ApiError, QuoteRequestData, getMediaUrl, quotesApi } from "@/lib/api";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

const HEALTHCARE_SECTORS = [
  "Hospitals & Healthcare Groups",
  "Clinics & Primary Care",
  "Emergency & EMS",
  "Veterinary & Animal Care",
  "Laboratories & Diagnostics",
  "Government & Public Health",
  "Private Practice & Specialist Surgery",
  "Other / Research Institution",
];

const URGENCY_OPTIONS = [
  {
    id: "Standard",
    label: "Standard Inquiry",
    desc: "General procurement planning or equipment replacement.",
    icon: "schedule",
  },
  {
    id: "Urgent",
    label: "Urgent Clinical Need",
    desc: "Critical ward, ICU, or immediate medical facility demand.",
    icon: "bolt",
  },
  {
    id: "Procurement Tender",
    label: "Formal Tender / RFP",
    desc: "Hospital group tender or bulk institutional procurement request.",
    icon: "assignment",
  },
];

export default function QuotePage() {
  const {
    items,
    isLoaded,
    updateQuantity,
    updateItemNotes,
    removeItem,
    clearCart,
    itemCount,
    totalUnits,
  } = useQuoteCart();
  const { user, token, isAuthenticated } = useAuth();

  // Multi-step flow: 1 = Cart Review, 2 = Facility & Contact, 3 = RFQ Specs & Timeline, 4 = Review & Submit
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  // Form Fields
  const [facilityName, setFacilityName] = useState("");
  const [contactNameInput, setContactNameInput] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [phoneInput, setPhoneInput] = useState("");
  const [sector, setSector] = useState(HEALTHCARE_SECTORS[0]);
  const [department, setDepartment] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [urgency, setUrgency] = useState("Standard");
  const [notes, setNotes] = useState("");

  // Auto-fill from authenticated user profile
  useEffect(() => {
    if (user) {
      if (user.full_name)
        setContactNameInput((prev) => prev || user.full_name || "");
      if (user.email) setEmailInput((prev) => prev || user.email || "");
      if (user.phone) setPhoneInput((prev) => prev || user.phone || "");
    }
  }, [user]);

  // Derived effective values with auth fallback
  const contactName = contactNameInput || user?.full_name || "";
  const email = emailInput || user?.email || "";
  const phone = phoneInput || user?.phone || "";

  // Submission & Validation State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submittedQuote, setSubmittedQuote] = useState<QuoteRequestData | null>(
    null,
  );
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const handleAuthSuccess = () => {
    setIsAuthModalOpen(false);
    // If user was prompted on Step 1, advance to Step 2 seamlessly
    if (currentStep === 1) {
      setCurrentStep(2);
    }
  };

  // Step 1 validation: Cart has items
  // Step 2 validation: Contact and facility details
  const validateStep2 = (): boolean => {
    setErrorMessage(null);
    if (!facilityName.trim()) {
      setErrorMessage("Please enter the Hospital, Clinic or Practice name.");
      return false;
    }
    if (!contactName.trim()) {
      setErrorMessage("Please enter the contact person name.");
      return false;
    }
    if (!email.trim() || !email.includes("@")) {
      setErrorMessage("Please enter a valid email address for quote delivery.");
      return false;
    }
    if (!phone.trim() || phone.trim().length < 6) {
      setErrorMessage("Please enter a valid telephone or mobile number.");
      return false;
    }
    return true;
  };

  const handleNextStep = () => {
    if (currentStep === 1) {
      if (items.length === 0) {
        setErrorMessage(
          "Your quote cart is empty. Please add medical equipment.",
        );
        return;
      }
      if (!isAuthenticated) {
        setIsAuthModalOpen(true);
        return;
      }
      setErrorMessage(null);
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (validateStep2()) {
        setCurrentStep(3);
      }
    } else if (currentStep === 3) {
      setErrorMessage(null);
      setCurrentStep(4);
    }
  };

  const handlePrevStep = () => {
    setErrorMessage(null);
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as 1 | 2 | 3 | 4);
    }
  };

  const handleSubmitQuote = async () => {
    if (items.length === 0) {
      setErrorMessage("Quote cart is empty.");
      return;
    }
    if (!isAuthenticated) {
      setIsAuthModalOpen(true);
      return;
    }
    if (!validateStep2()) {
      setCurrentStep(2);
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const payload = {
        facility_name: facilityName.trim(),
        contact_name: contactName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        sector,
        department: department.trim() || null,
        city: city.trim() || null,
        address: address.trim() || null,
        urgency,
        notes: notes.trim() || null,
        items: items.map((i) => ({
          product_id: Number(i.productId) || null,
          product_name: i.productName,
          product_sku: i.sku || null,
          brand_name: i.brandName || null,
          quantity: Math.max(1, i.quantity),
          item_notes: i.itemNotes || null,
        })),
      };

      const result = await quotesApi.submitQuote(payload, token);
      setSubmittedQuote(result);
      clearCart();
    } catch (err: unknown) {
      const msg =
        err instanceof ApiError
          ? err.message
          : "Failed to submit quote request. Please try again.";
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // SUCCESS CONFIRMATION VIEW
  if (submittedQuote) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8 font-sans print:p-0 print:py-2 print:m-0 print:max-w-none">
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden p-6 sm:p-12 text-center space-y-6 animate-fadeIn print:shadow-none print:border-none print:p-4 print:space-y-4">
          <div className="w-20 h-20 bg-emerald-50 border-2 border-emerald-200 text-emerald-600 rounded-3xl mx-auto flex items-center justify-center shadow-xs print:w-12 print:h-12">
            <span className="material-symbols-outlined text-5xl! print:text-3xl!">
              check_circle
            </span>
          </div>

          <div>
            <div className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 font-mono font-bold text-xs px-3 py-1 rounded-full border border-blue-200 mb-2">
              <span>REFERENCE:</span>
              <span className="text-navy">{submittedQuote.quote_number}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-navy tracking-tight print:text-2xl">
              Quotation Request Received!
            </h1>
            <p className="text-gray-600 max-w-lg mx-auto text-sm sm:text-base mt-2 leading-relaxed">
              Thank you,{" "}
              <span className="font-semibold text-navy">
                {submittedQuote.contact_name}
              </span>
              . Your formal quotation request for{" "}
              <span className="font-semibold text-navy">
                {submittedQuote.facility_name}
              </span>{" "}
              has been logged in our system.
            </p>
          </div>

          {/* Quick Summary Card */}
          <div className="bg-slate-50 border border-gray-200/80 rounded-2xl p-5 max-w-xl mx-auto text-left space-y-3 print:bg-white print:border-gray-300">
            <div className="flex items-center justify-between border-b border-gray-200 pb-2 text-xs font-bold text-gray-500 uppercase tracking-wider">
              <span>Equipment Requested ({submittedQuote.items.length})</span>
              <span>Priority: {submittedQuote.urgency}</span>
            </div>
            <div className="divide-y divide-gray-100 max-h-48 overflow-y-auto pr-1 print:max-h-none print:overflow-visible">
              {submittedQuote.items.map((it, idx) => (
                <div
                  key={idx}
                  className="py-2.5 flex items-center justify-between gap-3 text-xs sm:text-sm"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-10 h-10 bg-white border border-gray-200 rounded-lg relative overflow-hidden shrink-0 flex items-center justify-center p-0.5">
                      {it.image_url ? (
                        <Image
                          src={getMediaUrl(it.image_url)}
                          alt={it.product_name}
                          fill
                          sizes="40px"
                          className="object-contain p-0.5"
                        />
                      ) : (
                        <span className="material-symbols-outlined text-xl! text-gray-300">
                          inventory_2
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-navy truncate">
                        {it.product_name}
                      </div>
                      <div className="text-gray-400 text-[10px] flex items-center gap-2 flex-wrap">
                        {it.brand_name && <span>{it.brand_name}</span>}
                        {it.product_sku && <span>SKU: {it.product_sku}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="font-mono font-bold bg-white px-2.5 py-0.5 rounded border border-gray-200 text-xs shrink-0">
                    Qty: {it.quantity}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Next Steps Banner */}
          <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-left max-w-xl mx-auto flex items-start gap-3 print:bg-amber-50 print:border-amber-300">
            <span className="material-symbols-outlined text-amber-700 text-2xl! shrink-0 mt-0.5">
              info
            </span>
            <div className="text-xs text-amber-900 leading-relaxed">
              <span className="font-bold block text-sm mb-0.5">
                What happens next?
              </span>
              Our sales &amp; clinical equipment consultants will verify
              manufacturer availability, configure custom healthcare pricing and
              warranty options, and email an itemized PDF quote to{" "}
              <span className="font-semibold underline">
                {submittedQuote.email}
              </span>
              .
            </div>
          </div>

          {/* Action Buttons (Hidden on Print!) */}
          <div className="pt-4 flex flex-wrap items-center justify-center gap-3 print:hidden">
            <button
              type="button"
              onClick={() => window.print()}
              className="bg-white border border-gray-300 text-gray-700 font-bold text-xs sm:text-sm px-5 py-2.5 rounded-xl hover:bg-slate-50 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <span className="material-symbols-outlined text-sm!">print</span>
              Print Summary
            </button>

            {isAuthenticated ? (
              <Link
                href="/profile"
                className="bg-navy text-white text-xs sm:text-sm font-semibold px-6 py-2.5 rounded-xl hover:bg-navy-light transition-all shadow-md flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-sm!">
                  account_circle
                </span>
                View in My Profile
              </Link>
            ) : (
              <Link
                href="/login"
                className="bg-navy text-white text-xs sm:text-sm font-semibold px-6 py-2.5 rounded-xl hover:bg-navy-light transition-all shadow-md flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-sm!">
                  login
                </span>
                Sign In to Track
              </Link>
            )}

            <Link
              href="/products"
              className="bg-gold text-navy text-xs sm:text-sm font-bold px-6 py-2.5 rounded-xl hover:bg-gold-bright transition-all shadow-md flex items-center gap-1.5"
            >
              <span>Browse Catalogue</span>
              <span className="material-symbols-outlined text-sm!">
                arrow_forward
              </span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // LOADING STATE (Prevents hydration mismatch between server-rendered empty state and client localStorage)
  if (!isLoaded) {
    return (
      <div className="max-w-4xl mx-auto py-20 px-4 sm:px-6 lg:px-8 text-center font-sans">
        <div className="flex flex-col items-center justify-center gap-3">
          <div className="w-10 h-10 border-3 border-navy/20 border-t-navy rounded-full animate-spin" />
          <p className="text-sm text-gray-500 font-medium">
            Loading your quote cart...
          </p>
        </div>
      </div>
    );
  }

  // EMPTY CART STATE
  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto py-16 px-4 sm:px-6 lg:px-8 font-sans">
        <div className="bg-white rounded-3xl shadow-sm border border-gray-200/80 p-8 sm:p-14 text-center space-y-5">
          <div className="w-20 h-20 bg-slate-100 text-gray-400 rounded-3xl mx-auto flex items-center justify-center">
            <span className="material-symbols-outlined text-5xl!">
              production_quantity_limits
            </span>
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-navy tracking-tight">
              Your Quote Cart is Empty
            </h1>
            <p className="text-gray-500 max-w-md mx-auto text-sm sm:text-base mt-2">
              Browse our medical equipment catalogue and add products to request
              official healthcare quotations.
            </p>
          </div>
          <div className="pt-2">
            <Link
              href="/products"
              className="inline-flex items-center gap-2 bg-navy text-white font-bold text-sm px-6 py-3 rounded-xl hover:bg-navy-light transition-all shadow-md hover:scale-105 active:scale-95"
            >
              <span className="material-symbols-outlined text-lg!">
                storefront
              </span>
              Explore Products
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-10 px-4 sm:px-6 lg:px-8 font-sans">
      {/* Page Title & Authenticated Status */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-navy tracking-tight">
            Request Official Quotation
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Complete the procurement checkout below to receive custom healthcare
            facility pricing.
          </p>
        </div>

        {isAuthenticated && user ? (
          <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-800 text-xs px-3.5 py-1.5 rounded-xl border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>
              Signed in as{" "}
              <strong className="font-semibold">{user.email}</strong>
            </span>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setIsAuthModalOpen(true)}
            className="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-gray-700 text-xs px-3.5 py-1.5 rounded-xl transition-colors cursor-pointer border border-gray-200"
          >
            <span className="material-symbols-outlined text-sm!">lock</span>
            <span>
              Guest Mode (
              <strong className="text-blue-600 underline">
                Sign In / Register
              </strong>
              )
            </span>
          </button>
        )}
      </div>

      {/* Checkout Progress Stepper (eCommerce style) */}
      <div className="mb-8 bg-white p-3 sm:p-4 rounded-2xl border border-gray-200/80 shadow-xs">
        <div className="grid grid-cols-4 gap-2 text-center text-xs">
          {[
            { step: 1, title: "1. Cart Review", icon: "shopping_cart" },
            { step: 2, title: "2. Facility Info", icon: "local_hospital" },
            { step: 3, title: "3. RFQ Specs", icon: "tune" },
            { step: 4, title: "4. Confirmation", icon: "fact_check" },
          ].map((s) => {
            const isCompleted = currentStep > s.step;
            const isCurrent = currentStep === s.step;
            return (
              <button
                key={s.step}
                type="button"
                disabled={currentStep < s.step && s.step > 2}
                onClick={() => {
                  if (s.step < currentStep)
                    setCurrentStep(s.step as 1 | 2 | 3 | 4);
                }}
                className={`flex flex-col sm:flex-row items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl transition-all ${
                  isCurrent
                    ? "bg-navy text-white font-bold shadow-xs"
                    : isCompleted
                      ? "bg-emerald-50 text-emerald-800 font-semibold cursor-pointer"
                      : "text-gray-400 bg-slate-50 cursor-not-allowed"
                }`}
              >
                <span className="material-symbols-outlined text-base!">
                  {isCompleted ? "check" : s.icon}
                </span>
                <span className="truncate">{s.title}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Error Banner */}
      {errorMessage && (
        <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 flex items-center gap-3 text-red-700 text-sm animate-fadeIn">
          <span className="material-symbols-outlined text-xl! shrink-0">
            error
          </span>
          <span className="flex-1">{errorMessage}</span>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-red-500 hover:text-red-700"
          >
            <span className="material-symbols-outlined text-sm!">close</span>
          </button>
        </div>
      )}

      {/* STEP 1: CART REVIEW (Quantity managed here!) */}
      {currentStep === 1 && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-gray-200/80 shadow-xs overflow-hidden">
            <div className="p-5 sm:p-6 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-navy">
                  Selected Equipment ({itemCount} item{itemCount > 1 ? "s" : ""}
                  , {totalUnits} unit{totalUnits > 1 ? "s" : ""})
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Adjust product quantities and specify item-level accessory
                  requirements below.
                </p>
              </div>
              <button
                type="button"
                onClick={clearCart}
                className="text-xs font-semibold text-gray-400 hover:text-red-600 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm!">
                  delete_sweep
                </span>
                Clear Cart
              </button>
            </div>

            <div className="divide-y divide-gray-100">
              {items.map((item) => (
                <div
                  key={item.productId}
                  className="p-5 sm:p-6 flex flex-col md:flex-row gap-5 items-start md:items-center justify-between hover:bg-slate-50/50 transition-colors"
                >
                  {/* Product Details */}
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white border border-gray-200 rounded-2xl relative overflow-hidden shrink-0 flex items-center justify-center p-2">
                      {item.imageUrl ? (
                        <Image
                          src={getMediaUrl(item.imageUrl)}
                          alt={item.productName}
                          fill
                          sizes="80px"
                          className="object-contain p-1"
                        />
                      ) : (
                        <span className="material-symbols-outlined text-3xl! text-gray-300">
                          inventory_2
                        </span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        {item.brandName && (
                          <span className="text-[10px] font-bold uppercase tracking-wider text-red-700 bg-red-50 border border-red-100 px-2 py-0.2 rounded">
                            {item.brandName}
                          </span>
                        )}
                        {item.sku && (
                          <span className="text-[10px] font-mono text-gray-400">
                            SKU: {item.sku}
                          </span>
                        )}
                      </div>

                      <h3 className="font-bold text-navy text-sm sm:text-base leading-tight">
                        {item.productName}
                      </h3>

                      {/* Item-level notes input */}
                      <div className="mt-2.5 max-w-md">
                        <input
                          type="text"
                          value={item.itemNotes || ""}
                          onChange={(e) =>
                            updateItemNotes(item.productId, e.target.value)
                          }
                          placeholder="Specific options (e.g., wall mount, 230V plug, telemetry)..."
                          className="w-full text-xs px-3 py-1.5 rounded-lg border border-gray-200 bg-white focus:border-blue-500 outline-none text-navy"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Quantity Management (Managed exclusively at Cart!) */}
                  <div className="flex items-center gap-4 self-end md:self-center shrink-0">
                    <div className="flex items-center border border-gray-200 rounded-xl bg-white shadow-2xs overflow-hidden">
                      <button
                        type="button"
                        onClick={() =>
                          updateQuantity(
                            item.productId,
                            Math.max(1, item.quantity - 1),
                          )
                        }
                        disabled={item.quantity <= 1}
                        className="w-9 h-9 flex items-center justify-center text-gray-500 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                        title="Decrease quantity"
                      >
                        <span className="material-symbols-outlined text-sm!">
                          remove
                        </span>
                      </button>

                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          updateQuantity(
                            item.productId,
                            isNaN(val) || val < 1 ? 1 : val,
                          );
                        }}
                        className="w-12 text-center text-sm font-bold text-navy py-1.5 outline-none border-x border-gray-100"
                      />

                      <button
                        type="button"
                        onClick={() =>
                          updateQuantity(item.productId, item.quantity + 1)
                        }
                        className="w-9 h-9 flex items-center justify-center text-gray-500 hover:bg-slate-100 transition-colors cursor-pointer"
                        title="Increase quantity"
                      >
                        <span className="material-symbols-outlined text-sm!">
                          add
                        </span>
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeItem(item.productId)}
                      className="text-gray-400 hover:text-red-600 transition-colors p-1.5 rounded-lg hover:bg-red-50 cursor-pointer"
                      title="Remove from quote"
                    >
                      <span className="material-symbols-outlined text-lg!">
                        delete
                      </span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom Actions Bar */}
            <div className="p-5 sm:p-6 bg-slate-50 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
              <Link
                href="/products"
                className="text-xs sm:text-sm font-bold text-navy hover:text-blue-600 flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-sm!">
                  arrow_back
                </span>
                Continue Browsing Equipment
              </Link>

              <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                {!isAuthenticated && (
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm! text-amber-600">
                      lock
                    </span>
                    Sign-in required to submit
                  </span>
                )}
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="w-full sm:w-auto bg-navy text-white font-bold text-sm px-6 py-3 rounded-xl hover:bg-navy-light transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer hover:scale-102 active:scale-98"
                >
                  <span>Proceed to Facility Details</span>
                  <span className="material-symbols-outlined text-sm!">
                    {isAuthenticated ? "arrow_forward" : "lock"}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: FACILITY & REQUESTER DETAILS */}
      {currentStep === 2 && (
        <div className="bg-white rounded-3xl border border-gray-200/80 shadow-xs p-6 sm:p-8 space-y-6">
          <div>
            <h2 className="text-xl font-bold text-navy">
              Facility &amp; Contact Information
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              Provide your healthcare institution details so our team can assign
              the appropriate regional consultant.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Facility Name */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Hospital / Clinic / Organization Name{" "}
                <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={facilityName}
                onChange={(e) => setFacilityName(e.target.value)}
                placeholder="e.g. Mediclinic Panorama, Netcare St Augustine, Cape Town Day Clinic"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-blue-500 outline-none text-navy bg-slate-50 focus:bg-white transition-all"
                required
              />
            </div>

            {/* Contact Person */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Contact Person Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={contactName}
                onChange={(e) => setContactNameInput(e.target.value)}
                placeholder="e.g. Dr. Johan van der Merwe / Sister Nomsa"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-blue-500 outline-none text-navy bg-slate-50 focus:bg-white transition-all"
                required
              />
            </div>

            {/* Healthcare Sector */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Healthcare Sector <span className="text-red-500">*</span>
              </label>
              <CustomSelect
                value={sector}
                onChange={(val) => setSector(val)}
                options={HEALTHCARE_SECTORS}
                placeholder="Select Healthcare Sector"
                size="md"
                variant="slate"
                className="w-full"
              />
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Official Email Address <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="e.g. procurement@hospital.co.za"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-blue-500 outline-none text-navy bg-slate-50 focus:bg-white transition-all"
                required
              />
            </div>

            {/* Telephone Number */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Direct Telephone / Mobile{" "}
                <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhoneInput(e.target.value)}
                placeholder="e.g. +27 21 938 2111"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-blue-500 outline-none text-navy bg-slate-50 focus:bg-white transition-all"
                required
              />
            </div>

            {/* Department */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Department / Ward (Optional)
              </label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="e.g. ICU, Neonatal, Emergency, Operating Theatre"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-blue-500 outline-none text-navy bg-slate-50 focus:bg-white transition-all"
              />
            </div>

            {/* City / Province */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                City / Region
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Cape Town, Western Cape"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-blue-500 outline-none text-navy bg-slate-50 focus:bg-white transition-all"
              />
            </div>

            {/* Physical Address */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Delivery / Installation Address (Optional)
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Physical address for freight/delivery calculation"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-blue-500 outline-none text-navy bg-slate-50 focus:bg-white transition-all"
              />
            </div>
          </div>

          <div className="pt-6 border-t border-gray-100 flex items-center justify-between">
            <button
              type="button"
              onClick={handlePrevStep}
              className="text-xs sm:text-sm font-bold text-gray-500 hover:text-navy cursor-pointer flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-sm!">
                arrow_back
              </span>
              Back to Equipment Review
            </button>
            <button
              type="button"
              onClick={handleNextStep}
              className="bg-navy text-white font-bold text-sm px-6 py-2.5 rounded-xl hover:bg-navy-light transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              <span>Continue to RFQ Specs</span>
              <span className="material-symbols-outlined text-sm!">
                arrow_forward
              </span>
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: PROCUREMENT & RFQ SPECIFICATIONS (Payment alternative) */}
      {currentStep === 3 && (
        <div className="bg-white rounded-3xl border border-gray-200/80 shadow-xs p-6 sm:p-8 space-y-6">
          <div>
            <h2 className="text-xl font-bold text-navy">
              Procurement &amp; Quotation Specifications
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              Select your required turnaround urgency and detail any clinical or
              tender specifications.
            </p>
          </div>

          {/* Urgency Selector */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-3">
              Quotation Urgency Level
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {URGENCY_OPTIONS.map((opt) => (
                <div
                  key={opt.id}
                  onClick={() => setUrgency(opt.id)}
                  className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                    urgency === opt.id
                      ? "border-navy bg-blue-50/40 shadow-xs ring-2 ring-navy/10"
                      : "border-gray-200 bg-white hover:border-gray-300"
                  }`}
                >
                  <div>
                    <div className="mb-2">
                      <span className="material-symbols-outlined text-2xl! text-navy">
                        {opt.icon}
                      </span>
                    </div>
                    <div className="font-bold text-sm text-navy">
                      {opt.label}
                    </div>
                    <div className="text-xs text-gray-500 mt-1 leading-snug">
                      {opt.desc}
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-1 text-[11px] font-bold text-blue-600">
                    <span className="material-symbols-outlined text-sm!">
                      {urgency === opt.id
                        ? "radio_button_checked"
                        : "radio_button_unchecked"}
                    </span>
                    <span>{urgency === opt.id ? "Selected" : "Select"}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Project Notes & Technical Specifications */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Clinical Requirements, Tender Numbers or Installation Notes
            </label>
            <textarea
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Include telemetry receiver modules, training certifications required for 6 nursing staff, target commissioning by 15 November..."
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-blue-500 outline-none text-navy bg-slate-50 focus:bg-white transition-all"
            />
            <span className="text-[11px] text-gray-400 mt-1 block">
              You can also specify whether you require maintenance SLA contracts
              or on-site clinical demonstrations.
            </span>
          </div>

          <div className="pt-6 border-t border-gray-100 flex items-center justify-between">
            <button
              type="button"
              onClick={handlePrevStep}
              className="text-xs sm:text-sm font-bold text-gray-500 hover:text-navy cursor-pointer flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-sm!">
                arrow_back
              </span>
              Back to Facility Details
            </button>
            <button
              type="button"
              onClick={handleNextStep}
              className="bg-navy text-white font-bold text-sm px-6 py-2.5 rounded-xl hover:bg-navy-light transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              <span>Review Final Summary</span>
              <span className="material-symbols-outlined text-sm!">
                arrow_forward
              </span>
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: REVIEW & CONFIRM (Submit) */}
      {currentStep === 4 && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-gray-200/80 shadow-xs p-6 sm:p-8 space-y-6">
            <div>
              <h2 className="text-xl font-bold text-navy">
                Final Review &amp; Submission
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                Please review your medical quotation details before transmitting
                to our procurement desk.
              </p>
            </div>

            {/* Requester Information Card */}
            <div className="bg-slate-50 rounded-2xl p-4 sm:p-5 border border-gray-200/80">
              <div className="flex items-center justify-between border-b border-gray-200 pb-2 mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                  Facility &amp; Requester
                </span>
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="text-xs font-bold text-blue-600 hover:underline"
                >
                  Edit
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
                <div>
                  <span className="text-gray-400 block text-[11px]">
                    Facility Name
                  </span>
                  <span className="font-bold text-navy">{facilityName}</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[11px]">
                    Contact Person
                  </span>
                  <span className="font-bold text-navy">{contactName}</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[11px]">Email</span>
                  <span className="font-semibold text-gray-700">{email}</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[11px]">
                    Telephone
                  </span>
                  <span className="font-semibold text-gray-700">{phone}</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[11px]">
                    Sector
                  </span>
                  <span className="text-gray-700">{sector}</span>
                </div>
                {city && (
                  <div>
                    <span className="text-gray-400 block text-[11px]">
                      Destination City
                    </span>
                    <span className="text-gray-700">{city}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Equipment Items Summary */}
            <div className="border border-gray-200 rounded-2xl overflow-hidden">
              <div className="bg-slate-50 p-4 border-b border-gray-200 flex items-center justify-between text-xs font-bold text-gray-600 uppercase tracking-wider">
                <span>Requested Medical Equipment ({items.length})</span>
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="text-blue-600 hover:underline font-bold capitalize"
                >
                  Edit Items
                </button>
              </div>
              <div className="divide-y divide-gray-100">
                {items.map((it) => (
                  <div
                    key={it.productId}
                    className="p-4 flex items-center justify-between text-xs sm:text-sm"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-12 h-12 bg-white border border-gray-200 rounded-xl relative overflow-hidden shrink-0 flex items-center justify-center p-1">
                        {it.imageUrl ? (
                          <Image
                            src={getMediaUrl(it.imageUrl)}
                            alt={it.productName}
                            fill
                            sizes="48px"
                            className="object-contain p-0.5"
                          />
                        ) : (
                          <span className="material-symbols-outlined text-xl! text-gray-300">
                            inventory_2
                          </span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-navy truncate">
                          {it.productName}
                        </div>
                        <div className="text-xs text-gray-400 flex items-center gap-2 mt-0.5 flex-wrap">
                          {it.brandName && <span>Brand: {it.brandName}</span>}
                          {it.sku && <span>SKU: {it.sku}</span>}
                          {it.itemNotes && (
                            <span className="text-blue-600 italic">
                              &bull; Note: &quot;{it.itemNotes}&quot;
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="font-mono font-bold bg-slate-100 px-3 py-1 rounded-lg text-xs text-navy shrink-0 ml-3">
                      &times; {it.quantity}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Priority & Notes */}
            <div className="p-4 bg-amber-50/50 rounded-2xl border border-amber-200/80 text-xs text-gray-700 space-y-1">
              <div className="font-bold text-navy flex items-center gap-1.5">
                <span className="material-symbols-outlined text-amber-600 text-base!">
                  flag
                </span>
                <span>Urgency Level: {urgency}</span>
              </div>
              {notes && (
                <div className="pt-1 text-gray-600 italic">
                  &ldquo;{notes}&rdquo;
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="pt-6 border-t border-gray-100 flex items-center justify-between">
              <button
                type="button"
                onClick={handlePrevStep}
                className="text-xs sm:text-sm font-bold text-gray-500 hover:text-navy cursor-pointer flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-sm!">
                  arrow_back
                </span>
                Back
              </button>

              <button
                type="button"
                onClick={handleSubmitQuote}
                disabled={isSubmitting}
                className="bg-gold hover:bg-gold-bright text-navy font-black text-sm px-8 py-3.5 rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer hover:scale-102 active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-lg!">
                      progress_activity
                    </span>
                    <span>Submitting Request...</span>
                  </>
                ) : (
                  <>
                    <span>Submit Quote Request</span>
                    <span className="material-symbols-outlined text-base!">
                      send
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Authentication Modal Popup */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
      />
    </div>
  );
}
