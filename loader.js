(() => {
  const STORAGE_KEY = "lucas_site_boot_seen_v1";

  if (!document.body) {
    return;
  }

  if (sessionStorage.getItem(STORAGE_KEY) === "1") {
    return;
  }

  sessionStorage.setItem(STORAGE_KEY, "1");

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const overlay = document.createElement("div");
  overlay.className = "boot-overlay";
  overlay.innerHTML = `
    <section class="boot-terminal" role="status" aria-live="polite">
      <div class="boot-head">
        <div class="boot-lights"><span></span><span></span><span></span></div>
        <div>Boot Sequence</div>
      </div>
      <div class="boot-body">
        <div class="boot-lines" id="boot-lines"></div>
        <div class="boot-progress">
          <div class="boot-progress-fill" id="boot-progress-fill"></div>
        </div>
      </div>
    </section>
  `;

  document.body.appendChild(overlay);
  document.body.classList.add("boot-active");

  const linesContainer = overlay.querySelector("#boot-lines");
  const progressFill = overlay.querySelector("#boot-progress-fill");

  const sequence = [
    "$ init --profile lucas_laszacs",
    "Loading technical systems profile...",
    "Loading biological research profile...",
    "Syncing projects and resume artifacts...",
    "Ready."
  ];

  let lineIndex = 0;
  let cancelled = false;

  const clearCursor = () => {
    const cursor = linesContainer.querySelector(".boot-cursor");
    if (cursor) {
      cursor.remove();
    }
  };

  const updateProgress = () => {
    const pct = Math.round((lineIndex / sequence.length) * 100);
    progressFill.style.width = `${pct}%`;
  };

  const finish = () => {
    clearCursor();
    progressFill.style.width = "100%";

    window.setTimeout(() => {
      overlay.classList.add("boot-overlay--exit");
      window.setTimeout(() => {
        document.body.classList.remove("boot-active");
        overlay.remove();
      }, prefersReducedMotion ? 30 : 380);
    }, prefersReducedMotion ? 80 : 450);
  };

  const skip = () => {
    if (cancelled) {
      return;
    }

    cancelled = true;
    linesContainer.innerHTML = sequence
      .map((line) => `<p class="boot-line">${line}</p>`)
      .join("");

    lineIndex = sequence.length;
    finish();
  };

  const typeLine = (text, done) => {
    const lineEl = document.createElement("p");
    lineEl.className = "boot-line";

    const cursor = document.createElement("span");
    cursor.className = "boot-cursor";
    cursor.textContent = "_";

    linesContainer.appendChild(lineEl);
    lineEl.appendChild(cursor);

    if (prefersReducedMotion) {
      lineEl.textContent = text;
      done();
      return;
    }

    let i = 0;
    const interval = window.setInterval(() => {
      if (cancelled) {
        window.clearInterval(interval);
        return;
      }

      if (i >= text.length) {
        window.clearInterval(interval);
        lineEl.textContent = text;
        done();
        return;
      }

      lineEl.textContent = text.slice(0, i + 1);
      lineEl.appendChild(cursor);
      i += 1;
    }, 24);
  };

  const run = () => {
    if (cancelled) {
      return;
    }

    if (lineIndex >= sequence.length) {
      finish();
      return;
    }

    typeLine(sequence[lineIndex], () => {
      lineIndex += 1;
      updateProgress();
      window.setTimeout(run, prefersReducedMotion ? 20 : 180);
    });
  };

  overlay.addEventListener("click", skip);
  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape" || event.key === "Enter" || event.key === " ") {
      skip();
    }
  }, { once: true });

  updateProgress();
  run();
})();
