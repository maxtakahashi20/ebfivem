// O cliente do Supabase chama /rest/v1; o PostgREST puro responde na raiz.
const http = require("http");
http
  .createServer((q, s) => {
    const path = q.url.replace(/^\/rest\/v1/, "") || "/";
    const r = http.request(
      { host: "127.0.0.1", port: 8091, path, method: q.method, headers: { ...q.headers, host: "127.0.0.1:8091" } },
      (x) => {
        s.writeHead(x.statusCode, x.headers);
        x.pipe(s);
      },
    );
    r.on("error", (e) => {
      s.writeHead(502);
      s.end(e.message);
    });
    q.pipe(r);
  })
  .listen(8092, "127.0.0.1");
