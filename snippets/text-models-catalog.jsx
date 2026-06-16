export const TextModelsCatalog = () => {
  const MODELS_ENDPOINT = "https://api.uncensored.com/api/v1/models";
  const CATALOG_ENDPOINT = "https://api.uncensored.com/api/v1/catalog";

  const COPY_ICON =
    '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>';
  const CHECK_ICON =
    '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';
  // Capability icons (rendered only when the API reports the capability true).
  const EYE_ICON =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>';
  const TOOL_ICON =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path></svg>';
  const REASON_ICON =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l1.9 4.6L18.5 9.5 13.9 11.4 12 16l-1.9-4.6L5.5 9.5l4.6-1.9z"></path><path d="M19 15l.7 1.8L21.5 17.5 19.7 18.2 19 20l-.7-1.8L16.5 17.5l1.8-.7z"></path></svg>';

  const CAPABILITIES = [
    { key: "vision", icon: EYE_ICON, label: "Vision", tip: "Understands images you send in the request, not just text" },
    { key: "tools", icon: TOOL_ICON, label: "Tools", tip: "Supports function calling / tool use" },
    { key: "reasoning", icon: REASON_ICON, label: "Reasoning", tip: "Step-by-step reasoning model" },
  ];

  const capsFor = (m) => {
    const out = [];
    if (Array.isArray(m.modalities) && m.modalities.includes("image")) out.push(CAPABILITIES[0]);
    if (m.tools === true) out.push(CAPABILITIES[1]);
    if (m.reasoning === true) out.push(CAPABILITIES[2]);
    return out;
  };

  const fmtContext = (n) => {
    if (!n || !isFinite(n)) return null;
    if (n >= 1e6) return parseFloat((n / 1e6).toFixed(1)) + "M";
    if (n >= 1e3) return parseFloat((n / 1e3).toFixed(0)) + "K";
    return String(n);
  };

  const [models, setModels] = useState([]);
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [query, setQuery] = useState("");
  const [provider, setProvider] = useState("All");
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const toList = (json) => (Array.isArray(json) ? json : (json && json.data) || []);

    Promise.all([
      // Pricing source (required).
      fetch(MODELS_ENDPOINT, { headers: { Accept: "application/json" } }).then((r) => {
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.json();
      }),
      // Capabilities source (optional — modalities). Tolerate failure.
      fetch(CATALOG_ENDPOINT, { headers: { Accept: "application/json" } })
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null),
    ])
      .then(([modelsJson, catalogJson]) => {
        if (cancelled) return;
        const catById = {};
        toList(catalogJson).forEach((c) => {
          if (c && c.id) catById[c.id] = c;
        });
        const merged = toList(modelsJson).map((m) => {
          const c = catById[m.id] || {};
          return {
            ...m,
            display_name: c.display_name || null,
            context_length: c.context_length || null,
            modalities: c.modalities || [],
            tools: c.tools,
            reasoning: c.reasoning,
          };
        });
        setModels(merged);
        setStatus("ready");
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Price is per token (string); show per million tokens.
  const perMillion = (v) => {
    const n = Number(v);
    if (!isFinite(n)) return null;
    return "$" + (n * 1e6).toFixed(2);
  };

  const copy = (id) => {
    navigator.clipboard.writeText(id).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId((c) => (c === id ? null : c)), 1200);
    });
  };

  const providers = ["All", ...Array.from(new Set(models.map((m) => m.owned_by).filter(Boolean))).sort()];

  const q = query.trim().toLowerCase();
  const filtered = models.filter((m) => {
    if (provider !== "All" && m.owned_by !== provider) return false;
    if (!q) return true;
    return (
      (m.id || "").toLowerCase().includes(q) ||
      (m.owned_by || "").toLowerCase().includes(q) ||
      (m.display_name || "").toLowerCase().includes(q)
    );
  });

  const css = `
    .tmc-wrap {
      /* Neutral / monochrome — no brand accent, matches the docs UI */
      /* Light theme: neutral overlays that sit on the page surface */
      --tmc-fg: #1a1a1a;
      --tmc-muted: #6b7280;
      --tmc-field-bg: rgba(0,0,0,0.015);
      --tmc-field-border: rgba(0,0,0,0.12);
      --tmc-field-border-hover: rgba(0,0,0,0.28);
      --tmc-focus-ring: rgba(0,0,0,0.08);
      --tmc-code-bg: rgba(0,0,0,0.05);
      --tmc-row-border: rgba(0,0,0,0.08);
      --tmc-chip-bg: rgba(0,0,0,0.03);
      --tmc-chip-border: rgba(0,0,0,0.12);
      --tmc-chip-hover: rgba(0,0,0,0.06);
      --tmc-active-bg: #1a1a1a;
      --tmc-active-fg: #ffffff;
      --tmc-tip-bg: #1f2937;
      --tmc-tip-fg: #f9fafb;
      margin-top: 1rem;
    }
    :is(.dark) .tmc-wrap {
      --tmc-fg: #f3f4f6;
      --tmc-muted: #9ca3af;
      --tmc-field-bg: rgba(255,255,255,0.04);
      --tmc-field-border: rgba(255,255,255,0.14);
      --tmc-field-border-hover: rgba(255,255,255,0.34);
      --tmc-focus-ring: rgba(255,255,255,0.1);
      --tmc-code-bg: rgba(255,255,255,0.07);
      --tmc-row-border: rgba(255,255,255,0.09);
      --tmc-chip-bg: rgba(255,255,255,0.05);
      --tmc-chip-border: rgba(255,255,255,0.14);
      --tmc-chip-hover: rgba(255,255,255,0.09);
      --tmc-active-bg: #f3f4f6;
      --tmc-active-fg: #111111;
      --tmc-tip-bg: #f3f4f6;
      --tmc-tip-fg: #111827;
    }

    .tmc-search-box { position: relative; display: flex; align-items: center; }
    .tmc-search-box svg {
      position: absolute;
      left: 16px;
      width: 18px;
      height: 18px;
      color: var(--tmc-muted);
      pointer-events: none;
    }
    .tmc-search {
      width: 100%;
      box-sizing: border-box;
      padding: 13px 16px 13px 44px;
      font-size: 15px;
      color: var(--tmc-fg);
      background: var(--tmc-field-bg);
      border: 1px solid var(--tmc-field-border);
      border-radius: 12px;
      outline: none;
      box-shadow: 0 1px 2px rgba(0,0,0,0.04);
      transition: border-color 0.12s ease, box-shadow 0.12s ease;
    }
    .tmc-search::placeholder { color: var(--tmc-muted); }
    .tmc-search:hover { border-color: var(--tmc-field-border-hover); }
    .tmc-search:focus {
      border-color: var(--tmc-field-border-hover);
      box-shadow: 0 0 0 3px var(--tmc-focus-ring);
    }

    .tmc-chips { display: flex; flex-wrap: wrap; gap: 8px; margin: 18px 0 6px; }
    .tmc-chip {
      padding: 6px 14px;
      font-size: 13px;
      font-weight: 500;
      line-height: 1.2;
      border-radius: 999px;
      border: 1px solid var(--tmc-chip-border);
      background: var(--tmc-chip-bg);
      color: var(--tmc-muted);
      cursor: pointer;
      transition: all 0.12s ease;
    }
    .tmc-chip:hover { color: var(--tmc-fg); background: var(--tmc-chip-hover); border-color: var(--tmc-field-border-hover); }
    .tmc-chip.active {
      color: var(--tmc-active-fg);
      background: var(--tmc-active-bg);
      border-color: var(--tmc-active-bg);
    }

    .tmc-count { font-size: 13px; color: var(--tmc-muted); margin: 16px 2px 6px; }
    .tmc-card {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 16px;
      padding: 18px 4px;
      border-bottom: 1px solid var(--tmc-row-border);
    }
    .tmc-card-main { min-width: 0; }
    .tmc-title { font-size: 15px; font-weight: 600; color: var(--tmc-fg); line-height: 1.3; }
    .tmc-id { display: inline-flex; align-items: center; gap: 7px; margin-top: 7px; }
    .tmc-id code {
      font-size: 12.5px;
      font-weight: 500;
      padding: 2px 7px;
      border-radius: 6px;
      background: var(--tmc-code-bg);
      color: var(--tmc-fg);
      word-break: break-all;
    }
    .tmc-copy {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 2px;
      color: var(--tmc-muted);
      background: transparent;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      opacity: 0.7;
      transition: opacity 0.12s ease, color 0.12s ease;
    }
    .tmc-copy:hover { opacity: 1; color: var(--tmc-fg); }
    .tmc-copy.copied { color: #16a34a; opacity: 1; }

    .tmc-meta {
      display: flex; align-items: center; flex-wrap: wrap;
      gap: 6px 10px; margin-top: 10px;
      font-size: 13px; color: var(--tmc-muted);
    }
    .tmc-ctx { position: relative; padding-left: 11px; }
    .tmc-ctx::before {
      content: ""; position: absolute; left: 0; top: 50%;
      width: 3px; height: 3px; border-radius: 50%;
      background: currentColor; opacity: .5; transform: translateY(-50%);
    }
    .tmc-caps { display: inline-flex; align-items: center; gap: 4px; }

    /* Capability icon with reliable CSS tooltip (no native title) */
    .tmc-cap {
      position: relative;
      display: inline-flex; align-items: center; justify-content: center;
      width: 26px; height: 26px; border-radius: 7px;
      color: var(--tmc-muted); cursor: help; outline: none;
      transition: background .12s ease, color .12s ease;
    }
    .tmc-cap svg { width: 15px; height: 15px; display: block; }
    .tmc-cap:hover, .tmc-cap:focus-visible { background: var(--tmc-chip-bg); color: var(--tmc-fg); }
    .tmc-cap::after {
      content: attr(data-tip);
      position: absolute; bottom: calc(100% + 8px); left: 50%; transform: translateX(-50%);
      width: max-content; max-width: 220px;
      padding: 7px 10px; border-radius: 8px;
      font-size: 12px; font-weight: 500; line-height: 1.35; text-align: center;
      color: var(--tmc-tip-fg); background: var(--tmc-tip-bg);
      box-shadow: 0 4px 16px rgba(0,0,0,0.22);
      opacity: 0; visibility: hidden; transition: opacity .12s ease;
      pointer-events: none; z-index: 30;
    }
    .tmc-cap::before {
      content: ""; position: absolute; bottom: calc(100% + 3px); left: 50%;
      transform: translateX(-50%);
      border: 5px solid transparent; border-top-color: var(--tmc-tip-bg);
      opacity: 0; visibility: hidden; transition: opacity .12s ease;
      pointer-events: none; z-index: 30;
    }
    .tmc-cap:hover::after, .tmc-cap:hover::before,
    .tmc-cap:focus-visible::after, .tmc-cap:focus-visible::before { opacity: 1; visibility: visible; }

    .tmc-price { font-size: 13px; color: var(--tmc-muted); white-space: nowrap; text-align: right; flex-shrink: 0; }
    .tmc-price b { color: var(--tmc-fg); font-weight: 600; }
    .tmc-msg { padding: 24px 4px; font-size: 14px; color: var(--tmc-muted); }
    @media (max-width: 560px) {
      .tmc-card { flex-direction: column; align-items: flex-start; gap: 10px; }
      .tmc-price { text-align: left; }
    }
  `;

  return (
    <div className="tmc-wrap">
      <style dangerouslySetInnerHTML={{ __html: css }} />

      <div className="tmc-search-box">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <input
          className="tmc-search"
          type="text"
          placeholder="Search models…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {status === "ready" && (
        <div className="tmc-chips">
          {providers.map((p) => (
            <button
              key={p}
              type="button"
              className={"tmc-chip" + (provider === p ? " active" : "")}
              onClick={() => setProvider(p)}
            >
              {p}
            </button>
          ))}
        </div>
      )}


      {status === "loading" && <div className="tmc-msg">Loading models…</div>}
      {status === "error" && (
        <div className="tmc-msg">
          Couldn’t load the live model list. Fetch{" "}
          <code>GET /v1/models</code> to see all available models.
        </div>
      )}

      {status === "ready" && (
        <>
          <div className="tmc-count">{filtered.length} models</div>
          {filtered.map((m) => {
            const input = m.pricing && perMillion(m.pricing.prompt);
            const output = m.pricing && perMillion(m.pricing.completion);
            return (
              <div className="tmc-card" key={m.id}>
                <div className="tmc-card-main">
                  {m.display_name && <div className="tmc-title">{m.display_name}</div>}
                  <span className="tmc-id">
                    <code>{m.id}</code>
                    <button
                      type="button"
                      className={"tmc-copy" + (copiedId === m.id ? " copied" : "")}
                      title="Copy model ID"
                      aria-label={"Copy model ID " + m.id}
                      onClick={() => copy(m.id)}
                      dangerouslySetInnerHTML={{
                        __html: copiedId === m.id ? CHECK_ICON : COPY_ICON,
                      }}
                    />
                  </span>
                  <div className="tmc-meta">
                    {m.owned_by && <span className="tmc-provider">{m.owned_by}</span>}
                    {fmtContext(m.context_length) && (
                      <span className="tmc-ctx">{fmtContext(m.context_length)} context</span>
                    )}
                    {capsFor(m).length > 0 && (
                      <span className="tmc-caps">
                        {capsFor(m).map((c) => (
                          <span
                            key={c.key}
                            className="tmc-cap"
                            data-tip={c.tip}
                            tabIndex={0}
                            role="img"
                            aria-label={c.label + ": " + c.tip}
                            dangerouslySetInnerHTML={{ __html: c.icon }}
                          />
                        ))}
                      </span>
                    )}
                  </div>
                </div>
                {(input || output) && (
                  <div className="tmc-price">
                    {input && (
                      <span>
                        <b>{input}</b>/M input
                      </span>
                    )}
                    {input && output && " · "}
                    {output && (
                      <span>
                        <b>{output}</b>/M output
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          {filtered.length === 0 && <div className="tmc-msg">No models match your search.</div>}
        </>
      )}
    </div>
  );
};
