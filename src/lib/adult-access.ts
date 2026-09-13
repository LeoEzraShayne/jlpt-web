// A remembered explicit acknowledgement on this browser, not proof of age or server authorization.
export const ADULT_ACCESS_KEY = "jlpt-adult-access-v1";
const eventName = "jlpt-adult-access-change";
let memoryOnly = false;
let revokedForPage = false;

function readConfirmation(storage: "localStorage" | "sessionStorage") {
  try { return window[storage].getItem(ADULT_ACCESS_KEY) === "confirmed"; }
  catch { return false; }
}

export function adultAccessConfirmed() {
  if (revokedForPage) return false;
  return readConfirmation("localStorage") || readConfirmation("sessionStorage") || memoryOnly;
}

export function setAdultAccessConfirmed(confirmed: boolean) {
  memoryOnly = confirmed;
  revokedForPage = false;
  for (const storage of ["localStorage", "sessionStorage"] as const) {
    try {
      if (confirmed) window[storage].setItem(ADULT_ACCESS_KEY, "confirmed");
      else window[storage].removeItem(ADULT_ACCESS_KEY);
    } catch {
      // A failed removal must not expose a stale acknowledgement in this page.
      if (!confirmed) revokedForPage = true;
    }
  }
  window.dispatchEvent(new Event(eventName));
}

export function subscribeAdultAccess(listener: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (event.key !== ADULT_ACCESS_KEY && event.key !== null) return;
    try { if (event.storageArea !== window.localStorage) return; }
    catch { return; }
    // Clear this tab's legacy acknowledgement too when another tab signs out.
    const confirmed = event.key === ADULT_ACCESS_KEY && event.newValue === "confirmed";
    memoryOnly = confirmed;
    revokedForPage = !confirmed;
    try {
      if (confirmed) sessionStorage.setItem(ADULT_ACCESS_KEY, "confirmed");
      else sessionStorage.removeItem(ADULT_ACCESS_KEY);
    } catch { /* The in-memory snapshot still reflects the cross-tab change. */ }
    listener();
  };
  window.addEventListener(eventName, listener);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(eventName, listener);
    window.removeEventListener("storage", onStorage);
  };
}
