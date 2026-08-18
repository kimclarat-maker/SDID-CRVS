document.addEventListener("DOMContentLoaded", () => {
  const sections = Array.from(
    document.querySelectorAll(".docs-article .docs-section, #overview")
  );
  const navLinks = Array.from(document.querySelectorAll(".docs-nav .nav-link"));
  const paginationItems = Array.from(
    document.querySelectorAll(".pagination .page-item")
  );
  let currentIndex = 0;

  // Show a section by index
  const showSection = (index) => {
    sections.forEach(
      (section, i) => (section.style.display = i === index ? "block" : "none")
    );

    // Highlight sidebar link
    navLinks.forEach((link) => {
      const targetId = link.getAttribute("href").replace("#", "");
      link.classList.toggle("active", targetId === sections[index].id);
    });

    // Update pagination active & disabled
    paginationItems.forEach((li, i) => {
      const linkText = li.querySelector(".page-link").textContent.trim();
      li.classList.remove("active", "disabled");
      if (linkText === "Previous" && index === 0) li.classList.add("disabled");
      else if (linkText === "Next" && index === sections.length - 1)
        li.classList.add("disabled");
      else if (!isNaN(parseInt(linkText)) && parseInt(linkText) - 1 === index)
        li.classList.add("active");
    });
  };

  // Sidebar click
  navLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const targetId = link.getAttribute("href").replace("#", "");
      const index = sections.findIndex((section) => section.id === targetId);
      if (index !== -1) {
        currentIndex = index;
        showSection(currentIndex);
      }
    });
  });

  // Pagination click
  paginationItems.forEach((li) => {
    li.querySelector(".page-link").addEventListener("click", (e) => {
      e.preventDefault();
      const text = li.querySelector(".page-link").textContent.trim();
      if (text === "Next")
        currentIndex = Math.min(currentIndex + 1, sections.length - 1);
      else if (text === "Previous")
        currentIndex = Math.max(currentIndex - 1, 0);
      else currentIndex = parseInt(text) - 1;
      showSection(currentIndex);
    });
  });

  // Show overview section by default
  showSection(0);
});
