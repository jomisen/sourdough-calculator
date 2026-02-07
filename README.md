# 🥖 Surdegs Jästidskalkylator

En webbbaserad kalkylator för att beräkna optimal jästid för surdegsbröd baserat på rumstemperatur och andel surdeg.

## Funktioner

- 🌡️ Justera rumstemperatur (15-30°C)
- 📊 Välj andel surdeg (5-50%)
- ⏱️ Inbyggd timer med nedräkning
- 🔔 Notifikationer när degen är klar
- ♿ WCAG 2.2 AA-kompatibel

## Användning

Öppna `index.html` i din webbläsare eller besök: [Live Demo](https://jomisen.github.io/sourdough-calculator/)

## Tillgänglighet

Sidan är fullt tillgänglig enligt WCAG 2.2 Level AA:
- Tangentbordsnavigation
- Skärmläsarstöd
- Fokusindikatorer
- ARIA-attribut
- 24x24px touch targets

## Testning

Projektet har regressionstester för att säkerställa att alla funktioner fungerar korrekt:

### Köra tester

Öppna `tests.html` i din webbläsare och klicka på "Kör alla tester".

### Vad testas?

- **Hydrering Beräkningar** - Säkerställer korrekt beräkning av vattenprocent
- **Temperatur Påverkan** - Verifierar att temperatur påverkar jästtiden korrekt
- **Surdegsandel Påverkan** - Testar att olika mängder surdeg ger rätt tider
- **Input Validering** - Kontrollerar att alla gränsvärden respekteras
- **Kantfall & Gränsvärden** - Testar extrema värden och kombinationer
- **Verkliga Scenarier** - Validerar vanliga användningsfall

Totalt: **30+ tester** som täcker alla kritiska funktioner.

## Licens

MIT License
