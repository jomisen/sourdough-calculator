/**
 * Beginner Guide Content
 * Data-driven content for all 8 guide steps
 */

export interface GuideStep {
    id: number;
    title: string;
    icon: string;
    phase: string;
    description: string;
    content: string;
    duration: string;
    hasTimer?: boolean;
    timerDurationHours?: number;
    tips?: string[];
    warnings?: string[];
}

export const GUIDE_STEPS: GuideStep[] = [
    // Steg 1: Förbered din surdegsstart
    {
        id: 0,
        title: "Förbered surdegsstart",
        icon: "🌱",
        phase: "1-2 dagar innan bakning",
        description: "Mata och testa din surdeg så att den är stark och aktiv när du ska baka.",
        duration: "1-2 dagar (5 min arbete per matning)",
        hasTimer: false,
        content: `
            <div class="step-section">
                <h4>🔍 Vad du ska göra</h4>
                <p>För att få ett luftigt bröd behöver din surdegsstart vara aktiv och på toppen av sin kraft. Detta kallas att surdegsstarten är i sin <strong>peak</strong>.</p>
                <p>Om du förvarar surdegsstarten i kylen: ta ut den kvällen innan och gör en första matning. Mata den sedan igen innan du ska baka.</p>
            </div>

            <div class="step-section">
                <h4>📋 Vad du behöver</h4>
                <p style="margin: var(--space-2) 0;"><strong>Glasburk • Våg • Sked • Surdegsstart • Vetemjöl • Rågmjöl • Vatten (rumstemperatur) • Gummiband</strong></p>
            </div>

            <div class="step-section">
                <h4>🔄 Hur du matar surdegen för att hålla den aktiv</h4>
                <div class="technique-box">
                    <p><strong>Ratio 1:5:5</strong> (5g start + 25g vatten + 25g mjöl)</p>
                    <ol class="numbered-steps">
                        <li>Ställ den tomma glasburken på vågen och lägg ner <strong>5g surdegsstart</strong></li>
                        <li>Addera <strong>25g vatten</strong> och blanda tills starten löses upp – det ska se ut som en mjölkig blandning</li>
                        <li>Addera <strong>12g rågmjöl</strong> och <strong>13g vetemjöl</strong>. Blanda väl</li>
                        <li>Skrapa ner degen från kanterna av burken</li>
                        <li>Sätt ett gummiband runt burken vid surdegens nivå för att se när den växer</li>
                    </ol>
                </div>
            </div>

            <div class="step-section">
                <img src="mata-surdeg2.png" alt="Så här matar du din surdegsstart" style="width: 100%; max-width: 600px; height: auto; border-radius: var(--radius-md); margin: var(--space-4) auto; display: block;">
            </div>

            <div class="step-section">
                <h4>🎯 Hur du matar surdegen inför bakning</h4>
                <div class="technique-box">
                    <p><strong>Ratio 1:5:5</strong> (20g start + 100g vatten + 100g mjöl)</p>
                    <ol class="numbered-steps">
                        <li>Ställ den tomma glasburken på vågen och lägg ner <strong>20g surdegsstart</strong></li>
                        <li>Addera <strong>100g vatten</strong> och blanda tills starten löses upp – det ska se ut som en mjölkig blandning</li>
                        <li>Addera <strong>50g rågmjöl</strong> och <strong>50g vetemjöl</strong>. Blanda väl</li>
                        <li>Skrapa ner degen från kanterna av burken</li>
                        <li>Sätt ett gummiband runt burken vid surdegens nivå för att se när den växer</li>
                        <li><strong>När surdegen stigit till dubbel storlek har den nått sin peak</strong> – då är det dags att baka!</li>
                    </ol>
                </div>
            </div>
        `,
        tips: [
            "Ta ut surdegsstarten från kylen kvällen innan du ska baka",
            "Gummibandet hjälper dig se när den dubblats i storlek",
            "Peak nås vanligtvis 4-8 timmar efter matning vid rumstemperatur"
        ]
    },

    // Steg 2: Autolys
    {
        id: 1,
        title: "Autolys",
        icon: "💧",
        phase: "Dag 1 - Förmiddag",
        description: "Blanda mjöl och vatten och låt vila i en timme.",
        duration: "1 timme",
        hasTimer: false,
        content: `
            <div class="step-section">
                <h4>🔍 Vad är autolys?</h4>
                <p>Autolys är en teknik där man blandar mjöl och vatten och låter det vila <strong>innan</strong> man tillsätter surdeg och salt. Under denna vila börjar glutensträngarna att utvecklas av sig själva – det gör degen mer elastisk och lättare att arbeta med.</p>
                <p><strong>Varför gör vi det?</strong> Genom att ge mjölet tid att absorbera vattnet blir degen smidigare att knåda och brödet får en bättre struktur.</p>
            </div>

            <div class="step-section">
                <h4>📊 Ange dina mjölmängder</h4>
                <div class="recipe-calculator">
                    <div class="input-row">
                        <label for="wheat-flour-input">Vetemjöl (g):</label>
                        <input type="number" id="wheat-flour-input" class="guide-input" value="720" min="100" max="2000" step="10">
                    </div>
                    <div class="input-row">
                        <label for="spelt-flour-input">Fullkornsmjöl (g):</label>
                        <input type="number" id="spelt-flour-input" class="guide-input" value="80" min="0" max="500" step="10">
                    </div>
                    <p style="font-size: 14px; color: var(--green-medium); margin: var(--space-2) 0;"><em>💡 Tips: Använd fullkornsdinkel för god smak och fin textur</em></p>
                    <div class="input-row">
                        <label for="hydration-select">Hydreringsgrad:</label>
                        <select id="hydration-select" class="guide-select">
                            <option value="65">65%</option>
                            <option value="70" selected>70% (rekommenderat)</option>
                            <option value="75">75%</option>
                            <option value="80">80%</option>
                        </select>
                    </div>
                    <div class="calculated-result">
                        <strong>Vatten som behövs:</strong> <span id="water-amount">560</span> g
                    </div>
                </div>
            </div>

            <div class="step-section">
                <h4>📋 Så här gör du</h4>
                <ol class="numbered-steps">
                    <li>Lägg <strong id="wheat-amount-instruction">720g vetemjöl</strong> och <strong id="spelt-amount-instruction">80g fullkornsmjöl</strong> i en stor skål</li>
                    <li>Häll i <strong id="water-amount-instruction">560g vatten</strong></li>
                    <li>Blanda med händerna tills allt mjöl är vått (det behöver inte bli helt jämnt)</li>
                    <li>Täck över skålen med en handduk eller plastfolie</li>
                    <li><strong>Låt vila i 1 timme i rumstemperatur</strong></li>
                </ol>
            </div>
        `,
        tips: [
            "Degen kommer se ojämn ut efter blandning – det är helt normalt!",
            "Använd en stor skål – degen kommer växa under jäsningen senare",
            "Rumstemperatur = cirka 20-22°C"
        ]
    },

    // Steg 3: Bulkjäsning
    {
        id: 2,
        title: "Bulkjäsning",
        icon: "🙌",
        phase: "Dag 1 - Eftermiddag/Kväll",
        description: "Tillsätt surdeg och salt, gör stretch & folds, låt sedan degen jäsa.",
        duration: "5-7 timmar",
        content: `
            <div class="step-section">
                <h4>🧮 Beräknade mängder</h4>
                <div class="recipe-calculator">
                    <div class="calculated-amounts">
                        <div class="amount-item">
                            <strong>Surdegsstart (20%):</strong> <span id="starter-amount">160</span> g
                        </div>
                        <div class="amount-item">
                            <strong>Salt (2%):</strong> <span id="salt-amount">16</span> g
                        </div>
                    </div>
                    <p style="font-size: 14px; color: var(--green-medium); margin-top: var(--space-2);"><em>Baserat på dina mjölmängder från föregående steg</em></p>
                </div>
            </div>

            <div class="step-section">
                <h4>📋 Steg 1: Tillsätt surdeg</h4>
                <ol class="numbered-steps">
                    <li>Ta fram din autolysdeg från förra steget</li>
                    <li>Tillsätt <strong id="starter-amount-instruction">160g surdegsstart</strong></li>
                    <li>Blanda med händerna genom att klämma och vika degen tills surdegen är väl inblandad (2-3 minuter)</li>
                    <li>Täck skålen och <strong>låt vila i 30 minuter</strong></li>
                </ol>
            </div>

            <div class="step-section">
                <h4>🧂 Steg 2: Tillsätt salt</h4>
                <ol class="numbered-steps">
                    <li>Efter 30 minuter: Tillsätt <strong id="salt-amount-instruction">16g salt</strong></li>
                    <li>Blanda in saltet ordentligt med händerna</li>
                    <li>Täck skålen och <strong>låt vila i 20 minuter</strong></li>
                </ol>
            </div>

            <div class="step-section">
                <h4>🙌 Steg 3: Stretch & Fold (Vikningar)</h4>

                <div class="technique-box">
                    <h5>Vad är stretch & fold?</h5>
                    <p><strong>Stretch & fold</strong> (på svenska: <strong>vik</strong>) är en teknik där man drar ut degen och viker den över sig själv. Det bygger upp glutenstrukturen som gör brödet luftigt och ger det styrka att hålla formen.</p>
                    <p><strong>Så här gör du en vik:</strong></p>
                    <ol style="font-size: 14px; padding-left: var(--space-4);">
                        <li>Fukta händerna lätt</li>
                        <li>Greppa ena sidan av degen</li>
                        <li>Dra upp den så degen sträcks ut</li>
                        <li>Vik över degen mot mitten</li>
                        <li>Rotera skålen 90° och upprepa</li>
                        <li>Gör detta 4 gånger (en gång från varje sida)</li>
                    </ol>
                </div>

                <p style="margin-top: var(--space-3);"><strong>Gör 4 omgångar stretch & fold:</strong></p>
                <ul class="numbered-steps">
                    <li>Vik 1 → Vila 20 minuter</li>
                    <li>Vik 2 → Vila 20 minuter</li>
                    <li>Vik 3 → Vila 20 minuter</li>
                    <li>Vik 4 → Klar med vikningarna!</li>
                </ul>
            </div>

            <div class="step-section why-section">
                <details>
                    <summary>💡 Varför gör vi stretch & folds?</summary>
                    <p><strong>Bygger glutennätverk:</strong> Varje vikning stärker glutensträngarna som håller ihop degen och fångar upp luftbubblorna från jäsningen.</p>
                    <p><strong>Jämnare jäsning:</strong> Vikningarna sprider ut surdegen och jästen jämnt i hela degen.</p>
                    <p><strong>Bättre struktur:</strong> Utan vikningar blir brödet tätt och platt. Med vikningar får du luftigt bröd med vackra hålrum!</p>
                </details>
            </div>

            <div class="step-section">
                <h4>⏰ Steg 4: Vila (bulkjäsning)</h4>
                <p>Efter sista vikningen ska degen få vila ostört. Detta är själva bulkjäsningen där degen växer och utvecklar smak.</p>

                <div class="temperature-guide">
                    <h5>🌡️ Tid baserat på temperatur</h5>
                    <table style="width: 100%; border-collapse: collapse; margin: var(--space-3) 0;">
                        <tr style="background: rgba(159, 176, 148, 0.1);">
                            <th style="padding: var(--space-2); text-align: left; border: 1px solid var(--green-lighter);">Temperatur</th>
                            <th style="padding: var(--space-2); text-align: left; border: 1px solid var(--green-lighter);">Vila-tid efter vikningarna</th>
                        </tr>
                        <tr>
                            <td style="padding: var(--space-2); border: 1px solid var(--green-lighter);">18-19°C</td>
                            <td style="padding: var(--space-2); border: 1px solid var(--green-lighter);">4-5 timmar</td>
                        </tr>
                        <tr style="background: rgba(200, 167, 214, 0.05);">
                            <td style="padding: var(--space-2); border: 1px solid var(--green-lighter);"><strong>20-22°C (rekommenderat)</strong></td>
                            <td style="padding: var(--space-2); border: 1px solid var(--green-lighter);"><strong>3-4 timmar</strong></td>
                        </tr>
                        <tr>
                            <td style="padding: var(--space-2); border: 1px solid var(--green-lighter);">23-25°C</td>
                            <td style="padding: var(--space-2); border: 1px solid var(--green-lighter);">2-3 timmar</td>
                        </tr>
                    </table>
                    <p style="font-size: 14px; color: var(--green-medium);"><em>💡 Tips: Använd en rumstermometer för bästa resultat</em></p>
                </div>
            </div>

            <div class="step-section">
                <h4>✅ Hur vet jag att degen är klar?</h4>
                <p>Efter vilan ska degen ha:</p>
                <ul>
                    <li>Vuxit med cirka 50% i volym</li>
                    <li>Många små luftbubblor synliga på ytan och i sidorna</li>
                    <li>Känns luftig och vabblig när du skakar skålen</li>
                </ul>
                <p><em>Gå vidare till nästa steg för mer detaljerade test!</em></p>
            </div>
        `,
        tips: [
            "Täck skålen mellan vikningarna så degen inte torkar",
            "Efter varje vikning kommer degen kännas starkare och mer elastisk",
            "Ställ degen på ett jämnt varmt ställe – undvik drag och direkta värmekällor",
            "En missad vikning är ingen katastrof – gör bara nästa när du kommer ihåg!"
        ],
        warnings: [
            "Undvik temperaturer över 27°C – kan ge surt bröd och för snabb jäsning",
            "Under 18°C går jäsningen mycket långsamt (kan ta 8-12 timmar totalt)"
        ]
    },

    // Steg 4: Testa om degen är klar
    {
        id: 3,
        title: "Testa om degen är klar",
        icon: "👀",
        phase: "Dag 1 - Kväll",
        description: "Använd fingertoppstestet och volymtestet för att se om bulkjäsningen är klar.",
        duration: "5 minuter",
        hasTimer: false,
        content: `
            <div class="step-section">
                <h4>🔍 Vad du ska göra</h4>
                <p>Efter 4-6 timmar behöver du testa om degen är färdigjäst. Det finns två enkla test du kan göra!</p>
            </div>

            <div class="step-section">
                <h4>📋 Hur du gör</h4>
                <div class="test-box">
                    <h5>Test 1: Fingertoppstestet (Poke Test)</h5>
                    <ol class="numbered-steps">
                        <li>Fukta fingret och tryck försiktigt ned i degen (ca 1 cm)</li>
                        <li>Titta hur snabbt hålet studsar tillbaka:
                            <ul>
                                <li><strong>✅ Perfekt:</strong> Hålet studsar långsamt tillbaka (hälften kvar efter 5 sek)</li>
                                <li><strong>⏳ För tidig:</strong> Hålet studsar snabbt tillbaka helt → vänta 30-60 min till</li>
                                <li><strong>⚠️ Överjäst:</strong> Hålet studsar inte alls tillbaka → forma direkt!</li>
                            </ul>
                        </li>
                    </ol>
                </div>

                <div class="test-box">
                    <h5>Test 2: Volymtestet</h5>
                    <ol class="numbered-steps">
                        <li>Titta på degen i skålen – den ska ha växt med <strong>50-75%</strong></li>
                        <li>Du ska se luftbubblor på ytan och genom skålens sidor (om genomskinlig)</li>
                        <li>Degen ska kännas mjuk, "puffig" och fylld med luft</li>
                    </ol>
                </div>

                <p><strong>Båda testen visar "klart"?</strong> → Då är det dags att forma brödet! 🎉</p>
            </div>

            <div class="step-section why-section">
                <details>
                    <summary>💡 Varför är timingen så viktig?</summary>
                    <p><strong>Underjäst deg</strong> (för lite jäsning) ger tätt, kompakt bröd utan hålrum.</p>
                    <p><strong>Perfekt jäst deg</strong> ger luftigt bröd med vackra hålrum och god struktur.</p>
                    <p><strong>Överjäst deg</strong> kollapsar när du formar den och blir kladdigt platt bröd.</p>
                    <p>Det är bättre att forma lite för tidigt än för sent – överjäst deg är svårare att rädda!</p>
                </details>
            </div>
        `,
        tips: [
            "Lita på degen, inte klockan – temperatur påverkar tiden enormt",
            "Ta en bild innan jäsning så du kan jämföra volymökningen",
            "Första gången? Forma när degen känns \"nästan\" klar – bättre än att vänta för länge",
            "Övning ger färdighet – du kommer lära känna din deg!"
        ]
    },

    // Steg 5: Forma brödet
    {
        id: 4,
        title: "Forma brödet",
        icon: "✋",
        phase: "Dag 1 - Kväll",
        description: "Dela och forma degen till bröd som får vila i jäsningskorg.",
        duration: "45 minuter",
        hasTimer: false,
        content: `
            <div class="step-section">
                <h4>🍞 Antal bröd</h4>
                <div class="recipe-calculator">
                    <div class="calculated-result">
                        <strong>Rekommendation:</strong> <span id="loaf-count">2</span> bröd
                    </div>
                    <p style="font-size: 14px; color: var(--green-medium); margin-top: var(--space-2);"><em>Baserat på din totala mjölvikt (<span id="total-flour-weight">800</span>g)</em></p>
                </div>
            </div>

            <div class="step-section">
                <h4>🔪 Steg 1: Preshape (förformning)</h4>
                <p><strong>Viktigt: Använd INGET mjöl!</strong> Blöt händerna om degen är klibbig – då fastnar ingenting.</p>

                <ol class="numbered-steps">
                    <li>Ta ut degen försiktigt på en ren arbetsbänk (utan mjöl)</li>
                    <li>Dela degen i <strong id="loaf-count-instruction">2</strong> lika stora delar med en degskrapa</li>
                    <li>Arbeta med en degbit i taget:</li>
                </ol>

                <div class="technique-box">
                    <h5>Så här gör du en preshape:</h5>
                    <ol style="font-size: 14px; padding-left: var(--space-4); margin: var(--space-2) 0;">
                        <li>Använd en degskrapa eller dina händer</li>
                        <li>Dra degen försiktigt mot dig</li>
                        <li>Ta hjälp av underlaget för att skapa spänning</li>
                        <li>Dra degen runt och mot dig i omgångar</li>
                        <li>Forma till en rund boll</li>
                        <li>Upprepa med nästa degbit</li>
                    </ol>
                </div>

                <p style="margin-top: var(--space-3);"><strong>Bänkvila:</strong> Låt degbollarna vila på bänken i <strong>exakt 30 minuter</strong> med en handduk över.</p>
            </div>

            <div class="step-section">
                <h4>✨ Steg 2: Slutformning</h4>
                <p>Nu ska vi ge brödet sin slutliga form. Arbeta med ett bröd i taget:</p>

                <ol class="numbered-steps">
                    <li><strong>Mjöla:</strong> Strö lätt mjöl på degen och på underlaget du ska arbeta på</li>
                    <li><strong>Forma kvadrat:</strong> Lägg ut degen och dra försiktigt i den så att den blir mer kvadratisk</li>
                    <li><strong>Vik höger:</strong> Vik över högra sidan försiktigt så att den täcker två tredjedelar av degen</li>
                    <li><strong>Vik vänster:</strong> Vik över vänstra sidan så att nu hela degen är vikt</li>
                    <li><strong>Rulla:</strong> Rulla försiktigt degen uppifrån och ner så att det blir en avlång boll</li>
                    <li><strong>I jäskorg:</strong> Lägg ner i jäskorgen med <strong>skarven upp</strong></li>
                    <li><strong>Plastpåse:</strong> Lägg hela jäskorgen i en plastpåse</li>
                </ol>

                <p style="margin-top: var(--space-3);"><em>Upprepa med nästa bröd!</em></p>
            </div>

            <div class="step-section why-section">
                <details>
                    <summary>💡 Varför två formningar?</summary>
                    <p><strong>Preshape</strong> samlar degen och skapar grundspänning. Under de 30 minuterna relaxar glutenet så att slutformningen blir lättare.</p>
                    <p><strong>Slutformning</strong> skapar stark ytspänning – det är det som gör att brödet reser sig uppåt i ugnen istället för att sprida ut sig.</p>
                    <p><strong>Skarv upp</strong> i korgen gör att slätsidan blir botten när du stjälper ur brödet, vilket ger en fin yta att skära i.</p>
                </details>
            </div>
        `,
        tips: [
            "Våta händer är nyckeln! Då fastnar inget vid preshape",
            "Arbeta försiktigt men bestämt – vi vill inte slå ut luften",
            "Mjöla jäskorgen rikligt (ris-/vetemjölblandning funkar bäst) innan du lägger i degen",
            "Har du ingen jäsningskorg? Använd en skål fodrad med en mjölad kökshandduk!"
        ]
    },

    // Steg 6: Kalljäsning i kylskåp
    {
        id: 5,
        title: "Kalljäsning i kylskåp",
        icon: "❄️",
        phase: "Dag 1 - Natt → Dag 2-3",
        description: "Låt brödet jäsa långsamt i kylskåpet för bättre smak och struktur.",
        duration: "8-48 timmar",
        hasTimer: false,
        content: `
            <div class="step-section">
                <h4>🔍 Vad du ska göra</h4>
                <p>Nu ställer vi degen i kylskåpet över natten (eller längre!). Detta är den magiska delen som ger surdegsbröd sin karaktäristiska syrliga smak och perfekta struktur.</p>
                <p><strong>⚠️ Kalljäsning är valfritt!</strong> Du kan hoppa över detta steg och grädda direkt efter formning om du har bråttom. Brödet blir gott ändå, bara mindre syrligt.</p>
            </div>

            <div class="step-section">
                <h4>📋 Hur du gör</h4>
                <ol class="numbered-steps">
                    <li><strong>Lägg jäsningskorgen i en plastpåse</strong> (viktigt för att degen inte ska torka ut)</li>
                    <li>Ställ direkt i kylskåpet (4-7°C)</li>
                    <li>Låt stå i <strong>8-48 timmar</strong>
                        <ul>
                            <li><strong>8-12 timmar:</strong> Mildare smak, perfekt för nybörjare</li>
                            <li><strong>12-18 timmar:</strong> Klassisk surdeg-smak, bra balans</li>
                            <li><strong>18-24 timmar:</strong> Mer syrlig smak, bättre struktur</li>
                            <li><strong>24-36 timmar:</strong> Stark surdeg-smak, mycket syrlig</li>
                            <li><strong>36-48 timmar:</strong> Maximal syrlig smak och komplex aroma</li>
                        </ul>
                    </li>
                    <li>När du är redo att grädda: Ta ut degen direkt från kylskåpet</li>
                </ol>
            </div>

            <div class="step-section why-section">
                <details>
                    <summary>💡 Varför kalljäsning?</summary>
                    <p><strong>Smakutveckling:</strong> I kylan saktar jäsningen ner, men bakterierna (mjölksyrabakterierna) jobbar vidare och skapar de syrliga, komplexa smakerna.</p>
                    <p><strong>Bättre struktur:</strong> Den långsamma jäsningen ger starkare glutennätverk = mer luftigt bröd.</p>
                    <p><strong>Flexibilitet:</strong> Du kan baka när det passar dig – morgon, lunch, kväll eller till och med flera dagar senare!</p>
                    <p><strong>Lättare att hantera:</strong> Kall deg är mindre kladdig och lättare att skära mönster i.</p>
                </details>
            </div>
        `,
        tips: [
            "Första gången? Sikta på 12-18 timmar – en säker mellanting",
            "Plastpåsen förhindrar att degen torkar ut i kylskåpet",
            "Längre kalljäsning = surare smak, så anpassa efter din preferens",
            "Du kan utan problem kalljäsa upp till 48 timmar – perfekt om planerna ändras!"
        ]
    },

    // Steg 7: Förvärm ugn och grädda
    {
        id: 6,
        title: "Förvärm ugn och grädda",
        icon: "🔥",
        phase: "Dag 2 - Morgon/Eftermiddag",
        description: "Förvärm ugnen med gryta, skär mönster i degen och grädda till gyllene perfektion.",
        duration: "1 timme 20 minuter",
        hasTimer: false,
        content: `
            <div class="step-section">
                <h4>🔍 Vad du ska göra</h4>
                <p>Nu kommer den spännande delen – att förvandla din deg till ett vackert, gyllene bröd! Vi gräddar i en het gjutjärnsgryta för att skapa ånga och skorpa.</p>
            </div>

            <div class="step-section">
                <h4>📋 Hur du gör</h4>
                <ol class="numbered-steps">
                    <li><strong>Förvärm ugnen:</strong>
                        <ul>
                            <li>Sätt ugnen på <strong>250°C</strong> (över/undervärme)</li>
                            <li>Ställ in en gjutjärnsgryta med lock (eller Dutch oven)</li>
                            <li>Låt värmas i <strong>45-60 minuter</strong> – grytan måste bli riktigt het!</li>
                        </ul>
                    </li>
                    <li><strong>Förbered degen:</strong>
                        <ul>
                            <li>Lägg bakplåtspapper på bänken</li>
                            <li>Vänd ur degen från korgen på pappret (slätsidan upp nu)</li>
                            <li>Skär ett mönster med ett vasst rakblad eller kniv:
                                <ul>
                                    <li>Ett snett snitt (45°) tvärs över brödet, 1 cm djupt</li>
                                    <li>Eller ett kors-mönster</li>
                                </ul>
                            </li>
                        </ul>
                    </li>
                    <li><strong>I ugnen:</strong>
                        <ul>
                            <li>Ta ut den heta grytan (VAR FÖRSIKTIG!)</li>
                            <li>Lyft degen med bakplåtspappret ner i grytan</li>
                            <li><strong>Lägg två isbitar vid sidan om degen</strong> (inte på degen!) – ger extra ånga för bättre oven spring</li>
                            <li>Lägg på locket</li>
                            <li><strong>Grädda 20 minuter</strong> med lock</li>
                        </ul>
                    </li>
                    <li><strong>Utan lock:</strong>
                        <ul>
                            <li>Ta bort locket</li>
                            <li>Sänk till <strong>230°C</strong></li>
                            <li><strong>Grädda 25-35 minuter</strong> tills gyllenbrun (inre temp 96-98°C)</li>
                        </ul>
                    </li>
                    <li><strong>Ta ut:</strong> Lyft försiktigt ur brödet och ställ på galler</li>
                </ol>

                <div class="warning-box">
                    <h5>⚠️ Säkerhet</h5>
                    <p>Gjutjärnsgrytan är EXTREMT het! Använd grytlappar och var försiktig.</p>
                </div>
            </div>

            <div class="step-section why-section">
                <details>
                    <summary>💡 Varför gryta med lock?</summary>
                    <p><strong>Ångan är nyckeln!</strong> När du gräddar med lock fångas ångan från degen i grytan. Denna fukt håller ytan mjuk så att brödet kan expandera maximalt (kallas "oven spring").</p>
                    <p><strong>Utan lock:</strong> Efter 20 minuter tar vi bort locket så skorpan kan bli gyllene och knaprig.</p>
                    <p><strong>Hög värme:</strong> 250°C ger den explosiva expansionen och gyllene skorpan. Lägre temp = blekt, mindre luftigt bröd.</p>
                    <p><strong>Skärningen:</strong> Skapar en "ventil" som styr var brödet ska expandera – annars spricker det slumpmässigt.</p>
                </details>
            </div>
        `,
        tips: [
            "Har du ingen gjutjärnsgryta? En djup ugnsfast gryta med lock funkar också",
            "Skär snabbt och bestämt – tvekande snitt ger fula resultat",
            "Brödet är klart när det låter ihåligt när du knackar på botten",
            "Doften av färskt bröd är fantastisk – njut av den!"
        ],
        warnings: [
            "Ta inte ut brödet för tidigt – det kan vara degt inuti",
            "Glöm inte grytlapparna – allvarliga brännskador kan uppstå!"
        ]
    },

    // Steg 8: Låt svalna och njut
    {
        id: 7,
        title: "Låt svalna och njut!",
        icon: "🎉",
        phase: "Dag 2 - Eftermiddag",
        description: "Vänta tålmodigt medan brödet svalnar – sedan är det dags att skära upp och smaka!",
        duration: "1-2 timmar",
        hasTimer: false,
        content: `
            <div class="step-section">
                <h4>🔍 Vad du ska göra</h4>
                <p>Det svåraste steget av alla – att VÄNTA! Men det är viktigt att låta brödet svalna helt innan du skär upp det.</p>
            </div>

            <div class="step-section">
                <h4>📋 Hur du gör</h4>
                <ol class="numbered-steps">
                    <li>Ställ brödet på ett galler (inte på en bricka – botten blir fuktig)</li>
                    <li>Låt svalna i <strong>1-2 timmar</strong> tills det är rumstemperatur</li>
                    <li>När det har svalnat helt: skär upp med en bra brödkniv</li>
                    <li>Beundra de vackra hålrummen! 🤩</li>
                    <li><strong>Smaka och njut av ditt första surdegsbröd!</strong></li>
                </ol>

                <div class="celebration-box">
                    <h5>🎉 GRATTIS! 🎉</h5>
                    <p>Du har bakat ditt första surdegsbröd från grunden! Detta är en riktig prestation – surdegsbagning tar tid, precision och tålamod.</p>
                </div>
            </div>

            <div class="step-section why-section">
                <details>
                    <summary>💡 Varför måste det svalna?</summary>
                    <p><strong>Fortsatt bakning:</strong> Även utanför ugnen fortsätter brödet att "baka" inuti medan det svalnar. Stärkelsen stabiliseras och fukten fördelas jämnt.</p>
                    <p><strong>Skärbarhet:</strong> Varmt bröd är degigt och klibbigt inuti – det blir en kladdig röra när du skär det.</p>
                    <p><strong>Smak:</strong> Smakerna utvecklas och balanseras under svalningen. Varmt bröd smakar faktiskt lite platt!</p>
                </details>
            </div>

            <div class="step-section">
                <h4>📚 Nästa steg på din surdegsresa</h4>
                <ul>
                    <li><strong>Utvärdera:</strong> Hur blev hålrummen? För tätt/luftigt? För surt/milt? Anteckna och justera nästa gång!</li>
                    <li><strong>Experimentera:</strong> Prova andra mjölsorter, längre kalljäsning, olika former</li>
                    <li><strong>Skapa ett schema:</strong> Använd fliken "Skapa bakschema" för att planera nästa bak!</li>
                    <li><strong>Dela:</strong> Bjud familj och vänner på ditt bröd – alla blir imponerade! 🍞</li>
                </ul>
            </div>
        `,
        tips: [
            "Brödet håller 3-5 dagar i rumstemperatur (snitsidan nedåt på skärbräda)",
            "Frys gärna! Skivat bröd kan rostas direkt från frysen",
            "Gammal surdeg blir fantastiska krutonger eller ströbröd",
            "Fortsätt baka – varje bröd blir bättre än det förra!"
        ]
    }
];

export const GLOSSARY = {
    "Autolyse": "När mjöl och vatten vilar tillsammans innan salt och surdeg tillsätts. Detta utvecklar gluten och gör degen lättare att arbeta med.",
    "Bulkjäsning": "Första jäsningen när hela degen jäser i skål. Här utvecklas smak och gluten genom vikningar.",
    "Hydrering": "Mängden vatten i relation till mjöl, uttryckt i procent. 75% hydrering = 375g vatten per 500g mjöl.",
    "Kalljäsning": "Jäsning i kylskåp (4-7°C) som ger surdegsbröd sin syrliga smak och förbättrar strukturen.",
    "Gluten": "Proteinnätverk som bildas när mjöl och vatten blandas. Det ger brödet struktur och gör att det kan hålla luftbubblor.",
    "Oven spring": "Den dramatiska expansionen som sker när brödet kommer in i den heta ugnen. Ångan håller skorpan mjuk så degen kan växa.",
    "Vikningar (Stretch and fold)": "Teknik där man drar ut och viker degen för att utveckla gluten utan traditionell knådning.",
    "Jäsningskorg (Banneton)": "Korg av rotting eller trä som ger brödet stöd och form under slutjäsningen. Skapar det klassiska mönstret.",
    "Poke test": "Test där man trycker fingret i degen för att se om bulkjäsningen är klar. Hålet ska studsa långsamt tillbaka.",
    "Surdegsstartare": "En levande kultur av jäst och mjölksyrabakterier som används istället för torr jäst för att jäsa bröd."
};
