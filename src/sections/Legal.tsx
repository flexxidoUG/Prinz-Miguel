import { useEffect, useState } from 'react';
import { api, type PublicData } from '../api';

export default function Legal({ kind }: { kind: 'impressum' | 'datenschutz' }) {
  const [text, setText] = useState('');
  useEffect(() => {
    document.title = kind === 'impressum' ? 'Impressum' : 'Datenschutzerklärung';
    api<PublicData>('/api/public').then((d) => setText(d.content.legal[kind])).catch(() => setText('Inhalt konnte nicht geladen werden.'));
  }, [kind]);
  return (
    <main className="legal">
      <a href="/" className="pill">← Zurück zur Startseite</a>
      <h1 className="section-title">{kind === 'impressum' ? 'Impressum' : 'Datenschutz'}</h1>
      {text.split(/\n{2,}/).map((block, i) => (
        <p key={i}>{block.split('\n').map((l, j) => <span key={j}>{l}<br /></span>)}</p>
      ))}
    </main>
  );
}
