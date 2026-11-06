// Default site content. Every text here is editable in the admin panel.
// Fields marked with "PLATZHALTER" in the admin hints contain no personal data and must be replaced by the team.
export const defaultContent = {
  site: {
    title: 'Kinderprinz Miguel I. · Laura & Louisa',
    sessionLabel: 'Session 2026/27',
    allowIndexing: false, // minors on the page: search engines are off until the admin explicitly enables them
    photoConsentConfirmed: false,
  },
  media: {
    group: '/uploads/group.webp',
    miguel: '/uploads/miguel.jpg',
    laura: '/uploads/laura.webp',
    louisa: '/uploads/louisa.webp',
    scepterRef: '/uploads/scepter.webp',
    audio: '/uploads/show.mp3',
    scepterModel: '', // optional .glb – replaces the procedural 3D scepter when set
  },
  hero: {
    lines: ['Ein kleiner Prinz.', 'Zwei wunderbare Paginnen.', 'Eine unvergessliche Session.'],
    welcome: 'Willkommen in der närrisch-königlichen Welt von Kinderprinz Miguel I., Laura & Louisa.',
    autoplay: true,
    playOncePerVisit: false,
    // Cue points in seconds, measured from the supplied MP3 (speech transcription).
    cues: { miguel: 21.4, paginnen: 23.4, laura: 26.6, louisa: 27.3, konfetti: 30.1, dreimal: 33.2, alaaf: 34.5 },
  },
  team: [
    {
      key: 'miguel',
      title: 'Kinderprinz',
      name: 'Miguel I.',
      motto: 'Mit königlichem Glanz und ganz viel Herz!',
      text: 'Als Kinderprinz führt Miguel I. die kleinen und großen Jecken durch die Session – mit Zepter, Pritsche und einem kräftigen Alaaf.',
      facts: [
        { label: 'Rolle', value: 'Kinderprinz' },
        { label: 'Session', value: '2026/27' },
        { label: 'Lieblingsruf', value: 'Dreimal kräftig: Alaaf!' },
      ],
    },
    {
      key: 'laura',
      title: 'Pagin',
      name: 'Laura',
      motto: 'Lasst die Herzen höher schlagen!',
      text: 'Als Pagin steht Laura dem Kinderprinzen zur Seite – bei jedem Auftritt, jedem Orden und jedem Tanz.',
      facts: [
        { label: 'Rolle', value: 'Pagin' },
        { label: 'Session', value: '2026/27' },
      ],
    },
    {
      key: 'louisa',
      title: 'Pagin',
      name: 'Louisa',
      motto: 'Lasst das Konfetti fliegen!',
      text: 'Als Pagin begleitet Louisa den Kinderprinzen durch die fünfte Jahreszeit und bringt die Säle zum Strahlen.',
      facts: [
        { label: 'Rolle', value: 'Pagin' },
        { label: 'Session', value: '2026/27' },
      ],
    },
  ],
  scepter: {
    intro: 'Das Zepter des Kinderprinzen – Zeichen der närrischen Regentschaft.',
    motto: { kicker: 'Unser Karnevalsmotto', text: 'Mit königlichem Glanz und ganz viel Herz' },
    session: {
      kicker: 'Unsere Session',
      title: 'Session 2026/27',
      text: 'Vom 11.11. bis Aschermittwoch ist das Prinzenteam unterwegs: Sitzungen, Empfänge, Kindergärten, Schulen und natürlich der große Zug.',
      items: [
        { label: 'Sessionsbeginn', value: '11.11.2026, 11:11 Uhr' },
        { label: 'Weiberfastnacht', value: '11.02.2027' },
        { label: 'Rosenmontag', value: '15.02.2027' },
      ],
    },
    team: { kicker: 'Unser Prinzenteam', text: 'Ein Prinz, zwei Paginnen – ein Herz für den Kinderkarneval.' },
  },
  finale: {
    kicker: 'Dreimal kräftig',
    text: 'Alaaf!',
  },
  legal: {
    impressum:
      'Angaben gemäß § 5 DDG\n\n[PLATZHALTER – bitte im Admin-Panel ausfüllen]\nVerein / verantwortliche Person\nStraße Hausnummer\nPLZ Ort\n\nKontakt\nE-Mail: [bitte ergänzen]\n\nVerantwortlich für den Inhalt nach § 18 Abs. 2 MStV\n[Name, Anschrift]',
    datenschutz:
      'Datenschutzerklärung\n\n1. Verantwortlicher\n[PLATZHALTER – Name und Anschrift wie im Impressum]\n\n2. Hosting und Server-Logfiles\nBeim Aufruf dieser Webseite verarbeitet der Webserver technisch notwendige Daten (IP-Adresse, Zeitpunkt, aufgerufene Seite, Browsertyp). Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO (sicherer Betrieb). [Hoster und Speicherdauer bitte ergänzen.]\n\n3. Keine Tracking- und Analysedienste\nDiese Webseite verwendet keine Tracking-, Analyse- oder Werbedienste. Schriftarten werden lokal ausgeliefert, es werden keine externen Inhalte nachgeladen.\n\n4. Cookies\nEs wird ausschließlich für angemeldete Administratoren ein technisch notwendiges Sitzungs-Cookie gesetzt.\n\n5. Gästebuch\nWenn Sie einen Gruß hinterlassen, speichern wir Ihren Namen, Ihre Nachricht und den Zeitpunkt. Zum Schutz vor Missbrauch wird Ihre IP-Adresse ausschließlich gekürzt und gehasht gespeichert und nach 30 Tagen gelöscht. Einträge werden erst nach Prüfung veröffentlicht. Rechtsgrundlage ist Ihre Einwilligung (Art. 6 Abs. 1 lit. a DSGVO), die Sie jederzeit widerrufen können. Auf Wunsch löschen wir Ihren Eintrag.\n\n6. Fotos von Kindern\nDie Fotos des Prinzenteams werden mit Einwilligung der Erziehungsberechtigten veröffentlicht.\n\n7. Ihre Rechte\nSie haben das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung, Datenübertragbarkeit und Widerspruch sowie ein Beschwerderecht bei einer Aufsichtsbehörde.',
  },
};

export const seedEvents = [
  { date: '2026-11-11T11:11', title: 'Sessionseröffnung', location: '[PLATZHALTER] Rathausplatz', description: 'Beispieltermin – bitte im Admin-Panel anpassen oder löschen.', link: '' },
  { date: '2026-11-21T15:00', title: 'Proklamation des Kinderprinzenpaares', location: '[PLATZHALTER] Stadthalle', description: 'Beispieltermin – bitte im Admin-Panel anpassen oder löschen.', link: '' },
  { date: '2027-01-16T14:30', title: 'Große Kindersitzung', location: '[PLATZHALTER] Festsaal', description: '', link: '' },
  { date: '2027-02-14T13:00', title: 'Kinderzug', location: '[PLATZHALTER] Innenstadt', description: '', link: '' },
];
