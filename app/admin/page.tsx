'use client';

import { useEffect, useMemo, useState } from 'react';

type Customer = {
  id: string;
  first_name: string;
  last_name: string;
  dob: string;
  zip: string;
  city: string;
  insurance_type: string;
  insurance_name: string;
  care_grade: string | null;
  beihilfe_percent: number | null;
  updated_at: string;
  created_at: string;
};

type Order = {
  id: string;
  order_number: string;
  created_at: string;
  month_key: string;
  total: number;
  budget_max: number;
  status: string;
  customer_id: string;
};

function money(n: number){
  return new Intl.NumberFormat('de-DE', { style:'currency', currency:'EUR' }).format(n);
}

export default function AdminPage() {
  const [pw, setPw] = useState('');
  const [authError, setAuthError] = useState('');
  const [authed, setAuthed] = useState(false);

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [loading, setLoading] = useState(false);

  async function login() {
    setAuthError('');
    setLoading(true);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ password: pw }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data?.error || 'Login fehlgeschlagen');
      setAuthed(true);
      await refresh();
    } catch (e: any) {
      setAuthError(e?.message || 'Fehler');
    } finally {
      setLoading(false);
    }
  }

  async function refresh() {
    setLoading(true);
    try {
      const c = await fetch('/api/admin/customers');
      const cd = await c.json();
      if (!c.ok || !cd.ok) throw new Error(cd?.error || 'Kunden konnten nicht geladen werden');
      setCustomers(cd.data || []);

      const o = await fetch('/api/admin/orders' + (selectedCustomerId ? `?customerId=${encodeURIComponent(selectedCustomerId)}` : ''));
      const od = await o.json();
      if (!o.ok || !od.ok) throw new Error(od?.error || 'Bestellungen konnten nicht geladen werden');
      setOrders(od.data || []);

      setAuthed(true);
    } catch (e: any) {
      // If unauthorized, show login
      if ((e?.message || '').toLowerCase().includes('unauthorized')) {
        setAuthed(false);
      }
      setAuthError(e?.message || 'Fehler');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // try load without login (maybe cookie already set)
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (authed) refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCustomerId]);

  const selectedCustomer = useMemo(
    () => customers.find(c => c.id === selectedCustomerId) || null,
    [customers, selectedCustomerId]
  );

  return (
    <main className="container">
      <div className="card">
        <div className="row">
          <h2 style={{margin:0}}>Admin</h2>
          <a className="badge" href="/">← Konfigurator</a>
        </div>

        {!authed ? (
          <>
            <p className="notice">Bitte Admin-Passwort eingeben.</p>
            <div className="row" style={{gap:10, flexWrap:'wrap'}}>
              <input className="input" style={{maxWidth:320}} type="password" value={pw} onChange={e=>setPw(e.target.value)} placeholder="Admin Passwort" />
              <button className="btn btnPrimary" onClick={login} disabled={loading || !pw}>Login</button>
            </div>
            {authError ? <p className="notice" style={{color:'var(--danger)'}}>{authError}</p> : null}
          </>
        ) : (
          <>
            <div className="hr" />
            <div className="row" style={{flexWrap:'wrap'}}>
              <button className="btn" onClick={refresh} disabled={loading}>Aktualisieren</button>
              <div className="row" style={{gap:8}}>
                <span className="badge">Filter Kunde</span>
                <select className="input" style={{maxWidth:360}} value={selectedCustomerId} onChange={e=>setSelectedCustomerId(e.target.value)}>
                  <option value="">Alle</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.last_name}, {c.first_name} ({c.dob})</option>
                  ))}
                </select>
              </div>
            </div>

            {authError ? <p className="notice" style={{color:'var(--danger)', marginTop:10}}>{authError}</p> : null}

            <div className="hr" />

            <h3 style={{marginTop:0}}>Kunden</h3>
            {customers.length ? (
              <table className="table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Geb.</th>
                    <th>Ort</th>
                    <th>Vers.</th>
                    <th>PG</th>
                    <th>Update</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.slice(0, 50).map(c => (
                    <tr key={c.id} style={{cursor:'pointer'}} onClick={()=>setSelectedCustomerId(c.id)}>
                      <td><b>{c.last_name}</b>, {c.first_name}</td>
                      <td>{c.dob}</td>
                      <td>{c.zip} {c.city}</td>
                      <td>{c.insurance_type}: {c.insurance_name}</td>
                      <td>{c.care_grade ?? '—'}</td>
                      <td>{new Date(c.updated_at || c.created_at).toLocaleString('de-DE')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="notice">Noch keine Kunden gespeichert.</p>
            )}

            <div className="hr" />

            <h3 style={{marginTop:0}}>Bestellungen {selectedCustomer ? `für ${selectedCustomer.last_name}` : ''}</h3>
            {orders.length ? (
              <table className="table">
                <thead>
                  <tr>
                    <th>Bestellnr.</th>
                    <th>Datum</th>
                    <th>Monat</th>
                    <th>Summe</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map(o => (
                    <tr key={o.id}>
                      <td><b>{o.order_number}</b></td>
                      <td>{new Date(o.created_at).toLocaleString('de-DE')}</td>
                      <td>{o.month_key}</td>
                      <td>{money(o.total)}</td>
                      <td>{o.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="notice">Keine Bestellungen gefunden.</p>
            )}
          </>
        )}
      </div>
    </main>
  );
}
