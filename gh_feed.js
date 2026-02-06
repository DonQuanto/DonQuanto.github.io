const username = "DonQuanto";
const container = document.getElementById("github-feed");

async function loadRepos() {
  try {
    const res = await fetch(`https://api.github.com/users/${username}/repos?per_page=100`);
    const repos = await res.json();

    // filter + sort
    const filtered = repos
      .filter(r => !r.fork)
      .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
      .slice(0, 6);

    container.innerHTML = "";

    filtered.forEach(repo => {
      const el = document.createElement("div");
      el.className = "repo";

      el.innerHTML = `
        <div class="repo-top">
          <a href="${repo.html_url}" target="_blank" class="repo-name">
            ${repo.name}
          </a>
          <span class="repo-stars">★ ${repo.stargazers_count}</span>
        </div>

        <p class="repo-desc">
          ${repo.description || "No description provided"}
        </p>

        <div class="repo-meta">
          ${repo.language || "Code"} • Updated ${new Date(repo.updated_at).toLocaleDateString()}
        </div>
      `;

      container.appendChild(el);
    });

  } catch (err) {
    container.innerHTML = "Unable to load GitHub.";
  }
}

loadRepos();
