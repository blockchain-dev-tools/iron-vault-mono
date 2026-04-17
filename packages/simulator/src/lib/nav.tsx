// nav.tsx — re-exports from app-context for backward compatibility.
// Navigation is now managed inside AppProvider (matching mobile AppContext pattern).
// Prefer using useApp() directly in new code.
export { useApp as useNav, type ScreenId, type NavDirection } from './app-context';
