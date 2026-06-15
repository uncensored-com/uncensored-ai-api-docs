export const CopyableModelIds = () => {
  const COPY_ICON =
    '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>';
  const CHECK_ICON =
    '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';

  useEffect(() => {
    let cancelled = false;

    const enhance = () => {
      if (cancelled) return;
      const tables = document.querySelectorAll("table");
      tables.forEach((table) => {
        const headerCells = table.querySelectorAll("thead th");
        let colIndex = -1;
        headerCells.forEach((th, i) => {
          if (th.textContent.trim().toLowerCase() === "model id") colIndex = i;
        });
        if (colIndex === -1) return;

        const rows = table.querySelectorAll("tbody tr");
        rows.forEach((row) => {
          const cell = row.children[colIndex];
          if (!cell) return;
          const code = cell.querySelector("code");
          if (!code || code.dataset.copyEnhanced) return;
          code.dataset.copyEnhanced = "true";

          const id = code.textContent.trim();
          const btn = document.createElement("button");
          btn.type = "button";
          btn.className = "model-id-copy";
          btn.title = "Copy model ID";
          btn.setAttribute("aria-label", "Copy model ID " + id);
          btn.innerHTML = COPY_ICON;

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

          code.insertAdjacentElement("afterend", btn);
        });
      });
    };

    // Run after the table DOM is committed; retry briefly for SPA navigation.
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
    .model-id-copy {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      margin-left: 6px;
      padding: 2px;
      vertical-align: middle;
      color: var(--gray-400, #9ca3af);
      background: transparent;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      opacity: 0.55;
      transition: opacity 0.12s ease, color 0.12s ease, background 0.12s ease;
    }
    tr:hover .model-id-copy { opacity: 1; }
    .model-id-copy:hover {
      opacity: 1;
      background: var(--gray-100, rgba(0,0,0,0.06));
      color: var(--primary, #ff3b00);
    }
    .model-id-copy.copied { color: #16a34a; opacity: 1; }
    .model-id-copy svg { display: block; }
  `;

  return <style dangerouslySetInnerHTML={{ __html: css }} />;
};
