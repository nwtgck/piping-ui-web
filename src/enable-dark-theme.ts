import {keys} from "@/local-storage-keys";

export default function enableDarkTheme(): boolean {
  // Load environmental dark theme setting
  let enableDarkTheme = window.matchMedia('(prefers-color-scheme: dark)').matches;

  // Load dark theme setting
  const darkThemeStr = window.localStorage.getItem(keys.darkTheme);
  if (darkThemeStr !== null) {
    enableDarkTheme = darkThemeStr === "true";
  }
  return enableDarkTheme;
}
