// src/App.js
// Installa dipendenze: npm install @supabase/supabase-js

import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";

const CATEGORIES = ["Tutte", "Proteine", "Creatina", "Aminoacidi", "Pre-workout", "Mass Gainer", "Vitamine", "Bruciagrassi"];
const GOALS      = ["Tutti", "Massa muscolare", "Dimagrimento", "Resistenza", "Recupero"];
const TAGS_LIST  = ["Vegan", "Senza glutine", "Senza lattosio", "Sugar free"];
const tagColor   = { "Vegan":"#3B6D11","Senza glutine":"#185FA5","Senza lattosio":"#854F0B","Sugar free":"#993556" };
const tagBg      = { "Vegan":"#EAF3DE","Senza glutine":"#E6F1FB","Senza lattosio":"#FAEEDA","Sugar free":"#FBEAF0" };
const macroKeys  = [
  { key:"calories",label:"Calorie (kcal)" },
  { key:"protein", label:"Proteine (g)" },
  { key:"carbs",   label:"Carboidrati (g)" },
  { key:"fat",     label:"Grassi (g)" },
  { key:"sugar",   label:"Zuccheri (g)" },
  { key:"salt",    label:"Sale (g)" },
];

export default function App() {
  const [page, setPage]             = useState("catalog");
  const [session, setSession]       = useState(null);
  const [supplements, setSupplements] = useState([]);
  const [favorites, setFavorites]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [authMode, setAuthMode]     = useState("login");
  const [authForm, setAuthForm]     = useState({ email:"", password:"", name:"" });
  const [authError, setAuthError]   = useState("");
  const [search, setSearch]         = useState("");
  const [catFilter, setCatFilter]   = useState("Tutte");
  const [goalFilter, setGoalFilter] = useState("Tutti");
  const [tagFilters, setTagFilters] = useState([]);
  const [priceRange, setPriceRange] = useState(100);
  const [sortMacro, setSortMacro]   = useState("none");
  const [sortDir, setSortDir]       = useState("desc");
  const [compareList, setCompareList] = useState([]);
  const [notification, setNotification] = useState("");

  // ── carica sessione e integratori all'avvio ──
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setSession(session);
    });
    loadSupplements();
    return () => subscription.unsubscribe();
  }, []);

  // ── carica preferiti quando cambia la sessione ──
  useEffect(() => {
    if (session) loadFavorites();
    else setFavorites([]);
  }, [session]);

  async function loadSupplements() {
    setLoading(true);
    const { data, error } = await supabase
      .from("supplements")
      .select("*, categories(name)")
      .eq("is_approved", true)
      .eq("is_active", true);
    if (!error) setSupplements(data || []);
    setLoading(false);
  }

  async function loadFavorites() {
    const { data } = await supabase
      .from("favorites")
      .select("supplement_id")
      .eq("user_id", session.user.id);
    setFavorites((data || []).map(f => f.supplement_id));
  }

  function toast(msg) {
    setNotification(msg);
    setTimeout(() => setNotification(""), 2500);
  }

  // ── AUTH ──
  async function handleAuth() {
    setAuthError("");
    if (authMode === "register") {
      const { error } = await supabase.auth.signUp({
        email: authForm.email,
        password: authForm.password,
        options: { data: { name: authForm.name } },
      });
      if (error) { setAuthError(error.message); return; }
      toast("Registrazione completata! Controlla la tua email per confermare.");
      setPage("catalog");
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email: authForm.email,
        password: authForm.password,
      });
      if (error) { setAuthError("Email o password errati."); return; }
      toast("Bentornato!");
      setPage("catalog");
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    setFavorites([]);
    setPage("catalog");
    toast("Disconnesso.");
  }

  // ── PREFERITI ──
  async function toggleFavorite(id) {
    if (!session) { setPage("auth"); return; }
    if (favorites.includes(id)) {
      await supabase.from("favorites")
        .delete()
        .eq("user_id", session.user.id)
        .eq("supplement_id", id);
      setFavorites(f => f.filter(x => x !== id));
      toast("Rimosso dai preferiti.");
    } else {
      await supabase.from("favorites")
        .insert({ user_id: session.user.id, supplement_id: id });
      setFavorites(f => [...f, id]);
      toast("Aggiunto ai preferiti!");
    }
  }

  // ── CONFRONTO ──
  function toggleCompare(id) {
    if (compareList.includes(id)) { setCompareList(c => c.filter(x => x !== id)); return; }
    if (compareList.length >= 4) { toast("Massimo 4 integratori nel confronto."); return; }
    setCompareList(c => [...c, id]);
    if (compareList.length === 1) toast("Vai su 'Confronta' per vedere il confronto!");
  }

  function resetFilters() {
    setCatFilter("Tutte"); setGoalFilter("Tutti"); setTagFilters([]);
    setSearch(""); setPriceRange(100); setSortMacro("none"); setSortDir("desc");
  }

  // ── helper: leggi macro dal record Supabase ──
  // Lo schema usa cal_per100, protein_per100 ecc.
  function macro(s, key) {
    const map = { calories:"cal_per100", protein:"protein_per100", carbs:"carbs_per100", fat:"fat_per100", sugar:"sugar_per100", salt:"salt_per100" };
    return s[map[key] || key] || 0;
  }

  const hasActiveFilters = catFilter !== "Tutte" || goalFilter !== "Tutti" || tagFilters.length > 0 || search || priceRange < 100 || sortMacro !== "none";

  const filtered = supplements.filter(s => {
    const cat = s.categories?.name || s.category_name || "";
    if (catFilter !== "Tutte" && cat !== catFilter) return false;
    if (goalFilter !== "Tutti" && !(s.goals || []).includes(goalFilter)) return false;
    if (tagFilters.length > 0 && !tagFilters.every(t => (s.tags || []).includes(t))) return false;
    if (s.price > priceRange) return false;
    if (search && !s.name.toLowerCase().includes(search.toLowerCase()) && !s.brand.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }).sort((a, b) => {
    if (sortMacro === "none") return 0;
    const diff = macro(a, sortMacro) - macro(b, sortMacro);
    return sortDir === "desc" ? -diff : diff;
  });

  const compareItems = supplements.filter(s => compareList.includes(s.id));
  const favItems     = supplements.filter(s => favorites.includes(s.id));

  function bestVal(key) {
    if (compareItems.length < 2) return null;
    const vals = compareItems.map(s => macro(s, key));
    return key === "protein" ? Math.max(...vals) : Math.min(...vals.filter(v => v > 0));
  }

  // ── stili inline ──
  const s = {
    card:    { background:"#fff", border:"1px solid #E5E7EB", borderRadius:12, padding:"1rem 1.25rem" },
    input:   { width:"100%", boxSizing:"border-box", border:"1px solid #D1D5DB", borderRadius:8, padding:"8px 10px", fontSize:13, outline:"none" },
    btnPri:  { padding:"8px 16px", borderRadius:8, border:"none", background:"#1D4ED8", color:"#fff", cursor:"pointer", fontSize:13, fontWeight:500 },
    btnSec:  { padding:"8px 16px", borderRadius:8, border:"1px solid #D1D5DB", background:"#fff", color:"#374151", cursor:"pointer", fontSize:13 },
    pill:    (bg, color) => ({ display:"inline-block", padding:"2px 9px", borderRadius:99, background:bg, color, fontSize:11, fontWeight:500 }),
  };

  const NavBtn = ({ id, label }) => (
    <button onClick={() => setPage(id)} style={{ padding:"6px 14px", borderRadius:8, border: page===id ? "1px solid #BFDBFE" : "1px solid transparent", background: page===id ? "#EFF6FF" : "transparent", color: page===id ? "#1D4ED8" : "#6B7280", cursor:"pointer", fontSize:13, fontWeight: page===id ? 500 : 400 }}>
      {label}
    </button>
  );

  const SupCard = ({ sup }) => (
    <div style={{ ...s.card, display:"flex", flexDirection:"column", gap:10 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
        <div style={{ display:"flex", gap:10, alignItems:"center" }}>
          <span style={{ fontSize:28 }}>{sup.img_emoji || "💊"}</span>
          <div>
            <p style={{ margin:0, fontWeight:600, fontSize:14 }}>{sup.name}</p>
            <p style={{ margin:0, fontSize:12, color:"#6B7280" }}>{sup.brand}</p>
          </div>
        </div>
        <button onClick={() => toggleFavorite(sup.id)} style={{ background:"none", border:"none", cursor:"pointer", padding:4, fontSize:18 }}>
          {favorites.includes(sup.id) ? "❤️" : "🤍"}
        </button>
      </div>

      <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
        <span style={s.pill("#EEF2FF","#3730A3")}>{sup.categories?.name || "—"}</span>
        {(sup.tags || []).map(t => <span key={t} style={s.pill(tagBg[t], tagColor[t])}>{t}</span>)}
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:6 }}>
        {[["Proteine", macro(sup,"protein")+"g"], ["Carboidrati", macro(sup,"carbs")+"g"], ["Grassi", macro(sup,"fat")+"g"]].map(([label, val]) => (
          <div key={label} style={{ background:"#F9FAFB", borderRadius:8, padding:"6px 8px", textAlign:"center" }}>
            <p style={{ margin:0, fontSize:11, color:"#6B7280" }}>{label}</p>
            <p style={{ margin:0, fontSize:14, fontWeight:600 }}>{val}</p>
          </div>
        ))}
      </div>

      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <span style={{ fontWeight:700, fontSize:16 }}>€{Number(sup.price).toFixed(2)}</span>
        <span style={{ fontSize:12, color:"#6B7280" }}>Dose: {sup.dose || "—"}</span>
      </div>

      <div style={{ display:"flex", gap:8 }}>
        <button onClick={() => toggleCompare(sup.id)} style={{ flex:1, fontSize:12, padding:"7px 0", borderRadius:8, border: compareList.includes(sup.id) ? "1px solid #BFDBFE" : "1px solid #E5E7EB", background: compareList.includes(sup.id) ? "#EFF6FF" : "transparent", color: compareList.includes(sup.id) ? "#1D4ED8" : "#374151", cursor:"pointer" }}>
          {compareList.includes(sup.id) ? "✓ Nel confronto" : "⇄ Confronta"}
        </button>
        <a href={sup.buy_url} target="_blank" rel="noreferrer" style={{ flex:1, fontSize:12, padding:"7px 0", borderRadius:8, border:"1px solid #E5E7EB", color:"#374151", textDecoration:"none", display:"flex", alignItems:"center", justifyContent:"center", gap:4 }}>
          🛒 Acquista
        </a>
      </div>
    </div>
  );

  return (
    <div style={{ fontFamily:"system-ui,sans-serif", minHeight:"100vh", background:"#F9FAFB", paddingBottom:"3rem" }}>

      {notification && (
        <div style={{ position:"fixed", top:16, right:16, background:"#ECFDF5", color:"#065F46", border:"1px solid #A7F3D0", borderRadius:8, padding:"10px 18px", fontSize:14, fontWeight:500, zIndex:999 }}>
          {notification}
        </div>
      )}

      {/* Header */}
      <div style={{ background:"#fff", borderBottom:"1px solid #E5E7EB", padding:"0 1.5rem" }}>
        <div style={{ maxWidth:1000, margin:"0 auto", display:"flex", alignItems:"center", justifyContent:"space-between", height:58 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <span style={{ fontSize:22 }}>💪</span>
            <span style={{ fontWeight:700, fontSize:16 }}>SupplementCompare</span>
          </div>
          <nav style={{ display:"flex", gap:4 }}>
            <NavBtn id="catalog"   label="Catalogo" />
            <NavBtn id="compare"   label={`Confronta${compareList.length ? ` (${compareList.length})` : ""}`} />
            <NavBtn id="favorites" label="❤️ Preferiti" />
            {session
              ? <><NavBtn id="profile" label={session.user.user_metadata?.name?.split(" ")[0] || "Profilo"} />
                  <button onClick={handleLogout} style={{ ...s.btnSec, fontSize:12 }}>Esci</button></>
              : <NavBtn id="auth" label="Accedi" />
            }
          </nav>
        </div>
      </div>

      <div style={{ maxWidth:1000, margin:"0 auto", padding:"1.5rem" }}>

        {/* ── CATALOGO ── */}
        {page === "catalog" && (
          <div>
            {/* Filtri */}
            <div style={{ ...s.card, marginBottom:"1.5rem" }}>
              <div style={{ display:"flex", gap:12, flexWrap:"wrap", alignItems:"flex-end" }}>
                <div style={{ flex:"1 1 180px" }}>
                  <label style={{ fontSize:12, color:"#6B7280", display:"block", marginBottom:4 }}>Cerca</label>
                  <input style={s.input} value={search} onChange={e => setSearch(e.target.value)} placeholder="Nome o brand..." />
                </div>
                <div style={{ flex:"1 1 130px" }}>
                  <label style={{ fontSize:12, color:"#6B7280", display:"block", marginBottom:4 }}>Categoria</label>
                  <select style={s.input} value={catFilter} onChange={e => setCatFilter(e.target.value)}>
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div style={{ flex:"1 1 130px" }}>
                  <label style={{ fontSize:12, color:"#6B7280", display:"block", marginBottom:4 }}>Obiettivo</label>
                  <select style={s.input} value={goalFilter} onChange={e => setGoalFilter(e.target.value)}>
                    {GOALS.map(g => <option key={g}>{g}</option>)}
                  </select>
                </div>
                <div style={{ flex:"1 1 130px" }}>
                  <label style={{ fontSize:12, color:"#6B7280", display:"block", marginBottom:4 }}>Prezzo max: €{priceRange}</label>
                  <input type="range" min="10" max="100" step="1" value={priceRange} onChange={e => setPriceRange(Number(e.target.value))} style={{ width:"100%" }} />
                </div>
                <div style={{ flex:"1 1 190px" }}>
                  <label style={{ fontSize:12, color:"#6B7280", display:"block", marginBottom:4 }}>Ordina per macro</label>
                  <div style={{ display:"flex", gap:6 }}>
                    <select style={{ ...s.input }} value={sortMacro} onChange={e => setSortMacro(e.target.value)}>
                      <option value="none">Nessun ordine</option>
                      <option value="protein">Proteine</option>
                      <option value="carbs">Carboidrati</option>
                      <option value="fat">Grassi</option>
                      <option value="calories">Calorie</option>
                      <option value="sugar">Zuccheri</option>
                    </select>
                    <button onClick={() => setSortDir(d => d === "desc" ? "asc" : "desc")} disabled={sortMacro === "none"}
                      style={{ ...s.btnSec, padding:"0 12px", opacity: sortMacro === "none" ? 0.4 : 1, fontSize:13 }}>
                      {sortDir === "desc" ? "9→1" : "1→9"}
                    </button>
                  </div>
                </div>
              </div>
              <div style={{ marginTop:12, display:"flex", gap:8, flexWrap:"wrap" }}>
                {TAGS_LIST.map(t => (
                  <button key={t} onClick={() => setTagFilters(f => f.includes(t) ? f.filter(x=>x!==t) : [...f,t])}
                    style={{ fontSize:12, padding:"4px 10px", borderRadius:99, border: tagFilters.includes(t) ? `1px solid ${tagColor[t]}` : "1px solid #E5E7EB", background: tagFilters.includes(t) ? tagBg[t] : "transparent", color: tagFilters.includes(t) ? tagColor[t] : "#6B7280", cursor:"pointer" }}>
                    {t}
                  </button>
                ))}
                {hasActiveFilters && (
                  <button onClick={resetFilters} style={{ fontSize:12, padding:"4px 10px", borderRadius:99, border:"1px solid #E5E7EB", background:"transparent", color:"#6B7280", cursor:"pointer" }}>
                    ✕ Reset filtri
                  </button>
                )}
              </div>
            </div>

            {loading && <p style={{ textAlign:"center", color:"#6B7280", padding:"2rem" }}>Caricamento integratori...</p>}
            {!loading && filtered.length === 0 && <p style={{ textAlign:"center", color:"#6B7280", padding:"2rem" }}>Nessun integratore trovato.</p>}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:16 }}>
              {filtered.map(sup => <SupCard key={sup.id} sup={sup} />)}
            </div>
          </div>
        )}

        {/* ── CONFRONTO ── */}
        {page === "compare" && (
          <div>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"1.25rem" }}>
              <div>
                <h1 style={{ margin:0, fontSize:20, fontWeight:700 }}>Confronto integratori</h1>
                <p style={{ margin:"4px 0 0", fontSize:13, color:"#6B7280" }}>Seleziona fino a 4 prodotti dal catalogo</p>
              </div>
              {compareList.length > 0 && <button onClick={() => setCompareList([])} style={s.btnSec}>Svuota</button>}
            </div>
            {compareList.length === 0 ? (
              <div style={{ ...s.card, textAlign:"center", padding:"3rem" }}>
                <p style={{ fontSize:40, margin:"0 0 12px" }}>⇄</p>
                <p style={{ color:"#6B7280" }}>Nessun integratore selezionato.<br />Vai al catalogo e clicca "Confronta".</p>
                <button onClick={() => setPage("catalog")} style={{ ...s.btnSec, marginTop:16 }}>Vai al catalogo</button>
              </div>
            ) : (
              <div style={{ ...s.card, overflowX:"auto" }}>
                <table style={{ width:"100%", borderCollapse:"collapse", tableLayout:"fixed" }}>
                  <thead>
                    <tr>
                      <td style={{ padding:"12px 16px", borderBottom:"1px solid #F3F4F6", fontSize:12, color:"#6B7280", width:140 }}>Per 100g</td>
                      {compareItems.map(sup => (
                        <td key={sup.id} style={{ padding:"12px 16px", borderBottom:"1px solid #F3F4F6", textAlign:"center" }}>
                          <span style={{ fontSize:28, display:"block" }}>{sup.img_emoji || "💊"}</span>
                          <p style={{ margin:"4px 0 0", fontSize:13, fontWeight:600 }}>{sup.name}</p>
                          <p style={{ margin:0, fontSize:11, color:"#6B7280" }}>{sup.brand}</p>
                          <p style={{ margin:"4px 0 0", fontWeight:700 }}>€{Number(sup.price).toFixed(2)}</p>
                          <button onClick={() => setCompareList(c => c.filter(id => id !== sup.id))} style={{ ...s.btnSec, fontSize:11, padding:"3px 8px", marginTop:6 }}>✕ Rimuovi</button>
                        </td>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {macroKeys.map((m, i) => {
                      const best = bestVal(m.key);
                      return (
                        <tr key={m.key} style={{ background: i%2===0 ? "#F9FAFB" : "#fff" }}>
                          <td style={{ padding:"10px 16px", fontSize:13, color:"#6B7280" }}>{m.label}</td>
                          {compareItems.map(sup => {
                            const val = macro(sup, m.key);
                            const isBest = best !== null && val === best;
                            return (
                              <td key={sup.id} style={{ padding:"10px 16px", textAlign:"center", fontWeight: isBest ? 700 : 400, color: isBest ? "#065F46" : "#111", background: isBest ? "#ECFDF5" : "transparent", fontSize:14 }}>
                                {val}{isBest && " 🏆"}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                    <tr>
                      <td style={{ padding:"10px 16px", fontSize:13, color:"#6B7280" }}>Acquisto</td>
                      {compareItems.map(sup => (
                        <td key={sup.id} style={{ padding:"10px 16px", textAlign:"center" }}>
                          <a href={sup.buy_url} target="_blank" rel="noreferrer" style={{ fontSize:12, padding:"6px 12px", borderRadius:8, border:"1px solid #E5E7EB", color:"#374151", textDecoration:"none", display:"inline-block" }}>
                            🛒 Acquista
                          </a>
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── PREFERITI ── */}
        {page === "favorites" && (
          <div>
            <h1 style={{ margin:"0 0 1.25rem", fontSize:20, fontWeight:700 }}>I tuoi preferiti</h1>
            {!session ? (
              <div style={{ ...s.card, textAlign:"center", padding:"3rem" }}>
                <p style={{ fontSize:40, margin:"0 0 12px" }}>❤️</p>
                <p style={{ color:"#6B7280" }}>Accedi per vedere i tuoi preferiti.</p>
                <button onClick={() => setPage("auth")} style={{ ...s.btnPri, marginTop:16 }}>Accedi</button>
              </div>
            ) : favItems.length === 0 ? (
              <div style={{ ...s.card, textAlign:"center", padding:"3rem" }}>
                <p style={{ fontSize:40, margin:"0 0 12px" }}>🤍</p>
                <p style={{ color:"#6B7280" }}>Non hai ancora salvato nessun preferito.</p>
                <button onClick={() => setPage("catalog")} style={{ ...s.btnSec, marginTop:16 }}>Scopri il catalogo</button>
              </div>
            ) : (
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:16 }}>
                {favItems.map(sup => <SupCard key={sup.id} sup={sup} />)}
              </div>
            )}
          </div>
        )}

        {/* ── AUTH ── */}
        {page === "auth" && !session && (
          <div style={{ maxWidth:420, margin:"2rem auto" }}>
            <div style={s.card}>
              <div style={{ display:"flex", marginBottom:"1.5rem", border:"1px solid #E5E7EB", borderRadius:8, overflow:"hidden" }}>
                {["login","register"].map(m => (
                  <button key={m} onClick={() => { setAuthMode(m); setAuthError(""); }} style={{ flex:1, padding:"9px 0", border:"none", background: authMode===m ? "#EFF6FF" : "#fff", color: authMode===m ? "#1D4ED8" : "#6B7280", cursor:"pointer", fontWeight: authMode===m ? 600 : 400, fontSize:14 }}>
                    {m === "login" ? "Accedi" : "Registrati"}
                  </button>
                ))}
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                {authMode === "register" && (
                  <div>
                    <label style={{ fontSize:12, color:"#6B7280", display:"block", marginBottom:4 }}>Nome completo</label>
                    <input style={s.input} value={authForm.name} onChange={e => setAuthForm({...authForm, name:e.target.value})} placeholder="Mario Rossi" />
                  </div>
                )}
                <div>
                  <label style={{ fontSize:12, color:"#6B7280", display:"block", marginBottom:4 }}>Email</label>
                  <input type="email" style={s.input} value={authForm.email} onChange={e => setAuthForm({...authForm, email:e.target.value})} placeholder="mario@email.com" />
                </div>
                <div>
                  <label style={{ fontSize:12, color:"#6B7280", display:"block", marginBottom:4 }}>Password</label>
                  <input type="password" style={s.input} value={authForm.password} onChange={e => setAuthForm({...authForm, password:e.target.value})} placeholder="••••••••" onKeyDown={e => e.key==="Enter" && handleAuth()} />
                </div>
                {authError && <p style={{ margin:0, fontSize:13, color:"#DC2626" }}>{authError}</p>}
                <button onClick={handleAuth} style={{ ...s.btnPri, padding:"10px 0" }}>
                  {authMode === "login" ? "Accedi" : "Crea account"}
                </button>
              </div>
            </div>
          </div>
        )}

        {page === "auth" && session && (
          <div style={{ textAlign:"center", padding:"3rem" }}>
            <p style={{ color:"#6B7280" }}>Sei già connesso.</p>
            <button onClick={() => setPage("catalog")} style={{ ...s.btnSec, marginTop:12 }}>Vai al catalogo</button>
          </div>
        )}

        {/* ── PROFILO ── */}
        {page === "profile" && session && (
          <div style={{ maxWidth:500, margin:"2rem auto" }}>
            <div style={s.card}>
              <div style={{ display:"flex", alignItems:"center", gap:16, marginBottom:"1.5rem" }}>
                <div style={{ width:52, height:52, borderRadius:"50%", background:"#EFF6FF", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700, fontSize:18, color:"#1D4ED8" }}>
                  {(session.user.user_metadata?.name || session.user.email).slice(0,2).toUpperCase()}
                </div>
                <div>
                  <p style={{ margin:0, fontWeight:600, fontSize:16 }}>{session.user.user_metadata?.name || "Utente"}</p>
                  <p style={{ margin:0, fontSize:13, color:"#6B7280" }}>{session.user.email}</p>
                </div>
              </div>
              <div style={{ borderTop:"1px solid #F3F4F6", paddingTop:"1rem", display:"flex", flexDirection:"column", gap:8 }}>
                <div style={{ display:"flex", justifyContent:"space-between", fontSize:14 }}>
                  <span style={{ color:"#6B7280" }}>Preferiti salvati</span>
                  <span style={{ fontWeight:600 }}>{favorites.length}</span>
                </div>
              </div>
              <div style={{ marginTop:"1.5rem", display:"flex", gap:8 }}>
                <button onClick={() => setPage("favorites")} style={{ flex:1, ...s.btnSec }}>❤️ Vedi preferiti</button>
                <button onClick={handleLogout} style={{ flex:1, ...s.btnSec, color:"#DC2626" }}>Esci</button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}