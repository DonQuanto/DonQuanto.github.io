const username = "DonQuanto";
const streamContainers = Array.from(document.querySelectorAll("[data-github-stream]"));
const legacyContainer = document.getElementById("github-feed");

if (legacyContainer && !streamContainers.includes(legacyContainer)) {
  streamContainers.push(legacyContainer);
}

if (!streamContainers.length) {
  // No stream containers on this page.
} else {
  const TOOL_TOPICS = new Set([
    "portfolio-tool",
    "tool",
    "tools",
    "cli-tool",
    "automation-tool",
    "dev-tool"
  ]);

  const PROJECT_TOPICS = new Set([
    "portfolio-project",
    "project",
    "portfolio"
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

  const getTopics = (repo) =>
    Array.isArray(repo.topics)
      ? repo.topics.map((topic) => normalize(topic)).filter(Boolean)
      : [];

  const hasAnyTopic = (topics, topicSet) => topics.some((topic) => topicSet.has(topic));

  const includesAny = (value, markers) => {
    const text = normalize(value);
    return markers.some((marker) => text.includes(marker));
  };

  const startsWithAny = (value, prefixes) => {
    const text = normalize(value);
    return prefixes.some((prefix) => text.startsWith(prefix));
  };

  const classifyRepo = (repo, topics) => {
    if (hasAnyTopic(topics, TOOL_TOPICS)) return "tools";

    if (
      startsWithAny(repo.name, TOOL_NAME_PREFIXES) ||
      includesAny(repo.description, TOOL_TEXT_MARKERS)
    ) {
      return "tools";
    }

    if (hasAnyTopic(topics, PROJECT_TOPICS)) return "projects";

    // Default stream type for uncategorized repos.
    return "projects";
  };

  const renderRepoCard = ({ repo, streamType, topics }) => {
    const card = document.createElement("div");
    card.className = "repo";

    const badgeLabel = streamType === "tools" ? "Tool" : "Project";
    const badgeClass = streamType === "tools" ? "repo-badge tool" : "repo-badge project";

    const topicMarkup = topics
      .filter((topic) => topic !== "portfolio-tool" && topic !== "portfolio-project")
      .slice(0, 4)
      .map((topic) => `<span class="repo-topic">${escapeHtml(topic)}</span>`)
      .join("");

    const updated = new Date(repo.updated_at).toLocaleDateString();

    card.innerHTML = `
      <div class="repo-top">
        <a href="${escapeHtml(repo.html_url)}" target="_blank" rel="noopener noreferrer" class="repo-name">
          ${escapeHtml(repo.name)}
        </a>
        <div class="repo-meta-right">
          <span class="${badgeClass}">${badgeLabel}</span>
          <span class="repo-stars">★ ${repo.stargazers_count}</span>
        </div>
      </div>

      <p class="repo-desc">
        ${escapeHtml(repo.description || "No description provided")}
      </p>

      ${topicMarkup ? `<div class="repo-topic-row">${topicMarkup}</div>` : ""}

      <div class="repo-meta">
        ${escapeHtml(repo.language || "Code")} • Updated ${updated}
      </div>
    `;

    return card;
  };

  const renderStream = (container, repos) => {
    const requestedStream = normalize(container.dataset.githubStream || "projects");
    const streamType = requestedStream === "tools" ? "tools" : requestedStream === "all" ? "all" : "projects";

    const limitFromAttr = Number.parseInt(container.dataset.streamLimit || "", 10);
    const defaultLimit = streamType === "tools" ? 9 : 6;
    const limit = Number.isFinite(limitFromAttr) && limitFromAttr > 0 ? limitFromAttr : defaultLimit;

    const visible = repos
      .filter((entry) => streamType === "all" || entry.streamType === streamType)
      .slice(0, limit);

    if (!visible.length) {
      container.innerHTML =
        streamType === "tools"
          ? "No tool repositories found yet. Add topic <code>portfolio-tool</code> on GitHub to populate this stream."
          : "No repositories found for this stream yet.";
      return;
    }

    container.innerHTML = "";
    visible.forEach((entry) => {
      container.appendChild(renderRepoCard(entry));
    });
  };

  async function loadRepos() {
    try {
      const res = await fetch(
        `https://api.github.com/users/${username}/repos?per_page=100&sort=updated`,
        {
          headers: {
            Accept: "application/vnd.github+json"
          }
        }
      );

      if (!res.ok) {
        throw new Error(`GitHub API error: ${res.status}`);
      }

      const repos = await res.json();
      if (!Array.isArray(repos)) {
        throw new Error("Unexpected GitHub payload");
      }

      const decorated = repos
        .filter((repo) => !repo.fork)
        .map((repo) => {
          const topics = getTopics(repo);
          return {
            repo,
            topics,
            streamType: classifyRepo(repo, topics)
          };
        })
        .sort((a, b) => new Date(b.repo.updated_at) - new Date(a.repo.updated_at));

      streamContainers.forEach((container) => {
        renderStream(container, decorated);
      });
    } catch (err) {
      streamContainers.forEach((container) => {
        container.textContent = "Unable to load GitHub right now.";
      });
    }
  }

  loadRepos();
}
