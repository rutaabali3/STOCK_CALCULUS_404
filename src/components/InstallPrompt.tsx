import React, { useState, useEffect } from 'react';
import { Download, Share, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const InstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIosPrompt, setShowIosPrompt] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if user already dismissed banner this session
    const isDismissed = sessionStorage.getItem('mandi_install_dismissed');
    if (isDismissed) {
      setDismissed(true);
      return;
    }

    // Check if app is already running in standalone mode
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;

    if (isStandalone) {
      return;
    }

    // 1. Android / Desktop Chrome / Edge beforeinstallprompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // 2. iOS Safari detection (no beforeinstallprompt)
    const isIos = /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());
    if (isIos && !isStandalone) {
      setShowIosPrompt(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem('mandi_install_dismissed', 'true');
  };

  if (dismissed) return null;

  // Android / Desktop native install banner
  if (deferredPrompt) {
    return (
      <div className="bg-forest text-cream px-4 py-2.5 flex items-center justify-between text-xs font-semibold shadow-md border-b border-moss/40">
        <div className="flex items-center gap-2">
          <Download className="w-4 h-4 text-wheat shrink-0" />
          <span>Install Mandi App on your phone for instant offline access</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleInstallClick}
            className="px-3 py-1 bg-wheat text-forest font-bold rounded-lg hover:bg-wheat/90 active:scale-95 transition-all"
          >
            Install
          </button>
          <button
            type="button"
            onClick={handleDismiss}
            className="p-1 text-cream/70 hover:text-white"
            aria-label="Dismiss banner"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // iOS Safari "Add to Home Screen" guide banner
  if (showIosPrompt) {
    return (
      <div className="bg-forest text-cream px-4 py-2.5 flex items-center justify-between text-xs font-medium shadow-md border-b border-moss/40">
        <div className="flex items-center gap-2">
          <Share className="w-4 h-4 text-wheat shrink-0" />
          <span>
            Install on iPhone: Tap <strong className="text-white">Share</strong> then <strong className="text-white">Add to Home Screen</strong>
          </span>
        </div>
        <button
          type="button"
          onClick={handleDismiss}
          className="p-1 text-cream/70 hover:text-white"
          aria-label="Dismiss iOS guide banner"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return null;
};
