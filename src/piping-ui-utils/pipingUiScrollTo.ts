import {appBarPromise} from "@/app-bar-promise";

// Decrypt & Download
/**
 * Scroll to the specific element considering the app bar
 * @param element
 */
export async function pipingUiScrollTo(element: Element): Promise<void> {
  const appBar = await appBarPromise;
  const moveTop = element.getBoundingClientRect().y - appBar.clientHeight;
  window.scrollBy({ top: moveTop, left: 0, behavior: 'smooth' });
}
