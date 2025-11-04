async function includePartials() {
  const targets = document.querySelectorAll(
    "[data-include]"
  );
  await Promise.all(
    [...targets].map(async (el) => {
      const url = el.getAttribute("data-include");
      try {
        const res = await fetch(url, { cache: "no-cache" });
        if (!res.ok)
          throw new Error(
            res.status + " " + res.statusText
          );
        const html = await res.text();
        el.outerHTML = html;
      } catch (e) {
        console.error("Include failed for", url, e);
      }
    })
  );

  // Active link highlight (root-relative)
  const currentPage =
    location.pathname.split("/").pop() || "index.html";
  const nav = document.querySelector(".nav-links");
  if (nav) {
    for (const a of nav.querySelectorAll("a[href]")) {
      const href = a.getAttribute("href");
      const linkedPage = href.split("/").pop();

      // Match current page with linked page
      if (
        linkedPage === currentPage ||
        (currentPage === "" &&
          linkedPage === "index.html") ||
        (currentPage === "index.html" &&
          linkedPage === "index.html")
      ) {
        a.setAttribute("aria-current", "page");
        a.classList.add("active");
      }
    }
  }
}

export { includePartials };
