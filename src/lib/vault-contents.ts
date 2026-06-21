const FILE_CONTENTS_KEY = "brain-md-file-contents";

export function loadVaultFileContents(): Record<string, string> {
  if (typeof window === "undefined") return {};

  try {
    const raw = window.localStorage.getItem(FILE_CONTENTS_KEY);
    if (!raw) return {};

    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return Object.fromEntries(
      Object.entries(parsed).filter(([, value]) => typeof value === "string"),
    ) as Record<string, string>;
  } catch {
    return {};
  }
}

export function saveVaultFileContents(contents: Record<string, string>): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(FILE_CONTENTS_KEY, JSON.stringify(contents));
}
