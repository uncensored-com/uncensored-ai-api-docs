export const TextModelsCatalog = () => {
  const ENDPOINT = "https://api.uncensored.com/api/v1/models";

  const COPY_ICON =
    '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>';
  const CHECK_ICON =
    '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';

  const [models, setModels] = useState([]);
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [query, setQuery] = useState("");
  const [provider, setProvider] = useState("All");
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetch(ENDPOINT, { headers: { Accept: "application/json" } })
      .then((r) => {
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.json();
      })
      .then((json) => {
        if (cancelled) return;
        const list = Array.isArray(json) ? json : json.data || [];
        setModels(list);
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
    .tmc-wrap { margin-top: 1rem; }
    .tmc-search {
      width: 100%;
      box-sizing: border-box;
      padding: 14px 16px;
      font-size: 15px;
      color: var(--text, inherit);
      background: var(--gray-50, rgba(255,255,255,0.02));
      border: 1px solid var(--gray-200, rgba(255,255,255,0.1));
      border-radius: 12px;
      outline: none;
      transition: border-color 0.12s ease;
    }
    .tmc-search:focus { border-color: var(--primary, #ff3b00); }
    .tmc-chips { display: flex; flex-wrap: wrap; gap: 8px; margin: 16px 0 8px; }
    .tmc-chip {
      padding: 6px 14px;
      font-size: 13px;
      line-height: 1.2;
      border-radius: 999px;
      border: 1px solid var(--gray-200, rgba(255,255,255,0.12));
      background: transparent;
      color: var(--gray-500, #9ca3af);
      cursor: pointer;
      transition: all 0.12s ease;
    }
    .tmc-chip:hover { color: var(--text, inherit); border-color: var(--gray-300, rgba(255,255,255,0.25)); }
    .tmc-chip.active {
      color: #fff;
      background: var(--primary, #ff3b00);
      border-color: var(--primary, #ff3b00);
    }
    .tmc-count { font-size: 13px; color: var(--gray-500, #9ca3af); margin: 10px 2px 14px; }
    .tmc-card {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      padding: 16px 4px;
      border-bottom: 1px solid var(--gray-200, rgba(255,255,255,0.08));
    }
    .tmc-card-main { min-width: 0; }
    .tmc-id {
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }
    .tmc-id code {
      font-size: 15px;
      font-weight: 600;
      padding: 3px 8px;
      border-radius: 6px;
      background: var(--gray-100, rgba(255,255,255,0.06));
      color: var(--text, inherit);
      word-break: break-all;
    }
    .tmc-copy {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 3px;
      color: var(--gray-400, #9ca3af);
      background: transparent;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      opacity: 0.6;
      transition: opacity 0.12s ease, color 0.12s ease;
    }
    .tmc-copy:hover { opacity: 1; color: var(--primary, #ff3b00); }
    .tmc-copy.copied { color: #16a34a; opacity: 1; }
    .tmc-provider { font-size: 13px; color: var(--gray-500, #9ca3af); margin-top: 6px; }
    .tmc-price { font-size: 13px; color: var(--gray-500, #9ca3af); white-space: nowrap; text-align: right; }
    .tmc-price b { color: var(--text, inherit); font-weight: 600; }
    .tmc-msg { padding: 24px 4px; font-size: 14px; color: var(--gray-500, #9ca3af); }
    @media (max-width: 520px) {
      .tmc-card { flex-direction: column; align-items: flex-start; gap: 8px; }
      .tmc-price { text-align: left; }
    }
  `;

  return (
    <div className="tmc-wrap">
      <style dangerouslySetInnerHTML={{ __html: css }} />

      <input
        className="tmc-search"
        type="text"
        placeholder="Search models…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

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
