import { readFile, mkdir, writeFile } from "node:fs/promises";

// The administrative entry loads the same compiled app at /adm.
// Preserve its root asset base before normalizing the optional trailing slash.
const main = await readFile("dist/index.html", "utf8");
const entry = main.replace("<head>", `<head>
    <base id="dds-admin-base" href="../">
    <meta name="robots" content="noindex">
    <script>
      (function () {
        var url = new URL(location.href);
        url.pathname = url.pathname.replace(/\\/?$/, "/");
        document.getElementById("dds-admin-base").href = new URL("../", url).href;
        history.replaceState(history.state, "", location.pathname.replace(/\\/+$/, "") + location.search);
      })();
    </script>`);
await mkdir("dist/adm", { recursive: true });
await writeFile("dist/adm/index.html", entry);
