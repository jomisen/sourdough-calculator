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
    // Steg 1: Förbered ingredienser
    {
        id: 0,
        title: "Förbered ingredienserna",
        icon: "🌾",
        phase: "Dag 1 - Morgon",
        description: "Samla och väg upp allt du behöver för ditt första surdegsbröd.",
        duration: "10 minuter",
        hasTimer: false,
        content: `
            <div class="step-section">
                <h4>🔍 Vad du ska göra</h4>
                <p>Innan du börjar blanda ska du väga upp alla ingredienser noggrant. Surdegsbagning är som vetenskap – precisa mätningar ger bättre resultat!</p>
            </div>

            <div class="step-section">
                <h4>📋 Hur du gör</h4>
                <div class="recommended-values">
                    <h5>Rekommenderade mängder (för 1 bröd):</h5>
                    <ul class="ingredient-list">
                        <li><strong>500g</strong> mjöl (vitt vetemjöl för första försöket)</li>
                        <li><strong>375g</strong> vatten (75% hydrering – perfekt balans)</li>
                        <li><strong>100g</strong> surdeg (20% – aktiv och bubblig)</li>
                        <li><strong>10g</strong> salt (2% – perfekt för smak)</li>
                    </ul>
                    <p class="helper-text">💡 Vill du justera? Gå till fliken <strong>"Beräkna jästid"</strong> och experimentera!</p>
                </div>

                <ol class="numbered-steps">
                    <li>Ta fram en digital våg (helst med 1g precision)</li>
                    <li>Ta fram alla ingredienser från skåpet/kylskåpet</li>
                    <li>Väg upp varje ingrediens i separata skålar</li>
                    <li>Kontrollera att din surdeg är <strong>aktiv</strong> (bubblig och har dubblats sedan senaste matningen)</li>
                </ol>
            </div>

            <div class="step-section why-section">
                <details>
                    <summary>💡 Varför dessa mängder?</summary>
                    <p><strong>75% hydrering</strong> (vatten i relation till mjöl) är perfekt för nybörjare – tillräckligt mjuk för att utveckla gluten, men inte så kladdig att den är svår att hantera.</p>
                    <p><strong>20% surdeg</strong> ger en lagom fermentering på 4-6 timmar vid rumstemperatur. Mindre surdeg = längre tid, mer surdeg = snabbare.</p>
                    <p><strong>2% salt</strong> är standardmängden i bröd. Mindre än 1.5% blir smaklöst, mer än 2.5% kan hämma jäsningen.</p>
                </details>
            </div>
        `,
        tips: [
            "Digital våg är A och O – använd en som visar hela gram",
            "Surdegen ska vara aktiv (matad 4-8 timmar innan) och bubblig",
            "Vattnet ska vara rumstemperatur eller ljummet (ca 25°C)",
            "Använd vitt vetemjöl för första försöket – lättare att hantera än fullkorn"
        ]
    },

    // Steg 2: Blanda degen - Autolyse
    {
        id: 1,
        title: "Blanda degen – Autolyse",
        icon: "💧",
        phase: "Dag 1 - Förmiddag",
        description: "Blanda mjöl och vatten först, låt vila (autolyse), tillsätt sedan surdeg och salt.",
        duration: "30-60 minuter (valfritt)",
        hasTimer: false,
        content: `
            <div class="step-section">
                <h4>🔍 Vad du ska göra</h4>
                <p>Nu blandar vi ingredienserna i rätt ordning. Autolyse är ett fancy ord för "låt mjöl och vatten vila tillsammans" – det gör degen mjukare och lättare att arbeta med.</p>
            </div>

            <div class="step-section">
                <h4>📋 Hur du gör</h4>
                <ol class="numbered-steps">
                    <li>Häll <strong>vatten</strong> (375g) i en stor skål</li>
                    <li>Tillsätt <strong>mjöl</strong> (500g)</li>
                    <li>Rör ihop med en slickepott tills allt mjöl är vått (behöver inte vara jämnt!)</li>
                    <li><strong>Vila 30-60 min</strong> med lock/handduk över (detta är autolyse)</li>
                    <li>Efter vilan: tillsätt <strong>surdeg</strong> (100g) och <strong>salt</strong> (10g)</li>
                    <li>Blanda med handen tills allt är väl blandat (använd "stretch and fold"-tekniken)</li>
                </ol>

                <div class="technique-box">
                    <h5>🙌 Stretch and Fold-teknik</h5>
                    <p>Greppa ena sidan av degen, dra upp och vik över mitten. Rotera skålen 90° och upprepa. Gör detta 4-5 gånger tills degen känns sammanhängande.</p>
                </div>
            </div>

            <div class="step-section why-section">
                <details>
                    <summary>💡 Varför autolyse?</summary>
                    <p>När mjöl och vatten vilar tillsammans börjar glutensträngarna att utvecklas av sig själva – utan arbete! Detta gör degen mer elastisk och lättare att knåda senare.</p>
                    <p>Genom att <strong>inte</strong> tillsätta salt direkt får jäsningen en bättre start. Salt hämmar jästcellerna lite, så de får en bättre boost om de kommer in senare.</p>
                </details>
            </div>
        `,
        tips: [
            "Autolyse är valfritt – du kan hoppa över och blanda allt direkt om du har bråttom",
            "Degen kommer kännas kladdig – det är normalt!",
            "Använd en skål som är minst dubbelt så stor som degen – den kommer växa!",
            "Fukt händerna lite för att förhindra att degen fastnar"
        ]
    },

    // Steg 3: Bulkjäsning med vikningar
    {
        id: 2,
        title: "Bulkjäsning med vikningar",
        icon: "🙌",
        phase: "Dag 1 - Eftermiddag",
        description: "Låt degen jäsa och vik den var 30:e minut för att bygga struktur.",
        duration: "4-6 timmar",
        hasTimer: true,
        timerDurationHours: 5,
        content: `
            <div class="step-section">
                <h4>🔍 Vad du ska göra</h4>
                <p>Nu ska degen jäsa i skålen i flera timmar. Under tiden gör vi "vikningar" var 30:e minut för att ge brödet struktur och styrka. Detta är hjärtat i surdegsbagning!</p>
            </div>

            <div class="step-section">
                <h4>📋 Hur du gör</h4>
                <ol class="numbered-steps">
                    <li>Täck skålen med lock eller fuktig handduk</li>
                    <li>Ställ på en varm plats (20-24°C är perfekt)</li>
                    <li><strong>Var 30:e minut:</strong> Gör en serie vikningar (4-6 gånger totalt)
                        <ul>
                            <li>Fukta händerna</li>
                            <li>Greppa ena sidan av degen, dra upp och vik över mitten</li>
                            <li>Rotera skålen 90° och upprepa</li>
                            <li>Gör detta 4 gånger (alla fyra sidor)</li>
                        </ul>
                    </li>
                    <li>Efter 4-6 timmar: testa om degen är klar (se nästa steg)</li>
                </ol>

                <div class="timer-box">
                    <p>⏱️ <strong>Sätt en timer!</strong> Bulkjäsningen tar 4-6 timmar beroende på temperatur.</p>
                    <button class="timer-button" onclick="beginnerGuide.startStepTimer(2, 5)">
                        Starta timer (5 timmar)
                    </button>
                </div>
            </div>

            <div class="step-section why-section">
                <details>
                    <summary>💡 Varför vikningar?</summary>
                    <p><strong>Vikningar bygger glutennätverk</strong> – det är det som gör att brödet får sin struktur och kan hålla uppe alla små luftbubblor som jästen skapar.</p>
                    <p>Utan vikningar blir brödet tätt och platt. Med vikningar blir det luftigt med vackra hålrum!</p>
                    <p><strong>Temperatur är avgörande:</strong> Vid 20°C tar det 6 timmar, vid 24°C kanske bara 4 timmar. Håll koll på degen, inte klockan.</p>
                </details>
            </div>
        `,
        tips: [
            "Ställ degen på ett varmt ställe – ovanpå kylskåp, nära element (inte FÖR varmt!)",
            "Efter första 2-3 vikningarna kommer degen kännas mycket jämnare och elastiskare",
            "Glöm inte att täcka skålen mellan vikningarna så degen inte torkar",
            "Om du måste gå – en missad vikning är ingen katastrof!"
        ],
        warnings: [
            "Undvik temperaturer över 27°C – kan ge surt bröd",
            "Under 18°C går jäsningen mycket långsamt (kan ta 8-12 timmar)"
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
        description: "Forma degen till en rund boll och lägg i en jäsningskorg.",
        duration: "30 minuter",
        hasTimer: false,
        content: `
            <div class="step-section">
                <h4>🔍 Vad du ska göra</h4>
                <p>Nu ska vi forma degen till en stram, rund boll som får vila i en jäsningskorg över natten. Detta ger brödet sin slutliga form och kraft att resa sig i ugnen!</p>
            </div>

            <div class="step-section">
                <h4>📋 Hur du gör</h4>
                <ol class="numbered-steps">
                    <li><strong>Förbered ytan:</strong> Strö lite mjöl på arbetsbänken (inte för mycket!)</li>
                    <li><strong>Vänd ut degen:</strong> Häll försiktigt ut degen på bänken med kladdiga sidan upp</li>
                    <li><strong>Förforma (bench rest):</strong>
                        <ul>
                            <li>Vik kanterna mot mitten för att skapa en rund form</li>
                            <li>Låt vila 20-30 minuter med handduk över</li>
                        </ul>
                    </li>
                    <li><strong>Slutformning:</strong>
                        <ul>
                            <li>Vänd degen så att slätsidan är ner</li>
                            <li>Vik kanterna mot mitten igen (som att stänga ett kuvert)</li>
                            <li>Vänd degen och forma den till en stram boll genom att dra den mot dig på bänken</li>
                        </ul>
                    </li>
                    <li><strong>I jäsningskorg:</strong>
                        <ul>
                            <li>Mjöla jäsningskorgen rikligt (ris-/vetemjölblandning funkar bäst)</li>
                            <li>Lägg degen med sömmen UPP i korgen</li>
                            <li>Täck med plastfolie eller handduk</li>
                        </ul>
                    </li>
                </ol>

                <div class="technique-box">
                    <h5>🎥 Bra video att följa</h5>
                    <p>Sök på YouTube: "sourdough shaping tutorial" – visuellt är lättare än text!</p>
                </div>
            </div>

            <div class="step-section why-section">
                <details>
                    <summary>💡 Varför forma två gånger?</summary>
                    <p><strong>Förformning</strong> samlar degen och skapar grundformen. Under vilan relaxar glutenet så att slutformningen blir lättare.</p>
                    <p><strong>Slutformning</strong> skapar ytspänning – det är det som gör att brödet reser sig uppåt i ugnen istället för att sprida ut sig.</p>
                    <p><strong>Söm upp i korgen</strong> gör att slätsidan blir botten (där du skärar), vilket ger vackrare "öra" och expansion.</p>
                </details>
            </div>
        `,
        tips: [
            "Har du ingen jäsningskorg? Använd en skål fodrad med en mjölad kökshandduk!",
            "Använd lite mjöl – för mycket gör brödet torrt",
            "Degen ska kännas spänd men inte trasig efter formning",
            "Första gången? En lite klumpig form bakar fortfarande gott!"
        ],
        warnings: [
            "Arbeta snabbt men försiktigt – vi vill inte slå ut all luft ur degen",
            "För löst formad = platt bröd. För hårt formad = trasig yta. Hitta balansen!"
        ]
    },

    // Steg 6: Kalljäsning i kylskåp
    {
        id: 5,
        title: "Kalljäsning i kylskåp",
        icon: "❄️",
        phase: "Dag 1 - Natt → Dag 2 - Morgon",
        description: "Låt brödet jäsa långsamt i kylskåpet över natten för bättre smak och struktur.",
        duration: "8-24 timmar",
        hasTimer: false,
        content: `
            <div class="step-section">
                <h4>🔍 Vad du ska göra</h4>
                <p>Nu ställer vi degen i kylskåpet över natten. Detta är den magiska delen som ger surdegsbröd sin karaktäristiska syrliga smak och perfekta struktur!</p>
            </div>

            <div class="step-section">
                <h4>📋 Hur du gör</h4>
                <ol class="numbered-steps">
                    <li>Täck jäsningskorgen med plastfolie eller lägg i en stor plastpåse</li>
                    <li>Ställ direkt i kylskåpet (4-7°C)</li>
                    <li>Låt stå i <strong>8-24 timmar</strong>
                        <ul>
                            <li><strong>8-12 timmar:</strong> Mildare smak, perfekt för nybörjare</li>
                            <li><strong>12-18 timmar:</strong> Mer syrlig smak, bättre struktur</li>
                            <li><strong>18-24 timmar:</strong> Stark surdeg-smak, max syrlig</li>
                        </ul>
                    </li>
                    <li>Ta ut degen 30 min innan gräddning (valfritt – vissa gräddar direkt från kylen)</li>
                </ol>
            </div>

            <div class="step-section why-section">
                <details>
                    <summary>💡 Varför kalljäsning?</summary>
                    <p><strong>Smakutveckling:</strong> I kylan saktar jäsningen ner, men bakterierna (mjölksyrabakterierna) jobbar vidare och skapar de syrliga, komplexa smakerna.</p>
                    <p><strong>Bättre struktur:</strong> Den långsamma jäsningen ger starkare glutennätverk = mer luftigt bröd.</p>
                    <p><strong>Flexibilitet:</strong> Du kan baka när det passar dig – morgon, lunch eller kväll dag 2!</p>
                    <p><strong>Lättare att hantera:</strong> Kall deg är mindre kladdig och lättare att skära mönster i.</p>
                </details>
            </div>
        `,
        tips: [
            "Första gången? Sikta på 12 timmar – en säker mellanting",
            "Du kan kalljäsa upp till 48 timmar om du glömmer bort den (blir bara surare)",
            "Täck väl så degen inte torkar ut i kylskåpet",
            "Nästa morgon: kaffedoft + färskt bröd = perfekt start på dagen!"
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
