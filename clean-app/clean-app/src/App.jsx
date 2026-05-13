import { useState } from "react";
import { callClaude, EMAIL_SYSTEM, PRODUCT_SYSTEM, MARKETING_SYSTEM } from "./claude.js";

// ── COLORS ──────────────────────────────────────────────────────
const C = {
  bg: "#0A0A0F", surface: "#13131A", border: "#1E1E2A", borderHover: "#2E2E40",
  text: "#E2DDD6", muted: "#5A5A6E", accent: "#6EE7B7", accentDim: "#1A3D30",
  warn: "#FCD34D", warnDim: "#3D3010", danger: "#F87171", dangerDim: "#3D1010",
  blue: "#60A5FA", blueDim: "#102040",
};

const tabs = [
  { id: "overview", zh: "总览", en: "Overview", icon: "◈" },
  { id: "email", zh: "自动回邮", en: "Auto Email", icon: "✉" },
  { id: "delivery", zh: "本地配送", en: "Local Delivery", icon: "⊛" },
  { id: "marketing", zh: "推广工具", en: "Marketing", icon: "◉" },
  { id: "products", zh: "新产品", en: "Products", icon: "⊕" },
];

const mockZones = [
  { code: "50000", city: "Kuala Lumpur", active: true, orders: 12 },
  { code: "50450", city: "Kuala Lumpur", active: true, orders: 8 },
  { code: "50460", city: "Kuala Lumpur", active: true, orders: 5 },
  { code: "68000", city: "Ampang", active: false, orders: 0 },
  { code: "41000", city: "Klang", active: false, orders: 0 },
];

const mockProducts = [
  { id: 1, name: "经典帆布包", price: "RM 89", stock: 45, status: "active", category: "包包" },
  { id: 2, name: "真皮钱包", price: "RM 159", stock: 12, status: "active", category: "配件" },
  { id: 3, name: "手机壳 iPhone 15", price: "RM 39", stock: 0, status: "draft", category: "手机配件" },
];

const mockStats = [
  { zh: "今日订单", en: "Orders Today", value: "24", delta: "+12%", color: C.accent },
  { zh: "本地配送", en: "Local Deliveries", value: "8", delta: "+3", color: C.blue },
  { zh: "待回邮件", en: "Pending Emails", value: "5", delta: "-2", color: C.warn },
  { zh: "推广触达", en: "Marketing Reach", value: "1.2k", delta: "+8%", color: C.accent },
];

const catColors = {
  "订单状态/物流": { bg: C.blueDim, text: C.blue, border: "#1E3A5F" },
  "退换货申请": { bg: C.accentDim, text: C.accent, border: "#1A4A35" },
  "商品咨询": { bg: C.warnDim, text: C.warn, border: "#4A3A10" },
  "投诉/差评": { bg: C.dangerDim, text: C.danger, border: "#4A1A1A" },
  "其他": { bg: "#1A1A2A", text: "#A78BFA", border: "#2A2A4A" },
};

const marketingTemplates = [
  { zh: "首页Banner", en: "Homepage Banner", prompt: "生成首页Banner文案，推广本地当日达配送服务" },
  { zh: "邮件通知", en: "Email to Locals", prompt: "生成邮件通知现有本地客户，告知当日/次日达配送服务" },
  { zh: "社交媒体", en: "Social Media", prompt: "生成Instagram/Facebook帖子，推广本地配送当日达，要有吸引力" },
  { zh: "促销短信", en: "Promo SMS", prompt: "生成促销短信，通知本地客户当日达配送，不超过70字" },
];

// ── SHARED COMPONENTS ────────────────────────────────────────────
function Btn({ children, onClick, variant = "primary", disabled, style = {} }) {
  const base = {
    border: "none", borderRadius: 6, cursor: disabled ? "not-allowed" : "pointer",
    fontSize: 12, fontFamily: "sans-serif", letterSpacing: 0.5,
    padding: "8px 16px", transition: "all 0.15s", fontWeight: 500,
  };
  const variants = {
    primary: { background: disabled ? C.border : C.accent, color: disabled ? C.muted : "#0A0A0F" },
    ghost: { background: "transparent", color: C.muted, border: `1px solid ${C.border}` },
  };
  return <button onClick={onClick} disabled={disabled} style={{ ...base, ...variants[variant], ...style }}>{children}</button>;
}

function Card({ children, style = {} }) {
  return <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 20, ...style }}>{children}</div>;
}

function Label({ zh, en }) {
  return (
    <span style={{ fontSize: 11, color: C.muted, letterSpacing: 2, textTransform: "uppercase", fontFamily: "sans-serif" }}>
      {zh} <span style={{ opacity: 0.5 }}>/ {en}</span>
    </span>
  );
}

function Textarea({ value, onChange, placeholder, rows = 4 }) {
  const [focused, setFocused] = useState(false);
  return (
    <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows}
      onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
      style={{
        width: "100%", background: C.bg, border: `1px solid ${focused ? C.borderHover : C.border}`,
        borderRadius: 8, padding: "12px", color: C.text, fontSize: 13, fontFamily: "sans-serif",
        resize: "vertical", outline: "none", lineHeight: 1.6, boxSizing: "border-box", transition: "border-color 0.15s",
      }} />
  );
}

function CopyBtn({ text }) {
  const [copied, setCopied] = useState(false);
  return (
    <Btn variant="ghost" style={{ fontSize: 11, padding: "4px 12px" }}
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}>
      {copied ? "✓ 已复制" : "复制"}
    </Btn>
  );
}

// ── OVERVIEW ─────────────────────────────────────────────────────
function Overview({ setTab }) {
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 12, marginBottom: 24 }}>
        {mockStats.map((s, i) => (
          <Card key={i}>
            <div style={{ fontSize: 11, color: C.muted, fontFamily: "sans-serif", marginBottom: 8 }}>{s.zh} / {s.en}</div>
            <div style={{ fontSize: 28, color: s.color, fontFamily: "Georgia,serif", lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: 11, color: C.muted, fontFamily: "sans-serif", marginTop: 4 }}>{s.delta} vs yesterday</div>
          </Card>
        ))}
      </div>
      <div style={{ marginBottom: 12 }}><Label zh="快速操作" en="Quick Actions" /></div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {[
          { zh: "回复客户邮件", en: "Reply Emails", tab: "email", icon: "✉", color: C.blue },
          { zh: "管理配送区域", en: "Delivery Zones", tab: "delivery", icon: "⊛", color: C.accent },
          { zh: "生成推广文案", en: "Generate Copy", tab: "marketing", icon: "◉", color: C.warn },
          { zh: "加新产品", en: "Add Product", tab: "products", icon: "⊕", color: "#A78BFA" },
        ].map((a, i) => (
          <button key={i} onClick={() => setTab(a.tab)}
            style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: "14px", cursor: "pointer", textAlign: "left", transition: "border-color 0.15s" }}
            onMouseEnter={e => e.currentTarget.style.borderColor = C.borderHover}
            onMouseLeave={e => e.currentTarget.style.borderColor = C.border}>
            <div style={{ fontSize: 18, marginBottom: 6 }}>{a.icon}</div>
            <div style={{ fontSize: 12, color: a.color, fontFamily: "sans-serif", fontWeight: 500 }}>{a.zh}</div>
            <div style={{ fontSize: 10, color: C.muted, fontFamily: "sans-serif" }}>{a.en}</div>
          </button>
        ))}
      </div>
      <Card style={{ marginTop: 16 }}>
        <Label zh="系统状态" en="System Status" />
        <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 10 }}>
          {[
            { name: "Claude AI 回邮", ok: true, status: "运行中" },
            { name: "Shopify 本地配送", ok: true, status: "已启用" },
            { name: "Klaviyo 邮件推广", ok: false, status: "待配置" },
          ].map((s, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 12, color: C.text, fontFamily: "sans-serif" }}>{s.name}</span>
              <span style={{ fontSize: 11, padding: "2px 10px", borderRadius: 20, fontFamily: "sans-serif", background: s.ok ? C.accentDim : C.warnDim, color: s.ok ? C.accent : C.warn, border: `1px solid ${s.ok ? "#1A4A35" : "#4A3A10"}` }}>{s.status}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ── EMAIL TAB ────────────────────────────────────────────────────
function EmailTab() {
  const [input, setInput] = useState("");
  const [reply, setReply] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(false);

  async function generate() {
    setLoading(true); setReply(""); setCategory("");
    try {
      const text = await callClaude({ system: EMAIL_SYSTEM, userContent: `请回复以下客户邮件：\n\n${input}` });
      const match = text.match(/【(.+?)】/);
      if (match) { setCategory(match[1]); setReply(text.replace(/【.+?】\n?/, "").trim()); }
      else { setReply(text.trim()); setCategory("其他"); }
    } catch { setReply("生成失败，请重试。"); }
    setLoading(false);
  }

  const cs = category ? (catColors[category] || catColors["其他"]) : null;
  const examples = [
    { label: "物流查询", text: "你好，我的订单#8821下单3天了还没收到，请问什么情况？" },
    { label: "退换货", text: "Hi, I received the wrong item. Order #9034. Can I exchange?" },
    { label: "商品咨询", text: "请问这款包包有黑色吗？防水吗？" },
    { label: "投诉", text: "非常失望！商品质量太差，要求全额退款！" },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Label zh="自动回邮" en="AI Auto-Reply" />
        <p style={{ fontSize: 12, color: C.muted, fontFamily: "sans-serif", margin: "6px 0 0" }}>Claude AI · Zoho Desk Integration</p>
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
        {examples.map(ex => (
          <button key={ex.label} onClick={() => setInput(ex.text)}
            style={{ padding: "5px 12px", background: "transparent", border: `1px solid ${C.border}`, borderRadius: 20, color: C.muted, fontSize: 11, cursor: "pointer", fontFamily: "sans-serif" }}>
            {ex.label}
          </button>
        ))}
      </div>
      <div style={{ marginBottom: 10 }}><Textarea value={input} onChange={setInput} placeholder="粘贴客户来信... / Paste customer email..." rows={4} /></div>
      <Btn onClick={generate} disabled={loading || !input.trim()} style={{ width: "100%", padding: "11px" }}>
        {loading ? "AI 生成中..." : "生成自动回复 / Generate Reply"}
      </Btn>
      {reply && (
        <Card style={{ marginTop: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Label zh="AI 回复" en="Reply" />
              {cs && <span style={{ padding: "2px 10px", background: cs.bg, color: cs.text, border: `1px solid ${cs.border}`, borderRadius: 20, fontSize: 11, fontFamily: "sans-serif" }}>{category}</span>}
            </div>
            <CopyBtn text={reply} />
          </div>
          <p style={{ fontSize: 13, lineHeight: 1.8, color: "#C8C5BF", fontFamily: "sans-serif", margin: 0, whiteSpace: "pre-wrap" }}>{reply}</p>
        </Card>
      )}
    </div>
  );
}

// ── DELIVERY TAB ─────────────────────────────────────────────────
function DeliveryTab() {
  const [zones, setZones] = useState(mockZones);
  const [newCode, setNewCode] = useState("");
  const [newCity, setNewCity] = useState("");
  const inputStyle = { flex: 1, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 6, padding: "8px 10px", color: C.text, fontSize: 12, fontFamily: "sans-serif", outline: "none" };

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Label zh="本地配送管理" en="Local Delivery Zones" />
        <p style={{ fontSize: 12, color: C.muted, fontFamily: "sans-serif", margin: "6px 0 0" }}>按邮政编码+城市双重验证 / Postcode + City Verification</p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
        <Card><div style={{ fontSize: 22, color: C.accent, fontFamily: "Georgia,serif" }}>{zones.filter(z => z.active).length}</div><div style={{ fontSize: 11, color: C.muted, fontFamily: "sans-serif", marginTop: 4 }}>启用区域 / Active Zones</div></Card>
        <Card><div style={{ fontSize: 22, color: C.blue, fontFamily: "Georgia,serif" }}>{zones.filter(z => z.active).reduce((a, z) => a + z.orders, 0)}</div><div style={{ fontSize: 11, color: C.muted, fontFamily: "sans-serif", marginTop: 4 }}>今日配送 / Today</div></Card>
      </div>
      <Card style={{ marginBottom: 12 }}>
        <Label zh="配送区域" en="Zone List" />
        <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
          {zones.map((z, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", background: C.bg, borderRadius: 8, border: `1px solid ${z.active ? "#1A4A35" : C.border}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: z.active ? C.accent : C.muted, boxShadow: z.active ? `0 0 6px ${C.accent}` : "none" }} />
                <span style={{ fontSize: 13, color: C.text, fontFamily: "monospace" }}>{z.code}</span>
                <span style={{ fontSize: 12, color: C.muted, fontFamily: "sans-serif" }}>{z.city}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {z.orders > 0 && <span style={{ fontSize: 11, color: C.blue, fontFamily: "sans-serif" }}>{z.orders} orders</span>}
                <button onClick={() => setZones(zones.map((zone, idx) => idx === i ? { ...zone, active: !zone.active } : zone))}
                  style={{ padding: "3px 10px", borderRadius: 20, fontSize: 11, cursor: "pointer", fontFamily: "sans-serif", border: "none", background: z.active ? C.accentDim : C.border, color: z.active ? C.accent : C.muted }}>
                  {z.active ? "启用" : "停用"}
                </button>
                <button onClick={() => setZones(zones.filter((_, idx) => idx !== i))}
                  style={{ background: "transparent", border: "none", color: C.muted, cursor: "pointer", fontSize: 16 }}>×</button>
              </div>
            </div>
          ))}
        </div>
      </Card>
      <Card>
        <Label zh="添加区域" en="Add Zone" />
        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <input value={newCode} onChange={e => setNewCode(e.target.value)} placeholder="邮编 / Postcode" style={{ ...inputStyle, fontFamily: "monospace" }} />
          <input value={newCity} onChange={e => setNewCity(e.target.value)} placeholder="城市 / City" style={inputStyle} />
          <Btn onClick={() => { if (newCode && newCity) { setZones([...zones, { code: newCode, city: newCity, active: true, orders: 0 }]); setNewCode(""); setNewCity(""); } }} disabled={!newCode || !newCity}>添加</Btn>
        </div>
        <p style={{ fontSize: 11, color: C.muted, fontFamily: "sans-serif", margin: "10px 0 0" }}>💡 同邮编跨城市时，城市+邮编双重验证确保只有本地客户看到配送选项</p>
      </Card>
    </div>
  );
}

// ── MARKETING TAB ────────────────────────────────────────────────
function MarketingTab() {
  const [selected, setSelected] = useState(null);
  const [custom, setCustom] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  async function generate(prompt) {
    setLoading(true); setResult("");
    try { setResult(await callClaude({ system: MARKETING_SYSTEM, userContent: prompt })); }
    catch { setResult("生成失败，请重试。"); }
    setLoading(false);
  }

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Label zh="推广工具" en="Marketing Tools" />
        <p style={{ fontSize: 12, color: C.muted, fontFamily: "sans-serif", margin: "6px 0 0" }}>AI 生成本地配送推广文案</p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
        {marketingTemplates.map((t, i) => (
          <button key={i} onClick={() => { setSelected(i); generate(t.prompt); }}
            style={{ background: selected === i ? C.accentDim : C.surface, border: `1px solid ${selected === i ? "#1A4A35" : C.border}`, borderRadius: 8, padding: "14px 12px", cursor: "pointer", textAlign: "left", transition: "all 0.15s" }}>
            <div style={{ fontSize: 12, color: selected === i ? C.accent : C.text, fontFamily: "sans-serif", fontWeight: 500 }}>{t.zh}</div>
            <div style={{ fontSize: 10, color: C.muted, fontFamily: "sans-serif", marginTop: 2 }}>{t.en}</div>
          </button>
        ))}
      </div>
      <Card style={{ marginBottom: 12 }}>
        <Label zh="自定义需求" en="Custom Request" />
        <div style={{ marginTop: 10 }}><Textarea value={custom} onChange={setCustom} placeholder="描述你想要的推广内容..." rows={3} /></div>
        <Btn onClick={() => { setSelected(null); generate(custom); }} disabled={loading || !custom.trim()} style={{ marginTop: 10 }}>生成 / Generate</Btn>
      </Card>
      {loading && <Card><div style={{ display: "flex", alignItems: "center", gap: 10 }}><div style={{ width: 8, height: 8, borderRadius: "50%", background: C.accent, animation: "pulse 1s infinite" }} /><span style={{ fontSize: 12, color: C.muted, fontFamily: "sans-serif" }}>AI 生成中...</span></div><style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}`}</style></Card>}
      {result && !loading && (
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <Label zh="生成结果" en="Generated Copy" />
            <CopyBtn text={result} />
          </div>
          <p style={{ fontSize: 13, lineHeight: 1.9, color: "#C8C5BF", fontFamily: "sans-serif", margin: 0, whiteSpace: "pre-wrap" }}>{result}</p>
        </Card>
      )}
    </div>
  );
}

// ── PRODUCTS TAB ─────────────────────────────────────────────────
function ProductsTab() {
  const [products, setProducts] = useState(mockProducts);
  const [view, setView] = useState("list");
  const [mode, setMode] = useState("manual");
  const [form, setForm] = useState({ name: "", category: "", price: "", stock: "", keywords: "" });
  const [imageDesc, setImageDesc] = useState("");
  const [bulkText, setBulkText] = useState("");
  const [generated, setGenerated] = useState(null);
  const [loading, setLoading] = useState(false);
  const [imgFile, setImgFile] = useState(null);
  const [imgPreview, setImgPreview] = useState(null);

  const inputStyle = { width: "100%", background: C.bg, border: `1px solid ${C.border}`, borderRadius: 6, padding: "9px 12px", color: C.text, fontSize: 12, fontFamily: "sans-serif", outline: "none", boxSizing: "border-box" };

  function handleImg(e) {
    const file = e.target.files[0]; if (!file) return;
    setImgFile(file);
    const reader = new FileReader();
    reader.onload = ev => setImgPreview(ev.target.result);
    reader.readAsDataURL(file);
  }

  async function generateDesc() {
    setLoading(true); setGenerated(null);
    try {
      let userContent;
      if (mode === "image" && imgFile) {
        const base64 = await new Promise(res => { const r = new FileReader(); r.onload = () => res(r.result.split(",")[1]); r.readAsDataURL(imgFile); });
        userContent = [
          { type: "image", source: { type: "base64", media_type: imgFile.type, data: base64 } },
          { type: "text", text: `请根据这张产品图片生成完整的产品文案。${imageDesc ? "补充说明：" + imageDesc : ""}` }
        ];
      } else if (mode === "bulk") {
        userContent = `以下是多个产品的基本信息，请为每个产品生成文案，用=====分隔：\n\n${bulkText}`;
      } else {
        userContent = `产品名称：${form.name}\n类别：${form.category}\n价格：${form.price}\n关键词：${form.keywords}\n请生成完整产品文案。`;
      }
      setGenerated(await callClaude({ system: PRODUCT_SYSTEM, userContent }));
      setView("generated");
    } catch { setGenerated("生成失败，请重试。"); setView("generated"); }
    setLoading(false);
  }

  function saveProduct() {
    setProducts(p => [{ id: Date.now(), name: form.name || "新产品", price: form.price || "-", stock: parseInt(form.stock) || 0, status: "draft", category: form.category || "其他" }, ...p]);
    setForm({ name: "", category: "", price: "", stock: "", keywords: "" }); setGenerated(null); setView("list");
  }

  if (view === "list") return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
        <div><Label zh="产品管理" en="Product Manager" /><p style={{ fontSize: 12, color: C.muted, fontFamily: "sans-serif", margin: "6px 0 0" }}>{products.length} 个产品 · AI 自动生成描述</p></div>
        <Btn onClick={() => setView("add")}>+ 加新产品</Btn>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {products.map(p => (
          <div key={p.id} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: "14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 13, color: C.text, fontFamily: "sans-serif", fontWeight: 500 }}>{p.name}</div>
              <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                <span style={{ fontSize: 11, color: C.muted, fontFamily: "sans-serif" }}>{p.category}</span>
                <span style={{ fontSize: 11, color: C.accent, fontFamily: "sans-serif" }}>{p.price}</span>
                <span style={{ fontSize: 11, color: p.stock === 0 ? C.danger : C.muted, fontFamily: "sans-serif" }}>{p.stock === 0 ? "缺货" : `库存 ${p.stock}`}</span>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <button onClick={() => setProducts(products.map(x => x.id === p.id ? { ...x, status: x.status === "active" ? "draft" : "active" } : x))}
                style={{ padding: "3px 10px", borderRadius: 20, fontSize: 11, cursor: "pointer", fontFamily: "sans-serif", border: "none", background: p.status === "active" ? C.accentDim : C.border, color: p.status === "active" ? C.accent : C.muted }}>
                {p.status === "active" ? "上架" : "草稿"}
              </button>
              <button onClick={() => setProducts(products.filter(x => x.id !== p.id))} style={{ background: "transparent", border: "none", color: C.muted, cursor: "pointer", fontSize: 16 }}>×</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  if (view === "add") return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <button onClick={() => setView("list")} style={{ background: "transparent", border: "none", color: C.muted, cursor: "pointer", fontSize: 18 }}>←</button>
        <Label zh="加新产品" en="Add Product" />
      </div>
      <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
        {[{ id: "manual", zh: "手动填写" }, { id: "image", zh: "上传图片 AI" }, { id: "bulk", zh: "批量上传" }].map(m => (
          <button key={m.id} onClick={() => setMode(m.id)} style={{ flex: 1, padding: "8px", borderRadius: 6, cursor: "pointer", fontFamily: "sans-serif", fontSize: 11, border: "none", background: mode === m.id ? C.accent : C.surface, color: mode === m.id ? "#0A0A0F" : C.muted }}>{m.zh}</button>
        ))}
      </div>
      {mode === "manual" && (
        <Card style={{ marginBottom: 12 }}>
          <Label zh="产品信息" en="Product Info" />
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 12 }}>
            {[{ key: "name", ph: "产品名称 / Product Name" }, { key: "category", ph: "类别 / Category" }, { key: "price", ph: "价格 / Price (e.g. RM 99)" }, { key: "stock", ph: "库存 / Stock" }, { key: "keywords", ph: "关键词 / Keywords" }].map(f => (
              <input key={f.key} value={form[f.key]} onChange={e => setForm(x => ({ ...x, [f.key]: e.target.value }))} placeholder={f.ph} style={inputStyle} />
            ))}
          </div>
        </Card>
      )}
      {mode === "image" && (
        <Card style={{ marginBottom: 12 }}>
          <Label zh="上传产品图片" en="Upload Product Image" />
          <div style={{ marginTop: 12 }}>
            <label style={{ display: "block", border: `2px dashed ${C.border}`, borderRadius: 8, padding: "24px", textAlign: "center", cursor: "pointer" }}>
              {imgPreview ? <img src={imgPreview} alt="preview" style={{ maxHeight: 160, maxWidth: "100%", borderRadius: 6 }} /> : <div><div style={{ fontSize: 28, marginBottom: 8 }}>📷</div><div style={{ fontSize: 12, color: C.muted, fontFamily: "sans-serif" }}>点击上传产品图片</div></div>}
              <input type="file" accept="image/*" onChange={handleImg} style={{ display: "none" }} />
            </label>
            <div style={{ marginTop: 10 }}><Textarea value={imageDesc} onChange={setImageDesc} placeholder="补充说明（可选）：颜色、材质、用途..." rows={2} /></div>
          </div>
        </Card>
      )}
      {mode === "bulk" && (
        <Card style={{ marginBottom: 12 }}>
          <Label zh="批量输入" en="Bulk Input" />
          <p style={{ fontSize: 11, color: C.muted, fontFamily: "sans-serif", margin: "8px 0 10px" }}>每行一个产品，格式：产品名, 类别, 价格</p>
          <Textarea value={bulkText} onChange={setBulkText} placeholder={"经典帆布包, 包包, RM89\n真皮钱包, 配件, RM159"} rows={6} />
        </Card>
      )}
      <div style={{ display: "flex", gap: 10 }}>
        <Btn onClick={generateDesc} disabled={loading || (mode === "manual" && !form.name) || (mode === "image" && !imgFile) || (mode === "bulk" && !bulkText)} style={{ flex: 1, padding: "11px" }}>
          {loading ? "AI 生成中..." : "AI 生成产品描述 / Generate"}
        </Btn>
        {mode === "manual" && <Btn onClick={saveProduct} variant="ghost" disabled={!form.name}>直接保存</Btn>}
      </div>
    </div>
  );

  if (view === "generated") return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <button onClick={() => setView("add")} style={{ background: "transparent", border: "none", color: C.muted, cursor: "pointer", fontSize: 18 }}>←</button>
        <Label zh="AI 生成结果" en="Generated Description" />
      </div>
      <Card style={{ marginBottom: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: C.accent, boxShadow: `0 0 6px ${C.accent}` }} />
            <span style={{ fontSize: 11, color: C.accent, fontFamily: "sans-serif", letterSpacing: 1 }}>AI GENERATED</span>
          </div>
          <CopyBtn text={generated} />
        </div>
        <p style={{ fontSize: 13, lineHeight: 1.9, color: "#C8C5BF", fontFamily: "sans-serif", margin: 0, whiteSpace: "pre-wrap" }}>{generated}</p>
      </Card>
      <div style={{ display: "flex", gap: 10 }}>
        <Btn onClick={saveProduct} style={{ flex: 1, padding: "11px" }}>保存产品 / Save Product</Btn>
        <Btn onClick={() => setView("add")} variant="ghost">重新生成</Btn>
      </div>
    </div>
  );
}

// ── MAIN APP ─────────────────────────────────────────────────────
export default function App() {
  const [activeTab, setActiveTab] = useState("overview");
  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text }}>
      <style>{`* { box-sizing: border-box; } textarea, input { color-scheme: dark; }`}</style>
      <div style={{ borderBottom: `1px solid ${C.border}`, padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: C.accent, boxShadow: `0 0 8px ${C.accent}` }} />
            <span style={{ fontSize: 10, letterSpacing: 3, color: C.muted, textTransform: "uppercase", fontFamily: "sans-serif" }}>Coco Island Mart · Store Manager</span>
          </div>
          <h1 style={{ fontSize: 18, fontWeight: "normal", margin: "4px 0 0", fontFamily: "Georgia,serif", color: C.text }}>Shopify Dashboard</h1>
        </div>
        <div style={{ padding: "4px 12px", background: C.accentDim, border: `1px solid #1A4A35`, borderRadius: 20, fontSize: 10, color: C.accent, fontFamily: "sans-serif", letterSpacing: 1 }}>LIVE</div>
      </div>
      <div style={{ display: "flex", borderBottom: `1px solid ${C.border}`, padding: "0 20px", overflowX: "auto" }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            style={{ padding: "12px 14px", background: "transparent", border: "none", borderBottom: `2px solid ${activeTab === t.id ? C.accent : "transparent"}`, color: activeTab === t.id ? C.accent : C.muted, fontSize: 11, fontFamily: "sans-serif", cursor: "pointer", transition: "all 0.15s", whiteSpace: "nowrap" }}>
            <span style={{ marginRight: 5 }}>{t.icon}</span>{t.zh}
          </button>
        ))}
      </div>
      <div style={{ padding: 20, maxWidth: 640, margin: "0 auto" }}>
        {activeTab === "overview" && <Overview setTab={setActiveTab} />}
        {activeTab === "email" && <EmailTab />}
        {activeTab === "delivery" && <DeliveryTab />}
        {activeTab === "marketing" && <MarketingTab />}
        {activeTab === "products" && <ProductsTab />}
      </div>
    </div>
  );
}
