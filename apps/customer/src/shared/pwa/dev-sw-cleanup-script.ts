/** Inline in <head> during dev — must run before app bundles (useEffect is too late). */
export const DEV_SW_CLEANUP_SCRIPT = `
(function () {
  if (!("serviceWorker" in navigator)) return;
  if (sessionStorage.getItem("yorewards-dev-sw-cleared") === "1") return;
  navigator.serviceWorker.getRegistrations().then(function (regs) {
    if (!regs.length) return;
    return Promise.all(regs.map(function (r) { return r.unregister(); }))
      .then(function () {
        if ("caches" in window) {
          return caches.keys().then(function (keys) {
            return Promise.all(keys.map(function (k) { return caches.delete(k); }));
          });
        }
      })
      .then(function () {
        sessionStorage.setItem("yorewards-dev-sw-cleared", "1");
        location.reload();
      });
  });
})();
`.trim();
