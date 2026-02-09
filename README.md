# 🍞 Surdegsplaneraren

> Beräkna jästid, skapa bakschema och få perfekt surdegsbröd varje gång

**Live:** [https://jomisen.github.io/sourdough-calculator/](https://jomisen.github.io/sourdough-calculator/)

---

## 🎯 Problem & Lösning

**Problem:** Surdegsbakning är komplext - jästiden påverkas av temperatur, surdegsmängd, hydrering och flertal andra faktorer. Befintliga kalkylatorer är antingen för enkla (ignorerar viktiga faktorer) eller för komplexa (kräver expertkunskap).

**Lösning:** En intuitiv, svenskspråkig kalkylator som:
- Beräknar exakt jästid baserat på temperatur, ingredienser och avancerade faktorer
- Genererar komplett bakschema med klockslag för varje steg
- Inkluderar timer med notifikationer
- Stödjer kalljäsning (vanligt i Skandinavien men saknas i de flesta verktyg)
- Felsökningsfunktion för vanliga problem

---

## ✨ Features

### Core
- **Dynamisk jästidsberäkning** - Tar hänsyn till temperatur (15-30°C), surdegsmängd, hydrering, och mer
- **Redigerbar hydrering med låsfunktion** - Ändra mjöl → vatten justeras automatiskt för att bibehålla hydreringen
- **Kalljäsningshantering** - Justerar bulkjäsning baserat på kylskåpstemperatur
- **Komplett bakschema** - Genererar tidslinje med klockslag för stretch & folds, formning, bakning
- **Timer med notifikationer** - Pausbar, med desktop notifications och ljudsignal

### UX & Accessibility
- **Progressive disclosure** - Enkelt för nybörjare, avancerat för erfarna
- **WCAG 2.2 AA compliant** - Screen reader support, keyboard navigation, ARIA labels
- **Responsiv design** - Fungerar på mobil, tablet, desktop
- **Persistent state** - localStorage sparar recept (men inte temporära modes som hydration lock)
- **Zero framework bloat** - Vanilla JS = snabbt, även på slow connections

### Advanced
- **Mjöltypsanpassning** - Siktat, fullkorn eller blandat
- **Surdegsstatus** - Peak, före peak, efter peak
- **Autolyse-support** - Aktiverar/inaktiverar vila före saltning
- **FAQ & felsökning** - Kontextuell hjälp baserad på användarens värden

---

## 🏗️ Tech Stack

### Frontend
- **TypeScript with ES6 modules** - Typ-säker utveckling som kompileras till vanilla JavaScript:
  - Snabb laddningstid (inga framework-dependencies)
  - Lätt att underhålla (ingen framework lock-in)
  - Lärandemöjlighet (förståelse för fundamentals)

- **HTML5 & CSS3** - Semantic HTML, CSS Grid/Flexbox, CSS Variables
- **Web APIs** - Notifications API, localStorage, AudioContext

### Hosting
- **GitHub Pages** - Statisk hosting, HTTPS, global CDN

### Analytics (Planned)
- **Plausible** - Privacy-first, GDPR-compliant

---

## 📁 Architecture

```
sourdough-calculator/
├── index.html              # Single-page app (SPA)
├── logo.webp              # Optimized logo (91% size reduction vs PNG)
├── favicon.svg            # Custom favicon
├── src/                   # TypeScript source files
│   ├── types.ts           # Type definitions
│   ├── app.ts             # Main orchestrator, initialization
│   ├── constants.ts       # Fermentation constants, global state
│   ├── calculator.ts      # Core calculation logic
│   ├── timer.ts           # Timer functionality, notifications
│   ├── schedule.ts        # Baking schedule generation
│   ├── display.ts         # UI rendering helpers
│   ├── validation.ts      # Input validation, warnings
│   ├── analytics.ts       # Event tracking (GoatCounter)
│   └── faq.ts            # FAQ accordion functionality
├── dist/                  # Compiled JavaScript (generated, git-ignored)
├── package.json           # npm configuration
├── tsconfig.json          # TypeScript configuration
└── ARCHITECTURE.md        # Detailed technical documentation
```

### TypeScript Migration ✨

**Status:** Complete (Q1 2026)

Entire codebase migrated from vanilla JavaScript to TypeScript for production-grade quality:

- **9 modules** fully typed (~3,800 lines)
- **Strict mode enabled** - No `any` types, comprehensive null checks
- **Zero compilation errors** - Clean, type-safe codebase
- **Full feature parity** - 100% functionality preserved
- **Professional standards** - Ready for senior developer review

See `TYPESCRIPT_MIGRATION.md` for details.

### Design Patterns
- **Modular architecture** - Separation of concerns (calculation, display, state)
- **Type-safe interfaces** - All data structures explicitly typed
- **Single source of truth** - `SourdoughApp` global state object
- **Event-driven updates** - Input changes trigger recalculations
- **Progressive enhancement** - Works without JS (basic form), enhanced with JS

### State Management
```typescript
// Global state (type-safe, simple but effective for this scale)
interface SourdoughAppState {
    timerInterval: number | null;
    endTime: Date | null;
    calculatedTime: number;
    isPaused: boolean;
    remainingTime: number;
}

const SourdoughApp: SourdoughAppState = {
    calculatedTime: 0,
    endTime: null,
    timerInterval: null,
    isPaused: false,
    remainingTime: 0
};

// Persistent state (type-safe with interfaces)
localStorage.setItem('recipe', JSON.stringify(recipe));
```

---

## 🚀 Local Development

```bash
# Clone repo
git clone https://github.com/jomisen/sourdough-calculator.git
cd sourdough-calculator

# Install dependencies
npm install

# Build TypeScript (compile src/ to dist/)
npm run build

# Or: Watch mode (auto-recompile on save)
npm run watch

# Serve locally (any static server works)
python3 -m http.server 8000
# or
npx serve

# Open browser
open http://localhost:8000
```

**Build process:** TypeScript source in `src/` compiles to JavaScript in `dist/`. Edit TypeScript files and run `npm run build` or use watch mode for auto-compilation.

---

## 🧪 Testing

**Current status:**
- ✅ **TypeScript compile-time checks** - Type safety catches errors before runtime
- ✅ **Unit tests** - 32 tests covering core calculation logic (Vitest)
- ✅ **Manual testing** - All features tested in multiple browsers
- ⏳ **E2E tests** - Planned (see roadmap)

**Run tests:**
```bash
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # Generate coverage report
```

**Test coverage:**
```typescript
✅ calculateHydration() - 3 tests
✅ calculateBakersPercentages() - 1 test
✅ calculateTemperatureFactor() - 4 tests
✅ calculateStarterFactor() - 3 tests
✅ calculateFlourFactor() - 3 tests
✅ calculateAdvancedFactors() - 3 tests
✅ calculateColdProofAdjustment() - 4 tests
✅ calculateFoldingSchedule() - 6 tests
✅ calculateBakingTime() - 5 tests

Total: 32 passing tests
```

**Roadmap:**
```javascript
- [x] TypeScript strict mode - compile-time type safety
- [x] Unit tests (Vitest) - calculator.ts core logic
- [ ] Unit tests - validation.ts, display.ts
- [ ] E2E tests (Playwright) - critical user flows
- [ ] Visual regression (Percy) - UI consistency
- [ ] CI/CD (GitHub Actions) - automated testing + type checking
```

---

## 📊 Performance

- **First Contentful Paint:** <1s
- **Time to Interactive:** <2s
- **Total Bundle Size:** ~50KB (no frameworks!)
- **Lighthouse Score:** 95+ (Performance, Accessibility, Best Practices)

**Optimizations:**
- WebP images (logo: 583KB → 53KB, 91% reduction)
- Debounced calculations (prevents excessive recalcs)
- Minimal DOM manipulation
- No external dependencies

---

## 🗺️ Roadmap

### Q1 2026 ✅ (Completed)
- [x] Core calculator functionality
- [x] Timer with notifications
- [x] Schedule generation
- [x] Editable hydration with lock
- [x] Responsive design
- [x] Accessibility (WCAG 2.2 AA)
- [x] **TypeScript migration** - Full type safety (~3,800 lines)
- [x] **Unit tests** - 32 tests for core calculation logic (Vitest)

### Q2 2026 🚧 (In Progress)
- [ ] **Expanded test coverage** - validation.ts, display.ts, E2E tests
- [ ] **PWA support** - Service worker, offline-first, installable
- [ ] **Analytics** - GoatCounter integration (already in place)
- [ ] **Performance monitoring** - Web Vitals tracking

### Q3 2026 📋 (Planned)
- [ ] **Recipe sharing** - Generate shareable links (requires backend)
- [ ] **User accounts** - Save multiple recipes (Supabase)
- [ ] **Community features** - Recipe library, ratings
- [ ] **i18n** - English translation

### Future 💭
- [ ] **AI assistant** - "Help me troubleshoot my dough" (Claude API)
- [ ] **Image analysis** - Upload photo, get feedback on dough development
- [ ] **Native app** - React Native or Flutter
- [ ] **Premium features** - Advanced scheduling, PDF export

---

## 🏆 Design Decisions

### Why TypeScript + Vanilla JS instead of React/Vue?
1. **Performance** - No framework overhead, compiles to vanilla JS
2. **Type Safety** - Catches entire classes of bugs at compile time
3. **Learning** - Deeper understanding of DOM, events, state management
4. **Professional Standards** - Industry best practice, better IDE support
5. **Future-proof** - Clean architecture makes framework migration easier if needed

### Why TypeScript?
1. **Error Prevention** - ~3,800 lines of code with zero type errors
2. **Refactoring Confidence** - IDE catches breaking changes instantly
3. **Documentation** - Types serve as inline, always-updated documentation
4. **Team Readiness** - Professional codebase ready for collaboration
5. **Developer Experience** - Autocomplete, type hints, better debugging

### Why localStorage instead of a database?
1. **Privacy** - No data sent to servers
2. **Speed** - Instant persistence, no API calls
3. **Simplicity** - No backend infrastructure needed
4. **MVP phase** - Validate product before investing in backend

### Why single HTML file?
1. **Deployment** - GitHub Pages, zero config
2. **Performance** - One request, no cascading loads
3. **Simplicity** - Easy to reason about
4. **Trade-off** - Acknowledged: Harder to maintain at scale (future: separate CSS, add build step)

---

## 🤝 Contributing

This is a personal project, but feedback and suggestions are welcome!

**Areas where contributions would be most valuable:**
1. Test coverage (calculator logic, edge cases)
2. Accessibility improvements (screen reader testing)
3. Internationalization (English translation)
4. Bug reports from actual baking sessions

---

## 📝 License

MIT License - feel free to fork and adapt for your own baking needs!

---

## 🙏 Acknowledgments

- Built with feedback from the Swedish sourdough community
- Team review conducted by cross-functional AI agents (Product, UX, Design, Frontend, Backend, QA)

---

## 📧 Contact

**Author:** Emelie Jomer
**GitHub:** [@jomisen](https://github.com/jomisen)
**Live Demo:** [https://jomisen.github.io/sourdough-calculator/](https://jomisen.github.io/sourdough-calculator/)

---

*Hembakad med ❤️ på mjöl, vatten, salt och surdegskultur.*
