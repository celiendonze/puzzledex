import React, { useState, useEffect } from 'react';
import { Download, X, Share, PlusSquare, Smartphone, Check } from 'lucide-react';

export default function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showIosModal, setShowIosModal] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  useEffect(() => {
    // Vérifier si l'application est déjà lancée en mode autonome (installée)
    const checkStandalone = () => {
      const isStandaloneMode =
        window.matchMedia('(display-mode: standalone)').matches ||
        window.navigator.standalone === true ||
        document.referrer.includes('android-app://');
      setIsStandalone(Boolean(isStandaloneMode));
    };

    checkStandalone();

    // Vérifier si c'est un appareil iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    // Vérifier si l'utilisateur a masqué la bannière récemment
    const dismissed = localStorage.getItem('puzzledex_pwa_dismissed');
    if (dismissed && Date.now() - parseInt(dismissed, 10) < 7 * 24 * 60 * 60 * 1000) {
      setBannerDismissed(true);
    }

    // Écouter l'événement standard d'installation Chrome / Edge / Android
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setDeferredPrompt(null);
        setBannerDismissed(true);
      }
    } else if (isIOS) {
      setShowIosModal(true);
    }
  };

  const handleDismissBanner = () => {
    setBannerDismissed(true);
    localStorage.setItem('puzzledex_pwa_dismissed', Date.now().toString());
  };

  // Ne rien afficher si l'appli est déjà installée et ouverte en standalone
  if (isStandalone) return null;

  // L'utilisateur peut installer si deferredPrompt existe OU si on est sur iOS (Safari)
  const canInstall = Boolean(deferredPrompt || isIOS);

  if (!canInstall || bannerDismissed) {
    // Si la bannière est masquée mais que la modal iOS est ouverte
    if (showIosModal) {
      return <IosInstallModal onClose={() => setShowIosModal(false)} />;
    }
    return null;
  }

  return (
    <>
      {/* Petite bannière d'installation mobile discrète et élégante */}
      <div className="bg-gradient-to-r from-atelier-primaryLight via-atelier-surface to-atelier-subtle border-b border-atelier-border px-4 py-2.5 transition-all shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-atelier-primary text-white flex items-center justify-center shrink-0 shadow-2xs font-bold text-base">
              🧩
            </div>
            <div className="truncate">
              <span className="font-semibold text-atelier-text block sm:inline">
                Installer l'application PuzzleDex
              </span>
              <span className="text-atelier-muted hidden sm:inline ml-1.5">
                — Pour un confort plein écran sur votre téléphone
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleInstallClick}
              className="px-3 py-1.5 rounded-lg bg-atelier-primary hover:bg-atelier-primaryHover text-white font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer text-xs"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Installer</span>
            </button>
            <button
              onClick={handleDismissBanner}
              className="text-atelier-muted hover:text-atelier-text p-1 rounded-md"
              title="Ne plus afficher"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {showIosModal && <IosInstallModal onClose={() => setShowIosModal(false)} />}
    </>
  );
}

function IosInstallModal({ onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-atelier-surface border border-atelier-border rounded-2xl w-full max-w-md p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-atelier-muted hover:text-atelier-text p-1 rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-5">
          <div className="w-14 h-14 bg-atelier-primary/10 text-atelier-primary rounded-2xl flex items-center justify-center mx-auto mb-3 text-2xl shadow-xs">
            🧩
          </div>
          <h3 className="font-serif text-xl font-bold text-atelier-text">
            Installer PuzzleDex sur iPhone / iPad
          </h3>
          <p className="text-xs text-atelier-muted mt-1">
            Installez l'application pour l'utiliser en plein écran sans barre de navigation Safari.
          </p>
        </div>

        <div className="space-y-3.5 text-xs text-atelier-text mb-6 bg-atelier-subtle/50 p-4 rounded-xl border border-atelier-border">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-atelier-primary text-white flex items-center justify-center shrink-0 font-bold text-[11px] mt-0.5">
              1
            </div>
            <div>
              Touchez l'icône de <strong>Partage</strong> en bas de Safari :
              <div className="inline-flex items-center gap-1 ml-1.5 px-2 py-0.5 rounded bg-atelier-surface border border-atelier-border font-semibold">
                <Share className="w-3.5 h-3.5 text-blue-500" />
                <span>Partager</span>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-atelier-primary text-white flex items-center justify-center shrink-0 font-bold text-[11px] mt-0.5">
              2
            </div>
            <div>
              Faites défiler le menu et choisissez :
              <div className="inline-flex items-center gap-1 ml-1.5 px-2 py-0.5 rounded bg-atelier-surface border border-atelier-border font-semibold">
                <PlusSquare className="w-3.5 h-3.5 text-atelier-primary" />
                <span>Sur l'écran d'accueil</span>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-atelier-primary text-white flex items-center justify-center shrink-0 font-bold text-[11px] mt-0.5">
              3
            </div>
            <div>
              Touchez <strong>Ajouter</strong> en haut à droite. L'icône PuzzleDex apparaîtra directement sur votre écran !
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-atelier-primary hover:bg-atelier-primaryHover text-white font-bold text-sm shadow-xs transition-colors cursor-pointer"
        >
          J'ai compris
        </button>
      </div>
    </div>
  );
}
