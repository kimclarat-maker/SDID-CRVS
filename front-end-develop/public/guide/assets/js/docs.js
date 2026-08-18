"use strict";

// --- Sidebar toggler ---
const sidebarToggler = document.getElementById("docs-sidebar-toggler");
const docsSidebar = document.getElementById("docs-sidebar");

sidebarToggler?.addEventListener("click", () => {
  if (docsSidebar.classList.contains("sidebar-visible")) {
    console.log("visible");
    docsSidebar.classList.remove("sidebar-visible");
    docsSidebar.classList.add("sidebar-hidden");
  } else {
    console.log("hidden");
    docsSidebar.classList.remove("sidebar-hidden");
    docsSidebar.classList.add("sidebar-visible");
  }
});

function responsiveSidebar() {
  if (!docsSidebar) return;
  let w = window.innerWidth;
  if (w >= 1200) {
    // if larger
    console.log("larger");
    docsSidebar.classList.remove("sidebar-hidden");
    docsSidebar.classList.add("sidebar-visible");
  } else {
    // if smaller
    console.log("smaller");
    docsSidebar.classList.remove("sidebar-visible");
    docsSidebar.classList.add("sidebar-hidden");
  }
}

window.onload = responsiveSidebar;
window.onresize = responsiveSidebar;

// --- Render dynamic content ---
const sidebarNavList = document.querySelector("#docs-nav ul.section-items");
const contentContainer = document.getElementById("docs-sections");

docsData.sections.forEach((section, index) => {
  // Main section (title in sidebar)
  const li = document.createElement("li");
  li.className = "nav-item section-title";
  li.innerHTML = `
    <a class="nav-link scrollto${index === 0 ? " active" : ""}" href="#${
    section.id
  }">
      <span class="theme-icon-holder me-2"><i class="fas fa-map-signs"></i></span>
      ${section.title}
    </a>
  `;
  sidebarNavList.appendChild(li);

  // Subsections in sidebar (indented)
  if (section.subsections) {
    section.subsections.forEach((sub) => {
      const subLi = document.createElement("li");
      subLi.className = "nav-item ps-3"; // Add padding-left for indentation
      subLi.innerHTML = `<a class="nav-link scrollto" href="#${sub.id}">${sub.title}</a>`;
      sidebarNavList.appendChild(subLi);
    });
  }

  // Render parent section article FIRST
  renderArticle(section);

  // Then render subsections
  if (section.subsections) {
    section.subsections.forEach((sub) => renderArticle(sub));
  }
});

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

  // Check if this is a parent section (has subsections)
  const isParentSection = section.subsections && section.content;

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

// --- Initialize Gumshoe ScrollSpy after content is rendered ---
document.addEventListener("DOMContentLoaded", function () {
  // Initialize Gumshoe for scrollspy
  if (typeof Gumshoe !== "undefined") {
    var spy = new Gumshoe("#docs-nav a", {
      offset: 69, // sticky header height
    });
  }

  // Initialize SimpleLightbox
  if (typeof SimpleLightbox !== "undefined") {
    var lightbox = new SimpleLightbox(".simplelightbox-gallery a", {
      /* options */
    });
  }

  // Add click event listeners to sidebar links for mobile responsiveness
  const sidebarLinks = document.querySelectorAll("#docs-nav .scrollto");
  sidebarLinks.forEach((link) => {
    link.addEventListener("click", function () {
      // On mobile, close sidebar after clicking a link
      if (window.innerWidth < 1200) {
        docsSidebar.classList.remove("sidebar-visible");
        docsSidebar.classList.add("sidebar-hidden");
      }
    });
  });
});

// --- Language switcher ---
const languageSelect = document.getElementById("language-select");
if (languageSelect) {
  languageSelect.addEventListener("change", (e) => {
    const lang = e.target.value;
    localStorage.setItem("docsLanguage", lang);
    applyLanguage(lang);
  });
}

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
