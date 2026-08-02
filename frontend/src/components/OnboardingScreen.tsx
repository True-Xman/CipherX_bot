"use client";

import { useState } from "react";
import { ChevronRight, Radio, ShieldCheck, Zap } from "lucide-react";

type Step = {
  category: string;
  subtitle: string;
  dialogue: string;
  cta: string;
};

const STEPS: Step[] = [
  {
    category: "SIGNAL INTERCEPTED",
    subtitle: "Encrypted transmission // origin unknown",
    dialogue:
      "Human, you believe you own your digital assets because numbers appear on your screen. This is a pure illusion.",
    cta: "CONTINUE SIGNAL",
  },
  {
    category: "PROTOCOL BREACH",
    subtitle: "Decrypting node // integrity 87%",
    dialogue:
      "Every key you do not control is a promise someone else can break. Custody is not comfort. Custody is power.",
    cta: "CONTINUE SIGNAL",
  },
  {
    category: "GUARDIAN ONLINE",
    subtitle: "Neural handshake // synced",
    dialogue:
      "I am XMAN. I will teach you to hold what is truly yours. No middlemen. No illusions. Only the terminal.",
    cta: "CONTINUE SIGNAL",
  },
  {
    category: "TERMINAL READY",
    subtitle: "All systems armed // awaiting operator",
    dialogue:
      "The vault is calibrated. Step through, operator. From this point forward, your assets answer only to you.",
    cta: "INITIALIZE TERMINAL",
  },
];

export default function CyberpunkOnboarding() {
  const [step, setStep] = useState(0);
  const total = STEPS.length;
  const current = STEPS[step];
  const isLast = step === total - 1;

  const handleContinue = () => {
    setStep((s) => (s + 1) % total);
  };

  return (
    <main className="relative flex min-h-dvh w-full items-center justify-center bg-background p-4">
      <div className="relative flex min-h-dvh w-full max-w-md flex-col overflow-hidden border border-border bg-card sm:min-h-[860px] sm:rounded-3xl">
        {/* Grid & Glow */}
        <div className="cyber-grid pointer-events-none absolute inset-0 opacity-70" aria-hidden="true" />
        <div
          className="pointer-events-none absolute -top-24 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-primary/20 blur-[90px]"
          aria-hidden="true"
        />

        {/* Header */}
        <header className="relative z-10 flex items-center justify-between gap-3 border-b border-border px-5 py-4">
          <div className="flex flex-col">
            <span className="font-mono text-xs font-bold tracking-[0.28em] text-primary">SYSTEM ONLINE</span>
            <span className="font-mono text-[10px] tracking-[0.15em] text-muted-foreground">
              XMAN_TERMINAL <span className="text-muted-foreground">// v1.0</span>
            </span>
          </div>
          <span className="rounded-md border border-border bg-secondary px-2.5 py-1 font-mono text-[10px] tracking-[0.18em] text-primary">
            STEP {step + 1} / {total}
          </span>
        </header>

        {/* Progress Bar */}
        <div className="relative z-10 flex gap-1.5 px-5 pt-4" aria-hidden="true">
          {STEPS.map((_, i) => (
            <div key={i} className="h-1 flex-1 overflow-hidden rounded-full bg-secondary">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  i <= step ? "bg-primary shadow-[0_0_8px_var(--neon)]" : "bg-transparent"
                }`}
                style={{ width: i <= step ? "100%" : "0%" }}
              />
            </div>
          ))}
        </div>

        {/* Body */}
        <div className="relative z-10 flex flex-1 flex-col items-center px-5 pb-6 pt-8">
          {/* Avatar - Circular with direct neon glow, no square container */}
          <div className="relative flex flex-col items-center">
            {/* Only the circular avatar with neon glow */}
            <div className="relative h-40 w-40 animate-neon-pulse rounded-full border border-primary/70 bg-cyber shadow-[0_0_30px_rgba(0,255,102,0.6)] shadow-neon-green">
              <div className="relative h-full w-full overflow-hidden rounded-full bg-cyber">
                <img
                  src="/assets/xman-avatar.png"
                  alt="XMAN Guardian"
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = "none";
                  }}
                />
                {/* Scanline effect */}
                <div
                  className="pointer-events-none absolute inset-x-0 top-0 h-1/3 animate-scan bg-gradient-to-b from-primary/25 to-transparent"
                  aria-hidden="true"
                />
              </div>
            </div>

            {/* Guardian Badge */}
            <div className="relative z-10 -mt-3.5 flex items-center gap-1.5 rounded-full border border-primary/60 bg-background px-3.5 py-1.5 shadow-[0_0_14px_rgba(0,255,136,0.25)]">
              <ShieldCheck className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
              <span className="font-mono text-[10px] font-semibold tracking-[0.22em] text-primary">GUARDIAN</span>
            </div>
          </div>

          {/* Center card */}
          <div className="relative mt-8 w-full overflow-hidden rounded-2xl border border-border bg-secondary/60 p-5 backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/50 bg-accent px-3 py-1">
                <Radio className="h-3 w-3 text-primary" aria-hidden="true" />
                <span className="font-mono text-[10px] font-semibold tracking-[0.2em] text-primary">
                  {current.category}
                </span>
              </span>
            </div>
            <p className="mt-3 font-mono text-xs leading-relaxed tracking-wide text-muted-foreground">
              {current.subtitle}
            </p>
            <div className="relative mt-4 rounded-xl border border-border bg-background/80 p-4">
              <span className="absolute -top-2 left-4 bg-background px-2 font-mono text-[9px] tracking-[0.2em] text-primary/80">
                XMAN.SAYS
              </span>
              <p className="text-pretty text-[15px] leading-relaxed text-foreground">
                &ldquo;{current.dialogue}&rdquo;
              </p>
            </div>
          </div>
        </div>

        {/* Bottom action */}
        <footer className="relative z-10 border-t border-border px-5 pb-7 pt-5">
          {isLast ? (
            <p className="mb-4 text-center font-mono text-xs font-semibold tracking-[0.25em] text-primary animate-neon-pulse">
              INITIALIZING AGENT XMAN...
            </p>
          ) : null}
          <button
            type="button"
            onClick={handleContinue}
            className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl border border-primary bg-primary px-6 py-4 font-mono text-sm font-bold tracking-[0.15em] text-primary-foreground shadow-[0_0_20px_rgba(0,255,136,0.35)] transition-all duration-300 hover:shadow-[0_0_34px_rgba(0,255,136,0.6)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.98]"
          >
            <span
              className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 group-hover:translate-x-full"
              aria-hidden="true"
            />
            {isLast ? <Zap className="h-4 w-4" aria-hidden="true" /> : null}
            {current.cta}
            {!isLast ? (
              <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
            ) : null}
          </button>
          <p className="mt-3 text-center font-mono text-[10px] tracking-[0.2em] text-muted-foreground">
            SECURE CHANNEL // END-TO-END ENCRYPTED
          </p>
        </footer>
      </div>
    </main>
  );
}