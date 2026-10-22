import { useState } from 'react';
import { getCategoryColor } from '../../utils/calculations';
import type { SubscriptionCategory } from '../../types';

interface SubscriptionLogoProps {
  name: string;
  websiteUrl?: string;
  category: SubscriptionCategory;
  className?: string;
}

export function SubscriptionLogo({
  name,
  websiteUrl,
  category,
  className = '',
}: SubscriptionLogoProps) {
  const [failedUrl, setFailedUrl] = useState('');

  let logoUrl = '';

  if (websiteUrl?.trim()) {
    try {
      const parsed = new URL(websiteUrl.trim());

      if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
        logoUrl = `https://www.google.com/s2/favicons?domain_url=${encodeURIComponent(
          parsed.origin,
        )}&sz=128`;
      }
    } catch {
      // Invalid or missing URL: show the letter fallback.
    }
  }

  const showLogo = Boolean(logoUrl) && failedUrl !== logoUrl;

  return (
    <div
      className={`flex-shrink-0 overflow-hidden ${className}`}
      style={{
        backgroundColor: getCategoryColor(category),
      }}
    >
      {showLogo ? (
        <img
          src={logoUrl}
          alt={`${name} logo`}
          className="w-full h-full object-contain p-1.5"
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setFailedUrl(logoUrl)}
        />
      ) : (
        <span className="w-full h-full flex items-center justify-center text-white font-bold text-lg">
          {name.trim().charAt(0).toUpperCase() || '?'}
        </span>
      )}
    </div>
  );
}