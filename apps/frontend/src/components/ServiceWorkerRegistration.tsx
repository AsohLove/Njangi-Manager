"use client";

import { useEffect } from "react";

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log(
            "Njangi Manager service worker registered:",
            registration.scope
          );
        })
        .catch((error) => {
          console.error(
            "Njangi Manager service worker registration failed:",
            error
          );
        });
    }
  }, []);

  return null;
}