import React, { useState, useEffect } from 'react';
import { Download, Share, X } from 'lucide-react';
import { Md3Button } from './md3/Md3Button';

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
      <div className="bg-md-surface-container-high text-md-on-surface px-4 py-2.5 flex items-center justify-between text-xs font-semibold shadow-sm border-b border-md-outline-variant/30">
        <div className="flex items-center gap-2.5">
          <Download className="w-4 h-4 text-md-primary shrink-0" />
          <span>Install Mandi App for faster, instant offline access</span>
        </div>
        <div className="flex items-center gap-2">
          <Md3Button
            variant="filled"
            size="sm"
            onClick={handleInstallClick}
            className="!h-8 !px-3 !text-xs"
          >
            Install
          </Md3Button>
          <button
            type="button"
            onClick={handleDismiss}
            className="p-1 rounded-full text-md-on-surface-variant hover:text-md-on-surface hover:bg-md-on-surface/[0.08]"
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
      <div className="bg-md-surface-container-high text-md-on-surface px-4 py-2.5 flex items-center justify-between text-xs font-medium shadow-sm border-b border-md-outline-variant/30">
        <div className="flex items-center gap-2.5">
          <Share className="w-4 h-4 text-md-primary shrink-0" />
          <span>
            Install on iPhone: Tap <strong className="font-bold text-md-primary">Share</strong> then <strong className="font-bold text-md-primary">Add to Home Screen</strong>
          </span>
        </div>
        <button
          type="button"
          onClick={handleDismiss}
          className="p-1 rounded-full text-md-on-surface-variant hover:text-md-on-surface hover:bg-md-on-surface/[0.08]"
          aria-label="Dismiss iOS guide banner"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return null;
};
