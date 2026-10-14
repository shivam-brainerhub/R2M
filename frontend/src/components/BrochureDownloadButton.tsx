'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getMediaUrl } from '@/lib/api';
import AuthModal from '@/components/auth/AuthModal';

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
  const { isAuthenticated } = useAuth();
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  if (!brochureUrl) return null;

  const handleDownload = () => {
    const url = getMediaUrl(brochureUrl);
    window.open(url, '_blank', 'noopener,noreferrer');
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
    handleDownload();
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
        customTitle="Sign In to Download Brochure"
        customSubtitle="Only authenticated healthcare professionals can download official manufacturer brochures."
        submitButtonText="Sign In & Download Brochure"
        customFooterNote="Create a verified account or sign in to download medical device datasheets and brochures."
      />
    </>
  );
}
