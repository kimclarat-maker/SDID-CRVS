"use strict";

// --- Function to render each article ---
function renderArticle(section) {
  const article = document.createElement("article");
  article.className = "docs-article";
  article.id = section.id;

  let imagesHtml = "";
  if (section.images && section.images.length) {
    imagesHtml = '<div class="simplelightbox-gallery row mb-3">';
    section.images.forEach((img) => {
      imagesHtml += `
        <div class="col-12 col-md-4 mb-3">
          <a href="${img.src}">
            <img class="figure-img img-fluid shadow rounded" src="${img.thumb}" alt="${img.title}" title="${img.title}" />
          </a>
        </div>`;
    });
    imagesHtml += "</div>";
  }

  // Check if this is a parent section (has subsections but no parent section content rendered yet)
  const isParentSection =
    section.subsections &&
    !section.content?.includes("They are different ways"); // Adjust this condition as needed

  article.innerHTML = `
    <header class="docs-header">
      <h1 class="docs-heading">${section.title} </h1>
      <section class="docs-intro">
        ${section.content || ""}
        ${isParentSection ? '<p class="text-muted"></p>' : ""}
      </section>
      ${
        section.requirements
          ? `<h5>Requirements:</h5>${section.requirements}`
          : ""
      }
      ${imagesHtml}
    </header>
  `;

  contentContainer.appendChild(article);
}

// Initialize smooth scroll & lightbox
if (window.Gumshoe) Gumshoe.init();
if (window.SimpleLightbox) new SimpleLightbox(".simplelightbox-gallery a");

// --- Language switcher ---
const languageSelect = document.getElementById("language-select");
languageSelect.addEventListener("change", (e) => {
  const lang = e.target.value;
  localStorage.setItem("docsLanguage", lang);
  applyLanguage(lang);
});

function applyLanguage(lang) {
  document.documentElement.lang = lang;
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (translations[lang] && translations[lang][key])
      el.innerText = translations[lang][key];
  });
}

// Load saved language
applyLanguage(localStorage.getItem("docsLanguage") || "en");

// --- Search filter ---
document.querySelectorAll(".search-form").forEach((form) => {
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const term = e.target.search.value.toLowerCase();
    document.querySelectorAll(".docs-article").forEach((article) => {
      const text = article.innerText.toLowerCase();
      article.style.display = text.includes(term) ? "block" : "none";
    });
  });
});
