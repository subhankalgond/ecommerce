/**
 * The product page is a server component, but "recently viewed" lives in the
 * visitor's localStorage. We inject a tiny beforeload script that records the
 * view on the client as the page renders — no layout shift, no extra fetch.
 */
export function recordViewOnServer(slug: string): void {
  // This import is evaluated at render time on the server; the actual
  // recording happens through the client component in RecentlyViewedRail.
  // To keep it dependency-free we use a synchronous script tag below.
}

export function recordViewScript(slug: string): string {
  const KEY = "nova-threads-recently-viewed";
  return `(function(){try{var k=${JSON.stringify(KEY)};var l=JSON.parse(localStorage.getItem(k)||"[]");var n=[${JSON.stringify(
    slug
  )}].concat(l.filter(function(s){return s!==${JSON.stringify(
    slug
  )}})).slice(0,8);localStorage.setItem(k,JSON.stringify(n));}catch(e){}})();`;
}
