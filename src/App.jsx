import React, { useState, useEffect, useMemo } from "react";
import {
  TrendingUp, TrendingDown, Wallet, Lock, LogOut, Plus, Calendar, BarChart3, FileText, Trash2, Eye, EyeOff, Sparkles, Download, Wifi, WifiOff, CalendarDays, ChevronLeft, ChevronRight, Upload, Image as ImageIcon, Loader2, X, ArrowDownCircle, ArrowUpCircle,
  UtensilsCrossed, Car, Lightbulb, ShoppingBag, Film, MoreHorizontal, Home,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart, Cell, PieChart, Pie } from "recharts";
import { collection, doc, setDoc, deleteDoc, onSnapshot, getDoc } from "firebase/firestore";
import { db } from "./firebase";

// ---------- CONFIG ----------
const DEFAULT_PASSCODE = "household2026";
const CURRENCY_SYMBOL = "฿";
const CURRENCY_CODE = "THB";
const CONFIG_DOC = doc(db, "config", "main");
const TX_COL = collection(db, "transactions");

// ---------- CATEGORIES ----------
const CATEGORIES = {
  food: { label: "Food & Drink", icon: UtensilsCrossed, color: "#f97316" }, // orange
  transport: { label: "Transport", icon: Car, color: "#06b6d4" }, // cyan
  utilities: { label: "Utilities", icon: Lightbulb, color: "#eab308" }, // yellow
  shopping: { label: "Shopping", icon: ShoppingBag, color: "#ec4899" }, // pink
  entertainment: { label: "Entertainment", icon: Film, color: "#8b5cf6" }, // violet
  other: { label: "Other", icon: MoreHorizontal, color: "#71717a" }, // zinc
};
const CATEGORY_KEYS = Object.keys(CATEGORIES);

// ---------- HELPERS ----------
const fmt = (n) => {
  const sign = n < 0 ? "-" : "";
  const abs = Math.abs(n);
  return sign + CURRENCY_SYMBOL + abs.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
};

const fmtCompact = (n) => {
  const abs = Math.abs(n);
  const sign = n < 0 ? "-" : "";
  if (abs >= 1_000_000) return sign + CURRENCY_SYMBOL + (abs / 1_000_000).toFixed(2) + "M";
  if (abs >= 1_000) return sign + CURRENCY_SYMBOL + (abs / 1_000).toFixed(1) + "K";
  return sign + CURRENCY_SYMBOL + abs.toFixed(0);
};

const today = () => new Date().toISOString().slice(0, 10);

// ---------- DATA MODEL ----------
function buildDayMap(transactions) {
  const map = {};
  transactions.forEach((t) => {
    if (!map[t.date]) {
      map[t.date] = { date: t.date, income: 0, expenses: 0, profit: 0, transactions: [] };
    }
    if (t.kind === "income") map[t.date].income += t.amount;
    else map[t.date].expenses += t.amount;
    map[t.date].transactions.push(t);
  });
  Object.values(map).forEach((d) => {
    d.profit = d.income - d.expenses;
    d.transactions.sort((a, b) => (b.time || "").localeCompare(a.time || ""));
  });
  return map;
}

// ---------- AUTH ----------
function PasscodeScreen({ onUnlock }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    try {
      const snap = await getDoc(CONFIG_DOC);
      const correct = snap.exists() ? snap.data().passcode : DEFAULT_PASSCODE;
      if (!snap.exists()) await setDoc(CONFIG_DOC, { passcode: DEFAULT_PASSCODE });
      if (code === correct) {
        sessionStorage.setItem("household:unlocked", "1");
        onUnlock();
      } else {
        setError("Incorrect passcode");
        setCode("");
      }
    } catch (e) {
      setError("Could not connect. Check Firebase config.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ background: "radial-gradient(ellipse at top, #2a1f3e 0%, #0a0d14 60%)" }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 mb-6">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #8b5cf6 0%, #c4b5fd 100%)" }}>
              <Home className="w-6 h-6 text-black" strokeWidth={2.5} />
            </div>
          </div>
          <h1 className="text-5xl font-bold tracking-tight text-white mb-2" style={{ fontFamily: "'Playfair Display', serif", letterSpacing: "-0.02em" }}>
            Household
          </h1>
          <p className="text-sm text-zinc-500 tracking-[0.3em] uppercase">Personal Ledger</p>
        </div>

        <div className="bg-zinc-900/60 backdrop-blur-xl border border-zinc-800 rounded-2xl p-8 shadow-2xl">
          <div className="flex items-center gap-3 mb-6">
            <Lock className="w-4 h-4 text-violet-400" />
            <span className="text-sm font-medium text-zinc-300 tracking-wide">Family Access</span>
          </div>
          <div className="relative">
            <input
              type={show ? "text" : "password"}
              value={code}
              onChange={(e) => { setCode(e.target.value); setError(""); }}
              onKeyDown={(e) => e.key === "Enter" && !loading && handleSubmit()}
              placeholder="Enter passcode"
              className="w-full bg-black/40 border border-zinc-800 focus:border-violet-400/60 rounded-xl px-4 py-4 text-white text-lg tracking-widest outline-none transition-colors"
              autoFocus
            />
            <button onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300">
              {show ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          {error && <p className="text-red-400 text-sm mt-3">{error}</p>}
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full mt-6 py-4 rounded-xl font-semibold text-black transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
            style={{ background: "linear-gradient(135deg, #8b5cf6 0%, #c4b5fd 100%)" }}
          >
            {loading ? "Connecting…" : "Unlock"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------- ENTRY FORM ----------
function EntryForm({ onSave, dayMap }) {
  const [date, setDate] = useState(today());
  const [kind, setKind] = useState("expense"); // expense by default for personal use
  const [category, setCategory] = useState("food");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [partner, setPartner] = useState(localStorage.getItem("household:partner") || "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const day = dayMap[date];
  const amt = parseFloat(amount) || 0;

  const handleSave = async () => {
    if (!amount || amt <= 0 || saving) return;
    setSaving(true);
    if (partner.trim()) localStorage.setItem("household:partner", partner.trim());

    const now = new Date();
    const time = now.toTimeString().slice(0, 5);
    const id = `${date}_${now.getTime()}_${Math.random().toString(36).slice(2, 7)}`;

    const tx = {
      id, date, time,
      amount: amt,
      kind,
      category: kind === "income" ? "income" : category,
      description: description.trim(),
      partner: partner.trim() || "—",
      source: "manual",
      timestamp: now.toISOString(),
    };

    try {
      await onSave(tx);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      setAmount(""); setDescription("");
    } catch (e) {
      alert("Save failed: " + e.message);
    }
    setSaving(false);
  };

  return (
    <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 md:p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 rounded-lg bg-violet-400/10 border border-violet-400/20 flex items-center justify-center">
          <Plus className="w-5 h-5 text-violet-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white" style={{ fontFamily: "'Playfair Display', serif" }}>New Transaction</h2>
          <p className="text-xs text-zinc-500">Manual entry — for cash, card, or anything without a slip</p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-zinc-400 mb-2 tracking-wide uppercase">Date</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
            <input
              type="date"
              value={date}
              max={today()}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-black/40 border border-zinc-800 rounded-lg pl-10 pr-4 py-3 text-white outline-none focus:border-violet-400/60"
            />
          </div>
        </div>

        {/* Income vs Expense toggle */}
        <div>
          <label className="block text-xs font-semibold text-zinc-400 mb-2 tracking-wide uppercase">Type</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setKind("income")}
              className={`flex items-center justify-center gap-2 py-3 rounded-lg border-2 text-sm font-medium transition ${
                kind === "income" ? "border-emerald-400/50 bg-emerald-400/10 text-emerald-300" : "border-zinc-800 text-zinc-500"
              }`}
            >
              <ArrowDownCircle className="w-4 h-4" /> Income
            </button>
            <button
              onClick={() => setKind("expense")}
              className={`flex items-center justify-center gap-2 py-3 rounded-lg border-2 text-sm font-medium transition ${
                kind === "expense" ? "border-rose-400/50 bg-rose-400/10 text-rose-300" : "border-zinc-800 text-zinc-500"
              }`}
            >
              <ArrowUpCircle className="w-4 h-4" /> Expense
            </button>
          </div>
        </div>

        {/* Category — only for expenses */}
        {kind === "expense" && (
          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-2 tracking-wide uppercase">Category</label>
            <div className="grid grid-cols-3 gap-2">
              {CATEGORY_KEYS.map((k) => {
                const cfg = CATEGORIES[k];
                const Icon = cfg.icon;
                const selected = category === k;
                return (
                  <button
                    key={k}
                    onClick={() => setCategory(k)}
                    className={`flex flex-col items-center justify-center gap-1.5 py-3 rounded-lg border-2 text-xs font-medium transition ${selected ? "" : "border-zinc-800 text-zinc-500"}`}
                    style={selected ? { borderColor: cfg.color, background: cfg.color + "1a", color: cfg.color } : {}}
                  >
                    <Icon className="w-4 h-4" />
                    {cfg.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-zinc-400 mb-2 tracking-wide uppercase">Amount ({CURRENCY_CODE})</label>
          <input
            type="number"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0"
            className="w-full bg-black/40 border border-zinc-800 rounded-lg px-4 py-3 text-white text-lg outline-none focus:border-violet-400/60"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-zinc-400 mb-2 tracking-wide uppercase">Description (optional)</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={kind === "income" ? "Source / details" : "What was it for?"}
            className="w-full bg-black/40 border border-zinc-800 rounded-lg px-4 py-3 text-white outline-none focus:border-violet-400/60"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-zinc-400 mb-2 tracking-wide uppercase">Logged by</label>
          <input
            type="text"
            value={partner}
            onChange={(e) => setPartner(e.target.value)}
            placeholder="Your name"
            className="w-full bg-black/40 border border-zinc-800 rounded-lg px-4 py-3 text-white outline-none focus:border-violet-400/60"
          />
        </div>

        {day && (day.income > 0 || day.expenses > 0) && (
          <div className="p-3 rounded-lg bg-black/40 border border-zinc-800 text-xs">
            <div className="text-zinc-500 uppercase tracking-wider mb-2">{date} so far</div>
            <div className="grid grid-cols-2 gap-2">
              <div><span className="text-zinc-500">In:</span> <span className="text-emerald-400 font-medium ml-1">{fmtCompact(day.income)}</span></div>
              <div><span className="text-zinc-500">Out:</span> <span className="text-rose-400 font-medium ml-1">{fmtCompact(day.expenses)}</span></div>
            </div>
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={saving || !amount || amt <= 0}
          className="w-full py-4 rounded-xl font-semibold text-black transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-40"
          style={{ background: saving ? "#8b5cf6" : "linear-gradient(135deg, #8b5cf6 0%, #c4b5fd 100%)" }}
        >
          {saving ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Saving…
            </span>
          ) : saved ? "✓ Saved" : `Save ${kind === "income" ? "income" : "expense"}`}
        </button>
      </div>
    </div>
  );
}

// ---------- SLIP UPLOAD ----------
function SlipUpload({ onSave }) {
  const [date, setDate] = useState(today());
  const [kind, setKind] = useState(null); // "income" or "expense"
  const [category, setCategory] = useState("food");
  const [files, setFiles] = useState([]);
  const [results, setResults] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  const parseAmount = (text) => {
    const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

    // Pass 1: Look for "Amount" label followed by number
    for (const line of lines) {
      if (/amount/i.test(line)) {
        const m = line.match(/([\d,]+\.?\d{0,2})/g);
        if (m) {
          const nums = m.map(s => parseFloat(s.replace(/,/g, "")));
          const valid = nums.filter(n => !isNaN(n) && n >= 1);
          if (valid.length) return Math.max(...valid);
        }
      }
    }

    // Pass 2: number followed by Baht/THB/B
    for (const line of lines) {
      const m = line.match(/([\d,]+\.?\d{0,2})\s*(?:baht|thb|฿)/i);
      if (m) {
        const num = parseFloat(m[1].replace(/,/g, ""));
        if (num >= 1) return num;
      }
    }

    // Pass 3: largest reasonable number
    const allNums = (text.match(/[\d,]+\.?\d{0,2}/g) || [])
      .map(n => parseFloat(n.replace(/,/g, "")))
      .filter(n => !isNaN(n) && n >= 1 && n < 10_000_000);
    if (allNums.length) return Math.max(...allNums);

    return null;
  };

  const handlePickFiles = (k) => (e) => {
    const picked = Array.from(e.target.files || []);
    if (picked.length === 0) return;
    setKind(k);
    setFiles(picked);
    setResults([]);
    setSaveMsg("");
  };

  const processFiles = async () => {
    if (files.length === 0) return;
    setProcessing(true);
    setProgress({ current: 0, total: files.length });
    setResults([]);

    const Tesseract = (await import("tesseract.js")).default;

    const out = [];
    for (let i = 0; i < files.length; i++) {
      setProgress({ current: i + 1, total: files.length });
      const uid = `${Date.now()}_${i}_${Math.random().toString(36).slice(2, 9)}`;
      try {
        const { data } = await Tesseract.recognize(files[i], "eng");
        const amount = parseAmount(data.text);
        out.push({ uid, fileName: files[i].name, fileUrl: URL.createObjectURL(files[i]), amount, error: false });
      } catch (err) {
        out.push({ uid, fileName: files[i].name, fileUrl: URL.createObjectURL(files[i]), amount: null, error: true });
      }
      setResults([...out]);
    }
    setProcessing(false);
  };

  const updateAmount = (idx, val) => {
    setResults((prev) => prev.map((r, i) => (i === idx ? { ...r, amount: val } : r)));
  };
  const removeResult = (idx) => setResults((prev) => prev.filter((_, i) => i !== idx));

  const reset = () => {
    setFiles([]); setResults([]); setKind(null); setSaveMsg("");
  };

  const totals = useMemo(() => {
    let sum = 0, ready = 0;
    results.forEach(r => {
      if (r.amount && r.amount > 0) { sum += r.amount; ready++; }
    });
    return { sum, ready };
  }, [results]);

  const handleSave = async () => {
    if (totals.ready === 0 || !kind || saving) return;
    setSaving(true);
    setSaveMsg("");

    const partner = localStorage.getItem("household:partner") || "—";
    const now = new Date();
    const toSave = results.filter(r => r.amount && r.amount > 0);
    const savedSum = toSave.reduce((s, r) => s + r.amount, 0);
    const savedCount = toSave.length;
    const savedKind = kind;
    const savedDate = date;

    try {
      for (const r of toSave) {
        const id = `${date}_slip_${r.uid}`;
        const tx = {
          id, date,
          time: now.toTimeString().slice(0, 5),
          amount: r.amount,
          kind,
          category: kind === "income" ? "income" : category,
          description: "",
          partner,
          source: "slip",
          timestamp: new Date().toISOString(),
        };
        await onSave(tx);
      }
      setFiles([]); setResults([]); setKind(null);
      setSaveMsg(`✓ Added ${savedCount} ${savedKind} transaction${savedCount > 1 ? "s" : ""} (${fmt(savedSum)}) to ${savedDate}`);
      setTimeout(() => setSaveMsg(""), 4000);
    } catch (err) {
      setSaveMsg("Save failed: " + err.message);
    }
    setSaving(false);
  };

  const isIncome = kind === "income";
  const isExpense = kind === "expense";

  return (
    <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 md:p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 rounded-lg bg-violet-400/10 border border-violet-400/20 flex items-center justify-center">
          <Upload className="w-5 h-5 text-violet-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white" style={{ fontFamily: "'Playfair Display', serif" }}>Upload Slips</h2>
          <p className="text-xs text-zinc-500">SCB, KBank, Bangkok Bank, etc.</p>
        </div>
      </div>

      <div className="mb-5">
        <label className="block text-xs font-semibold text-zinc-400 mb-2 tracking-wide uppercase">Apply to date</label>
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
          <input
            type="date"
            value={date}
            max={today()}
            onChange={(e) => setDate(e.target.value)}
            className="w-full bg-black/40 border border-zinc-800 rounded-lg pl-10 pr-4 py-3 text-white outline-none focus:border-violet-400/60"
          />
        </div>
      </div>

      {!kind && (
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col items-center justify-center gap-2 px-4 py-8 rounded-xl border-2 border-emerald-400/30 bg-emerald-400/5 hover:bg-emerald-400/10 cursor-pointer transition">
            <ArrowDownCircle className="w-8 h-8 text-emerald-400" />
            <span className="text-sm font-semibold text-emerald-300">Income</span>
            <span className="text-xs text-zinc-500 text-center">Money received</span>
            <input type="file" accept="image/*" multiple onChange={handlePickFiles("income")} className="hidden" />
          </label>
          <label className="flex flex-col items-center justify-center gap-2 px-4 py-8 rounded-xl border-2 border-rose-400/30 bg-rose-400/5 hover:bg-rose-400/10 cursor-pointer transition">
            <ArrowUpCircle className="w-8 h-8 text-rose-400" />
            <span className="text-sm font-semibold text-rose-300">Expense</span>
            <span className="text-xs text-zinc-500 text-center">Money paid out</span>
            <input type="file" accept="image/*" multiple onChange={handlePickFiles("expense")} className="hidden" />
          </label>
        </div>
      )}

      {kind && (
        <>
          <div className={`flex items-center justify-between p-3 rounded-lg mb-4 ${isIncome ? "bg-emerald-400/10 border border-emerald-400/20" : "bg-rose-400/10 border border-rose-400/20"}`}>
            <div className="flex items-center gap-2">
              {isIncome ? <ArrowDownCircle className="w-5 h-5 text-emerald-400" /> : <ArrowUpCircle className="w-5 h-5 text-rose-400" />}
              <span className={`text-sm font-semibold ${isIncome ? "text-emerald-300" : "text-rose-300"}`}>
                {isIncome ? "Income slips" : "Expense slips"} · {files.length} selected
              </span>
            </div>
            <button onClick={reset} className="text-xs text-zinc-400 hover:text-white">Change</button>
          </div>

          {/* Category picker for expense slips */}
          {isExpense && results.length === 0 && (
            <div className="mb-4">
              <label className="block text-xs font-semibold text-zinc-400 mb-2 tracking-wide uppercase">Category for these slips</label>
              <div className="grid grid-cols-3 gap-2">
                {CATEGORY_KEYS.map((k) => {
                  const cfg = CATEGORIES[k];
                  const Icon = cfg.icon;
                  const selected = category === k;
                  return (
                    <button
                      key={k}
                      onClick={() => setCategory(k)}
                      className={`flex flex-col items-center justify-center gap-1.5 py-3 rounded-lg border-2 text-xs font-medium transition ${selected ? "" : "border-zinc-800 text-zinc-500"}`}
                      style={selected ? { borderColor: cfg.color, background: cfg.color + "1a", color: cfg.color } : {}}
                    >
                      <Icon className="w-4 h-4" />
                      {cfg.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {files.length > 0 && results.length === 0 && (
            <button
              onClick={processFiles}
              disabled={processing}
              className="w-full py-4 rounded-xl font-semibold text-black transition-all hover:opacity-90 disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, #8b5cf6 0%, #c4b5fd 100%)" }}
            >
              {processing ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Reading slip {progress.current} of {progress.total}…
                </span>
              ) : `Read ${files.length} slip${files.length > 1 ? "s" : ""}`}
            </button>
          )}

          {results.length > 0 && (
            <>
              <div className="mt-6 mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-zinc-300">Extracted Amounts</h3>
                <span className="text-xs text-zinc-500">{totals.ready} of {results.length} ready</span>
              </div>
              <div className="space-y-3">
                {results.map((r, idx) => (
                  <div key={idx} className="bg-black/40 border border-zinc-800 rounded-xl p-3">
                    <div className="flex gap-3 items-center">
                      <img src={r.fileUrl} alt="slip" className="w-14 h-14 object-cover rounded-lg border border-zinc-800 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        {r.error && <p className="text-xs text-rose-400">Could not read — enter manually</p>}
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={r.amount || ""}
                            onChange={(e) => updateAmount(idx, parseFloat(e.target.value) || null)}
                            placeholder="Amount"
                            className={`flex-1 bg-zinc-900 border rounded px-3 py-2 text-white text-base outline-none ${
                              isIncome ? "border-emerald-400/30 focus:border-emerald-400/60" : "border-rose-400/30 focus:border-rose-400/60"
                            }`}
                          />
                          <span className="text-xs text-zinc-500">{CURRENCY_SYMBOL}</span>
                        </div>
                      </div>
                      <button onClick={() => removeResult(idx)} className="text-zinc-500 hover:text-rose-400">
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {!processing && totals.ready > 0 && (
                <div className={`mt-6 p-4 rounded-xl ${isIncome ? "bg-emerald-400/5 border border-emerald-400/20" : "bg-rose-400/5 border border-rose-400/20"}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-zinc-400">Total {isIncome ? "income" : "expenses"} to add</span>
                    <span className={`text-2xl font-bold ${isIncome ? "text-emerald-400" : "text-rose-400"}`} style={{ fontFamily: "'Playfair Display', serif" }}>
                      {fmt(totals.sum)}
                    </span>
                  </div>
                  {isExpense && (
                    <div className="text-xs text-zinc-500 mt-1">All as: {CATEGORIES[category].label}</div>
                  )}
                </div>
              )}

              {!processing && (
                <button
                  onClick={handleSave}
                  disabled={saving || totals.ready === 0}
                  className="w-full mt-4 py-4 rounded-xl font-semibold text-black transition-all hover:opacity-90 disabled:opacity-60"
                  style={{ background: saving ? "#8b5cf6" : "linear-gradient(135deg, #8b5cf6 0%, #c4b5fd 100%)" }}
                >
                  {saving ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving {totals.ready} transaction{totals.ready > 1 ? "s" : ""}…
                    </span>
                  ) : `Save to ${date}`}
                </button>
              )}

              {saveMsg && <p className="text-sm text-emerald-400 mt-3 text-center">{saveMsg}</p>}
            </>
          )}
        </>
      )}

      <p className="text-xs text-zinc-600 mt-6 leading-relaxed flex items-center gap-1.5">
        <Lock className="w-3 h-3" /> Slips processed on your device — never uploaded
      </p>
    </div>
  );
}

// ---------- KPI CARD ----------
function KpiCard({ label, value, sub, accent, icon }) {
  return (
    <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5 relative overflow-hidden">
      <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full opacity-10" style={{ background: accent }} />
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">{label}</span>
        <div className="w-7 h-7 rounded-md flex items-center justify-center" style={{ background: accent + "20", color: accent }}>{icon}</div>
      </div>
      <div className="text-xl md:text-2xl font-bold text-white" style={{ fontFamily: "'Playfair Display', serif" }}>{value}</div>
      {sub && <div className="text-xs text-zinc-500 mt-1">{sub}</div>}
    </div>
  );
}

// ---------- DASHBOARD ----------
function Dashboard({ entries, transactions }) {
  const stats = useMemo(() => {
    const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
    const totalIncome = entries.reduce((s, e) => s + e.income, 0);
    const totalExpenses = entries.reduce((s, e) => s + e.expenses, 0);
    const totalProfit = totalIncome - totalExpenses;
    const last7 = sorted.slice(-7);
    const sum7 = last7.reduce((s, e) => s + e.profit, 0);

    let running = 0;
    const chartData = sorted.map(e => {
      running += e.profit;
      return { date: e.date.slice(5), cumulative: running };
    });

    // Category breakdown
    const catTotals = {};
    transactions.forEach(t => {
      if (t.kind === "expense") {
        catTotals[t.category] = (catTotals[t.category] || 0) + t.amount;
      }
    });
    const pieData = CATEGORY_KEYS
      .map(k => ({ name: CATEGORIES[k].label, value: catTotals[k] || 0, color: CATEGORIES[k].color, key: k }))
      .filter(d => d.value > 0);

    return { totalIncome, totalExpenses, totalProfit, sum7, chartData, last30Data: chartData.slice(-30), pieData };
  }, [entries, transactions]);

  if (entries.length === 0) {
    return (
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-12 text-center">
        <BarChart3 className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-white mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>No data yet</h3>
        <p className="text-zinc-500 text-sm">Add your first transaction to see the dashboard.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="Net" value={fmtCompact(stats.totalProfit)} sub="Income − Expenses" accent={stats.totalProfit >= 0 ? "#10b981" : "#f43f5e"} icon={<Wallet className="w-4 h-4" />} />
        <KpiCard label="Income" value={fmtCompact(stats.totalIncome)} sub="All time" accent="#8b5cf6" icon={<TrendingUp className="w-4 h-4" />} />
        <KpiCard label="Expenses" value={fmtCompact(stats.totalExpenses)} sub="All time" accent="#f43f5e" icon={<TrendingDown className="w-4 h-4" />} />
        <KpiCard label="Last 7 Days" value={fmtCompact(stats.sum7)} sub="Net" accent="#0ea5e9" icon={<Calendar className="w-4 h-4" />} />
      </div>

      {/* Spending by category pie */}
      {stats.pieData.length > 0 && (
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6">
          <div className="mb-4">
            <h3 className="text-lg font-bold text-white" style={{ fontFamily: "'Playfair Display', serif" }}>Spending by Category</h3>
            <p className="text-xs text-zinc-500">All-time breakdown</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={stats.pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={85} dataKey="value">
                    {stats.pieData.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: "#0a0a0a", border: "1px solid #27272a", borderRadius: 8 }}
                    formatter={(v) => fmt(v)}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2">
              {stats.pieData
                .sort((a, b) => b.value - a.value)
                .map((d) => {
                  const pct = stats.totalExpenses > 0 ? (d.value / stats.totalExpenses) * 100 : 0;
                  return (
                    <div key={d.key} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ background: d.color }} />
                        <span className="text-zinc-300">{d.name}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-white font-medium">{fmtCompact(d.value)}</div>
                        <div className="text-xs text-zinc-500">{pct.toFixed(1)}%</div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* Cumulative net chart */}
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6">
        <div className="mb-4">
          <h3 className="text-lg font-bold text-white" style={{ fontFamily: "'Playfair Display', serif" }}>Cumulative Net</h3>
        </div>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={stats.chartData}>
              <defs>
                <linearGradient id="cumGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#27272a" strokeDasharray="3 3" />
              <XAxis dataKey="date" stroke="#71717a" fontSize={11} />
              <YAxis stroke="#71717a" fontSize={11} tickFormatter={fmtCompact} />
              <Tooltip contentStyle={{ background: "#0a0a0a", border: "1px solid #27272a", borderRadius: 8 }} formatter={(v) => fmt(v)} />
              <Area type="monotone" dataKey="cumulative" stroke="#8b5cf6" strokeWidth={2} fill="url(#cumGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// ---------- HISTORY ----------
function History({ entries, onDeleteTransaction }) {
  const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date));
  const [expanded, setExpanded] = useState(null);
  const [confirmId, setConfirmId] = useState(null);

  if (entries.length === 0) {
    return (
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-12 text-center">
        <FileText className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
        <p className="text-zinc-500">No transactions yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl overflow-hidden">
      <div className="p-6 border-b border-zinc-800">
        <h3 className="text-lg font-bold text-white" style={{ fontFamily: "'Playfair Display', serif" }}>Ledger</h3>
        <p className="text-xs text-zinc-500">{entries.length} {entries.length === 1 ? "day" : "days"} · tap to expand</p>
      </div>
      <div className="divide-y divide-zinc-800">
        {sorted.map((day) => {
          const isOpen = expanded === day.date;
          return (
            <div key={day.date}>
              <button onClick={() => { setExpanded(isOpen ? null : day.date); setConfirmId(null); }} className="w-full text-left p-4 md:px-6 hover:bg-black/20 transition">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <ChevronRight className={`w-4 h-4 text-zinc-500 transition-transform flex-shrink-0 ${isOpen ? "rotate-90" : ""}`} />
                    <div className="min-w-0">
                      <div className="text-white font-semibold">{day.date}</div>
                      <div className="text-xs text-zinc-500">{day.transactions.length} transaction{day.transactions.length !== 1 ? "s" : ""}</div>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className={`text-lg font-bold ${day.profit >= 0 ? "text-emerald-400" : "text-rose-400"}`} style={{ fontFamily: "'Playfair Display', serif" }}>
                      {fmtCompact(day.profit)}
                    </div>
                    <div className="text-xs text-zinc-500">
                      <span className="text-emerald-400">{fmtCompact(day.income)}</span>
                      <span className="mx-1">·</span>
                      <span className="text-rose-400">{fmtCompact(day.expenses)}</span>
                    </div>
                  </div>
                </div>
              </button>
              {isOpen && (
                <div className="bg-black/30 px-4 md:px-6 py-3 border-t border-zinc-800 space-y-2">
                  {day.transactions.map((tx) => {
                    const cfg = tx.kind === "expense" ? CATEGORIES[tx.category] : null;
                    const Icon = cfg ? cfg.icon : ArrowDownCircle;
                    const color = cfg ? cfg.color : "#10b981";
                    return (
                      <div key={tx.id} className="p-3 rounded-lg bg-zinc-900 border border-zinc-800">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <div className="flex-shrink-0" style={{ color }}><Icon className="w-4 h-4" /></div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-bold" style={{ color: tx.kind === "income" ? "#10b981" : "#f43f5e" }}>
                                  {tx.kind === "income" ? "+" : "-"}{fmt(tx.amount)}
                                </span>
                                <span className="text-[10px] uppercase tracking-wider text-zinc-500">
                                  {tx.kind === "income" ? "Income" : (cfg ? cfg.label : "Expense")}
                                </span>
                                {tx.source === "slip" && <span className="text-[10px] uppercase tracking-wider text-violet-400/80">Slip</span>}
                              </div>
                              <div className="text-xs text-zinc-500 mt-0.5 truncate">
                                {tx.time && <span>{tx.time}</span>}
                                {tx.description && <span> · {tx.description}</span>}
                                {tx.partner && tx.partner !== "—" && <span> · {tx.partner}</span>}
                              </div>
                            </div>
                          </div>
                          {confirmId === tx.id ? (
                            <div className="flex gap-2 flex-shrink-0">
                              <button onClick={() => { onDeleteTransaction(tx.id); setConfirmId(null); }} className="text-rose-400 text-xs font-semibold">Confirm</button>
                              <button onClick={() => setConfirmId(null)} className="text-zinc-500 text-xs">Cancel</button>
                            </div>
                          ) : (
                            <button onClick={() => setConfirmId(tx.id)} className="text-zinc-500 hover:text-rose-400 flex-shrink-0">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------- MONTHLY ----------
function Monthly({ entries, transactions }) {
  const months = useMemo(() => {
    const map = {};
    entries.forEach(e => {
      const ym = e.date.slice(0, 7);
      if (!map[ym]) map[ym] = { ym, days: [], income: 0, expenses: 0, profit: 0 };
      map[ym].days.push(e);
      map[ym].income += e.income;
      map[ym].expenses += e.expenses;
      map[ym].profit += e.profit;
    });
    return Object.values(map).sort((a, b) => b.ym.localeCompare(a.ym));
  }, [entries]);

  const [selectedYm, setSelectedYm] = useState(null);
  useEffect(() => {
    if (months.length > 0 && !selectedYm) setSelectedYm(months[0].ym);
  }, [months, selectedYm]);

  if (entries.length === 0) {
    return (
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-12 text-center">
        <CalendarDays className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
        <p className="text-zinc-500">No data yet.</p>
      </div>
    );
  }

  const selectedMonth = months.find(m => m.ym === selectedYm) || months[0];
  const selectedIdx = months.findIndex(m => m.ym === selectedMonth.ym);
  const prevMonth = selectedIdx < months.length - 1 ? months[selectedIdx + 1] : null;
  const monthLabel = (ym) => {
    const [y, m] = ym.split("-");
    return new Date(parseInt(y), parseInt(m) - 1, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
  };

  // Category breakdown for selected month
  const monthTxs = transactions.filter(t => t.date.startsWith(selectedMonth.ym));
  const catTotals = {};
  monthTxs.forEach(t => {
    if (t.kind === "expense") catTotals[t.category] = (catTotals[t.category] || 0) + t.amount;
  });
  const monthPie = CATEGORY_KEYS
    .map(k => ({ name: CATEGORIES[k].label, value: catTotals[k] || 0, color: CATEGORIES[k].color, key: k }))
    .filter(d => d.value > 0);

  const dailyData = [...selectedMonth.days].sort((a, b) => a.date.localeCompare(b.date)).map(e => ({ date: e.date.slice(8), profit: e.profit }));

  return (
    <div className="space-y-6">
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4 md:p-6">
        <div className="flex items-center justify-between gap-3">
          <button onClick={() => prevMonth && setSelectedYm(prevMonth.ym)} disabled={!prevMonth} className="w-10 h-10 rounded-lg bg-black/40 border border-zinc-800 flex items-center justify-center text-zinc-400 disabled:opacity-30">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 text-center">
            <div className="text-xs text-zinc-500 uppercase tracking-[0.25em] mb-1">Viewing</div>
            <select value={selectedMonth.ym} onChange={(e) => setSelectedYm(e.target.value)} className="bg-transparent text-white text-xl md:text-2xl font-bold text-center outline-none cursor-pointer" style={{ fontFamily: "'Playfair Display', serif" }}>
              {months.map(m => <option key={m.ym} value={m.ym} className="bg-zinc-900">{monthLabel(m.ym)}</option>)}
            </select>
          </div>
          <button onClick={() => selectedIdx > 0 && setSelectedYm(months[selectedIdx - 1].ym)} disabled={selectedIdx === 0} className="w-10 h-10 rounded-lg bg-black/40 border border-zinc-800 flex items-center justify-center text-zinc-400 disabled:opacity-30">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <KpiCard label="Net" value={fmtCompact(selectedMonth.profit)} sub={`${selectedMonth.days.length} days`} accent={selectedMonth.profit >= 0 ? "#10b981" : "#f43f5e"} icon={<Wallet className="w-4 h-4" />} />
        <KpiCard label="Income" value={fmtCompact(selectedMonth.income)} sub="" accent="#8b5cf6" icon={<TrendingUp className="w-4 h-4" />} />
        <KpiCard label="Expenses" value={fmtCompact(selectedMonth.expenses)} sub="" accent="#f43f5e" icon={<TrendingDown className="w-4 h-4" />} />
      </div>

      {monthPie.length > 0 && (
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-white mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>Categories — {monthLabel(selectedMonth.ym)}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={monthPie} cx="50%" cy="50%" innerRadius={50} outerRadius={85} dataKey="value">
                    {monthPie.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: "#0a0a0a", border: "1px solid #27272a", borderRadius: 8 }} formatter={(v) => fmt(v)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2">
              {monthPie.sort((a, b) => b.value - a.value).map(d => {
                const pct = selectedMonth.expenses > 0 ? (d.value / selectedMonth.expenses) * 100 : 0;
                return (
                  <div key={d.key} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ background: d.color }} />
                      <span className="text-zinc-300">{d.name}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-white font-medium">{fmtCompact(d.value)}</div>
                      <div className="text-xs text-zinc-500">{pct.toFixed(1)}%</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6">
        <h3 className="text-lg font-bold text-white mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>Daily Net</h3>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dailyData}>
              <CartesianGrid stroke="#27272a" strokeDasharray="3 3" />
              <XAxis dataKey="date" stroke="#71717a" fontSize={11} />
              <YAxis stroke="#71717a" fontSize={11} tickFormatter={fmtCompact} />
              <Tooltip contentStyle={{ background: "#0a0a0a", border: "1px solid #27272a", borderRadius: 8 }} formatter={(v) => fmt(v)} />
              <Bar dataKey="profit" radius={[4, 4, 0, 0]}>
                {dailyData.map((d, i) => <Cell key={i} fill={d.profit >= 0 ? "#10b981" : "#f43f5e"} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// ---------- SETTINGS ----------
function Settings({ entries }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [working, setWorking] = useState(false);

  const handleChange = async () => {
    setMsg(""); setErr(""); setWorking(true);
    try {
      const snap = await getDoc(CONFIG_DOC);
      const correct = snap.exists() ? snap.data().passcode : DEFAULT_PASSCODE;
      if (current !== correct) { setErr("Current passcode is wrong"); setWorking(false); return; }
      if (next.length < 4) { setErr("Must be at least 4 characters"); setWorking(false); return; }
      if (next !== confirm) { setErr("New passcodes don't match"); setWorking(false); return; }
      await setDoc(CONFIG_DOC, { passcode: next });
      setMsg("Updated for both of you");
      setCurrent(""); setNext(""); setConfirm("");
    } catch (e) {
      setErr("Update failed: " + e.message);
    }
    setWorking(false);
  };

  const exportCSV = () => {
    const headers = ["Date", "Income (THB)", "Expenses (THB)", "Net (THB)"];
    const rows = [...entries].sort((a, b) => a.date.localeCompare(b.date)).map(e => [e.date, e.income, e.expenses, e.profit]);
    const csv = [headers.join(","), ...rows.map(r => r.map(c => `"${c}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `household-${today()}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 md:p-8 max-w-xl">
        <h3 className="text-xl font-bold text-white mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>Change Passcode</h3>
        <p className="text-xs text-zinc-500 mb-6">Shared between you and your wife.</p>
        <div className="space-y-4">
          <input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} placeholder="Current passcode" className="w-full bg-black/40 border border-zinc-800 rounded-lg px-4 py-3 text-white outline-none focus:border-violet-400/60" />
          <input type="password" value={next} onChange={(e) => setNext(e.target.value)} placeholder="New passcode" className="w-full bg-black/40 border border-zinc-800 rounded-lg px-4 py-3 text-white outline-none focus:border-violet-400/60" />
          <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Confirm new passcode" className="w-full bg-black/40 border border-zinc-800 rounded-lg px-4 py-3 text-white outline-none focus:border-violet-400/60" />
          {err && <p className="text-rose-400 text-sm">{err}</p>}
          {msg && <p className="text-emerald-400 text-sm">{msg}</p>}
          <button onClick={handleChange} disabled={working} className="w-full py-3 rounded-lg font-semibold text-black hover:opacity-90 disabled:opacity-50" style={{ background: "linear-gradient(135deg, #8b5cf6 0%, #c4b5fd 100%)" }}>
            {working ? "Updating…" : "Update Passcode"}
          </button>
        </div>
      </div>

      <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 md:p-8 max-w-xl">
        <h3 className="text-xl font-bold text-white mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>Export</h3>
        <p className="text-xs text-zinc-500 mb-6">Download daily totals as CSV.</p>
        <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-medium">
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>
    </div>
  );
}

// ---------- MAIN APP ----------
export default function App() {
  const [unlocked, setUnlocked] = useState(() => sessionStorage.getItem("household:unlocked") === "1");
  const [transactions, setTransactions] = useState([]);
  const [tab, setTab] = useState("entry");
  const [online, setOnline] = useState(navigator.onLine);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  useEffect(() => {
    if (!unlocked) return;
    setLoading(true);
    const unsub = onSnapshot(TX_COL,
      (snap) => {
        const list = [];
        snap.forEach(d => list.push(d.data()));
        setTransactions(list);
        setLoading(false);
      },
      (err) => { console.error(err); setLoading(false); }
    );
    return () => unsub();
  }, [unlocked]);

  const saveTransaction = async (tx) => {
    await setDoc(doc(db, "transactions", tx.id), tx);
  };
  const deleteTransaction = async (id) => {
    await deleteDoc(doc(db, "transactions", id));
  };
  const handleLock = () => {
    sessionStorage.removeItem("household:unlocked");
    setUnlocked(false);
  };

  if (!unlocked) return <PasscodeScreen onUnlock={() => setUnlocked(true)} />;

  const dayMap = buildDayMap(transactions);
  const entries = Object.values(dayMap).sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="min-h-screen text-white" style={{ background: "radial-gradient(ellipse at top, #2a1f3e 0%, #0a0d14 60%)" }}>
      <header className="border-b border-zinc-800/60 backdrop-blur-xl sticky top-0 z-40 bg-black/40">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, #8b5cf6 0%, #c4b5fd 100%)" }}>
              <Home className="w-5 h-5 text-black" strokeWidth={2.5} />
            </div>
            <div>
              <div className="text-lg font-bold leading-none" style={{ fontFamily: "'Playfair Display', serif" }}>Household</div>
              <div className="text-[10px] text-zinc-500 tracking-[0.2em] uppercase">Personal Ledger</div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-1.5 text-xs ${online ? "text-emerald-400" : "text-rose-400"}`}>
              {online ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{online ? "Live" : "Offline"}</span>
            </div>
            <button onClick={handleLock} className="flex items-center gap-2 text-zinc-400 hover:text-white text-sm">
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Lock</span>
            </button>
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-4 md:px-6 flex gap-1 overflow-x-auto">
          {[
            { id: "entry", label: "Entry", icon: <Plus className="w-4 h-4" /> },
            { id: "upload", label: "Slips", icon: <Upload className="w-4 h-4" /> },
            { id: "dashboard", label: "Dashboard", icon: <BarChart3 className="w-4 h-4" /> },
            { id: "monthly", label: "Monthly", icon: <CalendarDays className="w-4 h-4" /> },
            { id: "history", label: "History", icon: <FileText className="w-4 h-4" /> },
            { id: "settings", label: "Settings", icon: <Lock className="w-4 h-4" /> },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition ${
                tab === t.id ? "border-violet-400 text-white" : "border-transparent text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-8 pb-20">
        {loading ? (
          <div className="text-center py-20 text-zinc-500">Connecting…</div>
        ) : (
          <>
            {tab === "entry" && <EntryForm onSave={saveTransaction} dayMap={dayMap} />}
            {tab === "upload" && <SlipUpload onSave={saveTransaction} />}
            {tab === "dashboard" && <Dashboard entries={entries} transactions={transactions} />}
            {tab === "monthly" && <Monthly entries={entries} transactions={transactions} />}
            {tab === "history" && <History entries={entries} onDeleteTransaction={deleteTransaction} />}
            {tab === "settings" && <Settings entries={entries} />}
          </>
        )}
        <footer className="mt-12 text-center text-xs text-zinc-600">
          Household · Real-time sync · THB
        </footer>
      </main>
    </div>
  );
}
