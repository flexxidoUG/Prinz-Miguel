import { db, hashPassword } from './db.js';
const [user, pw] = process.argv.slice(2);
if (!user || !pw || pw.length < 12) {
  console.error('Aufruf: npm run create-admin -- <benutzername> <passwort mit mind. 12 Zeichen>');
  process.exit(1);
}
db.prepare('insert into users(username,password_hash) values(?,?) on conflict(username) do update set password_hash=excluded.password_hash').run(user, hashPassword(pw));
console.log(`Admin "${user}" gespeichert.`);
