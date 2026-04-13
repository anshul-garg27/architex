"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BrainCircuit,
  Palette,
  Volume2,
  Accessibility,
  Keyboard,
  DatabaseZap,
  Moon,
  Sun,
  Monitor,
  Download,
  Upload,
  Trash2,
  Check,
  Gauge,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore, type Theme, type AnimationSpeed } from "@/stores/ui-store";
import { useReducedMotionContext } from "@/providers/ReducedMotionProvider";
import { AISettingsSection } from "@/components/settings/AISettingsSection";
import { useIsMobile } from "@/hooks/use-media-query";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// ── Constants ──────────────────────────────────────────────────

type SectionId =
  | "appearance"
  | "animation"
  | "sound"
  | "accessibility"
  | "ai"
  | "keyboard-shortcuts"
  | "data-management";

interface NavSection {
  id: SectionId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const SECTIONS: NavSection[] = [
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "animation", label: "Animation Speed", icon: Gauge },
  { id: "sound", label: "Sound", icon: Volume2 },
  { id: "accessibility", label: "Accessibility", icon: Accessibility },
  { id: "ai", label: "AI", icon: BrainCircuit },
  { id: "keyboard-shortcuts", label: "Keyboard Shortcuts", icon: Keyboard },
  { id: "data-management", label: "Data Management", icon: DatabaseZap },
];

const THEME_OPTIONS: { value: Theme; label: string; icon: typeof Moon }[] = [
  { value: "dark", label: "Dark", icon: Moon },
  { value: "light", label: "Light", icon: Sun },
  { value: "system", label: "System", icon: Monitor },
];

type FontSize = "small" | "medium" | "large";

const FONT_SIZE_MAP: Record<FontSize, string> = {
  small: "14px",
  medium: "16px",
  large: "18px",
};

interface ShortcutEntry {
  keys: string[];
  description: string;
}

interface ShortcutCategory {
  name: string;
  shortcuts: ShortcutEntry[];
}

const SHORTCUT_CATEGORIES: ShortcutCategory[] = [
  {
    name: "General",
    shortcuts: [
      { keys: ["\u2318", "K"], description: "Open command palette" },
      { keys: ["\u2318", "B"], description: "Toggle sidebar" },
      { keys: ["\u2318", "J"], description: "Toggle bottom panel" },
      { keys: ["\u2318", "\u21e7", "B"], description: "Toggle properties panel" },
      { keys: ["\u2318", "E"], description: "Export diagram" },
      { keys: ["\u2318", "I"], description: "Import diagram" },
      { keys: ["\u2318", "T"], description: "Browse templates" },
      { keys: ["\u2318", "Z"], description: "Undo" },
      { keys: ["\u2318", "\u21e7", "Z"], description: "Redo" },
      { keys: ["\u2318", "\u21e7", "C"], description: "Capacity Calculator" },
      { keys: ["\u2318", "\u21e7", "E"], description: "Estimation Pad" },
    ],
  },
  {
    name: "Canvas",
    shortcuts: [
      { keys: ["\u2318", "A"], description: "Select all nodes" },
      { keys: ["\u232b"], description: "Delete selected" },
      { keys: ["Space"], description: "Play / pause simulation" },
    ],
  },
  {
    name: "Modules",
    shortcuts: [
      { keys: ["\u2318", "1"], description: "System Design" },
      { keys: ["\u2318", "2"], description: "Algorithms" },
      { keys: ["\u2318", "3"], description: "Data Structures" },
      { keys: ["\u2318", "4"], description: "Low-Level Design" },
      { keys: ["\u2318", "5"], description: "Database" },
      { keys: ["\u2318", "6"], description: "Distributed Systems" },
      { keys: ["\u2318", "7"], description: "Networking" },
      { keys: ["\u2318", "8"], description: "OS Concepts" },
      { keys: ["\u2318", "9"], description: "Concurrency" },
    ],
  },
];

// ── Helpers ────────────────────────────────────────────────────

function readLocalStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw !== null ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeLocalStorage(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // localStorage unavailable -- ignore
  }
}

// ── Section Components ─────────────────────────────────────────

function AppearanceSection() {
  const theme = useUIStore((s) => s.theme);
  const setTheme = useUIStore((s) => s.setTheme);

  const [fontSize, setFontSize] = useState<FontSize>("medium");

  useEffect(() => {
    setFontSize(readLocalStorage<FontSize>("architex-font-size", "medium"));
  }, []);

  const handleFontSizeChange = useCallback((value: string) => {
    const size = value as FontSize;
    setFontSize(size);
    writeLocalStorage("architex-font-size", size);
    document.documentElement.style.fontSize = FONT_SIZE_MAP[size];
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Appearance</CardTitle>
        <CardDescription>
          Customize the look and feel of the application.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Theme */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Theme</Label>
          <div className="grid grid-cols-3 gap-3">
            {THEME_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              const isActive = theme === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => setTheme(opt.value)}
                  className={cn(
                    "flex flex-col items-center gap-2 rounded-lg border p-3 transition-all",
                    isActive
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-foreground-muted hover:border-foreground-muted hover:text-foreground",
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-xs font-medium">{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <Separator />

        {/* Font size */}
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-0.5">
            <Label className="text-sm font-medium">Font Size</Label>
            <p className="text-xs text-muted-foreground">
              Adjust the base font size across the app.
            </p>
          </div>
          <Select value={fontSize} onValueChange={handleFontSizeChange}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="small">Small</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="large">Large</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}

const ANIMATION_SPEED_OPTIONS: {
  value: AnimationSpeed;
  label: string;
  description: string;
}[] = [
  { value: "slow", label: "Slow", description: "2x duration -- relaxed pacing" },
  { value: "normal", label: "Normal", description: "Default animation speed" },
  { value: "fast", label: "Fast", description: "0.5x duration -- snappy feel" },
];

function AnimationSpeedSection() {
  const animationSpeed = useUIStore((s) => s.animationSpeed);
  const setAnimationSpeed = useUIStore((s) => s.setAnimationSpeed);

  const handleChange = useCallback(
    (value: string) => {
      setAnimationSpeed(value as AnimationSpeed);
    },
    [setAnimationSpeed],
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Animation Speed</CardTitle>
        <CardDescription>
          Control how fast animations and transitions play throughout the app.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-0.5">
            <Label className="text-sm font-medium">Speed</Label>
            <p className="text-xs text-muted-foreground">
              {ANIMATION_SPEED_OPTIONS.find((o) => o.value === animationSpeed)?.description}
            </p>
          </div>
          <Select value={animationSpeed} onValueChange={handleChange}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ANIMATION_SPEED_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}

function SoundSection() {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [volume, setVolume] = useState(70);

  useEffect(() => {
    setSoundEnabled(readLocalStorage("architex-sound-enabled", true));
    setVolume(readLocalStorage("architex-sound-volume", 70));
  }, []);

  const handleToggleSound = useCallback((checked: boolean) => {
    setSoundEnabled(checked);
    writeLocalStorage("architex-sound-enabled", checked);
  }, []);

  const handleVolumeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = Number(e.target.value);
      setVolume(val);
      writeLocalStorage("architex-sound-volume", val);
    },
    [],
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sound</CardTitle>
        <CardDescription>
          Configure audio feedback for interactions.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Sound toggle */}
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-0.5">
            <Label htmlFor="sound-toggle" className="text-sm font-medium">
              Enable Sound
            </Label>
            <p className="text-xs text-muted-foreground">
              Play audio cues on interactions and events.
            </p>
          </div>
          <Switch
            id="sound-toggle"
            checked={soundEnabled}
            onCheckedChange={handleToggleSound}
          />
        </div>

        <Separator />

        {/* Volume slider */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="volume-slider" className="text-sm font-medium">
              Volume
            </Label>
            <span className="text-xs tabular-nums text-muted-foreground">
              {volume}%
            </span>
          </div>
          <input
            id="volume-slider"
            type="range"
            min={0}
            max={100}
            step={1}
            value={volume}
            disabled={!soundEnabled}
            onChange={handleVolumeChange}
            className={cn(
              "h-2 w-full cursor-pointer appearance-none rounded-full bg-muted",
              "[&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow",
              "[&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-primary [&::-moz-range-thumb]:shadow",
              "disabled:cursor-not-allowed disabled:opacity-50",
            )}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function AccessibilitySection() {
  const { prefersReducedMotion, toolbarOverride, setToolbarOverride } =
    useReducedMotionContext();

  const [highContrast, setHighContrast] = useState(false);
  const [a11yFontSize, setA11yFontSize] = useState<FontSize>("medium");

  useEffect(() => {
    setHighContrast(readLocalStorage("architex-high-contrast", false));
    setA11yFontSize(
      readLocalStorage<FontSize>("architex-a11y-font-size", "medium"),
    );
  }, []);

  const handleReducedMotionToggle = useCallback(
    (checked: boolean) => {
      setToolbarOverride(checked);
    },
    [setToolbarOverride],
  );

  const handleHighContrastToggle = useCallback((checked: boolean) => {
    setHighContrast(checked);
    writeLocalStorage("architex-high-contrast", checked);
    if (checked) {
      document.documentElement.classList.add("high-contrast");
    } else {
      document.documentElement.classList.remove("high-contrast");
    }
  }, []);

  const handleA11yFontSizeChange = useCallback((value: string) => {
    const size = value as FontSize;
    setA11yFontSize(size);
    writeLocalStorage("architex-a11y-font-size", size);
    document.documentElement.style.fontSize = FONT_SIZE_MAP[size];
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Accessibility</CardTitle>
        <CardDescription>
          Settings to improve usability and comfort.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Reduced motion */}
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-0.5">
            <Label
              htmlFor="reduced-motion-toggle"
              className="text-sm font-medium"
            >
              Reduced Motion
            </Label>
            <p className="text-xs text-muted-foreground">
              Minimize animations throughout the app.
              {toolbarOverride === null &&
                " Currently following your OS setting."}
            </p>
          </div>
          <Switch
            id="reduced-motion-toggle"
            checked={prefersReducedMotion}
            onCheckedChange={handleReducedMotionToggle}
          />
        </div>
        {toolbarOverride !== null && (
          <button
            onClick={() => setToolbarOverride(null)}
            className="text-xs text-primary hover:underline"
          >
            Reset to OS default
          </button>
        )}

        <Separator />

        {/* High contrast */}
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-0.5">
            <Label
              htmlFor="high-contrast-toggle"
              className="text-sm font-medium"
            >
              High Contrast
            </Label>
            <p className="text-xs text-muted-foreground">
              Increase contrast ratios for better readability.
            </p>
          </div>
          <Switch
            id="high-contrast-toggle"
            checked={highContrast}
            onCheckedChange={handleHighContrastToggle}
          />
        </div>

        <Separator />

        {/* Font size override */}
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-0.5">
            <Label className="text-sm font-medium">Font Size Override</Label>
            <p className="text-xs text-muted-foreground">
              Override the base font size for accessibility.
            </p>
          </div>
          <Select value={a11yFontSize} onValueChange={handleA11yFontSizeChange}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="small">Small</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="large">Large</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}

function KeyBadge({ children }: { children: string }) {
  return (
    <kbd
      className={cn(
        "inline-flex h-6 min-w-6 items-center justify-center rounded-md",
        "border border-border bg-sidebar px-1.5",
        "text-[11px] font-medium text-foreground-muted",
        "shadow-[0_1px_0_1px_rgba(0,0,0,0.15)]",
      )}
    >
      {children}
    </kbd>
  );
}

function KeyboardShortcutsSection() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Keyboard Shortcuts</CardTitle>
        <CardDescription>
          A reference of all available keyboard shortcuts. Press{" "}
          <KeyBadge>?</KeyBadge> anywhere in the canvas to open the shortcuts
          overlay.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {SHORTCUT_CATEGORIES.map((category) => (
            <div key={category.name}>
              <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {category.name}
              </h3>
              <div className="space-y-1">
                {category.shortcuts.map((shortcut, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between gap-4 rounded-md px-2 py-1.5 transition-colors hover:bg-accent/50"
                  >
                    <span className="text-sm text-foreground">
                      {shortcut.description}
                    </span>
                    <div className="flex shrink-0 items-center gap-1">
                      {shortcut.keys.map((key, ki) => (
                        <KeyBadge key={ki}>{key}</KeyBadge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function DataManagementSection() {
  const [clearConfirm, setClearConfirm] = useState(false);
  const [exportDone, setExportDone] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClearData = useCallback(() => {
    if (!clearConfirm) {
      setClearConfirm(true);
      return;
    }
    try {
      localStorage.clear();
      setClearConfirm(false);
      window.location.reload();
    } catch {
      // ignore
    }
  }, [clearConfirm]);

  const handleExport = useCallback(() => {
    try {
      const data: Record<string, string> = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          data[key] = localStorage.getItem(key) ?? "";
        }
      }

      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `architex-data-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setExportDone(true);
      setTimeout(() => setExportDone(false), 2000);
    } catch {
      // ignore
    }
  }, []);

  const handleImport = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target?.result as string) as Record<
            string,
            string
          >;
          for (const [key, value] of Object.entries(data)) {
            localStorage.setItem(key, value);
          }
          window.location.reload();
        } catch {
          // Invalid JSON -- ignore
        }
      };
      reader.readAsText(file);

      // Reset file input so the same file can be re-selected
      e.target.value = "";
    },
    [],
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Data Management</CardTitle>
        <CardDescription>
          Export, import, or clear your local application data.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Export */}
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-0.5">
            <p className="text-sm font-medium text-foreground">
              Export Progress
            </p>
            <p className="text-xs text-muted-foreground">
              Download all saved progress and settings as a JSON file.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={handleExport}>
            {exportDone ? (
              <>
                <Check className="h-4 w-4" />
                Exported
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Export
              </>
            )}
          </Button>
        </div>

        <Separator />

        {/* Import */}
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-0.5">
            <p className="text-sm font-medium text-foreground">
              Import Progress
            </p>
            <p className="text-xs text-muted-foreground">
              Restore data from a previously exported JSON file.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={handleImport}>
            <Upload className="h-4 w-4" />
            Import
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        <Separator />

        {/* Clear local data */}
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-0.5">
            <p className="text-sm font-medium text-foreground">
              Clear Local Data
            </p>
            <p className="text-xs text-muted-foreground">
              Remove all locally stored progress and settings. This action
              cannot be undone.
            </p>
          </div>
          <Button
            variant={clearConfirm ? "destructive" : "outline"}
            size="sm"
            onClick={handleClearData}
            onBlur={() => setClearConfirm(false)}
          >
            <Trash2 className="h-4 w-4" />
            {clearConfirm ? "Confirm Clear" : "Clear Data"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ── AI Section Wrapper ────────────────────────────────────────

function AISection() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>AI</CardTitle>
        <CardDescription>
          Configure AI-powered features and manage your API key.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <AISettingsSection />
      </CardContent>
    </Card>
  );
}

// ── Section Map ────────────────────────────────────────────────

const SECTION_COMPONENTS: Record<SectionId, React.ComponentType> = {
  appearance: AppearanceSection,
  animation: AnimationSpeedSection,
  sound: SoundSection,
  accessibility: AccessibilitySection,
  ai: AISection,
  "keyboard-shortcuts": KeyboardShortcutsSection,
  "data-management": DataManagementSection,
};

// ── Main Settings Page ────────────────────────────────────────

export default function SettingsPage() {
  const isMobile = useIsMobile();
  const [activeSection, setActiveSection] = useState<SectionId>("appearance");

  // On mobile, scroll the section into view when a nav item is tapped
  const sectionRefs = useRef<Record<SectionId, HTMLDivElement | null>>(
    {} as Record<SectionId, HTMLDivElement | null>,
  );

  const handleNavClick = useCallback(
    (id: SectionId) => {
      setActiveSection(id);
      if (isMobile) {
        sectionRefs.current[id]?.scrollIntoView({ behavior: "smooth" });
      }
    },
    [isMobile],
  );

  // Desktop: render only the active section
  // Mobile: render all sections stacked with scroll spy
  const ActiveComponent = SECTION_COMPONENTS[activeSection];

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Header */}
      <header className="flex shrink-0 items-center gap-3 border-b border-border px-4 py-3 sm:px-6">
        <Link
          href="/dashboard"
          className="flex h-8 w-8 items-center justify-center rounded-md text-foreground-muted transition-colors hover:bg-accent hover:text-foreground"
          aria-label="Back to Dashboard"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="text-lg font-semibold text-foreground">Settings</h1>
      </header>

      <div className="flex min-h-0 flex-1">
        {/* Sidebar navigation (desktop) */}
        {!isMobile && (
          <nav
            className="w-56 shrink-0 overflow-y-auto border-r border-border p-3"
            aria-label="Settings sections"
          >
            <ul className="m-0 list-none space-y-0.5 p-0">
              {SECTIONS.map((section) => {
                const Icon = section.icon;
                const isActive = activeSection === section.id;
                return (
                  <li key={section.id}>
                    <button
                      onClick={() => handleNavClick(section.id)}
                      className={cn(
                        "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
                        isActive
                          ? "bg-primary/10 font-medium text-primary"
                          : "text-foreground-muted hover:bg-accent hover:text-foreground",
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      {section.label}
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>
        )}

        {/* Content area */}
        <main
          id="main-content"
          className="flex-1 overflow-y-auto"
        >
          <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
            {isMobile ? (
              // Mobile: show all sections stacked
              <div className="space-y-6">
                {/* Mobile section nav (horizontal pills) */}
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {SECTIONS.map((section) => {
                    const Icon = section.icon;
                    const isActive = activeSection === section.id;
                    return (
                      <button
                        key={section.id}
                        onClick={() => handleNavClick(section.id)}
                        className={cn(
                          "flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                          isActive
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border text-foreground-muted hover:border-foreground-muted hover:text-foreground",
                        )}
                      >
                        <Icon className="h-3.5 w-3.5" />
                        {section.label}
                      </button>
                    );
                  })}
                </div>

                {SECTIONS.map((section) => {
                  const Component = SECTION_COMPONENTS[section.id];
                  return (
                    <div
                      key={section.id}
                      ref={(el) => {
                        sectionRefs.current[section.id] = el;
                      }}
                    >
                      <Component />
                    </div>
                  );
                })}
              </div>
            ) : (
              // Desktop: show active section only
              <ActiveComponent />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
