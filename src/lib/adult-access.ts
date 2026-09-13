// A browser-tab acknowledgement, not proof of age or server authorization.
export const ADULT_ACCESS_KEY = "jlpt-adult-access-v1";
const eventName = "jlpt-adult-access-change";
let memoryOnly = false;

export function adultAccessConfirmed() {
  try { return sessionStorage.getItem(ADULT_ACCESS_KEY) === "confirmed"; }
  catch { return memoryOnly; }
}
export function setAdultAccessConfirmed(confirmed: boolean) {
  memoryOnly = confirmed;
  try {
    if (confirmed) sessionStorage.setItem(ADULT_ACCESS_KEY, "confirmed");
    else sessionStorage.removeItem(ADULT_ACCESS_KEY);
  } catch { /* Keep the current page usable when browser storage is unavailable. */ }
  window.dispatchEvent(new Event(eventName));
}
export function subscribeAdultAccess(listener: () => void) {
  window.addEventListener(eventName, listener);
  return () => window.removeEventListener(eventName, listener);
}
