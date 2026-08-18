async function loadLanguage(lang) {
  const res = await fetch(`assets/lang/${lang}.json`);
  const data = await res.json();

  // Page title & intro
  document.querySelector(".page-heading").textContent = data.pageTitle;
  document.querySelector(".page-intro").textContent = data.pageIntro;

  // Render sections
  const container = document.getElementById("docs-sections");
  container.innerHTML = ""; // Clear existing

  data.sections.forEach((section) => {
    const col = document.createElement("div");
    col.className = "col-12 col-lg-4 py-3";

    col.innerHTML = `
        <div class="card shadow-sm">
          <div class="card-body">
            <h5 class="card-title mb-3">
              <span class="theme-icon-holder card-icon-holder me-2">
                <i class="${section.icon}"></i>
              </span>
              <span class="card-title-text">${section.title}</span>
            </h5>
            <div class="card-text">${section.description}</div>
            <a class="card-link-mask" href="${section.link}"></a>
          </div>
        </div>
      `;

    container.appendChild(col);
  });
}

// Init default language
loadLanguage("en");

// Language switcher
document.getElementById("languageSwitcher").addEventListener("change", (e) => {
  loadLanguage(e.target.value);
});

// Search filter
document.querySelector(".search-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const term = e.target.search.value.toLowerCase();
  document.querySelectorAll("#docs-sections .card").forEach((card) => {
    const text = card.innerText.toLowerCase();
    card.parentElement.style.display = text.includes(term) ? "block" : "none";
  });
});
