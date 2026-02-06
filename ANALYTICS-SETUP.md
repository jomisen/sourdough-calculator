# 📊 Analytics Setup - GoatCounter

## Vad mäts?

✅ **Besökare** - Antal unika besökare
✅ **Besök/Sessions** - Antal sessioner
✅ **Sidvisningar** - Hur många gånger sidan besöks
✅ **Kalkylator-användning** - När någon beräknar jästid (inklusive temp, hydrering, surdegsandel)
✅ **Timer-användning** - När någon startar timern
✅ **Referrers** - Varifrån besökare kommer (Google, Instagram, direkt, etc.)
✅ **Enheter** - Desktop, mobil, tablet, OS, browser

## Steg för att aktivera

### 1. Skapa gratis GoatCounter-konto

1. Gå till **https://www.goatcounter.com/signup**
2. Välj en **sitecode** (t.ex. `surdeg-kalkylator` eller `sourdough-calculator`)
3. Fyll i din email och välj lösenord
4. Klicka "Sign up" - helt gratis!

### 2. Uppdatera index.html

Öppna `index.html` och hitta denna rad (nästan längst ner):

```html
<script data-goatcounter="https://ÄNDRA-TILL-DIN-SITECODE.goatcounter.com/count"
```

Ändra **`ÄNDRA-TILL-DIN-SITECODE`** till den sitecode du valde i steg 1.

**Exempel:**
Om du valde sitecode `surdeg-kalkylator`, ändra till:
```html
<script data-goatcounter="https://surdeg-kalkylator.goatcounter.com/count"
```

### 3. Commita och pusha

```bash
cd /Users/emeliejomer/code/sourdough-calculator
git add index.html
git commit -m "Aktivera GoatCounter analytics"
git push
```

### 4. Besök din dashboard

Efter några minuter kan du se statistik på:
**https://[din-sitecode].goatcounter.com**

## Vad du kan se i dashboarden

- 📈 **Besökare per dag/vecka/månad** - Graf och siffror
- 🌍 **Varifrån de kommer** - Länder, referrers (Google, Instagram, etc.)
- 📱 **Enheter** - Desktop vs mobil, OS, browsers
- ⏱️ **Events** - När användare använder kalkylatorn och timern med detaljer
- 🔥 **Populäraste sidor** - Vilka sidor som besöks mest

## Privacy & GDPR

✅ **Ingen cookie-banner behövs** - GoatCounter använder inga cookies
✅ **GDPR-compliant** - Samlar inte in personuppgifter
✅ **Privacy-friendly** - Ingen tracking över sidor, ingen fingerprinting
✅ **Öppen källkod** - Transparent kod på GitHub

## Support

Om du vill ha hjälp med något:
- GoatCounter docs: https://www.goatcounter.com/help
- Issues: https://github.com/arp242/goatcounter/issues
