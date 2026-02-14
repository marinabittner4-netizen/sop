'use client';

import { useMemo, useState } from 'react';
import { CATALOG } from '@/lib/catalog';

type CartLine = {
  productId: string;
  name: string;
  category: string;
  unitPrice: number;
  quantity: number;
  size?: string | null;
};

type CustomerForm = {
  firstName: string;
  lastName: string;
  dob: string;
  street: string;
  zip: string;
  city: string;
  phone: string;
  email: string;
  insuranceType: 'gesetzlich' | 'privat';
  insuranceName: string;
  careGrade: '1'|'2'|'3'|'4'|'5'|'';
  beihilfePercent: 0|50|70|80;
  legalRepPresent: boolean;
  legalRepName: string;
};

const BUDGET_MAX = 42;

function money(n: number){
  return new Intl.NumberFormat('de-DE', { style:'currency', currency:'EUR' }).format(n);
}

export default function Page() {
  const [step, setStep] = useState<1|2|3|4>(1);
  const [careRequired, setCareRequired] = useState<'1'|'2'|'3'|'4'|'5'|''>('');

  const [cart, setCart] = useState<CartLine[]>([]);

  const [customer, setCustomer] = useState<CustomerForm>({
    firstName:'', lastName:'', dob:'', street:'', zip:'', city:'', phone:'', email:'',
    insuranceType:'gesetzlich', insuranceName:'',
    careGrade:'', beihilfePercent:0,
    legalRepPresent:false, legalRepName:''
  });

  const total = useMemo(() => cart.reduce((s,l) => s + l.unitPrice*l.quantity, 0), [cart]);
  const remaining = Math.round((BUDGET_MAX - total) * 100) / 100;

  const canAddMore = remaining > 0.0001;

  function upsert(productId: string, patch: Partial<CartLine>) {
    setCart(prev => {
      const idx = prev.findIndex(x => x.productId === productId && (x.size ?? null) === (patch.size ?? null));
      if (idx === -1) {
        const base = CATALOG.find(c => c.productId === productId);
        if (!base) return prev;
        const newLine: CartLine = {
          productId,
          name: base.name,
          category: base.category,
          unitPrice: base.unitPrice,
          quantity: 1,
          size: patch.size ?? null
        };
        const next = [...prev, { ...newLine, ...patch }];
        return next;
      }
      const next = [...prev];
      next[idx] = { ...next[idx], ...patch };
      return next;
    });
  }

  function setQty(line: CartLine, qty: number){
    if (qty <= 0) {
      setCart(prev => prev.filter(x => !(x.productId===line.productId && (x.size ?? null)===(line.size ?? null))));
      return;
    }
    setCart(prev => prev.map(x => (x.productId===line.productId && (x.size ?? null)===(line.size ?? null)) ? { ...x, quantity: qty } : x));
  }

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string>('');
  const [submitResult, setSubmitResult] = useState<{orderNumber:string, createdAt:string} | null>(null);

  async function submit(){
    setSubmitError('');
    setSubmitting(true);
    try {
      const payload = {
        customer: {
          ...customer,
          careGrade: (customer.careGrade || careRequired) as any,
        },
        order: {
          monthKey: new Date().toISOString().slice(0,7),
          total: Math.round(total*100)/100,
          budgetMax: BUDGET_MAX,
          items: cart.map(c => ({
            productId: c.productId,
            name: c.name,
            category: c.category,
            unitPrice: c.unitPrice,
            quantity: c.quantity,
            size: c.size ?? null,
          }))
        }
      };

      const res = await fetch('/api/submit', { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data?.error || 'Fehler beim Speichern');
      setSubmitResult({ orderNumber: data.orderNumber, createdAt: data.createdAt });
      setStep(4);
    } catch (e:any) {
      setSubmitError(e?.message || 'Fehler');
    } finally {
      setSubmitting(false);
    }
  }

  const stepOk1 = careRequired !== '';
  const stepOk2 = cart.length > 0 && total <= BUDGET_MAX + 1e-6;
  const stepOk3 = customer.firstName && customer.lastName && customer.dob && customer.street && customer.zip && customer.city && customer.insuranceName;

  return (
    <main className="container">
      <div className="stepper" style={{marginBottom:12}}>
        <span className={`step ${step===1 ? 'stepActive':''}`}>1 • Pflegegrad</span>
        <span className={`step ${step===2 ? 'stepActive':''}`}>2 • Produkte</span>
        <span className={`step ${step===3 ? 'stepActive':''}`}>3 • Kundendaten</span>
        <span className={`step ${step===4 ? 'stepActive':''}`}>4 • Fertig</span>
      </div>

      <div className="grid">
        <section className="card">
          {step === 1 && (
            <>
              <h2 style={{marginTop:0}}>Schritt 1: Pflegegrad auswählen</h2>
              <p className="notice">Ohne Pflegegrad kannst du nicht weiter. Budget ist fix auf <b>{money(BUDGET_MAX)}</b>.</p>

              <div className="hr" />

              <div className="row" style={{flexWrap:'wrap'}}>
                {(['1','2','3','4','5'] as const).map(pg => (
                  <button
                    key={pg}
                    className={`btn ${careRequired===pg ? 'btnPrimary':''}`}
                    onClick={() => setCareRequired(pg)}
                    type="button"
                  >
                    Pflegegrad {pg}
                  </button>
                ))}
              </div>

              <div className="hr" />

              <button
                className="btn btnPrimary"
                disabled={!stepOk1}
                onClick={() => setStep(2)}
                type="button"
              >Weiter</button>
            </>
          )}

          {step === 2 && (
            <>
              <h2 style={{marginTop:0}}>Schritt 2: Produkte auswählen</h2>
              <p className="notice">Budget-Limit aktiv: Wenn du über {money(BUDGET_MAX)} kommst, kannst du nichts Weiteres auswählen.</p>

              <div className="hr" />

              <div style={{display:'grid', gap:10}}>
                {CATALOG.map(item => {
                  const inCart = cart.filter(c => c.productId === item.productId);
                  const disabled = !canAddMore && inCart.length === 0;

                  return (
                    <div key={item.productId} className="card" style={{padding:12}}>
                      <div className="row">
                        <div>
                          <div style={{fontWeight:800}}>{item.name}</div>
                          <div className="notice">{item.category} • {money(item.unitPrice)}</div>
                        </div>
                        <button
                          className="btn btnPrimary"
                          disabled={disabled}
                          onClick={() => {
                            if (item.sizes && item.sizes.length) {
                              // default first size
                              upsert(item.productId, { size: item.sizes[0], quantity: 1 });
                            } else {
                              upsert(item.productId, { quantity: 1 });
                            }
                          }}
                          type="button"
                        >
                          + Hinzufügen
                        </button>
                      </div>

                      {item.sizes?.length ? (
                        <div style={{marginTop:10}}>
                          <div className="label">Größe (falls du mehrere Größen brauchst, füge das Produkt mehrfach hinzu)</div>
                          <div className="row" style={{flexWrap:'wrap'}}>
                            {item.sizes.map(sz => (
                              <button
                                key={sz}
                                className="btn"
                                type="button"
                                onClick={() => upsert(item.productId, { size: sz, quantity: 1 })}
                                disabled={!canAddMore && !inCart.some(x => x.size===sz)}
                              >
                                {sz}
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : null}

                      {inCart.length ? (
                        <div style={{marginTop:10}}>
                          {inCart.map((line, i) => (
                            <div key={`${line.productId}-${line.size ?? 'nosize'}-${i}`} className="row" style={{marginTop:6}}>
                              <div className="notice">Auswahl: <b>{line.size ? `Größe ${line.size}` : 'Standard'}</b></div>
                              <div className="row" style={{gap:6}}>
                                <button className="btn" type="button" onClick={() => setQty(line, line.quantity - 1)}>-</button>
                                <span className="badge">{line.quantity}</span>
                                <button
                                  className="btn"
                                  type="button"
                                  onClick={() => {
                                    const nextTotal = total + line.unitPrice;
                                    if (nextTotal <= BUDGET_MAX + 1e-6) setQty(line, line.quantity + 1);
                                  }}
                                  disabled={(total + line.unitPrice) > BUDGET_MAX + 1e-6}
                                >+
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>

              <div className="hr" />

              <div className="row" style={{flexWrap:'wrap'}}>
                <button className="btn" onClick={() => setStep(1)} type="button">Zurück</button>
                <button className="btn btnPrimary" disabled={!stepOk2} onClick={() => setStep(3)} type="button">Weiter</button>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <h2 style={{marginTop:0}}>Schritt 3: Kundendaten</h2>
              <p className="notice">Nach dem Absenden wird der Kunde automatisch angelegt/aktualisiert und die Bestellung gespeichert.</p>

              <div className="hr" />

              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12}}>
                <div>
                  <div className="label">Vorname*</div>
                  <input className="input" value={customer.firstName} onChange={e=>setCustomer(s=>({...s, firstName:e.target.value}))} />
                </div>
                <div>
                  <div className="label">Nachname*</div>
                  <input className="input" value={customer.lastName} onChange={e=>setCustomer(s=>({...s, lastName:e.target.value}))} />
                </div>
                <div>
                  <div className="label">Geburtsdatum*</div>
                  <input className="input" type="date" value={customer.dob} onChange={e=>setCustomer(s=>({...s, dob:e.target.value}))} />
                </div>
                <div>
                  <div className="label">Telefon</div>
                  <input className="input" value={customer.phone} onChange={e=>setCustomer(s=>({...s, phone:e.target.value}))} />
                </div>
                <div style={{gridColumn:'1 / -1'}}>
                  <div className="label">Straße + Hausnr.*</div>
                  <input className="input" value={customer.street} onChange={e=>setCustomer(s=>({...s, street:e.target.value}))} />
                </div>
                <div>
                  <div className="label">PLZ*</div>
                  <input className="input" value={customer.zip} onChange={e=>setCustomer(s=>({...s, zip:e.target.value}))} />
                </div>
                <div>
                  <div className="label">Ort*</div>
                  <input className="input" value={customer.city} onChange={e=>setCustomer(s=>({...s, city:e.target.value}))} />
                </div>
                <div>
                  <div className="label">Versicherung*</div>
                  <select className="input" value={customer.insuranceType} onChange={e=>setCustomer(s=>({...s, insuranceType: e.target.value as any}))}>
                    <option value="gesetzlich">gesetzlich</option>
                    <option value="privat">privat</option>
                  </select>
                </div>
                <div>
                  <div className="label">Krankenkasse / Versicherung*</div>
                  <input className="input" value={customer.insuranceName} onChange={e=>setCustomer(s=>({...s, insuranceName:e.target.value}))} />
                </div>
                <div>
                  <div className="label">Pflegegrad (wird aus Schritt 1 übernommen)</div>
                  <select className="input" value={customer.careGrade || careRequired} onChange={e=>setCustomer(s=>({...s, careGrade: e.target.value as any}))}>
                    <option value="">—</option>
                    {(['1','2','3','4','5'] as const).map(pg => (<option key={pg} value={pg}>Pflegegrad {pg}</option>))}
                  </select>
                </div>
                <div>
                  <div className="label">Beihilfe (optional)</div>
                  <select className="input" value={customer.beihilfePercent} onChange={e=>setCustomer(s=>({...s, beihilfePercent: Number(e.target.value) as any}))}>
                    <option value={0}>nein</option>
                    <option value={50}>50%</option>
                    <option value={70}>70%</option>
                    <option value={80}>80%</option>
                  </select>
                </div>
              </div>

              <div className="hr" />

              <label style={{display:'flex', gap:10, alignItems:'center'}}>
                <input type="checkbox" checked={customer.legalRepPresent} onChange={e=>setCustomer(s=>({...s, legalRepPresent: e.target.checked}))} />
                Gesetzlicher Vertreter vorhanden
              </label>
              {customer.legalRepPresent ? (
                <div style={{marginTop:10}}>
                  <div className="label">Name gesetzl. Vertreter</div>
                  <input className="input" value={customer.legalRepName} onChange={e=>setCustomer(s=>({...s, legalRepName:e.target.value}))} />
                </div>
              ) : null}

              {submitError ? (
                <p className="notice" style={{color:'var(--danger)', marginTop:12}}>{submitError}</p>
              ) : null}

              <div className="hr" />

              <div className="row" style={{flexWrap:'wrap'}}>
                <button className="btn" onClick={() => setStep(2)} type="button">Zurück</button>
                <button className="btn btnPrimary" disabled={!stepOk3 || submitting} onClick={submit} type="button">
                  {submitting ? 'Speichere…' : 'Bestellung speichern'}
                </button>
              </div>
            </>
          )}

          {step === 4 && (
            <>
              <h2 style={{marginTop:0}}>Schritt 4: Fertig ✅</h2>
              {submitResult ? (
                <>
                  <p className="notice">Bestellung gespeichert. Bestellnummer: <b>{submitResult.orderNumber}</b></p>
                  <p className="notice">Zeitpunkt: {new Date(submitResult.createdAt).toLocaleString('de-DE')}</p>
                </>
              ) : (
                <p className="notice">Wenn du hier landest ohne Bestellnummer, war wahrscheinlich kein Speichern aktiv.</p>
              )}
              <div className="hr" />
              <div className="row" style={{flexWrap:'wrap'}}>
                <button className="btn" type="button" onClick={() => {
                  setStep(1);
                  setCart([]);
                  setCustomer(s => ({...s, firstName:'', lastName:'', dob:'', street:'', zip:'', city:'', phone:'', email:'', insuranceName:'', legalRepPresent:false, legalRepName:''}));
                  setSubmitResult(null);
                  setSubmitError('');
                }}>Neue Bestellung</button>
                <a className="btn btnPrimary" href="/admin">Zum Admin-Bereich</a>
              </div>
            </>
          )}
        </section>

        <aside className="card">
          <h3 style={{marginTop:0}}>Zusammenfassung</h3>
          <div className="row">
            <span className="badge">Budget</span>
            <b>{money(BUDGET_MAX)}</b>
          </div>
          <div className="row" style={{marginTop:8}}>
            <span className="badge">Summe</span>
            <b>{money(total)}</b>
          </div>
          <div className="row" style={{marginTop:8}}>
            <span className="badge">Rest</span>
            <b style={{color: remaining < 0 ? 'var(--danger)' : 'inherit'}}>{money(remaining)}</b>
          </div>
          <div className="hr" />
          {cart.length ? (
            <table className="table">
              <thead>
                <tr><th>Produkt</th><th>Qty</th><th>Preis</th></tr>
              </thead>
              <tbody>
                {cart.map((l, idx) => (
                  <tr key={idx}>
                    <td>{l.name}{l.size ? ` (${l.size})` : ''}</td>
                    <td>{l.quantity}</td>
                    <td>{money(Math.round(l.unitPrice*l.quantity*100)/100)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="notice">Noch keine Produkte ausgewählt.</p>
          )}
        </aside>
      </div>
    </main>
  );
}
