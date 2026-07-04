# TrailGuesser – vasúti GeoGuesser

Egyjátékos, böngészőben futó játék: 360°-os képek (vagy élő panoráma-beágyazások)
alapján kell kitalálni, melyik országban és melyik vasútvonalon járunk. Nincs
szerver, nincs adatbázis, nincs többjátékos mód – egyetlen laptopról fut,
egyszeri alkalomra (pl. egy közösségi esemény kivetítőjén).

A felület és a teljes játékmenet **csak magyarul** érhető el.

## Gyors indítás

Szükséged van [Node.js](https://nodejs.org)-ra (a legtöbb gépen már telepítve
van). Ez csak egy helyi fájlkiszolgálóhoz kell, mert a böngészők biztonsági
okokból nem engedik `file://`-ból betölteni a JSON adatfájlokat.

```bash
node server.js
```

vagy dupla kattintás a `start.sh` (Linux/macOS) / `start.bat` (Windows)
fájlra. Ezután nyisd meg böngészőben: **http://localhost:8080**

Internetkapcsolat szükséges a térkép (OpenStreetMap csempék) betöltéséhez, és
akkor is, ha élő Mapillary/KartaView beágyazást használsz. A 360°-os képek és
maga a játék helyi fájlokból működik.

## Hogyan add meg a saját helyszíneidet

Minden helyszín a `data/locations.json` fájlban van leírva. Egy helyszín
így néz ki:

```json
{
  "id": "loc11",
  "name": "Ghega-vasútvonal",
  "country": "Ausztria",
  "lat": 47.622,
  "lng": 15.827,
  "scenes": [
    "assets/locations/loc11/scene1.jpg",
    "assets/locations/loc11/scene2.jpg",
    "assets/locations/loc11/scene3.jpg"
  ],
  "revealImage": "assets/locations/loc11/reveal.jpg"
}
```

Mezők:

- **id** – egyedi azonosító (ne árulja el a megoldást, pl. `loc11`).
- **name** – a vasútvonal neve, amit a játékosnak ki kell találnia. Ez a
  szöveg jelenik meg a legördülő javaslatok között a "Vasútvonal neve" mezőnél
  is, tehát a játékosok pontosan ebből a listából választhatnak.
- **country** – az ország magyar neve (lásd `data/countries.json`).
- **lat / lng** – a helyszín valós koordinátája (ebből számol a játék
  távolságot).
- **scenes** – a 360°-os képek listája **haladási sorrendben**. A "Hátra" /
  "Előre" gombok ezen a listán lépkednek. Legalább 1 kép szükséges, de 3-5
  már jó "sétaélményt" ad.
- **revealImage** – a megoldás képernyőn megjelenő, a helyszínt bemutató kép
  (pl. egy szép, felismerhető fotó a vonalról/tájról).

Új ország hozzáadásakor vedd fel a `data/countries.json` listába is, különben
nem tudod majd kiválasztani a legördülőben.

### Honnan szerezz 360°-os képeket vasútvonalakhoz

A Google Street View-n nincs vasúti lefedés, de több alternatíva van:

1. **Saját 360° fotó/kamera** – ha van 360°-os kameránk, a legegyszerűbb és
   legszebb megoldás.
2. **360°-os "cab ride" YouTube-videók** – sok vasútrajongó tölt fel 360°-os
   vezetőállás-felvételeket. Egy 360°-os videóból `ffmpeg`-gel könnyen ki
   lehet menteni néhány kockát equirectangular képként:
   ```bash
   ffmpeg -i cabride_360.mp4 -vf "select='eq(n\,300)+eq(n\,600)+eq(n\,900)'" -vsync 0 scene%d.jpg
   ```
   (a fenti a 300., 600. és 900. képkockát menti ki – igazítsd az időzítéshez).
3. **Mapillary / KartaView** – ezek a szolgáltatások elsősorban útmenti
   képeket gyűjtenek, vasúti nyomvonalon ritkán van közvetlen lefedés, de
   ösvények/állomások környékén előfordulhat. Ha találsz megfelelő képet,
   használd az **élő beágyazás** funkciót (lásd lent) ahelyett, hogy letöltenéd
   a képet.

### Élő beágyazás (Mapillary / KartaView / bármilyen 360° oldal)

Ha egy helyszínhez nem helyi képeket, hanem egy élő, beágyazható 360°-os
nézegetőt szeretnél használni (pl. mert találtál egy valódi Mapillary-képet
a vasútvonal mellett), a `scenes`/`revealImage` helyett/mellett adj meg egy
`embed` mezőt:

```json
{
  "id": "loc12",
  "name": "Példa vasútvonal",
  "country": "Szlovénia",
  "lat": 46.05,
  "lng": 14.5,
  "embed": {
    "provider": "mapillary",
    "imageKey": "ISMÉTLŐDŐ_MAPILLARY_KÉP_AZONOSÍTÓ"
  },
  "revealImage": "assets/locations/loc12/reveal.jpg"
}
```

- **provider: "mapillary"** + **imageKey** – a Mapillary térképén megnyitott
  kép URL-jéből kimásolt azonosító. A játék ezt tölti be:
  `https://www.mapillary.com/embed?image_key=<imageKey>&style=photo`
- **provider: "iframe"** + **url** – bármilyen más beágyazható 360° oldal
  (pl. KartaView részletnézet linkje, vagy egy saját hosztolt panoráma-oldal).
  Ekkor pontosan azt az URL-t ágyazza be a játék.

Beágyazott nézegetőnél a játék elrejti a saját "Előre/Hátra" gombjait, mert a
körbenézést és a lépkedést maga a beágyazott nézegető (Mapillary/KartaView)
kezeli. Fontos: **beágyazáshoz internetkapcsolat kell a parti alatt is**, és
egyes oldalak biztonsági beállításai (`X-Frame-Options`/CSP) megakadályozhatják
a beágyazást – érdemes előre kipróbálni, és ha nem működik, inkább letöltött
képekkel (helyi `scenes`) dolgozni.

## A demó helyszínek

A `data/locations.json` fájl 10 valós, látványos európai vasútvonalat
tartalmaz (Bernina, Flåm, Semmering, Albula, Tauern, Tátrai Elektromos Vasút,
Budapesti Gyermekvasút, Fekete-erdő-vasútvonal, La Mure, Cinque Terre). A
hozzájuk tartozó képek (`assets/locations/locXX/*.jpg`) **helykitöltő
(placeholder) grafikák**, nem valódi fotók – ezeket érdemes lecserélni saját
360°-os képekre a valódi játék előtt. A placeholder képeket a
`scripts/generate_placeholder_images.py` szkript generálta; ha módosítod a
`locations.json`-t és újra le akarod generáltatni a helykitöltőket, futtasd:

```bash
pip install pillow numpy
python3 scripts/generate_placeholder_images.py
```

## Pontszámítás

Helyszínenként az alábbi komponensekből áll össze a pontszám:

- **Ország eltalálása**: +1000 pont, ha a kiválasztott ország pontosan
  egyezik a helyszín országával.
- **Vasútvonal eltalálása**: +2000 pont, ha a megadott vonalnév pontosan
  egyezik a helyszín nevével.
- **Távolság**: legfeljebb 5000 pont, exponenciálisan csökkenve a valós
  helyszín és a térképre helyezett tipp közötti távolsággal (minél közelebb
  tippelsz, annál több pont jár).

Egy kör maximum 8000 pont. A végén az összes kör pontszáma összeadódik.

## Játékmenet dióhéjban

1. **Kezdőképernyő** – hány helyszínnel szeretnél játszani.
2. **Helyszín képernyő** – nézz körbe a 360°-os képen (húzd az egérrel),
   lépkedj előre/hátra a gombokkal, válaszd ki az országot és a vonal nevét
   (legördülő javaslatokból), majd kattints a térképre, ahova tippelsz.
   A "Tippet beküld" gomb csak akkor aktív, ha helyeztél tippet a térképre.
3. **Megoldás képernyő** – megjelenik a helyszínt bemutató kép, a valós és a
   tippelt pont a térképen, illetve a pontszám bontása.
4. **Végeredmény** – az összpontszám és helyszínenkénti bontás, valamint
   lehetőség új játék indítására.

Nincs időkorlát – a játék a saját tempódban játszható.

## Fájlstruktúra

```
index.html              a játék fő oldala
css/style.css           kinézet
js/                      játéklogika (ES modulok)
data/locations.json      helyszínek adatai
data/countries.json      választható országok listája
assets/locations/<id>/   helyszínenkénti 360° képek + megoldás-kép
assets/vendor/           helyben tárolt Leaflet és Pannellum könyvtárak
scripts/generate_placeholder_images.py   helykitöltő képek generátora
server.js, start.sh, start.bat   helyi indítás
```
