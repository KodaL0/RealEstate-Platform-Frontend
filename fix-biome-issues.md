# Biome Issues Fix Guide

## Fixed Issues ✅
- ScrollToTop: Removed unused variables (`search`, `key`)
- GDPRConsentModal: Prefixed unused parameters with `_`
- Navbar: Added `role` and keyboard handlers for accessibility
- Multiple buttons: Added `type="button"` to buttons in:
  - GDPRConsentModal (3 buttons)
  - LegalDocumentViewer (3 buttons)
  - Navbar (5 buttons)
  - PropertyDocuments (1 button)

## Remaining Common Issues

### 1. Missing `type="button"` on buttons
**Pattern:** `<button` without `type` attribute
**Fix:** Add `type="button"` to all non-submit buttons

**Files to check:**
- All 74 files with `<button` tags
- Common ones: ChatButton, ConsentBanner, EmailVerification, DeveloperPropertyCard, etc.

### 2. Unused Parameters
**Pattern:** Function parameters that aren't used
**Fix:** Prefix with `_` (e.g., `onDecline` → `_onDecline`)

### 3. `any` Types
**Pattern:** `catch (err: any)` or `(error: any)`
**Fix:** Use `unknown` or proper error types:
```typescript
catch (err: unknown) {
  const error = err as { code?: string; response?: { data?: { error?: string } } };
  // ...
}
```

### 4. Unused Variables
**Pattern:** Variables declared but never used
**Fix:** Remove or prefix with `_`

## Quick Fix Commands

To find all buttons missing type:
```bash
grep -r "<button" src --include="*.tsx" | grep -v "type="
```

To find all `any` types:
```bash
grep -r ": any" src --include="*.tsx"
```


