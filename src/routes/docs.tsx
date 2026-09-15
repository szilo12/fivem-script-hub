import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/docs")({
  head: () => ({
    meta: [
      { title: "Telepítés és licenc-ellenőrzés | NovaScripts" },
      {
        name: "description",
        content:
          "Így teszed fel a megvásárolt FiveM scriptet a szerverre: escrow resource kicsomagolása, licenckulcs beállítása és szerveroldali jogosultság-ellenőrzés.",
      },
      { property: "og:title", content: "Telepítési útmutató | NovaScripts" },
      {
        property: "og:description",
        content: "Escrow resource telepítése, licenckulcs beállítása és jogosultság-ellenőrzés FiveM szerveren.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Docs,
});

const luaSnippet = `-- server/license.lua
local LICENSE_KEY = GetConvar("novascripts_license", "")
local VERIFY_URL  = "https://project--ffa2ecb6-7199-4bc9-9479-cfcaa945c46b.lovable.app/api/public/license/verify"

local function verify()
  PerformHttpRequest(VERIFY_URL, function(status, body)
    if status ~= 200 then
      print("^1[NovaScripts] Licenc ellenorzes sikertelen: " .. tostring(status) .. "^0")
      return
    end
    local data = json.decode(body)
    if data and data.valid then
      print("^2[NovaScripts] Licenc rendben: " .. tostring(data.product) .. "^0")
    else
      print("^1[NovaScripts] Ervenytelen licenc, a resource leall.^0")
      StopResource(GetCurrentResourceName())
    end
  end, "POST", json.encode({
    license_key = LICENSE_KEY,
    resource = GetCurrentResourceName(),
    server_ip = GetConvar("web_baseUrl", "")
  }), { ["Content-Type"] = "application/json" })
end

CreateThread(function()
  verify()
  while true do
    Wait(60 * 60 * 1000) -- ora
    verify()
  end
end)`;

const steps = [
  {
    title: "1. Vásárlás és licenckulcs",
    body: "A megrendelés jóváhagyása után a Fiókom oldalon megjelenik a scripthez tartozó egyedi licenckulcs. Itt tudod a szervered IP-jéhez kötni is.",
  },
  {
    title: "2. Letöltés",
    body: "A Fiókom oldalon a Letöltés gombbal kapsz egy 5 percig élő, egyedi letöltési linket a legfrissebb verzióhoz.",
  },
  {
    title: "3. Feltöltés a szerverre",
    body: "Csomagold ki a resources mappába, majd add hozzá a server.cfg-hez: ensure advanced_ems. A config fájl szabadon szerkeszthető, a mag escrow-védett.",
  },
  {
    title: "4. Licenckulcs beállítása",
    body: 'A server.cfg-be írd be: set novascripts_license "FVM-XXXX-XXXX-XXXX". A resource induláskor ellenőrzi a kulcsot, és leáll, ha érvénytelen.',
  },
  {
    title: "5. CFX Keymaster",
    body: "Az escrow védelmet a CFX Keymasterben mi kapcsoljuk a fiókodhoz vagy a szerveredhez – a rendeléshez megadott CFX azonosító alapján. Ez a lépés a CFX oldalán történik, nem automatizálható kívülről.",
  },
];

function Docs() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-14">
      <h1 className="font-display text-3xl font-semibold md:text-4xl">Telepítés és licenc-ellenőrzés</h1>
      <p className="mt-3 text-muted-foreground">
        Vásárlástól a működő resource-ig öt lépés. A licenc-ellenőrzés a mi szerverünkkel beszél, így egy kimásolt
        script idegen szerveren nem indul el.
      </p>

      <ol className="mt-10 space-y-4">
        {steps.map((step) => (
          <li key={step.title} className="panel p-5">
            <h2 className="text-base font-semibold">{step.title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{step.body}</p>
          </li>
        ))}
      </ol>

      <section className="mt-12">
        <h2 className="font-display text-xl font-semibold">Szerveroldali ellenőrzés (Lua)</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Ez a részlet minden általunk kiadott scriptben megtalálható. Saját scriptedbe is beteheted.
        </p>
        <pre className="panel mt-4 overflow-x-auto p-5 font-mono text-xs leading-relaxed text-foreground/90">
          <code>{luaSnippet}</code>
        </pre>
      </section>

      <section className="mt-12">
        <h2 className="font-display text-xl font-semibold">Ellenőrző végpont</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          POST kérés a <code className="font-mono text-primary">/api/public/license/verify</code> címre, JSON törzzsel:
          license_key, resource, server_ip. Válasz: valid true/false, illetve hibakód (unknown_key, ip_mismatch,
          resource_mismatch, license_revoked).
        </p>
      </section>
    </main>
  );
}
