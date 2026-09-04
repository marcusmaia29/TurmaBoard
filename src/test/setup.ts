import "@testing-library/jest-dom/vitest";

/**
 * jsdom ships no matchMedia. Default every query to "no match" so components
 * render their wide layout, and let a test opt into the compact one with
 * setViewportMatches(true).
 */
let viewportMatches = false;

export function setViewportMatches(matches: boolean) {
  viewportMatches = matches;
}

window.matchMedia = (query: string) => {
  const listeners = new Set<(event: MediaQueryListEvent) => void>();
  return {
    get matches() { return viewportMatches; },
    media: query,
    onchange: null,
    addEventListener: (_: string, listener: (event: MediaQueryListEvent) => void) => { listeners.add(listener); },
    removeEventListener: (_: string, listener: (event: MediaQueryListEvent) => void) => { listeners.delete(listener); },
    addListener: () => undefined,
    removeListener: () => undefined,
    dispatchEvent: () => false,
  } as unknown as MediaQueryList;
};

afterEach(() => setViewportMatches(false));
