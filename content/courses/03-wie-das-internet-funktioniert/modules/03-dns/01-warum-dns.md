---
title: Warum es DNS gibt – Namen statt Zahlen
summary: Wozu das Domain Name System da ist, wie Domainnamen hierarchisch aufgebaut sind und wer welche Ebene verwaltet.
duration: 20
sources:
  - title: RFC 1034 – Domain Names, Concepts and Facilities
    url: https://www.rfc-editor.org/rfc/rfc1034
  - title: MDN – What is a domain name?
    url: https://developer.mozilla.org/en-US/docs/Learn_web_development/Howto/Web_mechanics/What_is_a_domain_name
  - title: IANA – Root Zone Database
    url: https://www.iana.org/domains/root/db
quiz:
  - type: single
    question: Welche Aufgabe hat DNS in erster Linie?
    options:
      - Es verschlüsselt Verbindungen zu Webseiten.
      - Es übersetzt Namen wie www.example.com in IP-Adressen.
      - Es transportiert Webseiten zum Browser.
      - Es vergibt IP-Adressen an Geräte im WLAN.
    answer: 1
    explanation: >
      DNS ist das Telefonbuch des Internets: Du gibst einen Namen an, DNS liefert die IP-Adresse. Den Transport
      übernehmen TCP/IP und HTTP, verschlüsselt wird mit TLS.
  - type: match
    question: "Ordne die Teile von `api.shop.example.com.` ihrer Ebene zu."
    pairs:
      - { left: "Der Punkt ganz rechts", right: "Root" }
      - { left: "com", right: "Top-Level-Domain" }
      - { left: "example", right: "Second-Level-Domain" }
      - { left: "shop und api", right: "Subdomains" }
    explanation: >
      Einen Domainnamen liest die Hierarchie von rechts nach links: Root, TLD, Second-Level, dann beliebig viele Subdomains.
  - type: cloze
    text: Ein vollständiger Name mit allen Ebenen bis zur Root heißt ___. Er endet streng genommen mit einem ___.
    blanks:
      - [FQDN, Fully Qualified Domain Name]
      - [Punkt, "."]
    explanation: "`www.example.com.` ist ein FQDN – der Punkt am Ende steht für die Root. Im Browser lässt man ihn meist weg."
  - type: multiple
    question: Welche Aussagen stimmen?
    options:
      - Wer example.com registriert hat, darf beliebig viele Subdomains anlegen.
      - Jede Domain braucht eine eigene Top-Level-Domain.
      - Die Root-Zone wird zentral koordiniert, die einzelnen TLDs von eigenen Registries verwaltet.
      - Groß- und Kleinschreibung spielt bei Domainnamen keine Rolle.
    answers: [0, 2, 3]
    explanation: >
      Die Hierarchie verteilt die Verantwortung: IANA koordiniert die Root, Registries die TLDs, Domain-Inhaber
      ihre eigene Zone mit beliebigen Subdomains. `EXAMPLE.com` und `example.com` sind derselbe Name.
tasks:
  - id: dns-baum
    type: diagram
    title: Beschrifte die Ebenen des DNS-Baums
    description: Ordne jeder Zeile des Baums ihre Ebene zu.
    image: /assets/wie-das-internet-funktioniert/dns-hierarchie-leer.svg
    slots:
      - { x: 86.3, y: 15.5, answer: Root-Ebene }
      - { x: 86.3, y: 38.1, answer: Top-Level-Domains }
      - { x: 86.3, y: 60.7, answer: Second-Level-Domains }
      - { x: 86.3, y: 83.3, answer: Subdomains }
    distractors: [Resolver, Ports]
    hints:
      - Ganz oben steht der Punkt, ganz unten die längsten Namen.
  - id: domain-zerlegen
    type: code
    language: js
    title: Zerlege einen Domainnamen in Ebenen
    description: |
      Schreibe eine Funktion `ebenen(name)`, die einen Domainnamen in seine Ebenen zerlegt – **von oben nach unten**,
      also beginnend mit der Top-Level-Domain:

      - `ebenen("www.example.com")` → `["com", "example.com", "www.example.com"]`
      - Ein Punkt am Ende (FQDN) wird ignoriert: `ebenen("example.org.")` → `["org", "example.org"]`
      - Groß-/Kleinschreibung spielt keine Rolle, gib alles klein zurück.
      - Ein leerer String ergibt ein leeres Array.
    starter: |
      function ebenen(name) {
        // 1. Punkt am Ende entfernen und klein schreiben
        // 2. In Teile zerlegen
        // 3. Von rechts nach links zusammensetzen
      }
    tests:
      - name: zerlegt www.example.com
        code: assertDeepEqual(ebenen("www.example.com"), ["com", "example.com", "www.example.com"])
      - name: ignoriert den Punkt am Ende
        code: assertDeepEqual(ebenen("example.org."), ["org", "example.org"])
      - name: schreibt alles klein
        code: assertDeepEqual(ebenen("API.Shop.Example.NET"), ["net", "example.net", "shop.example.net", "api.shop.example.net"])
      - name: leerer Name ergibt leeres Array
        code: assertDeepEqual(ebenen(""), [])
    hints:
      - "`name.replace(/\\.$/, '')` entfernt einen Punkt am Ende, `split('.')` zerlegt."
      - Gehe die Teile von hinten nach vorn durch und hänge jeweils den nächsten Teil links an.
    solution: |
      function ebenen(name) {
        const sauber = name.replace(/\.$/, '').toLowerCase()
        if (sauber === '') return []
        const teile = sauber.split('.')
        const ergebnis = []
        for (let i = teile.length - 1; i >= 0; i--) {
          ergebnis.push(teile.slice(i).join('.'))
        }
        return ergebnis
      }
---

Kannst du dir die Telefonnummern all deiner Freund:innen merken? Wahrscheinlich nicht – dafür hast du
ein Adressbuch. Im Internet ist es genauso: Computer finden sich über [[ip-adresse|IP-Adressen]] wie
`192.0.2.10`, Menschen merken sich lieber Namen wie `www.example.com`. Die Übersetzung macht das
[[dns|DNS]], das *Domain Name System*.

## Das Problem: Zahlen sind unpraktisch

Ganz am Anfang des Internets gab es eine einzige Datei, `HOSTS.TXT`, mit allen Namen und Adressen. Sie
wurde zentral gepflegt und regelmäßig an alle Rechner verteilt. Bei ein paar hundert Rechnern ging das.
Mit tausenden wurde es unmöglich.

Deshalb entstand 1983 DNS: ein **verteiltes** Telefonbuch. Niemand muss alles wissen. Jede Organisation
pflegt nur ihren eigenen Teil.

Namen haben neben der Merkbarkeit einen zweiten Vorteil: Die IP-Adresse dahinter darf sich ändern.

| Ohne DNS | Mit DNS |
|---|---|
| `https://192.0.2.10/` tippen | `https://www.example.com/` tippen |
| Neuer Server = alle Links kaputt | Neuer Server = nur DNS-Eintrag ändern |
| Eine Adresse pro Dienst | Ein Name kann auf mehrere Server zeigen |

> [!MERKSATZ]
> DNS übersetzt **Namen in IP-Adressen**. Weil der Name stabil bleibt, kann die Adresse dahinter wechseln,
> ohne dass Nutzer:innen etwas merken.

## Die Hierarchie: ein umgedrehter Baum

DNS-Namen sind hierarchisch aufgebaut, wie ein auf den Kopf gestellter Baum. Gelesen wird von **rechts
nach links**, vom Allgemeinen zum Speziellen.

![Der DNS-Baum von der Root bis zu den Subdomains](/assets/wie-das-internet-funktioniert/dns-hierarchie.svg)

| Ebene | Beispiel | Bedeutung |
|---|---|---|
| Root | `.` | Die Wurzel des Baums, unsichtbarer Punkt ganz rechts |
| [[top-level-domain\|Top-Level-Domain]] (TLD) | `com`, `org`, `de` | Endung; generisch oder Länderkennung |
| Second-Level-Domain | `example` in `example.com` | Der Teil, den man registriert |
| [[subdomain\|Subdomain]] | `www`, `shop`, `api` | Beliebige Unterteilung durch den Inhaber |

Ein Name mit allen Ebenen bis zur Root heißt [[fqdn|FQDN]] (*Fully Qualified Domain Name*). Streng
genommen endet er mit einem Punkt: `www.example.com.` – der Punkt ist die Root. Im Alltag lässt man ihn weg.

Jeder Teil darf bis zu 63 Zeichen lang sein, der ganze Name bis 253. Groß- und Kleinschreibung spielt keine Rolle.

## Wer verwaltet was?

Die Hierarchie verteilt auch die **Verantwortung**. Jede Ebene delegiert die nächste an jemand anderen:

| Wer | Verwaltet | Beispiel |
|---|---|---|
| IANA / ICANN | Die Root-Zone: welche TLDs es gibt | Es gibt `.com`, `.de`, `.org` … |
| Registry | Eine TLD und alle Namen darunter | Die Registry für `.com` |
| [[registrar\|Registrar]] | Verkauft Domains an Kund:innen | Dein Domain-Anbieter |
| Domain-Inhaber:in | Die eigene Zone mit allen Subdomains | Du legst `shop.example.com` an |

Wenn du eine [[domain|Domain]] registrierst, zahlst du beim Registrar, der den Namen bei der Registry
einträgt. Ab dann gehört dir dieser Teilbaum: Subdomains wie `api.example.com` kannst du selbst anlegen,
ohne jemanden zu fragen.

Den Bereich, für den jemand die Einträge pflegt, nennt man **Zone**. Die Zone `example.com` enthält zum
Beispiel die Einträge für `example.com`, `www.example.com` und `shop.example.com`.

> [!FEHLER]
> „`www` ist Pflicht für Webseiten.“ – Nein. `www` ist nur eine ganz normale Subdomain, die sich aus
> Tradition gehalten hat. `example.com` und `www.example.com` sind zwei verschiedene Namen und können sogar
> auf verschiedene Server zeigen.

## Domain, Host und URL – nicht verwechseln

Drei Begriffe gehen oft durcheinander:

| Begriff | Beispiel | Bedeutung |
|---|---|---|
| Domain | `example.com` | Ein Zweig im DNS-Baum |
| Hostname | `shop.example.com` | Name eines konkreten Rechners oder Dienstes |
| [[url\|URL]] | `https://shop.example.com/produkte` | Komplette Adresse einer Ressource, inkl. Protokoll und Pfad |

DNS kennt nur Namen. Ob danach eine Webseite, ein Mailserver oder eine API kommt, interessiert DNS nicht.
Es beantwortet nur Fragen wie „Welche IP-Adresse hat `shop.example.com`?“.

> [!PRAXIS]
> In Projekten bekommen verschiedene Teile eigene Subdomains: `www` für die Website, `api` für das Backend,
> `staging` für die Testumgebung. So kann jeder Teil auf einem eigenen Server laufen und unabhängig umziehen.

## Zusammenfassung

- **DNS** übersetzt Namen in IP-Adressen und ist ein verteiltes System statt einer zentralen Liste.
- Namen sind hierarchisch und werden **von rechts nach links** gelesen: Root, TLD, Second-Level, Subdomains.
- Ein **FQDN** enthält alle Ebenen und endet streng genommen mit einem Punkt.
- Die Verantwortung ist verteilt: IANA (Root), Registries (TLDs), Registrare, Domain-Inhaber (eigene Zone).
- Subdomains wie `www`, `api` oder `shop` legt der Inhaber einer Domain selbst an.
