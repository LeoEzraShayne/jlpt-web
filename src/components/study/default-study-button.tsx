"use client";

import { useRef, type ReactNode } from "react";
import { LoaderCircle } from "lucide-react";
import { useDefaultEnter } from "@/hooks/use-default-enter";
import { Button } from "@/components/ui/button";

export function DefaultStudyButton({
  disabled,
  onClick,
  children,
  title,
}: {
  disabled: boolean;
  onClick: () => void;
  children: ReactNode;
  title: string;
}) {
  const buttonRef = useRef<HTMLButtonElement>(null);

  useDefaultEnter(buttonRef);

  return (
    <Button ref={buttonRef} disabled={disabled} onClick={onClick}
      className="min-w-0 px-2 text-xs sm:text-sm"
      aria-keyshortcuts="Enter" title={`${title}（Enter）`}>
      {disabled && <LoaderCircle className="animate-spin" />}
      {children}
    </Button>
  );
}
