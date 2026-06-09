# Historia czatu — Rozkłady lotów Coral Travel (coraltravel.pl)

Dokument podsumowuje całą rozmowę: kolejne polecenia i wprowadzone zmiany,
najważniejsze decyzje techniczne, listę plików oraz instrukcję użycia.
Surowy, pełny zapis rozmowy znajduje się w transkrypcie:
`/mnt/transcripts/2026-06-01-12-43-03-coral-timetable-tool.txt`.

---

## 1. Kontekst projektu

Strona „Rozkłady lotów" na coraltravel.pl. Zawiera:
- sekcję hero (tytuł + przycisk do `https://coraltravel.pl/airlines`),
- rozwijaną sekcję „Ważne informacje" (domyślnie otwarta),
- rozwijaną sekcję „Zmiana przepisów kontroli paszportowej" (domyślnie zamknięta),
- tytuł „Tablice odlotów" z zakładkami (nav-tabs),
- dwie sortowalne tabele: „Lotniska" (28 wierszy) i „Linie lotnicze" (23 wiersze).

Oryginał oparty był na Bootstrap 5.3.2 + bootstrap-icons 1.11.3 + Popper + biblioteka
`tablesort` (`https://b2ccdn.coraltravel.pl/content/TimeTable/tablesortmin.js`).
Wszystkie style własne były scoped do `.tt-body`. Język pracy: polski.

Wymagania zachowane przez cały czas (wierność oryginałowi):
- format komórki z linkiem: `<td class="none"><a href="URL" rel="nofollow" target="_BLANK">…ikona…</a><br></td>`,
- `&` w adresach kodowane jako `&amp;` (Wiedeń, Doha, Rzym),
- zachowane oryginalne literówki: atrybut `cellspaccing` (podwójne c) i nagłówek „Nazwa lini" (jedno i),
- `thead` z klasą `table-dark`; tabela „Lotniska" dodatkowo z klasą `table-responsive`; obie w `.table-responsive-sm`.

---

## 2. Etap I — offline'owy edytor tabel (zrealizowany)

Powstało narzędzie `edytor-rozkladow.html` — samodzielny, offline'owy edytor (styl
grayscale w duchu shadcn/ui). Funkcje:
- dwie zakładki („Lotniska" / „Linie Lotnicze"),
- edycja komórek w miejscu, dodawanie / usuwanie / duplikowanie / przenoszenie wierszy,
  zmiana kolejności metodą przeciągnij-i-upuść, filtr,
- autozapis w localStorage (klucz `coral_timetable_editor_v1`, z awaryjnym zapisem w pamięci),
- „Przywróć oryginał" per zakładka,
- okno „Generuj kod HTML" (z opcjami) oraz okno „Wklej kod" (import wierszy z wklejonego HTML).

Dodatkowo powstał dokument przekazania `historia-czatu-edytor.md`.

---

## 3. Etap II — wersja BEZ Bootstrapa, podzielona na 3 pola CMS

Pytanie: czy można zrezygnować z Bootstrapa, zachowując w 100% wygląd i działanie skryptów?
Po ustaleniach:
- Bootstrap jest ładowany **tylko w tym bloku** → można go w pełni usunąć,
- zachować całą interaktywność (rozwijanie, zakładki, sortowanie) na własnym JS,
- ikony zastąpić wstawkami SVG.

Decyzje techniczne:
- `tablesort` (MIT, 2986 B) — wstawiony inline w niezmienionej postaci, aby kolejność
  sortowania (także po polskich znakach) była identyczna co do wiersza.
- Rozwijanie i zakładki — własny, lekki JS (delegacja zdarzeń na `document`).
- Ikony — inline SVG: kółko ze strzałką (linki), ramka ze strzałką (nagłówki),
  strzałka w przycisku hero. Klasa `.bi-svg` (1em, `currentColor`, `vertical-align:-.125em`).
- CSS Bootstrapa odtworzony własnymi regułami scoped do `.tt-body` (kontener, siatka
  `row`/`col-*`, odstępy `g-2`/`gx-5`, baza tabeli + `table-dark`/`table-striped`,
  przycisk `btn-outline-primary`, zakładki, `collapse`), a po nich oryginalny `<style>`
  (zachowuje kolejność nadpisań jak w oryginale).

Powstały trzy samodzielne pliki (wklejane do CMS w kolejności 1 → 2 → 3):
- `pole-1-css-js.html` — `<style>` (odpowiedniki Bootstrapa + oryginalny styl) oraz
  `<script>` (wstawiony `tablesort` + własna obsługa collapse/tabs + inicjalizacja sortowania).
- `pole-2-tresc.html` — treść (hero + obie sekcje informacyjne); ikona w przycisku jako SVG.
- `pole-3-tabela-zakladki.html` — tytuł + zakładki + obie pełne tabele; ikony jako SVG;
  bez własnego `<script>` (inicjalizacja sortowania przeniesiona do Pola 1).

---

## 4. Poprawki zgłaszane kolejno (chronologicznie)

1. **Błąd walidatora CMS w Polu 1** — „niedomknięte tagi" w `<script>`. Przyczyna: walidator
   czytał operatory porównania (`o<i.table…`, `i<all.length`) jak początki znaczników `<i>`,
   `<a>`. Naprawa: wstawienie spacji po każdym `<` w kodzie JS (`a < b` to dla JS to samo).

2. **Czcionka** — `.tt-body` narzucało systemowy font, przykrywając Manrope. Usunięto
   `font-family` z `.tt-body` → dziedziczy się domyślny font strony (Manrope).

3. **Za duży odstęp ikon w nagłówkach** — regresja zakresowania: `.tt-body .col-1` miało
   wyższą specyficzność niż `.tt-ikona{width:70px}`. Naprawa: podniesienie specyficzności
   do `.tt-body .tt-ikona` (kolumna ikony znów 70 px).

4. **Niebieski hover linków zakładek** — dodana ogólna reguła `a:hover` (kolor Bootstrapa)
   biła `.nav-link`. Usunięto ją → hover wraca do ciemnoszarego `#333`.

5. **Równe odstępy w nagłówkach + większe wcięcie tytułu** — odstęp tytuł↔przycisk był
   większy o dokładany `margin-left:10px` w `.tt-rozwin a`. Dodano blok korekt (tylko desktop):
   zerowanie tego marginesu (odstępy ikona↔tytuł = tytuł↔przycisk) oraz `margin-left:1rem`
   na `.tt-ikona` (większy odstęp od lewej krawędzi). Wartość `1rem` jest do regulacji.

6. **„Rozwiń/Zwiń" otwierało i od razu chowało sekcję** — podwójne podpięcie obsługi
   (CMS renderował pole ze skryptem więcej niż raz). Naprawa: zabezpieczenie przed wielokrotną
   inicjalizacją (`window.__ttTimetableInit`) — obsługa kliknięć i sortowania podpina się tylko raz.

---

## 5. Aktualizacja edytora pod nową wersję (Pole 3)

- Generowany kod dostosowany do Pola 3: ikony jako wstawki SVG (zamiast `<i class="bi …">`),
  właściwe klasy tabel („Lotniska" → `table table-responsive table-striped`,
  „Linie" → `table table-striped`). Import nadal poprawnie wyłapuje dane (tekst kolumn + `href`).

- **Brak stylów po wklejeniu** — przyczyna: edytor generował tylko `<table>`, bez owijki
  `<div class="tt-body container my-5">`, a wszystkie style są scoped do `.tt-body`.
  Naprawa: w oknie „Generuj kod HTML" dodano wybór **Zakres** z trzema opcjami:
  - **Całe Pole 3** (domyślne) — owijka `tt-body` + zakładki + obie tabele; wynik jest
    bajt-w-bajt identyczny z wklejonym Polem 3. To wklejasz jako całe Pole 3 — w pełni ostylowane.
  - **Sama tabela** (aktywnej zakładki) — do wklejenia w istniejącą strukturę.
  - **Tylko wiersze `<tbody>`** (aktywnej zakładki) — do wklejenia w istniejący `<tbody>`.

---

## 6. Pliki (stan końcowy)

- `edytor-rozkladow.html` — offline'owy edytor; generuje kod zgodny z Polem 3 (3 zakresy).
- `pole-1-css-js.html` — style + skrypty (bez Bootstrapa), wklejane jako pierwsze.
- `pole-2-tresc.html` — treść (hero + sekcje informacyjne).
- `pole-3-tabela-zakladki.html` — tytuł + zakładki + tabele.
- `historia-czatu-edytor.md` — wcześniejszy dokument przekazania (dot. samego edytora).
- `historia-czatu.md` — ten dokument (pełna historia rozmowy).

---

## 7. Jak używać

1. Wklej pola do CMS w kolejności: **Pole 1 → Pole 2 → Pole 3**.
2. Do aktualizacji danych tabel używaj `edytor-rozkladow.html`:
   edytuj → „Generuj kod HTML" → **Zakres: Całe Pole 3** → „Kopiuj" → wklej jako całe Pole 3.
   (Alternatywnie „Sama tabela" / „Tylko wiersze" — wklejane w istniejącą strukturę.)

Uwagi:
- Animacja rozwijania to płynne przejście wysokości (`max-height`) — bliskie „zjeżdżaniu"
  Bootstrapa, możliwa minimalna różnica tempa.
- Jeśli rozwijanie nadal dublowałoby się po wklejeniu, oznaczałoby to obecność innego skryptu
  obsługującego `data-bs-toggle` na stronie — wtedy rozwiązaniem jest zmiana atrybutów
  `data-bs-toggle`/`data-bs-target` na własne (np. `data-tt-toggle`) w polach 2 i 3.
