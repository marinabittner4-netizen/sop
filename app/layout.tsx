import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pflegebox Konfigurator',
  description: 'Pflegebox Konfigurator mit Kundenanlage & Bestellungen',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body>
        <header className="header">
          <div className="headerInner">
            <div className="row" style={{alignItems:'flex-end'}}>
              <div>
                <h1 className="h1">Pflegebox Konfigurator</h1>
                <p className="sub">4 Schritte • Kunden werden automatisch angelegt • Bestellungen werden gespeichert</p>
              </div>
              <a className="badge" href="/admin">Admin</a>
            </div>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
