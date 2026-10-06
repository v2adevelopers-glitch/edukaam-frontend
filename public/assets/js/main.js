/**
 * NiceAdmin-style behaviour for a React app.
 * React renders the header and sidebar after this file loads, so every handler uses event
 * delegation on document instead of binding to elements at load time.
 */
(function () {
  "use strict";

  const isMobile = () => window.innerWidth < 1200;

  document.addEventListener("click", function (e) {
    // Sidebar toggle (hamburger in the header)
    if (e.target.closest(".toggle-sidebar-btn")) {
      document.body.classList.toggle("toggle-sidebar");
      return;
    }

    // Tap on the dark backdrop closes the mobile sidebar
    if (e.target.closest(".sidebar-backdrop")) {
      document.body.classList.remove("toggle-sidebar");
      return;
    }

    // Picking a menu item on mobile closes the sidebar
    if (isMobile() && e.target.closest(".sidebar .nav-link")) {
      document.body.classList.remove("toggle-sidebar");
    }

    // Back to top
    const backToTop = e.target.closest(".back-to-top");
    if (backToTop) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  });

  window.addEventListener("scroll", function () {
    const backToTop = document.querySelector(".back-to-top");
    if (!backToTop) return;
    if (window.scrollY > 100) {
      backToTop.classList.add("active");
    } else {
      backToTop.classList.remove("active");
    }
  });
})();
