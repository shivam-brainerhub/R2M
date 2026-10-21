"use client";

import AuthModal from "@/components/auth/AuthModal";
import { useAuth } from "@/context/AuthContext";
import { getProtectedDownloadUrl } from "@/lib/api";
import React, { useState } from "react";

interface BrochureDownloadButtonProps {
  brochureUrl?: string | null;
  className?: string;
  title?: string;
  children: React.ReactNode;
}

export default function BrochureDownloadButton({
  brochureUrl,
  className,
  title,
  children,
}: BrochureDownloadButtonProps) {
  const { isAuthenticated, token } = useAuth();
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  if (!brochureUrl) return null;

  const handleDownload = (authToken?: string | null) => {
    const activeToken = authToken || token;
    const url = getProtectedDownloadUrl(brochureUrl, activeToken);
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isAuthenticated) {
      handleDownload();
    } else {
      setIsAuthOpen(true);
    }
  };

  const handleAuthSuccess = () => {
    setIsAuthOpen(false);
    const storedToken =
      typeof window !== "undefined"
        ? localStorage.getItem("r2m_access_token") ||
          sessionStorage.getItem("r2m_access_token")
        : null;
    handleDownload(storedToken || token);
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className={className}
        title={title}
      >
        {children}
      </button>

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={handleAuthSuccess}
        customTitle="Sign In to Download Documentation"
        customSubtitle="Only authenticated healthcare professionals can download official manufacturer brochures, clinical manuals, and datasheets."
        submitButtonText="Sign In & Download Document"
        customFooterNote="Create a verified account or sign in to download medical device datasheets and technical documentation."
      />
    </>
  );
}
