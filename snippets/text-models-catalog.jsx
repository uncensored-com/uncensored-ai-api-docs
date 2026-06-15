export const TextModelsCatalog = () => {
  const MODELS_ENDPOINT = "https://api.uncensored.com/api/v1/models";
  const CATALOG_ENDPOINT = "https://api.uncensored.com/api/v1/catalog";

  const COPY_ICON =
    '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>';
  const CHECK_ICON =
    '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';
  const IMAGE_ICON =
    '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>';

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
        const modalitiesById = {};
        toList(catalogJson).forEach((c) => {
          if (c && c.id) modalitiesById[c.id] = c.modalities || [];
        });
        const merged = toList(modelsJson).map((m) => ({
          ...m,
          modalities: modalitiesById[m.id] || [],
        }));
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
      (m.owned_by || "").toLowerCase().includes(q)
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

    .tmc-count { font-size: 13px; color: var(--tmc-muted); margin: 12px 2px 6px; }
    .tmc-card {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      padding: 16px 4px;
      border-bottom: 1px solid var(--tmc-row-border);
    }
    .tmc-card-main { min-width: 0; }
    .tmc-id { display: inline-flex; align-items: center; gap: 8px; }
    .tmc-id code {
      font-size: 15px;
      font-weight: 600;
      padding: 3px 8px;
      border-radius: 6px;
      background: var(--tmc-code-bg);
      color: var(--tmc-fg);
      word-break: break-all;
    }
    .tmc-copy {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 3px;
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
    .tmc-tags { display: inline-flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
    .tmc-tag {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      font-size: 12px;
      font-weight: 500;
      line-height: 1.2;
      padding: 3px 9px 3px 7px;
      border-radius: 999px;
      border: 1px solid var(--tmc-chip-border);
      background: var(--tmc-chip-bg);
      color: var(--tmc-muted);
      cursor: default;
    }
    .tmc-tag-icon { display: inline-flex; }
    .tmc-tag-icon svg { display: block; width: 13px; height: 13px; }
    .tmc-legend {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 8px;
      margin: 14px 2px 0;
      font-size: 13px;
      color: var(--tmc-muted);
    }
    .tmc-legend .tmc-tag { cursor: default; }
    .tmc-legend-text { line-height: 1.4; }
    .tmc-provider { font-size: 13px; color: var(--tmc-muted); margin-top: 6px; }
    .tmc-price { font-size: 13px; color: var(--tmc-muted); white-space: nowrap; text-align: right; }
    .tmc-price b { color: var(--tmc-fg); font-weight: 600; }
    .tmc-msg { padding: 24px 4px; font-size: 14px; color: var(--tmc-muted); }
    @media (max-width: 520px) {
      .tmc-card { flex-direction: column; align-items: flex-start; gap: 8px; }
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

      {status === "ready" && models.some((m) => Array.isArray(m.modalities) && m.modalities.includes("image")) && (
        <div className="tmc-legend">
          <span className="tmc-tag">
            <span className="tmc-tag-icon" dangerouslySetInnerHTML={{ __html: IMAGE_ICON }} />
            Accepts images
          </span>
          <span className="tmc-legend-text">
            Can understand images you send in the request, in addition to text. Other models are text-only.
          </span>
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
                  <span className="tmc-tags">
                    {Array.isArray(m.modalities) && m.modalities.includes("image") && (
                      <span className="tmc-tag">
                        <span
                          className="tmc-tag-icon"
                          dangerouslySetInnerHTML={{ __html: IMAGE_ICON }}
                        />
                        Accepts images
                      </span>
                    )}
                  </span>
                  {m.owned_by && <div className="tmc-provider">{m.owned_by}</div>}
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
