import React, { useState, useEffect } from "react";
import { X, Share, Plus, Download } from "lucide-react";

// Self-contained "Add to Home Screen" prompt.
// - Hidden entirely if the app is already running standalone (installed).
// - iOS Safari: shows manual instructions (no programmatic install on iOS).
// - Android/Chrome: captures beforeinstallprompt and offers a real Install button.
// - Dismissal is remembered for 30 days via localStorage.
export default function InstallPrompt() {
  const [visible, setVisible] = useState(false);
  const [platform, setPlatform] = useState("other"); // "ios" | "android" | "other"
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  useEffect(() => {
    // Already installed / launched from home screen → never show.
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true;
    if (standalone) return;

    // Respect a previous dismissal for 30 days.
    const snoozedUntil = parseInt(
      localStorage.getItem("household:installSnooze") || "0",
      10
    );
    if (Date.now() < snoozedUntil) return;

    const ua = window.navigator.userAgent.toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(ua);
    const isAndroid = /android/.test(ua);
    setPlatform(isIOS ? "ios" : isAndroid ? "android" : "other");

    // Android Chrome: capture the native install prompt.
    const onBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);

    // Delay so it appears AFTER the user has engaged, not on first paint.
    const t = setTimeout(() => setVisible(true), 4000);

    return () => {
      clearTimeout(t);
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
    };
  }, []);

  const snooze = () => {
    localStorage.setItem(
      "household:installSnooze",
      String(Date.now() + 30 * 24 * 60 * 60 * 1000)
    );
    setVisible(false);
  };

  const androidInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    try {
      await deferredPrompt.userChoice;
    } catch {}
    setDeferredPrompt(null);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 px-4 pb-4 pointer-events-none">
      <div className="pointer-events-auto max-w-md mx-auto bg-zinc-900/95 backdrop-blur-xl border border-zinc-700 rounded-2xl p-4 shadow-2xl">
        <div className="flex items-start gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #8b5cf6 0%, #c4b5fd 100%)" }}
          >
            <Download className="w-5 h-5 text-black" strokeWidth={2.5} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-white">
              Add Household to your Home Screen
            </div>

            {platform === "ios" && (
              <div className="text-xs text-zinc-400 mt-1 leading-relaxed">
                Tap the{" "}
                <Share className="inline w-3 h-3 -mt-0.5 text-zinc-300" /> Share
                button below, then choose{" "}
                <span className="text-zinc-200 font-medium">
                  “Add to Home Screen”
                </span>{" "}
                <Plus className="inline w-3 h-3 -mt-0.5 text-zinc-300" />.
              </div>
            )}

            {platform === "android" && (
              <div className="text-xs text-zinc-400 mt-1 leading-relaxed">
                Install it for one-tap access and a full-screen experience.
              </div>
            )}

            {platform === "other" && (
              <div className="text-xs text-zinc-400 mt-1 leading-relaxed">
                Use your browser menu and choose “Add to Home Screen” or
                “Install”.
              </div>
            )}

            <div className="flex gap-2 mt-3">
              {platform === "android" && deferredPrompt && (
                <button
                  onClick={androidInstall}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-black"
                  style={{
                    background:
                      "linear-gradient(135deg, #8b5cf6 0%, #c4b5fd 100%)",
                  }}
                >
                  Install
                </button>
              )}
              <button
                onClick={snooze}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-white"
              >
                Maybe later
              </button>
            </div>
          </div>
          <button
            onClick={snooze}
            className="text-zinc-500 hover:text-white flex-shrink-0 -mt-1 -mr-1 p-1"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
