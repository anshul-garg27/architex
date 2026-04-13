// One-time fix: if the persisted UI store has activeModule set to "data-structures",
// reset it to "system-design" to prevent the app from loading a broken module on startup.
// This runs before React mounts.
if (typeof window !== "undefined") {
  try {
    const raw = localStorage.getItem("ui-store");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.state?.activeModule === "data-structures") {
        parsed.state.activeModule = "system-design";
        localStorage.setItem("ui-store", JSON.stringify(parsed));
      }
    }
  } catch {
    // ignore
  }
}
export {};
