---
title: Domain und DNS-Einträge
summary: Wie deine Domain auf den Server zeigt – A, AAAA und CNAME richtig setzen und mit der TTL einen Umzug planen.
duration: 20
sources:
  - title: MDN – What is a domain name?
    url: https://developer.mozilla.org/en-US/docs/Learn_web_development/Howto/Web_mechanics/What_is_a_domain_name
  - title: RFC 1035 – Domain Names, Implementation and Specification
    url: https://www.rfc-editor.org/rfc/rfc1035
  - title: RFC 1034 – CNAME-Regeln (Abschnitt 3.6.2)
    url: https://www.rfc-editor.org/rfc/rfc1034#section-3.6.2
quiz:
  - type: match
    question: Ordne jedem DNS-Eintrag seine Aufgabe zu.
    pairs:
      - { left: "A", right: "Name → IPv4-Adresse" }
      - { left: "AAAA", right: "Name → IPv6-Adresse" }
      - { left: "CNAME", right: "Name → anderer Name (Alias)" }
      - { left: "MX", right: "Mailserver der Domain" }
    explanation: A und AAAA liefern Adressen, CNAME verweist auf einen anderen Namen, MX nennt die Mailserver.
  - type: single
    question: Warum darfst du für `example.com` selbst (die Apex-Domain) keinen CNAME setzen?
    options:
      - Weil CNAMEs nur für IPv6 funktionieren.
      - Weil ein Name mit CNAME keine anderen Einträge haben darf – die Apex-Domain braucht aber zwingend SOA- und NS-Einträge.
      - Weil CNAMEs kostenpflichtig sind.
      - Das geht problemlos.
    answer: 1
    explanation: >
      Ein CNAME schließt alle anderen Einträge für denselben Namen aus. An der Apex-Domain stehen aber immer
      SOA und NS. Deshalb nutzt du dort A und AAAA – und für `www` einen CNAME.
  - type: cloze
    text: "Die ___ eines Eintrags legt fest, wie viele Sekunden Resolver die Antwort zwischenspeichern dürfen. Vor einem Umzug setzt man sie z. B. auf ___ Sekunden herunter."
    blanks:
      - [TTL, Time to Live]
      - ["300", "60", "120", "600"]
    explanation: Eine kurze TTL sorgt dafür, dass die neue IP schnell überall ankommt. Nach dem Umzug darf sie wieder steigen.
  - type: find-bug
    question: Dieser Plan soll example.com und www.example.com auf den neuen Server bringen. Welche Zeile ist falsch?
    language: text
    code: |
      @     300  IN  A      203.0.113.10
      @     300  IN  AAAA   2001:db8::10
      www   300  IN  CNAME  example.com.
      @     300  IN  CNAME  www.example.com.
    bug_line: 4
    explanation: >
      Für die Apex-Domain (@) gibt es schon A- und AAAA-Einträge – ein zusätzlicher CNAME ist verboten und
      würde zudem eine Schleife bauen.
tasks:
  - id: zone-planen
    type: terminal
    title: Die Einträge für den Start planen
    description: |
      Du hast die Domain `example.com` registriert, dein Server hat die Adressen `203.0.113.10` (IPv4) und
      `2001:db8::10` (IPv6). Lege im Ordner `dns-plan` eine Datei `records.txt` an – eine Zeile pro Eintrag
      im Format `NAME TTL IN TYP WERT`:

      1. `@` (die Domain selbst) bekommt einen A-Eintrag auf `203.0.113.10`.
      2. `@` bekommt einen AAAA-Eintrag auf `2001:db8::10`.
      3. `www` wird ein CNAME auf `example.com.` (mit Punkt am Ende!).
      4. Ein Testsystem `staging` bekommt einen A-Eintrag auf `203.0.113.11`.
      5. Alle Einträge haben die TTL `3600`.

      Zeilen, die mit `;` beginnen, sind Kommentare. Prüfe dein Ergebnis mit `cat records.txt`.
    workdir: dns-plan
    checks:
      - type: file_exists
        path: records.txt
        message: Die Datei records.txt fehlt noch.
      - type: command
        run: awk '$1 !~ /^;/ && $1=="@" && $4=="A" {print $2, $5}' records.txt
        stdout_equals: "3600 203.0.113.10"
        message: "Es fehlt die Zeile `@ 3600 IN A 203.0.113.10` (genau ein A-Eintrag für @)."
      - type: command
        run: awk '$1 !~ /^;/ && $1=="@" && $4=="AAAA" {print $2, $5}' records.txt
        stdout_equals: "3600 2001:db8::10"
        message: "Es fehlt die Zeile `@ 3600 IN AAAA 2001:db8::10`."
      - type: command
        run: awk '$1 !~ /^;/ && $1=="www" {print $2, $3, $4, $5}' records.txt
        stdout_equals: "3600 IN CNAME example.com."
        message: "www braucht genau einen Eintrag: `www 3600 IN CNAME example.com.` – achte auf den Punkt am Ende."
      - type: command
        run: awk '$1 !~ /^;/ && $1=="staging" {print $2, $4, $5}' records.txt
        stdout_equals: "3600 A 203.0.113.11"
        message: "staging braucht einen A-Eintrag auf 203.0.113.11 mit TTL 3600."
      - type: command
        run: awk '$1 !~ /^;/ && NF>0 && $1=="@" && $4=="CNAME"' records.txt | wc -l
        stdout_matches: "^\\s*0\\s*$"
        message: Für @ darf es keinen CNAME geben – die Apex-Domain bekommt nur A und AAAA.
    hints:
      - "Jede Zeile hat fünf Spalten, z. B. `@ 3600 IN A 203.0.113.10`."
      - "Mit `cat > records.txt <<'EOF'` schreibst du mehrere Zeilen auf einmal; `nano records.txt` geht auch."
      - "Der CNAME-Wert ist ein Name, kein Wert mit IP: `www 3600 IN CNAME example.com.`"
    solution: |
      ```bash
      cd dns-plan
      cat > records.txt <<'EOF'
      ; Einträge für example.com
      @        3600  IN  A      203.0.113.10
      @        3600  IN  AAAA   2001:db8::10
      www      3600  IN  CNAME  example.com.
      staging  3600  IN  A      203.0.113.11
      EOF
      cat records.txt
      ```
  - id: dns-pruefen
    type: simulated
    title: Die Einträge mit dig kontrollieren
    description: |
      Die Einträge sind beim DNS-Anbieter eingetragen. Prüfe von deinem Laptop aus, was die Welt sieht:

      1. `dig +short example.com A`
      2. `dig +short example.com AAAA`
      3. `dig +short www.example.com`
      4. `dig example.com A +noall +answer` – hier siehst du auch die verbleibende TTL.
    prompt: "du@laptop:~$"
    steps:
      - expect: "^dig\\s+\\+short\\s+example\\.com\\.?\\s+A\\s*$"
        output: "203.0.113.10"
        hint: "Tippe: dig +short example.com A"
      - expect: "^dig\\s+\\+short\\s+example\\.com\\.?\\s+AAAA\\s*$"
        output: "2001:db8::10"
        hint: "Tippe: dig +short example.com AAAA"
      - expect: "^dig\\s+\\+short\\s+www\\.example\\.com\\.?(\\s+A)?\\s*$"
        output: |
          example.com.
          203.0.113.10
        hint: "Tippe: dig +short www.example.com – du siehst erst den CNAME, dann die Adresse."
      - expect: "^dig\\s+example\\.com\\.?\\s+A\\s+\\+noall\\s+\\+answer\\s*$"
        output: |
          example.com.		2874	IN	A	203.0.113.10
        hint: "Tippe: dig example.com A +noall +answer"
    responses:
      - match: "^dig"
        output: "; Diese Abfrage ist in der Übung nicht vorgesehen. Nimm den Befehl aus der Beschreibung."
    solution: |
      ```bash
      dig +short example.com A
      dig +short example.com AAAA
      dig +short www.example.com
      dig example.com A +noall +answer
      ```
      Die `2874` in der letzten Ausgabe ist die **verbleibende** TTL im Cache deines Resolvers – sie zählt
      von 3600 herunter.
---
Ohne DNS müsste deine Kundschaft `203.0.113.10` in die Adresszeile tippen. Damit `example.com` auf deinen
neuen Server zeigt, legst du ein paar DNS-Einträge an. Das dauert fünf Minuten – aber ein Fehler dabei kann
eine Seite stundenlang unerreichbar machen. Deshalb lohnt es sich, die Regeln genau zu kennen.

## Domain, Registrar und DNS-Anbieter

Eine [[domain|Domain]] mietest du bei einem [[registrar|Registrar]] – meist für ein Jahr. Damit gehört dir
der Name, aber noch zeigt er nirgendwohin.

Die eigentlichen Einträge verwaltet ein **DNS-Anbieter**. Oft ist das derselbe Anbieter, manchmal ein
anderer. Welcher zuständig ist, steht in den [[ns-record|NS-Einträgen]] der Domain.

| Rolle | Aufgabe | Beispiel |
|---|---|---|
| Registrar | vermietet den Namen | du kaufst `example.com` für ein Jahr |
| DNS-Anbieter | beantwortet Fragen zur Domain | „`example.com` hat die IP `203.0.113.10`“ |
| [[resolver\|Resolver]] | fragt für deinen Rechner nach und merkt sich Antworten | der Resolver deines Internetanbieters |

Die Einträge einer Domain heißen zusammen [[zonendatei|Zone]]. Viele Anbieter zeigen sie im klassischen
Format aus fünf Spalten:

```text title="Zonen-Format"
; NAME   TTL   KLASSE  TYP    WERT
@        3600  IN      A      203.0.113.10
www      3600  IN      CNAME  example.com.
```

`@` steht für die Domain selbst, `IN` für „Internet“. Ein Punkt am Ende (`example.com.`) bedeutet: Das ist
ein vollständiger Name – nichts mehr anhängen.

## A, AAAA und CNAME

Für eine Website brauchst du fast immer nur drei Typen von [[dns-record|DNS-Einträgen]]:

- **[[a-record|A]]** verbindet einen Namen mit einer [[ipv4|IPv4]]-Adresse.
- **[[aaaa-record|AAAA]]** verbindet einen Namen mit einer [[ipv6|IPv6]]-Adresse. Setz ihn, wenn dein
  Server IPv6 hat – sonst fehlt Nutzer:innen in reinen IPv6-Netzen der Zugang.
- **[[cname|CNAME]]** macht einen Namen zum Alias eines anderen. `www` zeigt so auf `example.com`, und eine
  neue IP trägst du nur an einer Stelle ein.

```text title="Eine typische Zone für eine Website"
@        3600  IN  A      203.0.113.10
@        3600  IN  AAAA   2001:db8::10
www      3600  IN  CNAME  example.com.
staging  3600  IN  A      203.0.113.11
```

Eine [[subdomain|Subdomain]] wie `staging.example.com` bekommt einfach eine eigene Zeile. Mail-Einträge
([[mx-record|MX]]) und Text-Einträge ([[txt-record|TXT]]) lässt du beim Website-Umzug in Ruhe.

> [!FEHLER]
> **CNAME auf der Apex-Domain.** Ein Name mit CNAME darf keine anderen Einträge haben. Die
> [[apex-domain|Apex-Domain]] `example.com` hat aber immer NS- und SOA-Einträge. Dort gehören A und AAAA hin.
> Manche Anbieter bieten dafür Sondertypen wie „ALIAS“ an – das ist eine Anbieter-Erweiterung, kein Standard.

## Die TTL: wie lange sich die Welt erinnert

Jeder Eintrag hat eine [[ttl|TTL]] (Time to Live) in Sekunden. So lange dürfen Resolver die Antwort
zwischenspeichern, ohne erneut zu fragen. Bei `3600` kann eine alte IP also bis zu einer Stunde lang
weiterleben – auch wenn du sie längst geändert hast.

Für einen Umzug nutzt du das gezielt:

1. **Einen Tag vorher** senkst du die TTL der betroffenen Einträge auf z. B. `300`.
2. **Warten**, bis die alte, lange TTL abgelaufen ist.
3. **Umstellen**: neue IP eintragen. Nach spätestens fünf Minuten fragen alle Resolver neu.
4. **Nach ein paar Tagen** die TTL wieder auf `3600` oder höher setzen.

> [!MERKSATZ]
> Die TTL wirkt **rückwärts**: Eine Senkung hilft erst, wenn die alte TTL abgelaufen ist. Senke sie also
> rechtzeitig vor dem Umzug.

Das berühmte „DNS braucht 48 Stunden“ ist meist nur eine zu lange TTL. Lass den alten Server nach dem
Umstellen trotzdem noch eine Weile laufen – manche Resolver halten sich nicht exakt an die TTL.

## Einträge prüfen mit dig

Mit [[dig|dig]] fragst du DNS direkt ab und siehst, was die Welt sieht:

```bash title="Terminal"
dig +short example.com A
dig +short www.example.com
dig example.com A +noall +answer
dig @ns1.example.net example.com A +short
```

Die letzte Zeile fragt direkt den zuständigen Nameserver (hier ein Platzhalter) – so prüfst du eine
Änderung, bevor die Caches sie kennen. Die Antwort von `+noall +answer` zeigt die **verbleibende** TTL
im Cache.

> [!PRAXIS]
> Viele Teams legen zuerst nur `staging.example.com` auf den neuen Server, testen dort in Ruhe und stellen
> erst danach die Hauptdomain um. Dabei wird sofort klar, ob DNS, Firewall und HTTPS zusammenspielen.

## Zusammenfassung

- Den Namen mietest du beim **Registrar**, die Einträge pflegt der **DNS-Anbieter**.
- **A** zeigt auf IPv4, **AAAA** auf IPv6, **CNAME** auf einen anderen Namen.
- Auf der **Apex-Domain** nie einen CNAME – dort stehen A und AAAA.
- Die **TTL** bestimmt, wie lange alte Antworten im Cache bleiben; vor Umzügen rechtzeitig senken.
- Mit `dig` prüfst du, was Resolver und Nameserver wirklich antworten.
