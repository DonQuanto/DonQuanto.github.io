(() => {
  const projectsRoot = document.querySelector("[data-projects-catalog]");
  const toolsRoot = document.querySelector("[data-tools-catalog]");

  if (!projectsRoot && !toolsRoot) {
    return;
  }

  const FOCUS_TOPICS = {
    biology: new Set(["focus-biology", "biology", "biotech", "lab", "virology"]),
    "data-science": new Set(["focus-data-science", "data-science", "data", "analytics", "quant", "ml"]),
    "software-systems": new Set(["focus-software-systems", "software-systems", "software", "devtools", "automation"])
  };

  const TOOL_TOPICS = new Set([
    "portfolio-tool",
    "tool",
    "tools",
    "cli-tool",
    "automation-tool",
    "dev-tool"
  ]);

  const TOOL_NAME_PREFIXES = ["tool-", "tools-"];
  const TOOL_TEXT_MARKERS = ["[tool]", "#tool", "tool:"];

  const normalize = (value) => (value || "").toString().trim().toLowerCase();

  const escapeHtml = (value) =>
    (value || "")
      .toString()
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");

  const toDate = (value) => {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "Unknown" : date.toLocaleDateString();
  };

  const isExternalUrl = (url) => /^https?:\/\//i.test(url || "");

  const linkMarkup = ({ url, label }) => {
    if (!url || !label) {
      return "";
    }

    const target = isExternalUrl(url) ? ' target="_blank" rel="noopener noreferrer"' : "";
    return `<a href="${escapeHtml(url)}"${target}>${escapeHtml(label)}</a>`;
  };

  const getTopics = (repo) =>
    Array.isArray(repo.topics)
      ? repo.topics.map((topic) => normalize(topic)).filter(Boolean)
      : [];

  const matchesAny = (text, markers) => {
    const normalized = normalize(text);
    return markers.some((marker) => normalized.includes(marker));
  };

  const startsWithAny = (text, prefixes) => {
    const normalized = normalize(text);
    return prefixes.some((prefix) => normalized.startsWith(prefix));
  };

  function createTabs(target, focuses, activeFocusId, onSelect) {
    target.innerHTML = "";

    focuses.forEach((focus) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `focus-tab${focus.id === activeFocusId ? " active" : ""}`;
      button.textContent = focus.label;
      button.setAttribute("aria-selected", focus.id === activeFocusId ? "true" : "false");

      button.addEventListener("click", () => {
        onSelect(focus.id);
      });

      target.appendChild(button);
    });
  }

  function renderProjects(catalog, root) {
    const tabs = root.querySelector("[data-focus-tabs]");
    const description = root.querySelector("[data-focus-description]");
    const count = root.querySelector("[data-focus-count]");
    const grid = root.querySelector("[data-focus-grid]");

    if (!tabs || !description || !count || !grid) {
      return;
    }

    const focuses = Array.isArray(catalog.focuses) ? catalog.focuses : [];
    const projects = Array.isArray(catalog.projects) ? catalog.projects : [];

    if (!focuses.length) {
      grid.innerHTML = '<div class="card">Project configuration is missing.</div>';
      return;
    }

    let activeFocusId = focuses[0].id;

    const render = () => {
      const activeFocus = focuses.find((focus) => focus.id === activeFocusId) || focuses[0];
      const visible = projects.filter((project) => project.focus === activeFocus.id);

      description.textContent = activeFocus.description || "";
      count.textContent = `${visible.length} ${visible.length === 1 ? "project case study" : "project case studies"} in ${activeFocus.label}.`;

      if (!visible.length) {
        grid.innerHTML = '<div class="card portfolio-empty">No project case studies are listed in this area yet.</div>';
        return;
      }

      grid.innerHTML = visible
        .map((project) => {
          const stack = Array.isArray(project.stack) ? project.stack : [];
          const links = Array.isArray(project.links) ? project.links : [];

          const stackMarkup = stack
            .slice(0, 6)
            .map((item) => `<span class="arch-node">${escapeHtml(item)}</span>`)
            .join("");

          const linksMarkup = links
            .map((item) => linkMarkup(item))
            .filter(Boolean)
            .join('<span class="portfolio-link-sep">|</span>');

          return `
            <article class="case-card portfolio-card" id="project-${escapeHtml(project.id)}">
              <div class="kicker">${escapeHtml(project.kicker || activeFocus.label)}</div>
              <h3>${escapeHtml(project.title || "Untitled Project")}</h3>
              <p>${escapeHtml(project.summary || "")}</p>
              <div class="arch-strip">${stackMarkup}</div>
              <ul>
                <li><strong>Problem:</strong> ${escapeHtml(project.problem || "")}</li>
                <li><strong>Architecture:</strong> ${escapeHtml(project.architecture || "")}</li>
                <li><strong>Outcome:</strong> ${escapeHtml(project.outcome || "")}</li>
              </ul>
              ${linksMarkup ? `<p class="portfolio-links">${linksMarkup}</p>` : ""}
            </article>
          `;
        })
        .join("");
    };

    const setActiveFocus = (focusId) => {
      activeFocusId = focusId;
      createTabs(tabs, focuses, activeFocusId, setActiveFocus);
      render();
    };

    createTabs(tabs, focuses, activeFocusId, setActiveFocus);

    render();
  }

  function detectFocusFromTopics(repo, topics, projectTopicToFocus) {
    const explicitFocus = Object.entries(FOCUS_TOPICS).find(([, topicSet]) =>
      topics.some((topic) => topicSet.has(topic))
    );

    if (explicitFocus) {
      return explicitFocus[0];
    }

    for (const topic of topics) {
      if (projectTopicToFocus.has(topic)) {
        return projectTopicToFocus.get(topic);
      }
    }

    const text = `${normalize(repo.name)} ${normalize(repo.description)}`;
    if (/(biolog|virolog|assay|vlp|immunolog|lab)/.test(text)) {
      return "biology";
    }

    if (/(data|pipeline|backfill|timeseries|kalshi|analytics|model|market)/.test(text)) {
      return "data-science";
    }

    return "software-systems";
  }

  function renderTools(catalog, root, repos) {
    const tabs = root.querySelector("[data-focus-tabs]");
    const description = root.querySelector("[data-focus-description]");
    const count = root.querySelector("[data-focus-count]");
    const grid = root.querySelector("[data-focus-grid]");

    if (!tabs || !description || !count || !grid) {
      return;
    }

    const focuses = Array.isArray(catalog.focuses) ? catalog.focuses : [];
    const projects = Array.isArray(catalog.projects) ? catalog.projects : [];

    if (!focuses.length) {
      grid.innerHTML = '<div class="card">Focus configuration is missing.</div>';
      return;
    }

    const projectTopicToFocus = new Map();
    const projectTopicToProject = new Map();

    projects.forEach((project) => {
      const topic = normalize(project.projectTopic);
      if (!topic) return;
      projectTopicToFocus.set(topic, project.focus);
      projectTopicToProject.set(topic, project);
    });

    const tools = repos
      .filter((repo) => !repo.fork)
      .map((repo) => {
        const topics = getTopics(repo);
        const isTool = topics.some((topic) => TOOL_TOPICS.has(topic)) ||
          startsWithAny(repo.name, TOOL_NAME_PREFIXES) ||
          matchesAny(repo.description, TOOL_TEXT_MARKERS);

        if (!isTool) {
          return null;
        }

        const focus = detectFocusFromTopics(repo, topics, projectTopicToFocus);
        const relatedProjects = topics
          .map((topic) => projectTopicToProject.get(topic))
          .filter(Boolean)
          .filter((project, idx, arr) => arr.findIndex((candidate) => candidate.id === project.id) === idx);

        return {
          repo,
          topics,
          focus,
          relatedProjects
        };
      })
      .filter(Boolean)
      .sort((a, b) => new Date(b.repo.updated_at) - new Date(a.repo.updated_at));

    let activeFocusId = focuses[0].id;

    const render = () => {
      const activeFocus = focuses.find((focus) => focus.id === activeFocusId) || focuses[0];
      const visible = tools.filter((item) => item.focus === activeFocus.id);

      description.textContent = activeFocus.description || "";
      count.textContent = `${visible.length} ${visible.length === 1 ? "tool" : "tools"} in ${activeFocus.label}.`;

      if (!visible.length) {
        grid.innerHTML = '<div class="card portfolio-empty">No tools are listed in this area yet.</div>';
        return;
      }

      grid.innerHTML = visible
        .map(({ repo, topics, relatedProjects }) => {
          const visibleTopics = topics
            .filter((topic) =>
              topic !== "portfolio-tool" &&
              topic !== "portfolio-project" &&
              !topic.startsWith("focus-") &&
              !topic.startsWith("project-")
            )
            .slice(0, 4);

          const chips = [];
          if (repo.language) {
            chips.push(repo.language);
          }
          visibleTopics.forEach((topic) => chips.push(topic));

          const chipMarkup = chips
            .map((item) => `<span class="arch-node">${escapeHtml(item)}</span>`)
            .join("");

          const relatedMarkup = relatedProjects.length
            ? `<p class="portfolio-related">Related project: ${relatedProjects
                .map((project) => `<a href="/projects/#project-${escapeHtml(project.id)}">${escapeHtml(project.title)}</a>`)
                .join('<span class="portfolio-link-sep">|</span>')}</p>`
            : "";

          return `
            <article class="case-card portfolio-card tool-card">
              <div class="portfolio-headline">
                <div class="kicker">Tool</div>
                <span class="repo-stars">★ ${repo.stargazers_count}</span>
              </div>
              <h3>
                <a href="${escapeHtml(repo.html_url)}" target="_blank" rel="noopener noreferrer" class="repo-name">${escapeHtml(repo.name)}</a>
              </h3>
              <p>${escapeHtml(repo.description || "No description provided")}</p>
              <div class="arch-strip">${chipMarkup}</div>
              ${relatedMarkup}
              <p class="repo-meta">Updated ${toDate(repo.updated_at)}</p>
            </article>
          `;
        })
        .join("");
    };

    const setActiveFocus = (focusId) => {
      activeFocusId = focusId;
      createTabs(tabs, focuses, activeFocusId, setActiveFocus);
      render();
    };

    createTabs(tabs, focuses, activeFocusId, setActiveFocus);

    render();
  }

  async function loadProjectCatalog() {
    const response = await fetch("/data/projects.json", { cache: "no-store" });

    if (!response.ok) {
      throw new Error(`Unable to load project catalog: ${response.status}`);
    }

    return response.json();
  }

  async function loadGitHubRepos() {
    const response = await fetch(
      "https://api.github.com/users/DonQuanto/repos?per_page=100&sort=updated",
      {
        headers: {
          Accept: "application/vnd.github+json, application/vnd.github.mercy-preview+json"
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Unable to load GitHub repos: ${response.status}`);
    }

    const payload = await response.json();
    return Array.isArray(payload) ? payload : [];
  }

  async function init() {
    try {
      const catalog = await loadProjectCatalog();

      if (projectsRoot) {
        renderProjects(catalog, projectsRoot);
      }

      if (toolsRoot) {
        const repos = await loadGitHubRepos();
        renderTools(catalog, toolsRoot, repos);
      }
    } catch (error) {
      const message = "Unable to load portfolio streams right now.";

      if (projectsRoot) {
        const grid = projectsRoot.querySelector("[data-focus-grid]");
        if (grid) {
          grid.textContent = message;
        }
      }

      if (toolsRoot) {
        const grid = toolsRoot.querySelector("[data-focus-grid]");
        if (grid) {
          grid.textContent = message;
        }
      }
    }
  }

  init();
})();
