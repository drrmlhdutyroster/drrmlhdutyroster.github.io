/* EM Roster - keeps a copy of the page for when the network drops.
   Always asks the network first, so everyone gets the newest version;
   the saved copy is used only when there is no answer within 6 seconds
   (or no internet at all). Roster data is never kept here - it always
   comes live from the department sheet. */
var CACHE = "em-roster-v1";
self.addEventListener("install", function(e){ self.skipWaiting(); });
self.addEventListener("activate", function(e){ e.waitUntil(self.clients.claim()); });
self.addEventListener("fetch", function(e){
  var r = e.request;
  if (r.method !== "GET") return;
  var u = new URL(r.url);
  if (u.origin !== self.location.origin) return;          /* the sheet, fonts: untouched */
  e.respondWith(new Promise(function(done){
    var settled = false;
    function give(res){ if (!settled && res){ settled = true; done(res); } }
    function fromCache(){
      return caches.match(r, {ignoreSearch: r.mode === "navigate"}).then(function(c){ if (c) give(c); return c; });
    }
    var t = setTimeout(fromCache, 6000);
    fetch(r).then(function(res){
      clearTimeout(t);
      if (res && res.ok){ var copy = res.clone(); caches.open(CACHE).then(function(c){ c.put(r, copy); }); }
      give(res);
    }).catch(function(){
      clearTimeout(t);
      fromCache().then(function(c){ if (!c) give(new Response("You are offline and this page has not been saved yet.", {status: 503, headers: {"Content-Type": "text/plain"}})); });
    });
  }));
});
