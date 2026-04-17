# Mobile (React Native) Design Rules

Rules for `apps/mobile` — React Native 0.84.1 + React 19.

## Required Setup in Every Component

```tsx
const C = useTheme();                               // always first
const s = useMemo(() => makeStyles(C), [C]);        // always memoize
```

Never skip the `useMemo`. Without it, styles recompute on every render regardless of theme.

## StyleSheet Patterns

### DO: Token-based styles
```tsx
const makeStyles = (C: ColorTokens) => StyleSheet.create({
  container: {
    backgroundColor: C.bg,
    flex: 1,
  },
  card: {
    backgroundColor: C.surface,
    borderRadius: 16,
    padding: 16,
  },
  label: {
    color: C.onSurfaceVariant,
    fontSize: 12,
  },
});
```

### DON'T: Hardcoded colors
```tsx
// ❌ Breaks light mode and theme switching
const makeStyles = () => StyleSheet.create({
  container: { backgroundColor: '#0F0F0F' },
  label: { color: '#999999' },
});
```

## Navigation Rules

| Intent | Use |
|--------|-----|
| After successful auth (PIN, biometric) | `reset('Vault')` — replaces stack |
| Reset wallet / logout | `reset('Welcome')` |
| Go deeper in flow | `go('ScreenName')` |
| Back button / cancel | `goBack()` |

Never use `go('Vault')` after auth — it stacks history and back-button returns to auth screen.

## Android Back Button

Every screen that can navigate back must register `BackHandler`:

```tsx
useEffect(() => {
  const sub = BackHandler.addEventListener('hardwareBackPress', () => {
    if (canGoBack) { goBack(); return true; }
    return false;
  });
  return () => sub.remove();
}, [canGoBack, goBack]);
```

## State Updater Rule

Never put navigation, timers, or side effects inside a state updater function.
React Strict Mode calls updaters twice.

```tsx
// ❌ Wrong — setTimeout inside setState
setPin(prev => {
  if (prev.length === 5) setTimeout(() => navigate(), 150);
  return [...prev, digit];
});

// ✅ Correct — useEffect watches state, triggers side effect
useEffect(() => {
  if (pin.length === 6) {
    const t = setTimeout(() => onComplete(pin), 150);
    return () => clearTimeout(t);
  }
}, [pin]);
```

## Icon Usage

```tsx
// Material Icons (default)
<Icon name="arrow-back" size={24} color={C.onSurface} />

// MaterialCommunityIcons
<Icon name="mci:wallet-outline" size={24} color={C.primary} />
```

Hyphens in names (`arrow-back`, not `arrow_back`). Component normalizes automatically.

## App Startup Pattern

Render `null` until `hasWallet()` resolves to prevent flash:

```tsx
const [ready, setReady] = useState(false);
useEffect(() => {
  hasWallet(storage).then(has => {
    navReset(has ? 'Unlock' : 'Welcome');
    setReady(true);
  });
}, []);
if (!ready) return null;
```

## Animation

Use React Native's built-in `Animated` API only.
**Do not use `react-native-reanimated` v4** — incompatible with RN 0.84 (JSI crash).

## Screen Spacing Template

```tsx
// Standard screen container
<View style={{ flex: 1, backgroundColor: C.bg }}>
  <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: 16 }}>
    {/* content */}
  </View>
  <View style={{ paddingHorizontal: 24, paddingBottom: 32 }}>
    {/* primary action button */}
  </View>
</View>
```
