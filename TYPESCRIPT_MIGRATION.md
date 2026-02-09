# TypeScript Migration Guide

## Status

✅ **Completed:**
- Project structure setup (tsconfig.json, package.json, .gitignore)
- Type definitions (src/types.ts)
- Core modules migrated:
  - constants.ts
  - calculator.ts
  - display.ts
  - validation.ts
  - analytics.ts
  - faq.ts
  - timer.ts
  - app.ts (main orchestrator)

⚠️ **Incomplete:**
- **schedule.ts** - This is a very large file (1500+ lines) that needs full migration from js/schedule.js
  - Currently has placeholder types
  - Full functionality in js/schedule.js needs to be migrated

## Build Instructions

### 1. Install Dependencies

```bash
cd /Users/emeliejomer/code/sourdough-calculator
npm install
```

### 2. Compile TypeScript

```bash
npm run build
```

This compiles all `.ts` files in `src/` to `.js` files in `dist/`.

### 3. Watch Mode (for development)

```bash
npm run watch
```

This automatically recompiles when you save changes to `.ts` files.

### 4. Update HTML

After building, update `index.html` to reference compiled JavaScript:

Change script imports from:
```html
<script type="module" src="js/app.js"></script>
```

To:
```html
<script type="module" src="dist/app.js"></script>
```

(And similarly for all other script tags)

## Next Steps

### Complete schedule.ts Migration

The `js/schedule.js` file is very large and complex. To complete the migration:

1. Read `js/schedule.js`
2. Create proper TypeScript interfaces for all schedule-related data
3. Migrate all functions with proper types
4. Test thoroughly as this is a critical feature

### Testing

After TypeScript compilation:

1. Open `index.html` in a browser
2. Test all calculator functions
3. Test timer functionality
4. Test schedule generation
5. Verify hydration lock works correctly

## Benefits of TypeScript

- **Type Safety**: Catch errors at compile-time instead of runtime
- **Better IDE Support**: Autocomplete and refactoring tools
- **Documentation**: Types serve as inline documentation
- **Maintainability**: Easier to understand code structure
- **Professional Standard**: Industry best practice for larger JavaScript projects

## Troubleshooting

If you get compilation errors:

1. Check `tsconfig.json` settings
2. Ensure all imports use `.js` extension (TypeScript convention)
3. Run `npm run type-check` to see type errors without generating files
4. Check that all DOM elements have proper null checks

## File Structure

```
sourdough-calculator/
├── src/                    # TypeScript source files
│   ├── types.ts           # Type definitions
│   ├── constants.ts       # Global constants
│   ├── calculator.ts      # Core calculation logic
│   ├── timer.ts           # Timer functionality
│   ├── display.ts         # UI helpers
│   ├── validation.ts      # Input validation
│   ├── analytics.ts       # Analytics tracking
│   ├── faq.ts            # FAQ accordion
│   ├── schedule.ts       # ⚠️ Needs completion
│   └── app.ts            # Main orchestrator
├── dist/                  # Compiled JavaScript (git-ignored)
├── js/                    # Original JavaScript (can be removed after full migration)
├── tsconfig.json         # TypeScript configuration
├── package.json          # npm configuration
└── index.html            # HTML (needs updating to use dist/)
```
