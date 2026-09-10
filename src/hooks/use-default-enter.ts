"use client";

import { useEffect, type RefObject } from "react";

export function useDefaultEnter(
  buttonRef: RefObject<HTMLButtonElement | null>,
  enabled = true,
) {
  useEffect(() => {
    if (!enabled) return;
    function onKeyDown(event: KeyboardEvent) {
      if (
        event.key !== "Enter" || event.defaultPrevented || event.repeat ||
        event.isComposing || event.keyCode === 229 ||
        event.shiftKey || event.ctrlKey || event.altKey || event.metaKey
      ) return;

      // Keep native Enter behavior for focused controls and editable content.
      const target = event.target;
      if (target instanceof Element && target.closest(
        'button, a, input, textarea, select, summary, [contenteditable]:not([contenteditable="false"]), [role="button"], [role="textbox"], [role="dialog"]',
      )) return;

      const button = buttonRef.current;
      if (!button || button.disabled || document.visibilityState !== "visible") return;
      event.preventDefault();
      button.click();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [buttonRef, enabled]);
}
