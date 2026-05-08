import { AnalysisResult } from "@/types/analysis";

// Demo-Daten für verschiedene Geschäftstypen
export const DEMO_ANALYSES: Record<string, Omit<AnalysisResult, "id" | "createdAt">> = {
  onlineshop: {
    url: "https://beispiel-onlineshop.de",
    requestedUrl: "https://beispiel-onlineshop.de",
    scannedAt: new Date().toISOString(),
    analysisMode: "rendered",
    finalUrl: "https://beispiel-onlineshop.de",
    technicalNotes: ["Demo-Analyse für einen kleinen Onlineshop"],
    screenshots: {
      fullPage: "/placeholder-screenshot.svg",
      viewport: "/placeholder-screenshot.svg",
    },
    visualPreviewAvailable: true,
    visualMap: {
      pageWidth: 1440,
      pageHeight: 2800,
      viewportWidth: 1440,
      viewportHeight: 900,
      buttons: [
        { x: 120, y: 180, width: 220, height: 56, label: "Jetzt kaufen" },
        { x: 360, y: 180, width: 180, height: 56, label: "Mehr Infos" },
        { x: 120, y: 850, width: 160, height: 48, label: "In den Warenkorb" }
      ],
      headings: [
        { x: 100, y: 80, width: 640, height: 72, label: "Handgemachte Seifen & Naturkosmetik" },
        { x: 100, y: 400, width: 480, height: 48, label: "Unsere Bestseller" },
        { x: 100, y: 1200, width: 520, height: 56, label: "Warum unsere Produkte?" }
      ],
      images: [
        { x: 860, y: 140, width: 420, height: 320, label: "Produktgalerie" },
        { x: 120, y: 450, width: 280, height: 280, label: "Lavendel-Seife" },
        { x: 420, y: 450, width: 280, height: 280, label: "Zitrus-Duft" }
      ],
      forms: [
        { x: 120, y: 2200, width: 540, height: 340, label: "Newsletter-Anmeldung" }
      ],
      links: [
        { x: 100, y: 2650, width: 120, height: 24, label: "AGB" },
        { x: 240, y: 2650, width: 140, height: 24, label: "Datenschutz" },
        { x: 400, y: 2650, width: 100, height: 24, label: "Impressum" }
      ],
    },
    isPremium: false,
    totalFindings: 12,
    visibleFindings: 8,
    overallScore: 65,
    categoryScores: {
      seo: { category: "seo", label: "SEO", score: 58 },
      performance: { category: "performance", label: "Performance", score: 72 },
      trust: { category: "trust", label: "Trust", score: 52 },
      conversion: { category: "conversion", label: "Conversion", score: 61 },
      design: { category: "design", label: "Design", score: 78 },
      aiVisibility: { category: "aiVisibility", label: "KI-Sichtbarkeit", score: 45 },
    },
    findings: [
      {
        category: "trust",
        status: "warning",
        title: "Unsichere Zahlungsmethoden",
        description: "Nur PayPal als Zahlungsmethode angeboten - Kunden bevorzugen oft Kreditkarte oder Sofortüberweisung",
        priority: "medium"
      },
      {
        category: "conversion",
        status: "error",
        title: "Kein Trust-Badge sichtbar",
        description: "Keine Sicherheitszeichen oder Zertifizierungen sichtbar, die Vertrauen schaffen",
        priority: "high"
      },
      {
        category: "aiVisibility",
        status: "warning",
        title: "Fehlende strukturierte Daten",
        description: "Keine Schema.org-Markup für Produkte - KI-Systeme verstehen das Angebot nicht optimal",
        priority: "medium"
      }
    ],
    recommendations: [
      {
        title: "Mehr Zahlungsmethoden anbieten",
        text: "Füge Kreditkarte, Sofortüberweisung und Rechnung hinzu, um die Conversion zu steigern",
        description: "Kunden brechen häufig ab, wenn ihre bevorzugte Zahlungsmethode fehlt",
        impact: "high",
        effort: "medium",
        category: "conversion",
        weight: 85
      },
      {
        title: "Trust-Badges prominent platzieren",
        text: "Füge SSL-Zertifikat, Trusted Shops Siegel und Zahlungssicherheit-Badges hinzu",
        description: "Visuelle Sicherheitssignale reduzieren Kaufängste erheblich",
        impact: "high",
        effort: "low",
        category: "trust",
        weight: 90
      }
    ],
    categories: {
      seo: {
        score: 58,
        label: "SEO-Grundlagen",
        summary: "Solide Basis, aber Optimierungspotenzial bei Meta-Daten und Struktur",
        checks: [
          { title: "Meta-Title vorhanden", status: "good", message: "Titel ist aussagekräftig und enthält Keywords" },
          { title: "Meta-Description", status: "warning", message: "Beschreibung könnte ansprechender formuliert werden" },
          { title: "H1-Tag klar", status: "good", message: "Hauptüberschrift ist eindeutig und relevant" },
          { title: "Interne Verlinkung", status: "warning", message: "Wenige interne Links gefunden" }
        ]
      },
      performance: {
        score: 72,
        label: "Ladeperformance",
        summary: "Gute Ladezeiten, aber Bilder könnten optimiert werden",
        checks: [
          { title: "Ladezeit unter 3s", status: "good", message: "Seite lädt schnell genug" },
          { title: "Bilder optimiert", status: "warning", message: "Einige Produktbilder sind zu groß" },
          { title: "Server-Response", status: "good", message: "Schnelle Server-Antwortzeit" }
        ]
      },
      trust: {
        score: 52,
        label: "Vertrauen & Sicherheit",
        summary: "Grundlagen vorhanden, aber Trust-Signale fehlen",
        checks: [
          { title: "HTTPS-Verschlüsselung", status: "good", message: "Seite ist SSL-gesichert" },
          { title: "Impressum vorhanden", status: "good", message: "Rechtlich erforderliche Angaben vorhanden" },
          { title: "Trust-Badges", status: "critical", message: "Keine Sicherheitsbadges sichtbar" },
          { title: "Kontaktmöglichkeiten", status: "warning", message: "Nur E-Mail-Kontakt, kein Telefon" }
        ]
      },
      conversion: {
        score: 61,
        label: "Conversion-Optimierung",
        summary: "Gute Produktpräsentation, aber Kaufprozess könnte smoother werden",
        checks: [
          { title: "CTA-Buttons sichtbar", status: "good", message: "Kaufen-Buttons sind gut platziert" },
          { title: "Produktbeschreibungen", status: "good", message: "Detaillierte und ansprechende Texte" },
          { title: "Warenkorb-Funktion", status: "warning", message: "Warenkorb-Icon könnte prominenter sein" },
          { title: "Mobile Kaufprozess", status: "warning", message: "Checkout auf Mobile optimieren" }
        ]
      },
      design: {
        score: 78,
        label: "Design & UX",
        summary: "Sauberes, natürliches Design mit guter Benutzerführung",
        checks: [
          { title: "Mobile Responsive", status: "good", message: "Seite funktioniert gut auf allen Geräten" },
          { title: "Farbschema", status: "good", message: "Natürliche Farben passen zur Marke" },
          { title: "Typografie", status: "good", message: "Gut lesbare Schriftarten und -größen" },
          { title: "Weißraum", status: "warning", message: "Etwas mehr Luft zwischen Elementen würde helfen" }
        ]
      },
      aiVisibility: {
        score: 45,
        label: "KI-Sichtbarkeit",
        summary: "Grundlagen vorhanden, aber KI-Optimierung fehlt weitgehend",
        checks: [
          { title: "Semantische HTML-Struktur", status: "good", message: "Gute Überschriften-Hierarchie" },
          { title: "Schema.org Markup", status: "critical", message: "Keine strukturierten Daten für Produkte" },
          { title: "Entitäten-Erkennung", status: "warning", message: "Produkt-Entitäten könnten klarer definiert werden" },
          { title: "KI-freundliche Inhalte", status: "warning", message: "Inhalte könnten KI-Systemen mehr Kontext geben" }
        ]
      }
    },
    quickWins: [],
    criticalIssues: [],
    premiumInsightsPreview: [],
    measures: [],
    revenueBlockers: [
      {
        problem: "Kunden trauen der Seite nicht genug",
        whyItCostsCustomers: "Ohne Trust-Badges und Bewertungen kaufen weniger Kunden",
        action: "Trust-Badges (SSL, Trusted Shops) und Kundenbewertungen hinzufügen",
        estimatedEffort: "niedrig",
        estimatedImpact: "hoch",
        priority: 1,
        category: "Vertrauen",
        sourceCheck: "Trust-Badges fehlen"
      },
      {
        problem: "Bezahlung ist umständlich",
        whyItCostsCustomers: "Nur PayPal führt zu Abbrüchen bei Kreditkarten-Kunden",
        action: "Stripe oder ähnliche Payment-Provider mit mehr Zahlungsmethoden integrieren",
        estimatedEffort: "mittel",
        estimatedImpact: "hoch",
        priority: 2,
        category: "Klarheit",
        sourceCheck: "Eingeschränkte Zahlungsmethoden"
      },
      {
        problem: "KI-Systeme verstehen das Angebot nicht",
        whyItCostsCustomers: "Ohne Schema.org-Markup erscheint der Shop nicht in KI-Antworten",
        action: "Produkt-Schema.org-Markup für alle Produkte hinzufügen",
        estimatedEffort: "mittel",
        estimatedImpact: "mittel",
        priority: 3,
        category: "AI-Sichtbarkeit",
        sourceCheck: "Fehlende strukturierte Daten"
      }
    ]
  },

  handwerker: {
    url: "https://schreiner-meister.de",
    requestedUrl: "https://schreiner-meister.de",
    scannedAt: new Date().toISOString(),
    analysisMode: "rendered",
    finalUrl: "https://schreiner-meister.de",
    technicalNotes: ["Demo-Analyse für einen Handwerksbetrieb"],
    screenshots: {
      fullPage: "/placeholder-screenshot.svg",
      viewport: "/placeholder-screenshot.svg",
    },
    visualPreviewAvailable: true,
    visualMap: {
      pageWidth: 1440,
      pageHeight: 2400,
      viewportWidth: 1440,
      viewportHeight: 900,
      buttons: [
        { x: 120, y: 180, width: 200, height: 56, label: "Angebot anfordern" },
        { x: 340, y: 180, width: 160, height: 56, label: "Projekte ansehen" }
      ],
      headings: [
        { x: 100, y: 80, width: 580, height: 72, label: "Maßgefertigte Möbel seit 1995" },
        { x: 100, y: 400, width: 480, height: 48, label: "Unsere Leistungen" },
        { x: 100, y: 1000, width: 520, height: 56, label: "Kundenprojekte" }
      ],
      images: [
        { x: 860, y: 140, width: 420, height: 320, label: "Werkstatt-Atmosphäre" },
        { x: 120, y: 450, width: 280, height: 280, label: "Küchenmöbel" },
        { x: 420, y: 450, width: 280, height: 280, label: "Wohnzimmermöbel" }
      ],
      forms: [
        { x: 120, y: 1800, width: 540, height: 380, label: "Projekt-Anfrage" }
      ],
      links: [
        { x: 100, y: 2300, width: 120, height: 24, label: "Impressum" },
        { x: 240, y: 2300, width: 140, height: 24, label: "Datenschutz" }
      ],
    },
    isPremium: false,
    totalFindings: 15,
    visibleFindings: 8,
    overallScore: 58,
    categoryScores: {
      seo: { category: "seo", label: "SEO", score: 52 },
      performance: { category: "performance", label: "Performance", score: 68 },
      trust: { category: "trust", label: "Trust", score: 48 },
      conversion: { category: "conversion", label: "Conversion", score: 55 },
      design: { category: "design", label: "Design", score: 65 },
      aiVisibility: { category: "aiVisibility", label: "KI-Sichtbarkeit", score: 42 },
    },
    findings: [
      {
        category: "trust",
        status: "error",
        title: "Keine Bewertungen oder Referenzen",
        description: "Keine Kundenstimmen oder Projektbeispiele sichtbar",
        priority: "high"
      },
      {
        category: "conversion",
        status: "warning",
        title: "Unklare Preisspanne",
        description: "Keine Preisangaben machen es schwer, Leads zu qualifizieren",
        priority: "medium"
      }
    ],
    recommendations: [
      {
        title: "Kundenbewertungen integrieren",
        text: "Füge Google Reviews, Projektfotos und Kundenstimmen hinzu",
        description: "Soziale Bewertungen sind das wichtigste Trust-Signal für Dienstleister",
        impact: "high",
        effort: "medium",
        category: "trust",
        weight: 95
      },
      {
        title: "Preisrahmen kommunizieren",
        text: "Zeige realistische Preisspannen für verschiedene Leistungen",
        description: "Kunden wissen nicht, ob sie sich deine Dienstleistungen leisten können",
        impact: "high",
        effort: "low",
        category: "conversion",
        weight: 80
      }
    ],
    categories: {
      seo: {
        score: 52,
        label: "SEO-Grundlagen",
        summary: "Lokale SEO fehlt komplett, technische Grundlagen ausbaufähig",
        checks: [
          { title: "Lokale Suchbegriffe", status: "critical", message: "Keine lokalen Keywords in Meta-Daten" },
          { title: "Google My Business", status: "critical", message: "Kein Google My Business Eintrag verlinkt" },
          { title: "H1-Tag", status: "good", message: "Hauptüberschrift ist präsent" }
        ]
      },
      performance: {
        score: 68,
        label: "Ladeperformance",
        summary: "Akzeptable Ladezeiten, aber große Bilder verlangsamen die Seite",
        checks: [
          { title: "Ladezeit", status: "warning", message: "Etwas langsamer als optimal" },
          { title: "Bildoptimierung", status: "warning", message: "Projektfotos sind zu groß" }
        ]
      },
      trust: {
        score: 48,
        label: "Vertrauen & Sicherheit",
        summary: "Handwerksbetrieb wirkt etabliert, aber Trust-Signale fehlen",
        checks: [
          { title: "Firmenalter sichtbar", status: "good", message: "'Seit 1995' ist ein gutes Signal" },
          { title: "Kundenbewertungen", status: "critical", message: "Keine Bewertungen oder Referenzen" },
          { title: "Zertifizierungen", status: "warning", message: "Keine Handwerks-Zertifikate sichtbar" }
        ]
      },
      conversion: {
        score: 55,
        label: "Conversion-Optimierung",
        summary: "Gute Kontaktaufnahme, aber Lead-Qualifizierung könnte besser sein",
        checks: [
          { title: "Kontaktformular", status: "good", message: "Ausführliches Anfrageformular vorhanden" },
          { title: "Telefonnummer", status: "good", message: "Telefonnummer prominent platziert" },
          { title: "Preisangaben", status: "critical", message: "Keine Preisinformationen vorhanden" }
        ]
      },
      design: {
        score: 65,
        label: "Design & UX",
        summary: "Solides Handwerks-Design, aber könnte moderner wirken",
        checks: [
          { title: "Mobile Optimierung", status: "warning", message: "Auf Mobile etwas eng" },
          { title: "Farbschema", status: "good", message: "Holzfarben passen zur Branche" }
        ]
      },
      aiVisibility: {
        score: 42,
        label: "KI-Sichtbarkeit",
        summary: "Lokaler Dienstleister braucht dringend Local SEO und Schema.org",
        checks: [
          { title: "LocalBusiness Schema", status: "critical", message: "Kein LocalBusiness Markup" },
          { title: "Öffnungszeiten", status: "warning", message: "Keine strukturierten Öffnungszeiten" },
          { title: "Dienstleistungs-Schema", status: "critical", message: "Keine Dienstleistungs-Entitäten definiert" }
        ]
      }
    },
    quickWins: [],
    criticalIssues: [],
    premiumInsightsPreview: [],
    measures: [],
    revenueBlockers: [
      {
        problem: "Kunden finden den Betrieb nicht online",
        whyItCostsCustomers: "Ohne Local SEO und Google My Business bleiben Anfragen aus",
        action: "Google My Business optimieren und lokale Keywords integrieren",
        estimatedEffort: "mittel",
        estimatedImpact: "hoch",
        priority: 1,
        category: "Vertrauen",
        sourceCheck: "Lokale Sichtbarkeit fehlt"
      },
      {
        problem: "Keine sozialen Beweise",
        whyItCostsCustomers: "Ohne Bewertungen und Referenzen trauen Kunden dem Handwerker nicht",
        action: "Kundenbewertungen, Projektfotos und Referenzen hinzufügen",
        estimatedEffort: "niedrig",
        estimatedImpact: "hoch",
        priority: 2,
        category: "Vertrauen",
        sourceCheck: "Keine Bewertungen"
      },
      {
        problem: "Unklare Preisvorstellungen",
        whyItCostsCustomers: "Kunden zögern bei Anfragen, wenn sie keine Preisrahmen kennen",
        action: "Preisspannen für verschiedene Leistungen kommunizieren",
        estimatedEffort: "niedrig",
        estimatedImpact: "mittel",
        priority: 3,
        category: "Klarheit",
        sourceCheck: "Keine Preisangaben"
      }
    ]
  },

  restaurant: {
    url: "https://feinkost-paradies.de",
    requestedUrl: "https://feinkost-paradies.de",
    scannedAt: new Date().toISOString(),
    analysisMode: "rendered",
    finalUrl: "https://feinkost-paradies.de",
    technicalNotes: ["Demo-Analyse für ein lokales Restaurant/Feinkostladen"],
    screenshots: {
      fullPage: "/placeholder-screenshot.svg",
      viewport: "/placeholder-screenshot.svg",
    },
    visualPreviewAvailable: true,
    visualMap: {
      pageWidth: 1440,
      pageHeight: 2600,
      viewportWidth: 1440,
      viewportHeight: 900,
      buttons: [
        { x: 120, y: 180, width: 220, height: 56, label: "Tisch reservieren" },
        { x: 360, y: 180, width: 180, height: 56, label: "Speisekarte" },
        { x: 120, y: 650, width: 160, height: 48, label: "Jetzt bestellen" }
      ],
      headings: [
        { x: 100, y: 80, width: 640, height: 72, label: "Feinkost & mediterrane Küche" },
        { x: 100, y: 400, width: 480, height: 48, label: "Tägliche Spezialitäten" },
        { x: 100, y: 1200, width: 520, height: 56, label: "Unser Restaurant" }
      ],
      images: [
        { x: 860, y: 140, width: 420, height: 320, label: "Restaurant-Atmosphäre" },
        { x: 120, y: 450, width: 280, height: 280, label: "Frische Salate" },
        { x: 420, y: 450, width: 280, height: 280, label: "Pasta Gerichte" }
      ],
      forms: [
        { x: 120, y: 2000, width: 540, height: 320, label: "Reservierungsformular" }
      ],
      links: [
        { x: 100, y: 2450, width: 120, height: 24, label: "Impressum" },
        { x: 240, y: 2450, width: 140, height: 24, label: "Datenschutz" },
        { x: 400, y: 2450, width: 100, height: 24, label: "Kontakt" }
      ],
    },
    isPremium: false,
    totalFindings: 14,
    visibleFindings: 8,
    overallScore: 62,
    categoryScores: {
      seo: { category: "seo", label: "SEO", score: 55 },
      performance: { category: "performance", label: "Performance", score: 70 },
      trust: { category: "trust", label: "Trust", score: 58 },
      conversion: { category: "conversion", label: "Conversion", score: 59 },
      design: { category: "design", label: "Design", score: 72 },
      aiVisibility: { category: "aiVisibility", label: "KI-Sichtbarkeit", score: 48 },
    },
    findings: [
      {
        category: "seo",
        status: "error",
        title: "Google My Business fehlt",
        description: "Kein Google My Business Eintrag für lokale Sichtbarkeit",
        priority: "high"
      },
      {
        category: "aiVisibility",
        status: "warning",
        title: "Keine Öffnungszeiten-Struktur",
        description: "Öffnungszeiten nicht als strukturierte Daten verfügbar",
        priority: "medium"
      }
    ],
    recommendations: [
      {
        title: "Google My Business optimieren",
        text: "Erstelle und optimiere deinen Google My Business Eintrag vollständig",
        description: "Lokale Sichtbarkeit ist entscheidend für Restaurant-Buchungen",
        impact: "high",
        effort: "medium",
        category: "seo",
        weight: 90
      },
      {
        title: "Online-Reservierung vereinfachen",
        text: "Füge eine einfache Reservierungsfunktion mit Kalender hinzu",
        description: "Kunden erwarten heute einfache Online-Buchungen",
        impact: "high",
        effort: "high",
        category: "conversion",
        weight: 85
      }
    ],
    categories: {
      seo: {
        score: 55,
        label: "SEO-Grundlagen",
        summary: "Lokale SEO fehlt komplett, aber Grundlagen sind okay",
        checks: [
          { title: "Lokale Keywords", status: "critical", message: "Keine lokalen Suchbegriffe verwendet" },
          { title: "Google My Business", status: "critical", message: "Kein GMB-Eintrag vorhanden" },
          { title: "Meta-Description", status: "good", message: "Beschreibung enthält wichtige Infos" }
        ]
      },
      performance: {
        score: 70,
        label: "Ladeperformance",
        summary: "Solide Ladezeiten, aber Speisekarten-Bilder könnten schneller laden",
        checks: [
          { title: "Ladezeit", status: "good", message: "Unter 2 Sekunden - sehr gut" },
          { title: "Bildoptimierung", status: "warning", message: "Speisekarten-Fotos zu groß" }
        ]
      },
      trust: {
        score: 58,
        label: "Vertrauen & Sicherheit",
        summary: "Gute Grundlagen, aber Bewertungen könnten prominenter sein",
        checks: [
          { title: "Kontaktinformationen", status: "good", message: "Adresse und Telefon klar ersichtlich" },
          { title: "Öffnungszeiten", status: "good", message: "Öffnungszeiten gut sichtbar" },
          { title: "Bewertungen", status: "warning", message: "Bewertungen könnten prominenter platziert werden" }
        ]
      },
      conversion: {
        score: 59,
        label: "Conversion-Optimierung",
        summary: "Gute Reservierungsoptionen, aber Bestellprozess könnte einfacher sein",
        checks: [
          { title: "Reservierungs-CTA", status: "good", message: "Tischreservierung gut sichtbar" },
          { title: "Online-Bestellung", status: "warning", message: "Bestellprozess könnte einfacher sein" },
          { title: "Liefergebiet", status: "warning", message: "Lieferradius nicht klar kommuniziert" }
        ]
      },
      design: {
        score: 72,
        label: "Design & UX",
        summary: "Appetitliches Design mit guter Bildsprache",
        checks: [
          { title: "Mobile Optimierung", status: "good", message: "Speisekarte funktioniert gut auf Mobile" },
          { title: "Bildqualität", status: "good", message: "Hochwertige Food-Fotografie" },
          { title: "Farbschema", status: "good", message: "Mediterrane Farben passen perfekt" }
        ]
      },
      aiVisibility: {
        score: 48,
        label: "KI-Sichtbarkeit",
        summary: "Restaurant braucht dringend LocalBusiness und Menu Schema",
        checks: [
          { title: "Restaurant Schema", status: "critical", message: "Kein Restaurant/LocalBusiness Markup" },
          { title: "Menu Schema", status: "critical", message: "Keine strukturierten Speisekarten-Daten" },
          { title: "Öffnungszeiten Schema", status: "warning", message: "Öffnungszeiten nicht strukturiert" },
          { title: "Adress-Struktur", status: "warning", message: "Adresse könnte als strukturierte Daten vorliegen" }
        ]
      }
    },
    quickWins: [],
    criticalIssues: [],
    premiumInsightsPreview: [],
    measures: [],
    revenueBlockers: [
      {
        problem: "Kunden finden das Restaurant nicht",
        whyItCostsCustomers: "Ohne Google My Business und lokale SEO bleiben Reservierungen aus",
        action: "Google My Business vollständig einrichten und lokale Keywords optimieren",
        estimatedEffort: "mittel",
        estimatedImpact: "hoch",
        priority: 1,
        category: "Vertrauen",
        sourceCheck: "Lokale Sichtbarkeit fehlt"
      },
      {
        problem: "Online-Reservierung ist umständlich",
        whyItCostsCustomers: "Komplizierte Buchungsprozesse führen zu Abbrüchen",
        action: "Einfache Online-Reservierung mit Kalender und Zeitwahl implementieren",
        estimatedEffort: "hoch",
        estimatedImpact: "hoch",
        priority: 2,
        category: "Klarheit",
        sourceCheck: "Reservierungsprozess"
      },
      {
        problem: "KI-Systeme kennen das Restaurant nicht",
        whyItCostsCustomers: "Ohne Schema.org erscheint das Restaurant nicht in KI-Empfehlungen",
        action: "Restaurant-Schema und strukturierte Öffnungszeiten hinzufügen",
        estimatedEffort: "mittel",
        estimatedImpact: "mittel",
        priority: 3,
        category: "AI-Sichtbarkeit",
        sourceCheck: "Fehlende Schema-Daten"
      }
    ]
  }
};
