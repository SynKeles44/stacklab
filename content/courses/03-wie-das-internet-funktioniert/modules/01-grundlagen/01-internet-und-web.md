---
title: Internet und Web – nicht dasselbe
summary: Was das Internet ist, warum das World Wide Web nur einer von vielen Diensten darauf ist und wie beides entstanden ist.
duration: 18
sources:
  - title: MDN – How does the Internet work?
    url: https://developer.mozilla.org/en-US/docs/Learn_web_development/Howto/Web_mechanics/How_does_the_Internet_work
  - title: MDN – Browsing the web
    url: https://developer.mozilla.org/en-US/docs/Learn_web_development/Getting_started/Environment_setup/Browsing_the_web
  - title: W3C – A Little History of the World Wide Web
    url: https://www.w3.org/History.html
  - title: Internet Society – Brief History of the Internet
    url: https://www.internetsociety.org/internet/history-internet/brief-history-internet/
quiz:
  - type: single
    question: Welche Aussage beschreibt den Unterschied zwischen Internet und Web am besten?
    options:
      - Internet und Web sind zwei Wörter für dasselbe.
      - Das Internet ist das weltweite Netz aus verbundenen Netzwerken, das Web ist ein Dienst, der dieses Netz nutzt.
      - Das Web ist die Hardware, das Internet ist die Software.
      - Das Internet gibt es erst seit dem Web, also seit 1991.
    answer: 1
    explanation: >
      Das Internet ist die Infrastruktur – Kabel, Router und gemeinsame Regeln, über die Rechner Daten
      austauschen. Das World Wide Web ist ein Dienst darauf: verlinkte Seiten, die ein Browser abruft.
      Das Internet ist über 20 Jahre älter als das Web.
  - type: multiple
    question: Welche dieser Dienste nutzen das Internet, sind aber NICHT Teil des World Wide Web?
    options:
      - Eine E-Mail mit einem Mail-Programm verschicken
      - Eine verlinkte Seite im Browser öffnen
      - Ein Online-Spiel mit Freunden auf der Konsole spielen
      - Ein Videotelefonat in einer App führen
    answers: [0, 2, 3]
    explanation: >
      E-Mail, Online-Spiele und viele Video-Calls laufen über das Internet, aber mit eigenen Protokollen –
      ohne Webseiten und Hyperlinks. Nur das Öffnen einer verlinkten Seite im Browser ist das Web.
  - type: cloze
    text: Das World Wide Web wurde ab 1989 von Tim ___ am Forschungszentrum ___ in Genf entwickelt.
    blanks:
      - [Berners-Lee, Berners Lee]
      - [CERN]
    explanation: Tim Berners-Lee schrieb seinen Vorschlag im März 1989 am CERN. Ende 1990 liefen dort der erste Webserver und der erste Browser.
  - type: match
    question: Ordne jedem Jahr das passende Ereignis zu.
    pairs:
      - { left: "1969", right: "Erste Verbindung im ARPANET" }
      - { left: "1983", right: "ARPANET stellt komplett auf TCP/IP um" }
      - { left: "1989", right: "Tim Berners-Lee schlägt das Web vor" }
      - { left: "1991", right: "Das Web wird außerhalb des CERN zugänglich" }
    explanation: Erst kam das Netz (1969), dann die gemeinsame Sprache TCP/IP (1983), und erst darauf baute das Web auf (1989–1991).
tasks:
  - id: internet-oder-web
    type: dragdrop
    title: Internet oder Web?
    description: >
      Alle diese Dinge brauchen das Internet. Aber nur einige davon gehören zum World Wide Web.
      Ziehe jede Tätigkeit in die passende Spalte. Denk daran: Zum Web gehören Seiten, die ein
      Browser abruft und die über Hyperlinks verbunden sind.
    targets:
      - { id: web, label: "Teil des World Wide Web" }
      - { id: nur-internet, label: "Nutzt das Internet, ist aber nicht das Web" }
    items:
      - { label: "Eine Nachrichtenseite im Browser lesen", target: web }
      - { label: "Auf einen Link klicken und zur nächsten Seite springen", target: web }
      - { label: "Ein HTML-Dokument von einem Webserver abrufen", target: web }
      - { label: "Eine E-Mail mit einem Mail-Programm verschicken", target: nur-internet }
      - { label: "Ein Mehrspieler-Spiel auf der Konsole spielen", target: nur-internet }
      - { label: "Per SSH auf einem Server arbeiten", target: nur-internet }
      - { label: "Ein Videotelefonat in einer Messenger-App führen", target: nur-internet }
    hints:
      - "Frag dich: Brauche ich dafür einen Browser und eine Adresse wie https://…?"
  - id: zeitstrahl
    type: order
    title: Bring die Geschichte in die richtige Reihenfolge
    description: >
      Vom ersten Rechnernetz bis zum Web für alle: Sortiere die Ereignisse vom ältesten zum jüngsten.
    items:
      - "1969: Im ARPANET tauschen zwei Universitätsrechner zum ersten Mal Daten aus."
      - "1983: Das ARPANET stellt komplett auf TCP/IP um – die gemeinsame Sprache des Internets."
      - "1989: Tim Berners-Lee schreibt am CERN seinen Vorschlag für ein vernetztes Informationssystem."
      - "1990: Am CERN laufen der erste Webserver und der erste Browser."
      - "1991: Das Web wird für Menschen außerhalb des CERN zugänglich."
      - "1993: Das CERN gibt die Web-Software frei, jeder darf sie kostenlos nutzen."
    hints:
      - Das Netz ist älter als das Web. Erst gab es Verbindungen, dann eine gemeinsame Sprache, dann Seiten.
---

Du schaust ein Video, schreibst einer Freundin eine Nachricht und liest nebenbei einen Artikel im
Browser. Umgangssprachlich sagst du zu allem: „Ich bin im Internet.“ Das stimmt – aber nur der
Artikel im Browser ist das, was Fachleute das **Web** nennen. Internet und Web sind nämlich nicht
dasselbe. In dieser Lektion lernst du den Unterschied, welche Dienste es außer dem Web gibt und wie
das alles entstanden ist.

## Das Internet: ein Netz aus Netzen

Ein [[netzwerk|Netzwerk]] sind mehrere [[computer|Computer]], die miteinander verbunden sind und Daten
austauschen können. Dein [[wlan|WLAN]] zu Hause ist so ein Netzwerk: Laptop, Handy, Drucker und Fernseher
hängen alle am selben [[router|Router]].

Das [[internet|Internet]] ist nun ein **Netz aus Netzwerken**. Millionen kleiner und großer Netze –
Heimnetze, Firmennetze, Uni-Netze, die Netze der Internetanbieter – sind miteinander verbunden. Über
Kupferkabel, Glasfaser, Funk und sogar Seekabel am Meeresgrund. Damit all diese unterschiedlichen
Geräte sich verstehen, halten sie sich an gemeinsame Regeln. Die wichtigste Regelsammlung heißt
[[tcp-ip|TCP/IP]]. Was genau dahintersteckt, lernst du später in diesem Modul.

Stell dir das Internet wie das **Straßennetz** eines Landes vor. Es gibt Feldwege, Landstraßen und
Autobahnen, und alle sind miteinander verbunden. Das Straßennetz selbst transportiert nichts – es
ermöglicht nur, dass Fahrzeuge von A nach B kommen. Was auf den Straßen fährt, ist eine ganz andere
Frage: Lieferwagen, Busse, Fahrräder.

> [!MERKSATZ]
> Das Internet ist die **Infrastruktur**: verbundene Netzwerke plus gemeinsame Regeln. Es sagt nichts
> darüber, *was* übertragen wird – nur, *dass* Daten von einem Rechner zum anderen kommen.

## Das Web: ein Dienst auf dem Internet

Das [[world-wide-web|World Wide Web]] (kurz Web oder WWW) ist einer der „Fahrzeugtypen“ auf diesen
Straßen. Es besteht aus drei Zutaten:

1. **Webseiten**: Dokumente, die in der Sprache [[html|HTML]] geschrieben sind. Eine [[webseite|Webseite]]
   kann Text, Bilder und Videos enthalten.
2. **Hyperlinks**: Verweise von einer Seite auf eine andere. Ein [[hyperlink|Hyperlink]] ist das, was du
   anklickst, um weiterzuspringen. Durch Links entsteht das „Netz“ (englisch *web*) aus Seiten.
3. **Browser und Webserver**: Ein [[browser|Browser]] wie Firefox oder Chrome fragt Seiten an, ein
   [[server|Server]] im Internet liefert sie aus.

Jede Webseite hat eine eindeutige Adresse, zum Beispiel `https://www.example.com/kontakt`. Wenn du sie
in die Adresszeile tippst, schickt dein Browser über das Internet eine Anfrage an den passenden
Server und zeigt dir die Antwort an.

```text title="Das Web in einem Satz"
Browser  --- "Gib mir bitte /kontakt" --->  Server
Browser  <--- HTML-Dokument der Seite ----  Server
```

## Andere Dienste im Internet

Das Web ist der bekannteste Dienst, aber bei Weitem nicht der einzige. Viele Programme nutzen das
Internet direkt mit eigenen Regeln, ganz ohne Webseiten und Hyperlinks:

| Dienst | Wofür? | Gehört zum Web? |
|---|---|---|
| Web | Seiten im Browser ansehen | ja |
| [[e-mail|E-Mail]] | Nachrichten zwischen Postfächern verschicken | nein, eigenes Protokoll (z. B. SMTP) |
| [[streaming|Streaming]] | Videos und Musik abspielen, während sie noch laden | meist über Web-Technik, aber oft in eigenen Apps |
| Online-Spiele | Spielstände in Echtzeit austauschen | nein, eigene Protokolle |
| Videotelefonie | Bild und Ton live übertragen | nein, eigene Protokolle |
| [[ssh|SSH]] | Sich sicher auf einem entfernten Rechner anmelden | nein |

Besonders bei Apps verschwimmt die Grenze: Viele Handy-Apps holen ihre Daten über dieselbe Technik
wie das Web, zeigen sie aber ohne Browser an. Für den Anfang reicht dir diese Faustregel: **Brauchst
du einen Browser und eine Adresse wie `https://…`, bist du im Web.** Alles andere nutzt „nur“ das
Internet.

> [!FEHLER]
> „Das WLAN geht, aber das Internet ist kaputt“ oder „Google ist das Internet“ – solche Sätze
> vermischen Ebenen. Dein WLAN ist ein lokales Netzwerk, das Internet ist der Verbund aller Netze,
> und eine Suchmaschine ist nur eine von Milliarden Webseiten. Wenn du Fehler suchst, hilft es
> enorm, diese Ebenen auseinanderzuhalten.

## Wie alles anfing: vom ARPANET zum Internet

Die Geschichte beginnt in den 1960er-Jahren in den USA. Forschende wollten Computer an verschiedenen
Orten verbinden, damit sie Rechenzeit und Daten teilen können. Daraus entstand das [[arpanet|ARPANET]].
Im Oktober 1969 tauschten zum ersten Mal zwei Rechner an zwei Universitäten in Kalifornien Daten
darüber aus. Die allererste Nachricht sollte „LOGIN“ lauten – nach „LO“ stürzte das System ab.

Neu war vor allem die Idee, Daten in kleine **Pakete** zu zerlegen, statt eine feste Leitung zu
belegen wie beim Telefon. Mehr dazu erfährst du in der Lektion über IP-Adressen und Pakete.

In den 1970er-Jahren entstanden immer mehr Netze, die aber unterschiedliche Regeln hatten. Um sie zu
verbinden, entwickelten Vint Cerf und Bob Kahn die Protokolle TCP und IP. Am **1. Januar 1983**
stellte das ARPANET komplett auf TCP/IP um. Dieser Tag gilt oft als Geburtstag des Internets, denn
ab jetzt konnten beliebige Netze über eine gemeinsame Sprache zusammenwachsen.

## Wie das Web entstand

Das Web ist deutlich jünger. Im März 1989 arbeitete der britische Physiker **Tim Berners-Lee** am
Forschungszentrum CERN bei Genf. Dort arbeiteten tausende Forschende mit unterschiedlichen
Computern, und Informationen gingen ständig verloren. Berners-Lee schlug vor, Dokumente über
Hyperlinks miteinander zu verknüpfen – über das bereits bestehende Internet.

Bis Ende 1990 hatte er die drei Grundbausteine fertig, die das Web bis heute ausmachen:

| Baustein | Aufgabe |
|---|---|
| HTML | Sprache, in der Webseiten geschrieben werden |
| [[http|HTTP]] | Regeln, wie Browser und Server Seiten austauschen |
| [[url|URL]] | Eindeutige Adresse für jede Seite |

Dazu schrieb er den ersten Webserver und den ersten Browser, der gleichzeitig ein Editor war. 1991
wurde das Web für Menschen außerhalb des CERN zugänglich. Im April 1993 gab das CERN die Software frei,
sodass jede und jeder sie kostenlos nutzen durfte. Im selben Jahr erschien mit Mosaic ein Browser, der
Bilder direkt im Text anzeigen konnte – danach wuchs das Web explosionsartig.

```text title="Zeitstrahl"
1969  ARPANET: erste Verbindung zwischen zwei Rechnern
1983  Umstellung auf TCP/IP – das Internet entsteht
1989  Tim Berners-Lee schlägt am CERN das Web vor
1990  erster Webserver und erster Browser
1991  das Web wird öffentlich zugänglich
1993  CERN gibt die Web-Software frei
```

> [!PRAXIS]
> Wer in der IT arbeitet, muss diese Unterscheidung im Schlaf beherrschen. Ein Support-Ticket
> „Website lädt nicht“ kann an ganz verschiedenen Stellen liegen: am WLAN, an der Internetverbindung,
> an der Namensauflösung oder am Webserver selbst. Wer die Schichten kennt, findet den Fehler
> schneller – genau das lernst du in diesem Kurs Schritt für Schritt.

## Zusammenfassung

- Ein **Netzwerk** verbindet Computer, das **Internet** ist ein weltweites Netz aus Netzwerken mit
  gemeinsamen Regeln (TCP/IP).
- Das **World Wide Web** ist ein Dienst auf dem Internet: Webseiten in HTML, verbunden durch Hyperlinks,
  abgerufen von einem Browser bei einem Server.
- Viele Dienste nutzen das Internet ohne das Web: E-Mail, Online-Spiele, Videotelefonie, SSH.
- Das Internet entstand aus dem ARPANET (1969) und wurde mit der Umstellung auf TCP/IP 1983 zum
  „Netz der Netze“.
- Das Web erfand Tim Berners-Lee 1989–1991 am CERN, mit HTML, HTTP und URLs als Grundbausteinen.
