"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  motion,
  useReducedMotion,
  useInView,
  useMotionValue,
  useTransform,
  animate,
} from "motion/react";
import { duration, easing } from "@/lib/constants/motion";

// ═══════════════════════════════════════════════════════════════
// 1. GradientText — animated gradient fill cycling violet/blue/purple
// ═══════════════════════════════════════════════════════════════

// SECURITY NOTE: All CSS constants below are static strings defined at build
// time in source code. They contain no user input and pose zero XSS risk.

const GRADIENT_TEXT_CSS = `
@property --gradient-angle {
  syntax: "<angle>";
  initial-value: 0deg;
  inherits: false;
}

@keyframes gradient-text-rotate {
  0% { --gradient-angle: 0deg; }
  100% { --gradient-angle: 360deg; }
}

.animated-gradient-text {
  background: linear-gradient(
    var(--gradient-angle),
    hsl(252, 87%, 67%) 0%,
    hsl(217, 91%, 60%) 33%,
    hsl(271, 81%, 56%) 66%,
    hsl(252, 87%, 67%) 100%
  );
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: gradient-text-rotate 6s linear infinite;
}

.animated-gradient-text--static {
  background: linear-gradient(
    135deg,
    hsl(252, 87%, 67%) 0%,
    hsl(217, 91%, 60%) 50%,
    hsl(271, 81%, 56%) 100%
  );
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: none;
}

@media (prefers-reduced-motion: reduce) {
  .animated-gradient-text {
    animation: none;
    background: linear-gradient(
      135deg,
      hsl(252, 87%, 67%) 0%,
      hsl(217, 91%, 60%) 50%,
      hsl(271, 81%, 56%) 100%
    );
  }
}
`;

interface GradientTextProps {
  children: ReactNode;
  className?: string;
  as?: "span" | "h1" | "h2" | "h3" | "p";
}

export function GradientText({
  children,
  className = "",
  as: Tag = "span",
}: GradientTextProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: GRADIENT_TEXT_CSS }} />
      <Tag
        className={`${
          prefersReducedMotion
            ? "animated-gradient-text--static"
            : "animated-gradient-text"
        } ${className}`}
      >
        {children}
      </Tag>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════
// 2. TypewriterText — typewriter effect with blinking cursor
// ═══════════════════════════════════════════════════════════════

const TYPEWRITER_CURSOR_CSS = `
@keyframes typewriter-blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}

.typewriter-cursor {
  display: inline-block;
  width: 2px;
  height: 1em;
  background: currentColor;
  margin-left: 2px;
  vertical-align: text-bottom;
  animation: typewriter-blink 1s step-end infinite;
}

@media (prefers-reduced-motion: reduce) {
  .typewriter-cursor {
    animation: none;
    opacity: 1;
  }
}
`;

interface TypewriterTextProps {
  text: string;
  className?: string;
  /** Milliseconds per character */
  speed?: number;
  /** Delay before starting in ms */
  startDelay?: number;
  /** Show blinking cursor */
  showCursor?: boolean;
}

export function TypewriterText({
  text,
  className = "",
  speed = 50,
  startDelay = 0,
  showCursor = true,
}: TypewriterTextProps) {
  const prefersReducedMotion = useReducedMotion();
  const [displayed, setDisplayed] = useState(prefersReducedMotion ? text : "");
  const [isComplete, setIsComplete] = useState(!!prefersReducedMotion);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (prefersReducedMotion || !isInView) return;

    let timeoutId: ReturnType<typeof setTimeout>;
    let charIndex = 0;

    const startTyping = () => {
      const typeChar = () => {
        if (charIndex < text.length) {
          charIndex++;
          setDisplayed(text.slice(0, charIndex));
          timeoutId = setTimeout(typeChar, speed);
        } else {
          setIsComplete(true);
        }
      };
      typeChar();
    };

    timeoutId = setTimeout(startTyping, startDelay);

    return () => clearTimeout(timeoutId);
  }, [text, speed, startDelay, isInView, prefersReducedMotion]);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: TYPEWRITER_CURSOR_CSS }} />
      <span ref={ref} className={className}>
        <span>{displayed}</span>
        {showCursor && !isComplete && (
          <span className="typewriter-cursor" aria-hidden="true" />
        )}
      </span>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════
// 3. FadeUpText — fades in and slides up on scroll into view
// ═══════════════════════════════════════════════════════════════

interface FadeUpTextProps {
  children: ReactNode;
  className?: string;
  as?: "div" | "p" | "h1" | "h2" | "h3" | "h4" | "span";
  delay?: number;
  offset?: number;
}

export function FadeUpText({
  children,
  className = "",
  as = "div",
  delay = 0,
  offset = 24,
}: FadeUpTextProps) {
  const prefersReducedMotion = useReducedMotion();
  const Tag = motion[as];

  return (
    <Tag
      initial={prefersReducedMotion ? false : { opacity: 0, y: offset }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={
        prefersReducedMotion
          ? { duration: 0 }
          : {
              duration: duration.moderate,
              ease: easing.out,
              delay,
            }
      }
      className={className}
    >
      {children}
    </Tag>
  );
}

// ═══════════════════════════════════════════════════════════════
// 4. CountUpNumber — number counts up from 0 on scroll into view
// ═══════════════════════════════════════════════════════════════

interface CountUpNumberProps {
  to: number;
  className?: string;
  /** Duration in seconds */
  countDuration?: number;
  /** Prefix like "$" */
  prefix?: string;
  /** Suffix like "+" or "%" */
  suffix?: string;
}

export function CountUpNumber({
  to,
  className = "",
  countDuration = 1.5,
  prefix = "",
  suffix = "",
}: CountUpNumberProps) {
  const prefersReducedMotion = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.5 });
  const motionVal = useMotionValue(0);
  const rounded = useTransform(motionVal, (latest) => Math.round(latest));
  const [display, setDisplay] = useState(prefersReducedMotion ? to : 0);

  useEffect(() => {
    if (!isInView) return;

    if (prefersReducedMotion) {
      setDisplay(to);
      return;
    }

    const controls = animate(motionVal, to, {
      duration: countDuration,
      ease: easing.out as unknown as [number, number, number, number],
    });

    const unsubscribe = rounded.on("change", (v) => setDisplay(v));

    return () => {
      controls.stop();
      unsubscribe();
    };
  }, [isInView, to, countDuration, prefersReducedMotion, motionVal, rounded]);

  return (
    <span ref={ref} className={className}>
      {prefix}
      {display}
      {suffix}
    </span>
  );
}
