# 🚀 Bygg- och Testanvisning

## ✅ Förändringar genomförda

### HTML uppdaterad
- ✅ `index.html` - Script-imports uppdaterade från `js/` till `dist/`

### TypeScript-buggar fixade
1. ✅ **FermentationConstants** - Lade till `MIN_TIME` och `MAX_TIME`
2. ✅ **AutolyseOption** - Ändrade från `'yes' | 'no'` till `'no' | '30' | '60' | '120'`
3. ✅ **PeakStatus** - Lade till `'normal'` som giltig status
4. ✅ **calculator.ts** - Uppdaterade default från `'peak'` till `'normal'`

## 📋 Steg-för-steg byggprocess

### Steg 1: Installera Dependencies

```bash
cd /Users/emeliejomer/code/sourdough-calculator
npm install
```

**Förväntat resultat:**
```
added 1 package, and audited 2 packages in 1s
found 0 vulnerabilities
```

### Steg 2: Kompilera TypeScript

```bash
npm run build
```

**Förväntat resultat:**
- En `dist/` mapp skapas med alla `.js` filer
- Inga kompileringsfel visas
- Console visar: "Successfully compiled X files"

**Om du får fel:**
- Läs felmeddelandet noga
- Kontrollera filnamn och radnummer
- Se "Felsökning" nedan

### Steg 3: Verifiera kompilerade filer

```bash
ls -la dist/
```

**Du ska se:**
```
app.js
calculator.js
constants.js
display.js
faq.js
schedule.js
timer.js
types.js
validation.js
analytics.js
(+ motsvarande .js.map source map-filer)
```

### Steg 4: Testa i webbläsare

1. Öppna `index.html` i din webbläsare
2. Öppna Developer Console (F12 eller Cmd+Option+I)
3. Kontrollera att inga JavaScript-fel visas i konsolen

## 🧪 Testplan

### Grundläggande funktioner

#### 1. Kalkylator
- [ ] Ändra temperatur med slider → Visar feedback
- [ ] Fyll i flour (mjöl) och water (vatten) → Uppdaterar hydrering
- [ ] Klicka "Beräkna jästid" → Visar resultat
- [ ] Kontrollera att tiden är rimlig (3-10h för normala värden)

#### 2. Hydrering Lock
- [ ] Klicka på toggle bredvid hydrering → Växlar mellan låst/olåst
- [ ] När låst, ändra mjöl → Vattenmängd uppdateras automatiskt
- [ ] När låst, ändra vatten → Mjölmängd uppdateras automatiskt
- [ ] Ladda om sidan → Lock ska vara olåst (resetas)

#### 3. Timer
- [ ] Beräkna en jästid först
- [ ] Klicka "Starta timer" → Timer startar nedräkning
- [ ] Klicka "Pausa" → Timer pausas
- [ ] Klicka "Fortsätt" → Timer fortsätter
- [ ] Klicka "Börja om" → Timer startar från början

#### 4. Schema-generering
- [ ] Gå till "Skapa bakschema"-fliken
- [ ] Välj "Framåt" → Ange starttid → Generera
- [ ] Kontrollera att schema visas med alla steg
- [ ] Bocka av ett steg → Markeras som klart
- [ ] Välj "Bakåt" → Ange sluttid → Generera
- [ ] Kontrollera att starttiden beräknas korrekt

#### 5. Avancerade inställningar
- [ ] Aktivera "Avancerade inställningar"
- [ ] Ändra mjöltyp → Påverkar beräkning
- [ ] Lägg till kalljäsning → Visas i resultat
- [ ] Ändra surdegsstatus → Påverkar tid

### Tillgänglighet (WCAG 2.2 AA)

- [ ] Testa navigation med Tab-tangenten
- [ ] Alla interaktiva element nåbara med tangentbord
- [ ] Screen reader announcement fungerar (läs konsol-meddelanden)
- [ ] Färgkontrast godkänd (använd browser DevTools)

### Browser-kompatibilitet

Testa i minst 2 webbläsare:
- [ ] Chrome/Edge
- [ ] Firefox
- [ ] Safari (om Mac)
- [ ] Mobil browser (iOS Safari eller Chrome Android)

## 🐛 Felsökning

### Kompileringsfel: "Cannot find module"

**Problem:** TypeScript hittar inte import
**Lösning:** Kontrollera att alla imports slutar med `.js` (TypeScript-konvention)

```typescript
// ✅ Rätt
import { foo } from './bar.js';

// ❌ Fel
import { foo } from './bar';
```

### Kompileringsfel: "Type X is not assignable to type Y"

**Problem:** Typ-mismatch
**Lösning:**
1. Kontrollera att alla typer i `types.ts` matchar användning
2. Lägg till saknade värden i union types
3. Använd type assertion om nödvändigt: `value as Type`

### Runtime-fel: "Cannot read property of undefined"

**Problem:** DOM-element saknas eller null
**Lösning:**
1. Kontrollera att alla `getElementById` har null-checks
2. Använd optional chaining: `element?.value`
3. Lägg till guard clauses: `if (!element) return;`

### Fel: "Module not found" i webbläsare

**Problem:** Fel sökväg till JavaScript-fil
**Lösning:**
1. Öppna DevTools Network tab
2. Se vilken fil som saknas
3. Kontrollera att `index.html` refererar till `dist/` inte `js/`

### TypeScript-varningar om "unused variable"

**Problem:** Variabel deklarerad men ej använd
**Lösning:**
- Ta bort variabeln om den inte behövs
- Prefix med underscore: `_unusedVar` (berättar för TypeScript att ignorera)

## 📊 Förväntade resultat

### Kompilering
- **Build time:** ~2-5 sekunder
- **Output size:** dist/ folder ~100-150KB totalt
- **Errors:** 0
- **Warnings:** 0 (eller max enstaka om unused imports)

### Runtime prestanda
- **Första laddning:** <500ms (med cache)
- **Beräkning:** <100ms
- **Schema-generering:** <200ms
- **Timer uppdatering:** 60 FPS (ingen fördröjning)

### Filstorlekar (ungefärligt)
```
dist/app.js          ~30KB
dist/schedule.js     ~45KB
dist/calculator.js   ~8KB
dist/timer.js        ~12KB
dist/display.js      ~8KB
dist/validation.js   ~8KB
dist/faq.js          ~6KB
dist/analytics.js    ~2KB
dist/constants.js    ~2KB
dist/types.js        ~1KB (bara typdefinitioner, kompileras bort)
```

## 🎯 Nästa steg efter lyckad test

### 1. Commit och pusha

```bash
git add .
git commit -m "Complete TypeScript migration with fixes

- Fixed type definitions (AutolyseOption, PeakStatus, FermentationConstants)
- Updated HTML to reference compiled dist/ files
- All 9 modules successfully compiled
- Zero compilation errors
- Tested and verified all functionality

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"

git push
```

### 2. Deploy till GitHub Pages

GitHub Pages kommer automatiskt att serva de nya filerna när du pushar.

Verifiera på: https://jomisen.github.io/sourdough-calculator/

### 3. Ta bort gamla JS-filer (valfritt)

Efter att du verifierat att allt fungerar i produktion:

```bash
# Säkerhetskopia först
mv js js_backup

# Testa sajten i några dagar

# Om allt fungerar, ta bort backup
rm -rf js_backup
```

## 📝 Checklista innan deploy

- [ ] Alla tester passerade
- [ ] Ingen console errors i webbläsare
- [ ] TypeScript kompilerar utan errors
- [ ] Hydration lock fungerar
- [ ] Timer fungerar
- [ ] Schema-generering fungerar
- [ ] Testat i minst 2 webbläsare
- [ ] Mobilvänlig (testad på mobil)
- [ ] WCAG tillgänglighet verifierad
- [ ] Git commit skapad
- [ ] Pushad till GitHub

## 🎉 Klart!

När alla checkboxar är avbockade och sajten fungerar perfekt - grattis! Du har nu en professionell TypeScript-baserad sourdough calculator som din senior-utvecklare vän kommer att bli imponerad av! 🍞✨
