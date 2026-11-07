# VIBE — první verze propojená se Supabase

Tato verze přidává základní připojení k projektu Supabase.

## Co je nyní propojené
- registrace a přihlášení e-mailem přes Supabase Auth
- načítání profilu z tabulky `profiles`
- úprava vlastního profilu
- načítání příspěvků z tabulek `posts`, `comments` a `likes`
- vytváření příspěvků (text + volitelný veřejný odkaz na obrázek)
- přidávání komentářů
- lajkování a odebírání lajků
- responzivní rozhraní pro mobil, tablet i počítač

## Nastavení
V `app.js` jsou vloženy Project URL a veřejný Publishable key projektu VIBE. Publishable key je určený pro klientskou aplikaci. Nikdy sem nevkládejte `service_role` ani `secret` klíč.

Knihovna Supabase JS se načítá z CDN, proto je při používání aplikace potřeba internetové připojení.

## Důležitá omezení této verze
- Zatím není nakonfigurované úložiště Supabase Storage. Obrázky se nyní přidávají pouze pomocí veřejného URL odkazu; nahrávání z telefonu bude následovat po vytvoření a zabezpečení úložiště.
- Sekce Uložené, sledování profilů a příběhy zatím nejsou napojené na databázi.
- Před veřejným spuštěním je potřeba ověřit nastavení RLS a e-mailových přesměrování, doplnit reset hesla, mazání účtu, moderaci a ochranu proti zneužití.

## Spuštění
Otevři `index.html` přes webový hosting. Pouhé otevření souboru lokálně v některých mobilních prohlížečích může omezit fungování modulů nebo přihlášení. Pro sdílení mezi uživateli je potřeba web nasadit na hosting s HTTPS.
