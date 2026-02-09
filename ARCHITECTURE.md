# 🏗️ Architecture Documentation

> Technical deep-dive into Surdegsplaneraren's architecture, design patterns, and technical decisions

---

## 📐 System Overview

Surdegsplaneraren is a **client-side single-page application** with no backend dependencies. All computation, state management, and persistence happens in the browser.

```
┌─────────────────────────────────────────────┐
│           Browser (Client-Side)             │
│  ┌───────────────────────────────────────┐  │
│  │         index.html (SPA)              │  │
│  │  ┌─────────────────────────────────┐  │  │
│  │  │    JavaScript Modules (ES6)     │  │  │
│  │  │                                 │  │  │
│  │  │  app.js → Orchestrator          │  │  │
│  │  │  calculator.js → Core logic     │  │  │
│  │  │  timer.js → Timer + notify      │  │  │
│  │  │  schedule.js → Baking schedule  │  │  │
│  │  │  display.js → UI rendering      │  │  │
│  │  │  validation.js → Input checks   │  │  │
│  │  └─────────────────────────────────┘  │  │
│  │                                       │  │
│  │  ┌─────────────────────────────────┐  │  │
│  │  │       localStorage              │  │  │
│  │  │  - Recipe values                │  │  │
│  │  │  - User preferences             │  │  │
│  │  └─────────────────────────────────┘  │  │
│  └───────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
```

---

## 🗂️ Module Breakdown

### **app.js** - Application Orchestrator
**Responsibility:** Initialization, event wiring, coordination

```javascript
// Key functions:
- init() // Entry point, sets up everything
- setupAutoCalculate() // Debounced input listeners
- setupEditableHydration() // Hydration lock feature
- syncTemperature() // Slider ↔ input sync
```

**Dependencies:** All other modules
**State:** Initializes SourdoughApp global state

---

### **constants.js** - Configuration & Global State
**Responsibility:** Fermentation constants, global state object

```javascript
// Fermentation science constants
export const FERMENTATION_CONSTANTS = {
    BASE_TIME: 4.0,              // Hours at 22°C, 20% starter
    TEMP_FACTOR_PER_DEGREE: 0.2, // Exponential temperature effect
    STARTER_BASE: 20,            // Reference starter percentage
    // ... more constants
};

// Global application state
export const SourdoughApp = {
    calculatedTime: 0,     // Calculated fermentation time
    endTime: null,         // Timer end timestamp
    timerInterval: null,   // setInterval reference
    isPaused: false,       // Timer pause state
    remainingTime: 0       // Milliseconds remaining
};
```

**Why global state?**
- Simple for this scale (single-page, single-user)
- No concurrent state updates to manage
- Easy to debug (inspect `window.SourdoughApp`)
- Migration path: Future refactor to Redux/Zustand is straightforward

---

### **calculator.js** - Core Fermentation Logic
**Responsibility:** All fermentation time calculations

```javascript
// Pure functions (no side effects)
export function calculateTemperatureFactor(temp) {
    // Exponential relationship: each degree changes time significantly
    const deviation = temp - 22;
    return Math.pow(2, -deviation / 10);
}

export function calculateStarterFactor(starterPercent) {
    // More starter = faster fermentation
    const ratio = starterPercent / FERMENTATION_CONSTANTS.STARTER_BASE;
    return Math.pow(ratio, -0.5);
}

export function calculateFlourFactor(flourType, wholeGrainPercent) {
    // Whole grain ferments faster (more nutrients)
    // ... logic
}

// Orchestrator function
export function calculateFermentationTime(inputs) {
    // Combines all factors multiplicatively
    const factors = [
        calculateTemperatureFactor(inputs.temp),
        calculateStarterFactor(inputs.starterPercent),
        calculateFlourFactor(inputs.flourType),
        // ... more factors
    ];
    return factors.reduce((acc, f) => acc * f, BASE_TIME);
}
```

**Design pattern:** Pure functions = easily testable
**Science basis:** Based on published sourdough fermentation research

---

### **timer.js** - Timer & Notifications
**Responsibility:** Countdown timer, browser notifications, audio alerts

```javascript
// State management
let endTime = null;
let timerInterval = null;

// Key functions
export function startTimer() {
    endTime = new Date(now + calculatedTime);
    timerInterval = setInterval(updateTimer, 1000);
    requestNotificationPermission();
}

export function updateTimer() {
    const remaining = endTime - new Date();
    if (remaining <= 0) {
        playKitchenTimerSound();  // AudioContext API
        showNotification();        // Notifications API
    }
    updateUI(remaining);
}

function playKitchenTimerSound() {
    // Web Audio API: Synthesize "ring ring" pattern
    const oscillator = audioContext.createOscillator();
    oscillator.frequency.setValueAtTime(1200, ...); // Bell-like frequency
    // ... create ringing pattern
}
```

**Web APIs used:**
- `setInterval` - Timer ticks
- Notifications API - Desktop notifications
- AudioContext - Synthesized bell sound

---

### **schedule.js** - Baking Schedule Generation
**Responsibility:** Generate timeline with specific timestamps

```javascript
export function generateBakingSchedule(inputs) {
    const now = new Date();
    const schedule = [];

    // Stretch & Fold timing (exponentially spaced)
    const folds = calculateFoldingSchedule(bulkTime);
    folds.forEach((time, index) => {
        schedule.push({
            time: addMinutes(now, time),
            action: `Stretch & Fold ${index + 1}`,
            type: 'fold'
        });
    });

    // Shaping, proofing, baking
    schedule.push({
        time: addHours(now, bulkTime),
        action: 'Shape loaves',
        type: 'shape'
    });

    // Cold proof calculation (if enabled)
    if (coldProofHours > 0) {
        const adjustedBulk = calculateColdProofAdjustment(
            bulkTime,
            fridgeTemp
        );
        // ... adjust schedule
    }

    return schedule;
}
```

**Algorithm:** Exponential spacing for S&F (more frequent early, less later)

---

### **display.js** - UI Rendering Helpers
**Responsibility:** Pure display functions, no business logic

```javascript
// Separation of concerns: display logic separate from calculation
export function formatHoursMinutes(time) {
    const hours = Math.floor(time);
    const minutes = Math.round((time - hours) * 60);
    return { hours, minutes };
}

export function generateTimeDisplayText(time, coldProof) {
    // Template generation, no side effects
    return `Bulkjäsning: ${hours}h ${minutes}min`;
}

export function announceToScreenReader(message) {
    // Accessibility: ARIA live regions
    const announcement = document.getElementById('sr-announcements');
    announcement.textContent = message;
}
```

**Pattern:** View layer - receives data, returns HTML/text

---

### **validation.js** - Input Validation & Warnings
**Responsibility:** User input validation, edge case warnings

```javascript
export function validateInputs() {
    const warnings = [];

    if (hydration < 60) {
        warnings.push({
            type: 'warning',
            message: 'Låg hydrering - degen kan bli torr'
        });
    }

    if (hydration > 90) {
        warnings.push({
            type: 'caution',
            message: 'Hög hydrering - svår att hantera för nybörjare'
        });
    }

    return warnings;
}

export function validateRecipeWarnings(flour, water, starter, salt) {
    // Business rules validation
    const saltPercent = (salt / flour) * 100;
    if (saltPercent < 1.5 || saltPercent > 2.5) {
        return createWarning('Saltmängd utanför normalt intervall');
    }
}
```

**Pattern:** Validation logic separated from UI and calculation

---

## 🔄 Data Flow

### **User Input → Calculation → Display**

```
1. User changes input (e.g., temperature)
   ↓
2. Event listener (debounced 300ms)
   ↓
3. getInputValues() → Read all form values
   ↓
4. calculateFermentationTime(inputs)
   ↓
5. Update SourdoughApp.calculatedTime
   ↓
6. updateRecipeSummary() → Display percentages
   ↓
7. displayResults() → Show fermentation time
```

### **Debouncing Strategy**

```javascript
const debouncedCalculate = debounce(() => {
    updateRecipeSummary();
    calculateTime();
}, 300);

// Prevents expensive recalculations while user is typing
// 300ms = sweet spot (feels instant, prevents excessive calls)
```

---

## 💾 State Management

### **Three Types of State**

1. **Ephemeral State** (in-memory only)
   - Timer intervals
   - UI transient states (loading indicators)
   - Debounce timers

2. **Session State** (localStorage, persists across reloads)
   - Recipe values (flour, water, etc.)
   - User preferences (seen tooltips)
   - ❌ NOT hydration lock (intentionally resets)

3. **Derived State** (calculated, not stored)
   - Fermentation time
   - Baker's percentages
   - Schedule timestamps

### **Why NOT persist hydration lock?**

```javascript
// UX Decision: Lock is a "mode", not a "setting"
// - Modes are temporary (like caps lock)
// - Settings are persistent (like theme preference)
// - Users might forget they locked it → confusion
// - Always starting unlocked is safer default

let isHydrationLocked = false; // Always starts false
// No localStorage.setItem('hydrationLocked', ...)
```

---

## 🎨 CSS Architecture

### **Structure**

```
/* Inline in index.html (trade-off acknowledged) */

1. CSS Variables (Design tokens)
   --green-dark, --green-medium, --text-base, etc.

2. Reset & Base styles
   box-sizing, font-family, etc.

3. Component styles
   .input-group, .toggle-switch, .timer-display

4. Utility classes
   .visually-hidden (accessibility)

5. Responsive queries
   @media (max-width: 768px)
```

### **Why inline CSS?**

**Pros:**
- One HTTP request (performance)
- No build step needed
- CSS is scoped to this page only

**Cons:**
- Harder to maintain
- No CSS minification (yet)
- Can't share styles across pages (not relevant here)

**Future:** Extract to `styles.css` when adding build process

---

## 🔐 Security Considerations

### **No Backend = Inherently Secure**

- ✅ No SQL injection (no database)
- ✅ No XSS vulnerabilities (no user-generated content stored/displayed)
- ✅ No CSRF (no state-changing requests)
- ✅ No authentication vulnerabilities (no auth)

### **Client-Side Risks**

- **localStorage tampering** - User can modify own data (not a security issue)
- **Calculation manipulation** - User can only affect their own experience
- **No sensitive data** - Recipe values are not sensitive

---

## ♿ Accessibility Architecture

### **WCAG 2.2 AA Compliance**

```html
<!-- Semantic HTML -->
<label for="flour">Mjöl</label>
<input id="flour" aria-describedby="flour-desc" />
<span id="flour-desc" class="visually-hidden">Ange total mjölmängd</span>

<!-- ARIA live regions for screen readers -->
<div id="sr-announcements" aria-live="polite" class="visually-hidden"></div>

<!-- Keyboard navigation -->
<button aria-label="Starta timer" onclick="startTimer()">
```

### **Accessibility Features**

1. **Screen reader announcements**
   ```javascript
   announceToScreenReader('Timer startad. Klar kl 14:30');
   ```

2. **Keyboard navigation**
   - Tab through all interactive elements
   - Enter key on inputs moves to next field
   - Escape closes modals/advanced settings

3. **Focus management**
   - Clear focus indicators
   - Focus returns to trigger after modal close

4. **Color contrast**
   - All text meets WCAG AA standards (4.5:1 minimum)

---

## 📊 Performance Optimizations

### **Bundle Size**
- **Total:** ~50KB (HTML + JS + CSS)
- **No frameworks:** Saved ~100KB+ (React alone is ~40KB gzipped)
- **Logo optimization:** 583KB → 53KB (91% reduction via WebP)

### **Runtime Performance**
- **Debounced calculations:** Prevents excessive recalcs (300ms debounce)
- **Minimal DOM manipulation:** Only update changed elements
- **Event delegation:** Where applicable (FAQ accordions)
- **No memory leaks:** Timer cleanup on page unload

### **Loading Performance**
- **No cascading requests:** Single HTML file includes everything
- **No render-blocking resources:** CSS inline, JS modules deferred
- **GitHub Pages CDN:** Global edge caching

---

## 🚧 Known Technical Debt

### **Priority: High**
1. **No automated tests** - Manual testing only
2. **CSS in HTML** - Should be extracted
3. **No build process** - No minification, bundling

### **Priority: Medium**
4. **Global state** - Works now, but limits scalability
5. **Event listener cleanup** - Potential memory leaks on SPA navigation (not relevant yet)
6. **No error boundaries** - Uncaught errors could break entire app

### **Priority: Low**
7. **No code splitting** - Everything loads upfront (acceptable at 50KB)
8. **No TypeScript** - Vanilla JS works but TS would catch errors earlier

---

## 🔮 Migration Paths

### **If app grows, here's how to evolve:**

**Phase 1: Testing & Tooling**
```bash
npm init -y
npm install --save-dev vitest playwright
# Add test coverage, CI/CD
```

**Phase 2: Build Process**
```bash
npm install --save-dev vite
# Extract CSS, add minification, code splitting
```

**Phase 3: State Management**
```bash
npm install zustand
# Migrate SourdoughApp → Zustand store
```

**Phase 4: Framework (if needed)**
```bash
npx create-vite --template react
# Gradual migration: One component at a time
# JS modules make this easier (already modular)
```

---

## 🎓 Learning Resources

**Fermentation Science:**
- "The Perfect Loaf" - Temperature & fermentation research
- "Sourdough Cultures" (Whole Grain Bakery) - Microbiome studies

**Web Performance:**
- web.dev/vitals - Core Web Vitals
- MDN Web Docs - Web APIs reference

**Accessibility:**
- WCAG 2.2 Guidelines
- WebAIM - Screen reader testing

---

## 📞 Architecture Questions?

For technical discussions about architecture decisions, open an issue or contact:

**Author:** Emelie Jomer
**GitHub:** [@jomisen](https://github.com/jomisen)

---

*Architecture designed for: Fast iteration, easy learning, clear migration paths.*
