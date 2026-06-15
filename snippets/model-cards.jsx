export const ModelCards = () => {
  const COPY_ICON =
    '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>';
  const CHECK_ICON =
    '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';
  const SEARCH_ICON =
    '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>';

  useEffect(() => {
    let cancelled = false;

    const findCol = (headers, name) =>
      headers.findIndex((h) => h === name.toLowerCase());

    const buildCard = (cells, map) => {
      const cell = (i) => (i > -1 && cells[i] ? cells[i] : null);
      const txt = (i) => (cell(i) ? cell(i).textContent.trim() : "");
      const html = (i) => (cell(i) ? cell(i).innerHTML.trim() : "");

      const id = txt(map.id);
      const name = map.name > -1 ? txt(map.name) : id;

      const card = document.createElement("div");
      card.className = "mc-card";
      card.dataset.search = (
        id + " " + name + " " + txt(map.type)
      ).toLowerCase();

      const metaBits = [];
      if (map.status > -1 && html(map.status))
        metaBits.push('<span class="mc-status">' + html(map.status) + "</span>");
      if (map.type > -1 && txt(map.type))
        metaBits.push('<span class="mc-tag">' + txt(map.type) + "</span>");
      if (map.cost > -1 && html(map.cost))
        metaBits.push('<span class="mc-cost">' + html(map.cost) + "</span>");
      if (map.eta > -1 && txt(map.eta))
        metaBits.push('<span class="mc-eta">' + txt(map.eta) + "</span>");

      const params = [];
      if (map.req > -1 && html(map.req))
        params.push(
          '<div class="mc-param"><span class="mc-plabel">Required</span><span class="mc-pval">' +
            html(map.req) +
            "</span></div>"
        );
      if (map.opt > -1 && html(map.opt))
        params.push(
          '<div class="mc-param"><span class="mc-plabel">Optional</span><span class="mc-pval">' +
            html(map.opt) +
            "</span></div>"
        );

      card.innerHTML =
        '<div class="mc-head">' +
        '<div class="mc-left">' +
        '<div class="mc-title">' +
        name +
        "</div>" +
        '<div class="mc-idrow"><code class="mc-id">' +
        id +
        '</code><button type="button" class="mc-copy" title="Copy model ID" aria-label="Copy model ID ' +
        id +
        '">' +
        COPY_ICON +
        "</button></div>" +
        "</div>" +
        (metaBits.length ? '<div class="mc-meta">' + metaBits.join("") + "</div>" : "") +
        "</div>" +
        (params.length ? '<div class="mc-params">' + params.join("") + "</div>" : "");

      const btn = card.querySelector(".mc-copy");
      if (btn) {
        btn.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          navigator.clipboard.writeText(id).then(() => {
            btn.innerHTML = CHECK_ICON;
            btn.classList.add("copied");
            setTimeout(() => {
              btn.innerHTML = COPY_ICON;
              btn.classList.remove("copied");
            }, 1200);
          });
        });
      }
      return card;
    };

    const enhance = () => {
      if (cancelled) return;
      document.querySelectorAll("table").forEach((table) => {
        if (table.dataset.cardsEnhanced) return;
        const headers = Array.from(table.querySelectorAll("thead th")).map((th) =>
          th.textContent.trim().toLowerCase()
        );
        // Only transform model tables (first column is "Model ID").
        if (headers[0] !== "model id") return;
        table.dataset.cardsEnhanced = "true";

        const map = {
          id: 0,
          status: findCol(headers, "status"),
          name: findCol(headers, "display name"),
          type: findCol(headers, "type"),
          cost: findCol(headers, "cost"),
          eta: findCol(headers, "eta"),
          req: findCol(headers, "required params"),
          opt: findCol(headers, "optional supported params"),
        };

        const rows = Array.from(table.querySelectorAll("tbody tr"));

        const wrap = document.createElement("div");
        wrap.className = "mc-wrap";

        const list = document.createElement("div");
        list.className = "mc-list";
        rows.forEach((tr) => list.appendChild(buildCard(Array.from(tr.children), map)));

        const count = document.createElement("div");
        count.className = "mc-count";
        const setCount = (n) => (count.textContent = n + (n === 1 ? " model" : " models"));
        setCount(rows.length);

        const empty = document.createElement("div");
        empty.className = "mc-empty";
        empty.textContent = "No models match your search.";
        empty.style.display = "none";

        // Search only when there are enough rows to warrant it.
        if (rows.length >= 6) {
          const box = document.createElement("div");
          box.className = "mc-search-box";
          box.innerHTML = SEARCH_ICON;
          const input = document.createElement("input");
          input.type = "text";
          input.className = "mc-search";
          input.placeholder = "Search models…";
          box.appendChild(input);
          input.addEventListener("input", () => {
            const q = input.value.trim().toLowerCase();
            let n = 0;
            list.querySelectorAll(".mc-card").forEach((c) => {
              const show = !q || c.dataset.search.indexOf(q) !== -1;
              c.style.display = show ? "" : "none";
              if (show) n++;
            });
            setCount(n);
            empty.style.display = n ? "none" : "";
          });
          wrap.appendChild(box);
        }

        wrap.appendChild(count);
        wrap.appendChild(list);
        wrap.appendChild(empty);
        table.insertAdjacentElement("beforebegin", wrap);
        table.style.display = "none";
      });
    };

    enhance();
    const raf = requestAnimationFrame(enhance);
    const t = setTimeout(enhance, 300);
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      clearTimeout(t);
    };
  }, []);

  const css = `
    .mc-wrap {
      --mc-fg: #1a1a1a;
      --mc-muted: #6b7280;
      --mc-field-bg: transparent;
      --mc-field-border: rgba(0,0,0,0.14);
      --mc-field-border-hover: rgba(0,0,0,0.30);
      --mc-focus-ring: rgba(0,0,0,0.07);
      --mc-code-bg: rgba(0,0,0,0.045);
      --mc-divider: rgba(0,0,0,0.08);
      --mc-row-hover: rgba(0,0,0,0.018);
      margin: 1rem 0 1.5rem;
    }
    :is(.dark) .mc-wrap {
      --mc-fg: #f3f4f6;
      --mc-muted: #9ca3af;
      --mc-field-border: rgba(255,255,255,0.16);
      --mc-field-border-hover: rgba(255,255,255,0.36);
      --mc-focus-ring: rgba(255,255,255,0.09);
      --mc-code-bg: rgba(255,255,255,0.07);
      --mc-divider: rgba(255,255,255,0.08);
      --mc-row-hover: rgba(255,255,255,0.025);
    }

    .mc-search-box { position: relative; display: flex; align-items: center; }
    .mc-search-box svg { position: absolute; left: 14px; color: var(--mc-muted); pointer-events: none; }
    .mc-search {
      width: 100%; box-sizing: border-box;
      padding: 11px 14px 11px 42px; font-size: 15px;
      color: var(--mc-fg); background: var(--mc-field-bg);
      border: 1px solid var(--mc-field-border); border-radius: 10px; outline: none;
      transition: border-color .12s ease, box-shadow .12s ease;
    }
    .mc-search::placeholder { color: var(--mc-muted); }
    .mc-search:hover { border-color: var(--mc-field-border-hover); }
    .mc-search:focus { border-color: var(--mc-field-border-hover); box-shadow: 0 0 0 3px var(--mc-focus-ring); }

    .mc-count { font-size: 13px; color: var(--mc-muted); margin: 16px 2px 2px; }
    .mc-list { display: flex; flex-direction: column; }

    /* Borderless rows separated only by a thin divider */
    .mc-card {
      padding: 18px 8px;
      border-bottom: 1px solid var(--mc-divider);
      border-radius: 8px;
      transition: background .12s ease;
    }
    .mc-card:last-child { border-bottom: none; }
    .mc-card:hover { background: var(--mc-row-hover); }

    .mc-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; }
    .mc-left { min-width: 0; }
    .mc-title { font-size: 15px; font-weight: 600; color: var(--mc-fg); line-height: 1.3; }
    .mc-idrow { display: inline-flex; align-items: center; gap: 7px; margin-top: 7px; }
    .mc-id {
      font-size: 12.5px; font-weight: 500;
      padding: 2px 7px; border-radius: 6px;
      background: var(--mc-code-bg); color: var(--mc-fg);
      word-break: break-all;
    }
    .mc-copy {
      display: inline-flex; align-items: center; justify-content: center;
      padding: 2px; color: var(--mc-muted);
      background: transparent; border: none; border-radius: 4px;
      cursor: pointer; opacity: 0; transition: opacity .12s ease, color .12s ease;
    }
    .mc-card:hover .mc-copy { opacity: .7; }
    .mc-copy:hover { opacity: 1; color: var(--mc-fg); }
    .mc-copy.copied { color: #16a34a; opacity: 1; }

    .mc-meta { display: flex; flex-wrap: wrap; align-items: center; justify-content: flex-end; gap: 8px 14px; flex-shrink: 0; text-align: right; }
    .mc-meta code { background: transparent; padding: 0; font-size: 13px; color: var(--mc-fg); }
    .mc-status :is(span, .badge) { vertical-align: middle; }
    .mc-tag { font-size: 12px; color: var(--mc-muted); }
    .mc-cost { font-size: 13px; font-weight: 600; color: var(--mc-fg); }
    .mc-eta { font-size: 12.5px; color: var(--mc-muted); }

    /* Params shown openly (documentation, not hidden behind a toggle) */
    .mc-params { margin-top: 14px; display: flex; flex-direction: column; gap: 8px; }
    .mc-param { display: grid; grid-template-columns: 84px 1fr; gap: 12px; align-items: start; }
    .mc-plabel { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: .04em; color: var(--mc-muted); padding-top: 2px; }
    .mc-pval { font-size: 13.5px; color: var(--mc-fg); line-height: 1.6; }
    .mc-pval code { font-size: 12px; padding: 1px 5px; border-radius: 5px; background: var(--mc-code-bg); }

    .mc-empty { padding: 24px 8px; font-size: 14px; color: var(--mc-muted); }

    @media (max-width: 600px) {
      .mc-card { padding: 16px 0; }
      .mc-count, .mc-empty { margin-left: 0; padding-left: 0; }
      .mc-search { font-size: 16px; } /* avoid iOS focus zoom */

      .mc-head { flex-direction: column; gap: 0; }
      .mc-idrow { margin-top: 8px; }
      /* Meta becomes a left-aligned inline group under the ID */
      .mc-meta { justify-content: flex-start; text-align: left; margin-top: 11px; gap: 6px 14px; }
      .mc-copy { opacity: .7; padding: 5px; margin: -3px; } /* larger tap target */

      /* Params stack label-over-value, full width */
      .mc-params { margin-top: 13px; gap: 11px; }
      .mc-param { grid-template-columns: 1fr; gap: 3px; }
      .mc-plabel { padding-top: 0; }
    }
  `;

  return <style dangerouslySetInnerHTML={{ __html: css }} />;
};
