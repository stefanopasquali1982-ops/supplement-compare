import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";

const CATEGORIES = ["Tutte","Proteine","Creatina","Aminoacidi","Pre-workout","Mass Gainer","Vitamine","Bruciagrassi"];
const GOALS      = ["Tutti","Massa muscolare","Dimagrimento","Resistenza","Recupero"];
const TAGS_LIST  = ["Vegan","Senza glutine","Senza lattosio","Sugar free"];

const FALLBACK_IMGS = {
  "Proteine":    "https://images.unsplash.com/photo-1593095948071-474c5cc2989d?w=400&q=80",
  "Creatina":    "https://images.unsplash.com/photo-1579722820285-e0b78edc9ca4?w=400&q=80",
  "Aminoacidi":  "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&q=80",
  "Pre-workout": "https://images.unsplash.com/photo-1544033527-b192daee1f5b?w=400&q=80",
  "Mass Gainer": "https://images.unsplash.com/photo-1612532751383-f2b37b8e83ad?w=400&q=80",
  "Vitamine":    "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80",
  "Bruciagrassi":"https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400&q=80",
  "default":     "https://images.unsplash.com/photo-1593095948071-474c5cc2989d?w=400&q=80",
};

const tagColors = {
  "Vegan":"#16A34A","Senza glutine":"#2563EB","Senza lattosio":"#D97706","Sugar free":"#DC2626"
};

function macro(s, key) {
  const map = { calories:"cal_per100", protein:"protein_per100", carbs:"carbs_per100", fat:"fat_per100", sugar:"sugar_per100", salt:"salt_per100" };
  return s[map[key] || key] || 0;
}

function Stars({ rating = 4.5 }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:4 }}>
      {[1,2,3,4,5].map(i => (
        <svg key={i} width="13" height="13" viewBox="0 0 24 24" fill={i <= Math.round(rating) ? "#F59E0B" : "#E5E7EB"}>
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
      ))}
      <span style={{ fontSize:11, color:"#94A3B8", marginLeft:2 }}>{rating}</span>
    </div>
  );
}

function ProductCard({ s, favs, toggleFav, compare, toggleCompare, hovered, setHovered }) {
  const imgUrl = s.img_url || FALLBACK_IMGS[s.categories?.name] || FALLBACK_IMGS.default;
  const isHovered = hovered === s.id;

  return (
    <div
      onMouseEnter={() => setHovered(s.id)}
      onMouseLeave={() => setHovered(null)}
      style={{ background:"#fff", borderRadius:20, border:"1px solid", borderColor: isHovered ? "#C7D2FE" : "#E2E8F0", overflow:"hidden", transition:"all .2s", transform: isHovered ? "translateY(-4px)" : "none", boxShadow: isHovered ? "0 12px 32px rgba(99,102,241,0.12)" : "0 1px 3px rgba(0,0,0,0.04)" }}>

      {/* Immagine */}
      <div style={{ position:"relative", height:200, overflow:"hidden", background:"#F8FAFC" }}>
        <img
          src={imgUrl}
          alt={s.name}
          onError={e => { e.target.src = FALLBACK_IMGS.default; }}
          style={{ width:"100%", height:"100%", objectFit:"cover", transition:"transform .3s", transform: isHovered ? "scale(1.05)" : "scale(1)" }}
        />
        <div style={{ position:"absolute", inset:0, background:"linear-gradient(to top, rgba(0,0,0,0.3) 0%, transparent 50%)" }} />
        <span style={{ position:"absolute", top:12, left:12, background:"rgba(255,255,255,0.95)", borderRadius:99, padding:"4px 10px", fontSize:11, fontWeight:600, color:"#6366F1" }}>
          {s.categories?.name || "—"}
        </span>
        <button onClick={() => toggleFav(s.id)} style={{ position:"absolute", top:10, right:10, width:34, height:34, borderRadius:"50%", background:"rgba(255,255,255,0.95)", border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, boxShadow:"0 2px 8px rgba(0,0,0,0.1)" }}>
          {favs.includes(s.id) ? "❤️" : "🤍"}
        </button>
        <div style={{ position:"absolute", bottom:10, left:12, display:"flex", gap:4, flexWrap:"wrap" }}>
          {(s.tags || []).slice(0,2).map(t => (
            <span key={t} style={{ background:"rgba(255,255,255,0.95)", borderRadius:99, padding:"2px 8px", fontSize:10, fontWeight:600, color: tagColors[t] || "#374151" }}>{t}</span>
          ))}
        </div>
      </div>

      {/* Contenuto */}
      <div style={{ padding:"1.25rem" }}>
        <p style={{ margin:"0 0 2px", fontSize:11, color:"#94A3B8", fontWeight:500, textTransform:"uppercase", letterSpacing:"0.5px" }}>{s.brand}</p>
        <p style={{ margin:"0 0 6px", fontSize:16, fontWeight:700, color:"#1E293B", lineHeight:1.3 }}>{s.name}</p>
        <Stars />

        {/* Macro */}
        <div style={{ background:"#F8FAFC", borderRadius:12, padding:"10px 12px", margin:"12px 0" }}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8 }}>
            {[
              { label:"Proteine", val:macro(s,"protein"), color:"#6366F1", bg:"#EEF2FF" },
              { label:"Carb", val:macro(s,"carbs"), color:"#F59E0B", bg:"#FFFBEB" },
              { label:"Grassi", val:macro(s,"fat"), color:"#EF4444", bg:"#FEF2F2" },
            ].map(m => (
              <div key={m.label} style={{ textAlign:"center" }}>
                <div style={{ background:m.bg, borderRadius:8, padding:"6px 4px" }}>
                  <p style={{ margin:0, fontSize:15, fontWeight:700, color:m.color }}>{m.val}g</p>
                  <p style={{ margin:0, fontSize:10, color:"#94A3B8" }}>{m.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Prezzo e acquisto */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
          <div>
            <p style={{ margin:0, fontSize:22, fontWeight:800, color:"#1E293B" }}>€{Number(s.price || 0).toFixed(2)}</p>
            <p style={{ margin:0, fontSize:11, color:"#94A3B8" }}>per confezione</p>
          </div>
          <a href={s.buy_url || "#"} target="_blank" rel="noreferrer" style={{ padding:"10px 16px", borderRadius:10, background:"linear-gradient(135deg,#6366F1,#8B5CF6)", color:"#fff", textDecoration:"none", fontSize:13, fontWeight:600 }}>
            🛒 Acquista
          </a>
        </div>

        <button onClick={() => toggleCompare(s.id)} style={{ width:"100%", padding:"9px 0", borderRadius:10, border:"1px solid", borderColor: compare.includes(s.id) ? "#6366F1" : "#E2E8F0", background: compare.includes(s.id) ? "#EEF2FF" : "#fff", color: compare.includes(s.id) ? "#6366F1" : "#64748B", cursor:"pointer", fontSize:13, fontWeight:600 }}>
          {compare.includes(s.id) ? "✓ Nel confronto" : "⇄ Aggiungi al confronto"}
        </button>
      </div>
    </div>
  );
}

export default function App() {
  const [page, setPage]           = useState("home");
  const [session, setSession]     = useState(null);
  const [supplements, setSupplements] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [favs, setFavs]           = useState([]);
  const [compare, setCompare]     = useState([]);
  const [hovered, setHovered]     = useState(null);
  const [search, setSearch]       = useState("");
  const [catFilter, setCatFilter] = useState("Tutte");
  const [goalFilter, setGoalFilter] = useState("Tutti");
  const [tagFilters, setTagFilters] = useState([]);
  const [priceRange, setPriceRange] = useState(200);
  const [sortMacro, setSortMacro] = useState("none");
  const [sortDir, setSortDir]     = useState("desc");
  const [authMode, setAuthMode]   = useState("login");
  const [authForm, setAuthForm]   = useState({ email:"", password:"", name:"" });
  const [authError, setAuthError] = useState("");
  const [notification, setNotification] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    loadSupplements();
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => { if (session) loadFavs(); else setFavs([]); }, [session]);

  async function loadSupplements() {
    setLoading(true);
    const { data } = await supabase
      .from("supplements")
      .select("*, categories(name)")
      .eq("is_approved", true)
      .eq("is_active", true);
    setSupplements(data || []);
    setLoading(false);
  }

  async function loadFavs() {
    const { data } = await supabase.from("favorites").select("supplement_id").eq("user_id", session.user.id);
    setFavs((data || []).map(f => f.supplement_id));
  }

  function toast(msg) { setNotification(msg); setTimeout(() => setNotification(""), 2500); }

  async function handleAuth() {
    setAuthError("");
    if (authMode === "register") {
      const { error } = await supabase.auth.signUp({ email: authForm.email, password: authForm.password, options: { data: { name: authForm.name } } });
      if (error) { setAuthError(error.message); return; }
      toast("Registrazione completata! Controlla la tua email."); setPage("home");
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email: authForm.email, password: authForm.password });
      if (error) { setAuthError("Email o password errati."); return; }
      toast("Bentornato!"); setPage("home");
    }
  }

  async function handleLogout() { await supabase.auth.signOut(); setFavs([]); setPage("home"); toast("Disconnesso."); }

  async function toggleFav(id) {
    if (!session) { setPage("auth"); return; }
    if (favs.includes(id)) {
      await supabase.from("favorites").delete().eq("user_id", session.user.id).eq("supplement_id", id);
      setFavs(f => f.filter(x => x !== id)); toast("Rimosso dai preferiti.");
    } else {
      await supabase.from("favorites").insert({ user_id: session.user.id, supplement_id: id });
      setFavs(f => [...f, id]); toast("Aggiunto ai preferiti!");
    }
  }

  function toggleCompare(id) {
    if (compare.includes(id)) { setCompare(c => c.filter(x => x !== id)); return; }
    if (compare.length >= 4) { toast("Massimo 4 integratori nel confronto."); return; }
    setCompare(c => [...c, id]);
  }

  const filtered = supplements.filter(s => {
    const cat = s.categories?.name || "";
    if (catFilter !== "Tutte" && cat !== catFilter) return false;
    if (goalFilter !== "Tutti" && !(s.goals || []).includes(goalFilter)) return false;
    if (tagFilters.length > 0 && !tagFilters.every(t => (s.tags || []).includes(t))) return false;
    if ((s.price || 0) > priceRange) return false;
    if (search && !s.name.toLowerCase().includes(search.toLowerCase()) && !s.brand.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }).sort((a, b) => {
    if (sortMacro === "none") return 0;
    const diff = macro(a, sortMacro) - macro(b, sortMacro);
    return sortDir === "desc" ? -diff : diff;
  });

  const compareItems = supplements.filter(s => compare.includes(s.id));
  const favItems     = supplements.filter(s => favs.includes(s.id));
  const hasFilters   = catFilter !== "Tutte" || goalFilter !== "Tutti" || tagFilters.length > 0 || search || priceRange < 200 || sortMacro !== "none";

  const nav = [
    { id:"home", label:"Catalogo" },
    { id:"compare", label:`Confronta${compare.length ? ` (${compare.length})` : ""}` },
    { id:"favs", label:"❤️ Preferiti" },
  ];

  return (
    <div style={{ fontFamily:"'Inter',system-ui,sans-serif", background:"#F8FAFC", minHeight:"100vh" }}>

      {notification && (
        <div style={{ position:"fixed", top:16, right:16, background:"#ECFDF5", color:"#065F46", border:"1px solid #A7F3D0", borderRadius:10, padding:"10px 18px", fontSize:14, fontWeight:500, zIndex:9999, boxShadow:"0 4px 12px rgba(0,0,0,0.1)" }}>
          {notification}
        </div>
      )}

      {/* HEADER */}
      <header style={{ background:"#fff", borderBottom:"1px solid #E2E8F0", position:"sticky", top:0, zIndex:100, boxShadow:"0 1px 3px rgba(0,0,0,0.06)" }}>
        <div style={{ maxWidth:1200, margin:"0 auto", padding:"0 1.5rem", display:"flex", alignItems:"center", justifyContent:"space-between", height:64 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, cursor:"pointer" }} onClick={() => setPage("home")}>
            <div style={{ width:36, height:36, borderRadius:10, background:"linear-gradient(135deg,#6366F1,#8B5CF6)", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <span style={{ fontSize:18 }}>💪</span>
            </div>
            <div>
              <p style={{ margin:0, fontWeight:700, fontSize:16, color:"#1E293B" }}>SupplementCompare</p>
              <p style={{ margin:0, fontSize:11, color:"#94A3B8" }}>Il comparatore #1 in Italia</p>
            </div>
          </div>
          <nav style={{ display:"flex", gap:2, alignItems:"center" }}>
            {nav.map(n => (
              <button key={n.id} onClick={() => setPage(n.id)} style={{ padding:"8px 16px", borderRadius:8, border:"none", background: page===n.id ? "#EEF2FF" : "transparent", color: page===n.id ? "#6366F1" : "#64748B", cursor:"pointer", fontSize:13, fontWeight: page===n.id ? 600 : 400 }}>
                {n.label}
              </button>
            ))}
            {session ? (
              <>
                <button onClick={() => setPage("profile")} style={{ padding:"8px 16px", borderRadius:8, border:"none", background: page==="profile" ? "#EEF2FF" : "transparent", color: page==="profile" ? "#6366F1" : "#64748B", cursor:"pointer", fontSize:13 }}>
                  {session.user.user_metadata?.name?.split(" ")[0] || "Profilo"}
                </button>
                <button onClick={handleLogout} style={{ padding:"8px 16px", borderRadius:8, border:"1px solid #E2E8F0", background:"#fff", color:"#64748B", cursor:"pointer", fontSize:13 }}>Esci</button>
              </>
            ) : (
              <>
                <button onClick={() => { setAuthMode("login"); setPage("auth"); }} style={{ padding:"8px 16px", borderRadius:8, border:"none", background:"transparent", color:"#64748B", cursor:"pointer", fontSize:13 }}>Accedi</button>
                <button onClick={() => { setAuthMode("register"); setPage("auth"); }} style={{ padding:"8px 20px", borderRadius:8, border:"none", background:"linear-gradient(135deg,#6366F1,#8B5CF6)", color:"#fff", cursor:"pointer", fontSize:13, fontWeight:600 }}>Registrati</button>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* HOME */}
      {page === "home" && (
        <div>
          {/* HERO */}
          <div style={{ background:"linear-gradient(135deg,#EEF2FF 0%,#F0FDF4 50%,#FFF7ED 100%)", padding:"4rem 1.5rem 3rem" }}>
            <div style={{ maxWidth:1200, margin:"0 auto", textAlign:"center" }}>
              <div style={{ display:"inline-flex", alignItems:"center", gap:8, background:"#fff", border:"1px solid #E2E8F0", borderRadius:99, padding:"6px 14px", marginBottom:20, boxShadow:"0 1px 3px rgba(0,0,0,0.06)" }}>
                <span style={{ width:8, height:8, borderRadius:"50%", background:"#22C55E", display:"inline-block" }}></span>
                <span style={{ fontSize:12, color:"#64748B", fontWeight:500 }}>{supplements.length}+ integratori da 5 brand leader</span>
              </div>
              <h1 style={{ margin:"0 0 16px", fontSize:48, fontWeight:800, color:"#1E293B", letterSpacing:"-1px", lineHeight:1.1 }}>
                Confronta gli integratori<br />
                <span style={{ background:"linear-gradient(135deg,#6366F1,#8B5CF6)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>migliori d'Italia</span>
              </h1>
              <p style={{ margin:"0 auto 32px", fontSize:18, color:"#64748B", maxWidth:560, lineHeight:1.6 }}>
                Trova l'integratore perfetto per i tuoi obiettivi. Confronta macro, prezzi e caratteristiche in un click.
              </p>
              <div style={{ position:"relative", maxWidth:480, margin:"0 auto" }}>
                <svg style={{ position:"absolute", left:14, top:"50%", transform:"translateY(-50%)" }} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cerca per nome o brand..." style={{ width:"100%", boxSizing:"border-box", padding:"14px 14px 14px 44px", borderRadius:12, border:"1px solid #E2E8F0", fontSize:15, outline:"none", background:"#fff", boxShadow:"0 1px 3px rgba(0,0,0,0.06)" }} />
              </div>
              <div style={{ display:"flex", gap:32, justifyContent:"center", marginTop:32, flexWrap:"wrap" }}>
                {[[supplements.length+"+","Integratori"],["5","Brand top"],["100%","Gratuito"],["⭐ 4.8","Rating medio"]].map(([val,label]) => (
                  <div key={label}>
                    <p style={{ margin:0, fontSize:24, fontWeight:700, color:"#1E293B" }}>{val}</p>
                    <p style={{ margin:0, fontSize:12, color:"#94A3B8" }}>{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* FILTRI */}
          <div style={{ maxWidth:1200, margin:"1.5rem auto 0", padding:"0 1.5rem" }}>
            <div style={{ background:"#fff", borderRadius:16, padding:"1.25rem 1.5rem", border:"1px solid #E2E8F0", boxShadow:"0 1px 3px rgba(0,0,0,0.04)" }}>
              <div style={{ display:"flex", gap:20, flexWrap:"wrap", alignItems:"flex-start" }}>
                <div>
                  <p style={{ margin:"0 0 8px", fontSize:12, fontWeight:600, color:"#374151", textTransform:"uppercase", letterSpacing:"0.5px" }}>Categoria</p>
                  <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                    {CATEGORIES.map(c => (
                      <button key={c} onClick={() => setCatFilter(c)} style={{ padding:"6px 14px", borderRadius:99, border:"1px solid", borderColor: catFilter===c ? "#6366F1" : "#E2E8F0", background: catFilter===c ? "#EEF2FF" : "#fff", color: catFilter===c ? "#6366F1" : "#64748B", cursor:"pointer", fontSize:13, fontWeight: catFilter===c ? 600 : 400 }}>{c}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <p style={{ margin:"0 0 8px", fontSize:12, fontWeight:600, color:"#374151", textTransform:"uppercase", letterSpacing:"0.5px" }}>Obiettivo</p>
                  <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                    {GOALS.map(g => (
                      <button key={g} onClick={() => setGoalFilter(g)} style={{ padding:"6px 14px", borderRadius:99, border:"1px solid", borderColor: goalFilter===g ? "#8B5CF6" : "#E2E8F0", background: goalFilter===g ? "#F5F3FF" : "#fff", color: goalFilter===g ? "#8B5CF6" : "#64748B", cursor:"pointer", fontSize:13, fontWeight: goalFilter===g ? 600 : 400 }}>{g}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <p style={{ margin:"0 0 8px", fontSize:12, fontWeight:600, color:"#374151", textTransform:"uppercase", letterSpacing:"0.5px" }}>Tag</p>
                  <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                    {TAGS_LIST.map(t => (
                      <button key={t} onClick={() => setTagFilters(f => f.includes(t) ? f.filter(x=>x!==t) : [...f,t])} style={{ padding:"6px 14px", borderRadius:99, border:"1px solid", borderColor: tagFilters.includes(t) ? tagColors[t] : "#E2E8F0", background: tagFilters.includes(t) ? "#F0FDF4" : "#fff", color: tagFilters.includes(t) ? tagColors[t] : "#64748B", cursor:"pointer", fontSize:13, fontWeight: tagFilters.includes(t) ? 600 : 400 }}>{t}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <p style={{ margin:"0 0 8px", fontSize:12, fontWeight:600, color:"#374151", textTransform:"uppercase", letterSpacing:"0.5px" }}>Ordina per</p>
                  <div style={{ display:"flex", gap:6 }}>
                    <select value={sortMacro} onChange={e => setSortMacro(e.target.value)} style={{ padding:"6px 12px", borderRadius:8, border:"1px solid #E2E8F0", fontSize:13, outline:"none" }}>
                      <option value="none">Nessun ordine</option>
                      <option value="protein">Proteine</option>
                      <option value="carbs">Carboidrati</option>
                      <option value="fat">Grassi</option>
                      <option value="calories">Calorie</option>
                    </select>
                    <button onClick={() => setSortDir(d => d==="desc"?"asc":"desc")} disabled={sortMacro==="none"} style={{ padding:"6px 12px", borderRadius:8, border:"1px solid #E2E8F0", background:"#fff", cursor: sortMacro==="none" ? "default" : "pointer", opacity: sortMacro==="none" ? 0.4 : 1, fontSize:13 }}>
                      {sortDir==="desc" ? "9→1" : "1→9"}
                    </button>
                  </div>
                </div>
                <div>
                  <p style={{ margin:"0 0 8px", fontSize:12, fontWeight:600, color:"#374151", textTransform:"uppercase", letterSpacing:"0.5px" }}>Prezzo max: €{priceRange}</p>
                  <input type="range" min="10" max="200" step="5" value={priceRange} onChange={e => setPriceRange(Number(e.target.value))} style={{ width:140 }} />
                </div>
              </div>
              {hasFilters && (
                <button onClick={() => { setCatFilter("Tutte"); setGoalFilter("Tutti"); setTagFilters([]); setSearch(""); setPriceRange(200); setSortMacro("none"); setSortDir("desc"); }} style={{ marginTop:12, fontSize:12, padding:"5px 12px", borderRadius:8, border:"1px solid #E2E8F0", background:"#fff", color:"#64748B", cursor:"pointer" }}>
                  ✕ Reset filtri
                </button>
              )}
            </div>
          </div>

          {/* GRIGLIA */}
          <div style={{ maxWidth:1200, margin:"0 auto", padding:"1.5rem" }}>
            <p style={{ margin:"0 0 1rem", fontSize:14, color:"#64748B" }}><b style={{ color:"#1E293B" }}>{filtered.length}</b> integratori trovati</p>
            {loading && <p style={{ textAlign:"center", color:"#64748B", padding:"3rem" }}>Caricamento...</p>}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))", gap:20 }}>
              {filtered.map(s => (
                <ProductCard key={s.id} s={s} favs={favs} toggleFav={toggleFav} compare={compare} toggleCompare={toggleCompare} hovered={hovered} setHovered={setHovered} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* CONFRONTO */}
      {page === "compare" && (
        <div style={{ maxWidth:1200, margin:"0 auto", padding:"2rem 1.5rem" }}>
          <h1 style={{ margin:"0 0 8px", fontSize:28, fontWeight:800, color:"#1E293B" }}>Confronto integratori</h1>
          <p style={{ margin:"0 0 1.5rem", color:"#64748B" }}>Seleziona fino a 4 prodotti dal catalogo</p>
          {compare.length === 0 ? (
            <div style={{ background:"#fff", borderRadius:20, border:"1px solid #E2E8F0", padding:"4rem", textAlign:"center" }}>
              <p style={{ fontSize:48, margin:"0 0 12px" }}>⇄</p>
              <p style={{ color:"#64748B" }}>Nessun prodotto selezionato.</p>
              <button onClick={() => setPage("home")} style={{ marginTop:16, padding:"10px 24px", borderRadius:10, border:"none", background:"linear-gradient(135deg,#6366F1,#8B5CF6)", color:"#fff", cursor:"pointer", fontWeight:600 }}>Vai al catalogo</button>
            </div>
          ) : (
            <div style={{ background:"#fff", borderRadius:20, border:"1px solid #E2E8F0", overflowX:"auto" }}>
              <table style={{ width:"100%", borderCollapse:"collapse" }}>
                <thead>
                  <tr style={{ borderBottom:"2px solid #F1F5F9" }}>
                    <td style={{ padding:"16px 20px", width:160, fontSize:13, color:"#94A3B8", fontWeight:600 }}>PER 100g</td>
                    {compareItems.map(s => (
                      <td key={s.id} style={{ padding:"16px 20px", textAlign:"center" }}>
                        <img src={s.img_url || FALLBACK_IMGS[s.categories?.name] || FALLBACK_IMGS.default} alt={s.name} onError={e => { e.target.src = FALLBACK_IMGS.default; }} style={{ width:80, height:80, borderRadius:12, objectFit:"cover", marginBottom:8 }} />
                        <p style={{ margin:"0 0 2px", fontSize:11, color:"#94A3B8" }}>{s.brand}</p>
                        <p style={{ margin:"0 0 4px", fontSize:14, fontWeight:700, color:"#1E293B" }}>{s.name}</p>
                        <p style={{ margin:"0 0 8px", fontSize:20, fontWeight:800, color:"#6366F1" }}>€{Number(s.price||0).toFixed(2)}</p>
                        <button onClick={() => setCompare(c => c.filter(id=>id!==s.id))} style={{ fontSize:11, padding:"4px 10px", borderRadius:8, border:"1px solid #E2E8F0", background:"#fff", color:"#94A3B8", cursor:"pointer" }}>✕ Rimuovi</button>
                      </td>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { label:"🔵 Proteine", key:"protein", unit:"g", best:"max" },
                    { label:"🟡 Carboidrati", key:"carbs", unit:"g", best:"min" },
                    { label:"🔴 Grassi", key:"fat", unit:"g", best:"min" },
                    { label:"⚡ Calorie", key:"calories", unit:"kcal", best:"min" },
                    { label:"🍬 Zuccheri", key:"sugar", unit:"g", best:"min" },
                  ].map((m, i) => {
                    const vals = compareItems.map(s => macro(s, m.key));
                    const best = m.best==="max" ? Math.max(...vals) : Math.min(...vals.filter(v=>v>0));
                    return (
                      <tr key={m.key} style={{ background: i%2===0 ? "#F8FAFC" : "#fff", borderBottom:"1px solid #F1F5F9" }}>
                        <td style={{ padding:"14px 20px", fontSize:13, fontWeight:600, color:"#374151" }}>{m.label}</td>
                        {compareItems.map(s => {
                          const val = macro(s, m.key);
                          const isBest = val === best && compareItems.length > 1;
                          return (
                            <td key={s.id} style={{ padding:"14px 20px", textAlign:"center" }}>
                              <span style={{ fontSize:17, fontWeight:700, color: isBest ? "#6366F1" : "#1E293B", background: isBest ? "#EEF2FF" : "transparent", padding:"4px 12px", borderRadius:8, display:"inline-block" }}>
                                {val}{m.unit} {isBest && "🏆"}
                              </span>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                  <tr>
                    <td style={{ padding:"14px 20px", fontSize:13, fontWeight:600, color:"#374151" }}>🛒 Acquisto</td>
                    {compareItems.map(s => (
                      <td key={s.id} style={{ padding:"14px 20px", textAlign:"center" }}>
                        <a href={s.buy_url||"#"} target="_blank" rel="noreferrer" style={{ padding:"8px 16px", borderRadius:10, background:"linear-gradient(135deg,#6366F1,#8B5CF6)", color:"#fff", textDecoration:"none", fontSize:13, fontWeight:600, display:"inline-block" }}>Acquista</a>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* PREFERITI */}
      {page === "favs" && (
        <div style={{ maxWidth:1200, margin:"0 auto", padding:"2rem 1.5rem" }}>
          <h1 style={{ margin:"0 0 1.5rem", fontSize:28, fontWeight:800, color:"#1E293B" }}>❤️ I tuoi preferiti</h1>
          {!session ? (
            <div style={{ background:"#fff", borderRadius:20, border:"1px solid #E2E8F0", padding:"4rem", textAlign:"center" }}>
              <p style={{ fontSize:48, margin:"0 0 12px" }}>🔒</p>
              <p style={{ color:"#64748B" }}>Accedi per vedere i tuoi preferiti.</p>
              <button onClick={() => setPage("auth")} style={{ marginTop:16, padding:"10px 24px", borderRadius:10, border:"none", background:"linear-gradient(135deg,#6366F1,#8B5CF6)", color:"#fff", cursor:"pointer", fontWeight:600 }}>Accedi</button>
            </div>
          ) : favItems.length === 0 ? (
            <div style={{ background:"#fff", borderRadius:20, border:"1px solid #E2E8F0", padding:"4rem", textAlign:"center" }}>
              <p style={{ fontSize:48, margin:"0 0 12px" }}>🤍</p>
              <p style={{ color:"#64748B" }}>Non hai ancora salvato nessun preferito.</p>
              <button onClick={() => setPage("home")} style={{ marginTop:16, padding:"10px 24px", borderRadius:10, border:"none", background:"linear-gradient(135deg,#6366F1,#8B5CF6)", color:"#fff", cursor:"pointer", fontWeight:600 }}>Scopri il catalogo</button>
            </div>
          ) : (
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))", gap:20 }}>
              {favItems.map(s => <ProductCard key={s.id} s={s} favs={favs} toggleFav={toggleFav} compare={compare} toggleCompare={toggleCompare} hovered={hovered} setHovered={setHovered} />)}
            </div>
          )}
        </div>
      )}

      {/* AUTH */}
      {page === "auth" && (
        <div style={{ maxWidth:440, margin:"3rem auto", padding:"0 1.5rem" }}>
          <div style={{ background:"#fff", borderRadius:20, border:"1px solid #E2E8F0", padding:"2.5rem", boxShadow:"0 4px 24px rgba(0,0,0,0.06)" }}>
            <div style={{ textAlign:"center", marginBottom:"2rem" }}>
              <div style={{ width:52, height:52, borderRadius:14, background:"linear-gradient(135deg,#6366F1,#8B5CF6)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 12px", fontSize:24 }}>💪</div>
              <h2 style={{ margin:0, fontSize:22, fontWeight:800, color:"#1E293B" }}>{authMode==="login" ? "Bentornato!" : "Crea account"}</h2>
              <p style={{ margin:"4px 0 0", color:"#94A3B8", fontSize:14 }}>Accedi per salvare i tuoi preferiti</p>
            </div>
            <div style={{ display:"flex", marginBottom:"1.5rem", border:"1px solid #E2E8F0", borderRadius:10, overflow:"hidden" }}>
              {["login","register"].map(m => (
                <button key={m} onClick={() => { setAuthMode(m); setAuthError(""); }} style={{ flex:1, padding:"9px 0", border:"none", background: authMode===m ? "#EEF2FF" : "#fff", color: authMode===m ? "#6366F1" : "#64748B", cursor:"pointer", fontWeight: authMode===m ? 600 : 400, fontSize:14 }}>
                  {m==="login" ? "Accedi" : "Registrati"}
                </button>
              ))}
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              {authMode==="register" && (
                <div>
                  <label style={{ fontSize:13, fontWeight:600, color:"#374151", display:"block", marginBottom:6 }}>Nome completo</label>
                  <input value={authForm.name} onChange={e => setAuthForm({...authForm,name:e.target.value})} placeholder="Mario Rossi" style={{ width:"100%", boxSizing:"border-box", padding:"12px 14px", borderRadius:10, border:"1px solid #E2E8F0", fontSize:14, outline:"none" }} />
                </div>
              )}
              <div>
                <label style={{ fontSize:13, fontWeight:600, color:"#374151", display:"block", marginBottom:6 }}>Email</label>
                <input type="email" value={authForm.email} onChange={e => setAuthForm({...authForm,email:e.target.value})} placeholder="mario@email.com" style={{ width:"100%", boxSizing:"border-box", padding:"12px 14px", borderRadius:10, border:"1px solid #E2E8F0", fontSize:14, outline:"none" }} />
              </div>
              <div>
                <label style={{ fontSize:13, fontWeight:600, color:"#374151", display:"block", marginBottom:6 }}>Password</label>
                <input type="password" value={authForm.password} onChange={e => setAuthForm({...authForm,password:e.target.value})} placeholder="••••••••" onKeyDown={e => e.key==="Enter" && handleAuth()} style={{ width:"100%", boxSizing:"border-box", padding:"12px 14px", borderRadius:10, border:"1px solid #E2E8F0", fontSize:14, outline:"none" }} />
              </div>
              {authError && <p style={{ margin:0, fontSize:13, color:"#DC2626" }}>{authError}</p>}
              <button onClick={handleAuth} style={{ marginTop:4, padding:"13px 0", borderRadius:10, border:"none", background:"linear-gradient(135deg,#6366F1,#8B5CF6)", color:"#fff", cursor:"pointer", fontWeight:700, fontSize:15 }}>
                {authMode==="login" ? "Accedi" : "Crea account"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PROFILO */}
      {page === "profile" && session && (
        <div style={{ maxWidth:500, margin:"3rem auto", padding:"0 1.5rem" }}>
          <div style={{ background:"#fff", borderRadius:20, border:"1px solid #E2E8F0", padding:"2rem", boxShadow:"0 4px 24px rgba(0,0,0,0.06)" }}>
            <div style={{ display:"flex", alignItems:"center", gap:16, marginBottom:"1.5rem" }}>
              <div style={{ width:56, height:56, borderRadius:"50%", background:"linear-gradient(135deg,#6366F1,#8B5CF6)", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700, fontSize:20, color:"#fff" }}>
                {(session.user.user_metadata?.name || session.user.email).slice(0,2).toUpperCase()}
              </div>
              <div>
                <p style={{ margin:0, fontWeight:700, fontSize:16, color:"#1E293B" }}>{session.user.user_metadata?.name || "Utente"}</p>
                <p style={{ margin:0, fontSize:13, color:"#94A3B8" }}>{session.user.email}</p>
              </div>
            </div>
            <div style={{ borderTop:"1px solid #F1F5F9", paddingTop:"1rem", marginBottom:"1.5rem" }}>
              <div style={{ display:"flex", justifyContent:"space-between", fontSize:14, padding:"8px 0", borderBottom:"1px solid #F1F5F9" }}>
                <span style={{ color:"#64748B" }}>Preferiti salvati</span>
                <span style={{ fontWeight:600, color:"#1E293B" }}>{favs.length}</span>
              </div>
              <div style={{ display:"flex", justifyContent:"space-between", fontSize:14, padding:"8px 0" }}>
                <span style={{ color:"#64748B" }}>Nel confronto</span>
                <span style={{ fontWeight:600, color:"#1E293B" }}>{compare.length}</span>
              </div>
            </div>
            <div style={{ display:"flex", gap:8 }}>
              <button onClick={() => setPage("favs")} style={{ flex:1, padding:"10px 0", borderRadius:10, border:"1px solid #E2E8F0", background:"#fff", color:"#1E293B", cursor:"pointer", fontWeight:500, fontSize:13 }}>❤️ Vedi preferiti</button>
              <button onClick={handleLogout} style={{ flex:1, padding:"10px 0", borderRadius:10, border:"1px solid #FEE2E2", background:"#FFF5F5", color:"#EF4444", cursor:"pointer", fontWeight:500, fontSize:13 }}>Esci</button>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer style={{ background:"#1E293B", color:"#94A3B8", padding:"3rem 1.5rem", marginTop:"4rem" }}>
        <div style={{ maxWidth:1200, margin:"0 auto", display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:16 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:32, height:32, borderRadius:8, background:"linear-gradient(135deg,#6366F1,#8B5CF6)", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <span style={{ fontSize:16 }}>💪</span>
            </div>
            <span style={{ color:"#F1F5F9", fontWeight:700 }}>SupplementCompare</span>
          </div>
          <p style={{ margin:0, fontSize:13 }}>© 2026 SupplementCompare — Il comparatore #1 di integratori in Italia</p>
          <div style={{ display:"flex", gap:16, fontSize:13 }}>
            <span style={{ cursor:"pointer" }}>Privacy</span>
            <span style={{ cursor:"pointer" }}>Termini</span>
            <span style={{ cursor:"pointer" }}>Contatti</span>
          </div>
        </div>
      </footer>
    </div>
  );
}