"use client";

import { useState, useCallback, type FormEvent } from "react";
import { Mail, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

// ── Constants ────────────────────────────────────────────────

const STORAGE_KEY = "architex-newsletter-emails";
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ── Types ────────────────────────────────────────────────────

type SubmitState = "idle" | "submitting" | "success" | "error";

export interface NewsletterSignupProps {
  /** Optional heading text */
  heading?: string;
  /** Optional description text */
  description?: string;
  /** Additional class names for the container */
  className?: string;
  /** Compact mode for footer embedding */
  compact?: boolean;
}

// ── Helpers ──────────────────────────────────────────────────

function getStoredEmails(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function storeEmail(email: string): void {
  const emails = getStoredEmails();
  if (!emails.includes(email)) {
    emails.push(email);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(emails));
  }
}

function isAlreadySubscribed(email: string): boolean {
  return getStoredEmails().includes(email);
}

// ── Component ────────────────────────────────────────────────

export function NewsletterSignup({
  heading = "Stay in the loop",
  description = "Get weekly system design insights, interview tips, and new module announcements straight to your inbox.",
  className,
  compact = false,
}: NewsletterSignupProps) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<SubmitState>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setErrorMessage("");

      const trimmed = email.trim().toLowerCase();

      // Validate
      if (!trimmed) {
        setState("error");
        setErrorMessage("Please enter your email address.");
        return;
      }

      if (!EMAIL_REGEX.test(trimmed)) {
        setState("error");
        setErrorMessage("Please enter a valid email address.");
        return;
      }

      if (isAlreadySubscribed(trimmed)) {
        setState("error");
        setErrorMessage("This email is already subscribed.");
        return;
      }

      // Simulate async subscription (mock -- real would use Resend API)
      setState("submitting");
      await new Promise((resolve) => setTimeout(resolve, 800));

      try {
        storeEmail(trimmed);
        setState("success");
        setEmail("");
      } catch {
        setState("error");
        setErrorMessage("Something went wrong. Please try again.");
      }
    },
    [email],
  );

  // ── Success state ──────────────────────────────────────────

  if (state === "success") {
    return (
      <div
        className={cn(
          "flex items-center gap-3 rounded-lg border border-green-500/20 bg-green-500/5 p-4",
          className,
        )}
        role="status"
        aria-live="polite"
      >
        <CheckCircle className="h-5 w-5 shrink-0 text-green-500" />
        <p className="text-sm font-medium text-green-400">
          You are subscribed! Check your inbox for a confirmation.
        </p>
      </div>
    );
  }

  // ── Default / error state ──────────────────────────────────

  return (
    <div
      className={cn(
        "rounded-lg border border-border/50 bg-card/50 backdrop-blur-sm",
        compact ? "p-4" : "p-6",
        className,
      )}
    >
      {!compact && (
        <div className="mb-4 flex items-center gap-2">
          <Mail className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">{heading}</h3>
        </div>
      )}

      {!compact && (
        <p className="mb-4 text-sm text-muted-foreground">{description}</p>
      )}

      {compact && (
        <p className="mb-3 text-sm font-medium text-foreground">{heading}</p>
      )}

      <form
        onSubmit={handleSubmit}
        className={cn("flex gap-2", compact ? "flex-col sm:flex-row" : "flex-col sm:flex-row")}
        noValidate
      >
        <Input
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (state === "error") {
              setState("idle");
              setErrorMessage("");
            }
          }}
          aria-label="Email address"
          aria-invalid={state === "error"}
          aria-describedby={state === "error" ? "newsletter-error" : undefined}
          disabled={state === "submitting"}
          className="flex-1"
        />
        <Button
          type="submit"
          disabled={state === "submitting"}
          size={compact ? "sm" : "default"}
          className="shrink-0"
        >
          {state === "submitting" ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Subscribing...
            </>
          ) : (
            "Subscribe"
          )}
        </Button>
      </form>

      {state === "error" && errorMessage && (
        <div
          id="newsletter-error"
          className="mt-2 flex items-center gap-2 text-sm text-destructive"
          role="alert"
        >
          <AlertCircle className="h-4 w-4 shrink-0" />
          {errorMessage}
        </div>
      )}
    </div>
  );
}
