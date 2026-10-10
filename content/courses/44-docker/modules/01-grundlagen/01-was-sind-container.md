---
title: Was sind Container?
summary: Welches Problem Container lösen, wie sie sich von virtuellen Maschinen unterscheiden und wie Docker aufgebaut ist.
duration: 20
sources:
  - title: Docker Docs – What is a container?
    url: https://docs.docker.com/get-started/docker-concepts/the-basics/what-is-a-container/
  - title: Docker Docs – Docker overview
    url: https://docs.docker.com/get-started/docker-overview/
quiz:
  - type: single
    question: Was teilen sich alle Container auf einem Linux-Rechner?
    options:
      - Nichts – jeder Container bringt ein komplettes Betriebssystem samt Kernel mit.
      - Den Kernel des Gastgeber-Betriebssystems.
      - Ihre Dateisysteme – jeder Container sieht die Dateien der anderen.
      - Ihre Umgebungsvariablen.
    answer: 1
    explanation: >
      Container sind isolierte Prozesse auf demselben Kernel. Genau das macht sie so leicht: Es startet kein
      zweites Betriebssystem, sondern nur ein Prozess mit eigener Sicht auf Dateien, Netzwerk und Prozesse.
  - type: multiple
    question: Welche Aussagen über Container und virtuelle Maschinen stimmen?
    options:
      - Ein Container startet meist in Sekundenbruchteilen, eine VM braucht eher Sekunden bis Minuten.
      - Eine VM bringt einen eigenen Kernel mit, ein Container nicht.
      - Container sind grundsätzlich stärker voneinander isoliert als VMs.
      - Auf einem Rechner laufen typischerweise viel mehr Container als VMs.
    answers: [0, 1, 3]
    explanation: >
      VMs emulieren komplette Rechner mit eigenem Kernel – das kostet Zeit und Arbeitsspeicher, isoliert aber
      stärker. Container teilen den Kernel, sind dadurch leicht und schnell, aber weniger hart voneinander getrennt.
  - type: match
    question: Ordne jedem Baustein von Docker seine Aufgabe zu.
    pairs:
      - { left: "Docker-CLI", right: "Nimmt deine Befehle wie docker run entgegen" }
      - { left: "Docker-Daemon", right: "Baut Images und verwaltet laufende Container im Hintergrund" }
      - { left: "Registry", right: "Speichert Images zum Herunterladen und Hochladen" }
      - { left: "Linux-Kernel", right: "Isoliert die Container-Prozesse mit Namespaces und cgroups" }
    explanation: >
      Die CLI ist nur die Fernbedienung. Die eigentliche Arbeit macht der Daemon `dockerd`, der Images aus
      Registries holt und die Isolation über Funktionen des Linux-Kernels einrichtet.
  - type: cloze
    text: Linux isoliert Container mit ___ (eigene Sicht auf Prozesse, Netzwerk, Dateien) und begrenzt ihre Ressourcen mit ___.
    blanks:
      - [Namespaces, Namespace, Linux-Namespaces]
      - [cgroups, cgroup, Control Groups]
    explanation: Namespaces bestimmen, was ein Prozess sehen kann. cgroups bestimmen, wie viel CPU und Speicher er verbrauchen darf.
tasks:
  - id: vm-oder-container
    type: dragdrop
    title: VM oder Container?
    description: Ordne jede Eigenschaft der Technik zu, auf die sie zutrifft.
    targets:
      - { id: vm, label: Virtuelle Maschine }
      - { id: container, label: Container }
    items:
      - { label: Bringt einen eigenen Kernel mit, target: vm }
      - { label: Startet in unter einer Sekunde, target: container }
      - { label: Kann ein anderes Betriebssystem als der Host ausführen (z. B. Windows auf Linux), target: vm }
      - { label: Ist im Kern ein isolierter Prozess, target: container }
      - { label: Braucht einen Hypervisor, target: vm }
      - { label: "Ein Image ist oft nur 50–200 MB groß", target: container }
    hints:
      - Frag dich bei jeder Karte, ob ein komplettes Betriebssystem bootet.
  - id: docker-run-ablauf
    type: steps
    title: Was passiert bei docker run?
    description: Du tippst zum ersten Mal `docker run hello-world`. Verfolge, was Docker hinter den Kulissen tut.
    steps:
      - situation: Du drückst Enter. Die Docker-CLI hat den Befehl entgegengenommen.
        question: Wohin schickt die CLI den Befehl?
        options:
          - Direkt an den Linux-Kernel.
          - An den Docker-Daemon, der im Hintergrund läuft.
          - An Docker Hub im Internet.
        answer: 1
        explanation: Die CLI spricht über eine API mit dem Daemon `dockerd`. Er erledigt die eigentliche Arbeit.
      - situation: Der Daemon sucht das Image `hello-world` auf deinem Rechner – und findet es nicht.
        question: Was tut er jetzt?
        options:
          - Er bricht mit einem Fehler ab.
          - Er lädt das Image aus der Registry (standardmäßig Docker Hub) herunter.
          - Er baut das Image selbst aus dem Namen.
        answer: 1
        explanation: Fehlende Images holt Docker automatisch aus der Registry. Beim nächsten Start liegt es lokal bereit.
      - situation: Das Image liegt jetzt lokal vor.
        question: Was passiert als Nächstes?
        options:
          - Docker erzeugt aus dem Image einen Container und startet dessen Hauptprozess.
          - Docker installiert das Image wie ein Programm auf deinem Rechner.
        answer: 0
        explanation: >
          Aus dem unveränderlichen Image entsteht ein Container mit eigener, beschreibbarer Schicht. Sein Prozess
          gibt eine Begrüßung aus und beendet sich – damit stoppt auch der Container.
---
Deine Anwendung läuft auf deinem Laptop perfekt. Auf dem Server deiner Kollegin stürzt sie ab: andere
PHP-Version, eine fehlende Erweiterung, eine andere Bibliothek. Dieses Problem heißt „Works on my machine“ –
und **Container** sind die Antwort darauf.

## Das Problem: Programme brauchen ihre Umgebung

Ein Programm besteht nie nur aus deinem [[code]]. Es braucht eine Laufzeit (z. B. [[nodejs|Node.js]] 24),
Systembibliotheken, Konfiguration und die richtigen Versionen von allem. Auf jedem Rechner sieht diese
[[umgebung|Umgebung]] etwas anders aus.

Früher hat man Server per Anleitung eingerichtet: „Installiere PHP 8.5, dann die Erweiterung X …“. Das ist
fehleranfällig. Ein falscher Schritt, und Produktion verhält sich anders als dein Laptop.

> [!FEHLER]
> „Ich schreibe einfach genau auf, was installiert werden muss.“ – Anleitungen veralten, werden falsch
> befolgt und erfassen nie alles. Genau deshalb verpackt man heute die Umgebung **mit** der Anwendung.

## Die Idee: ein Schiffscontainer für Software

Schiffscontainer haben den Welthandel verändert, weil sie genormt sind. Egal ob Bananen oder Laptops drin
sind: Kran, Schiff und Lkw behandeln jeden Container gleich.

Ein [[container]] macht dasselbe für Software. Er enthält deine Anwendung **plus alles, was sie zum Laufen
braucht**: Laufzeit, Bibliotheken, Konfiguration. Der Rechner, auf dem er läuft, muss nur eines können –
Container starten.

| Ohne Container | Mit Container |
|---|---|
| Jeder Server wird von Hand eingerichtet | Die Umgebung steckt im Container |
| Laptop und Server unterscheiden sich | Überall läuft exakt dasselbe Paket |
| Zwei Apps mit unterschiedlichen PHP-Versionen stören sich | Jede App hat ihre eigene Version |

> [!MERKSATZ]
> Ein Container ist ein genormtes Paket aus Anwendung und Umgebung, das überall gleich läuft.

## Container vs. virtuelle Maschine

Vielleicht kennst du [[virtuelle-maschine|virtuelle Maschinen]] (VMs). Auch sie isolieren Anwendungen –
aber auf ganz andere Weise.

![Virtuelle Maschinen bringen je ein eigenes Betriebssystem mit, Container teilen sich den Kernel des Hosts](/assets/docker/container-vs-vm.svg)

- Eine **VM** simuliert einen kompletten Rechner. Ein [[hypervisor|Hypervisor]] verteilt die Hardware, und in
  jeder VM bootet ein ganzes [[betriebssystem|Betriebssystem]] mit eigenem [[kernel|Kernel]].
- Ein **Container** ist dagegen nur ein isolierter [[prozess|Prozess]] auf dem Kernel des Gastgebers (Host).
  Es bootet nichts.

| | Virtuelle Maschine | Container |
|---|---|---|
| Startzeit | Sekunden bis Minuten | Meist unter einer Sekunde |
| Größe | Gigabytes | Oft 50–200 MB |
| Eigener Kernel | Ja | Nein, teilt den des Hosts |
| Isolation | Sehr stark | Gut, aber schwächer |

Deshalb laufen auf einem Rechner problemlos dutzende Container, aber nur wenige VMs. In der Praxis
kombiniert man beides oft: Container laufen auf virtuellen Servern in der Cloud.

## Wie Linux Container möglich macht

Container sind keine Erfindung von Docker, sondern Funktionen des [[linux|Linux]]-Kernels:

- [[linux-namespaces|Namespaces]] geben einem Prozess eine **eigene Sicht**: eigene Prozessliste, eigenes
  [[netzwerk|Netzwerk]], eigenes [[dateisystem|Dateisystem]], eigenen [[hostname]]. Im Container sieht dein
  Programm sich selbst als Prozess Nummer 1.
- [[cgroups]] (Control Groups) **begrenzen Ressourcen**: höchstens 512 MB Arbeitsspeicher, höchstens eine CPU.

Weil Container den Linux-Kernel brauchen, startet [[docker-desktop|Docker Desktop]] auf macOS und Windows im Hintergrund eine
kleine Linux-VM. Davon merkst du im Alltag kaum etwas.

> [!HINWEIS]
> Ein Container ist kein „Mini-Computer“. Er ist ein ganz normaler Prozess, den der Kernel abschirmt.

## Docker: Engine, CLI und Registry

[[docker|Docker]] ist das verbreitetste Werkzeug, um Container zu bauen und zu starten. Es besteht aus
mehreren Teilen:

1. Die **Docker-CLI** (`docker`) ist deine Fernbedienung im Terminal.
2. Die [[docker-engine|Docker Engine]] mit dem [[daemon|Daemon]] `dockerd` läuft im Hintergrund, baut Images
   und verwaltet Container.
3. Eine [[registry|Registry]] wie [[docker-hub|Docker Hub]] speichert fertige Images.

```bash title="Der erste Container"
docker run hello-world
```

Die CLI schickt den Befehl an den Daemon. Der lädt das Image `hello-world` aus der Registry, startet daraus
einen Container und zeigt dessen Ausgabe. Container-Images folgen dem offenen [[oci|OCI]]-Standard – deshalb
laufen sie auch mit anderen Werkzeugen wie Podman oder in [[kubernetes|Kubernetes]].

> [!PRAXIS]
> In vielen Teams startest du am ersten Tag nicht mehr fünf Installationsprogramme, sondern einen einzigen
> Befehl: `docker compose up`. Datenbank, Cache und Webserver laufen danach in Containern. Das lernst du im
> letzten Modul.

> [!ACHTUNG]
> Das Übungs-Terminal von Stacklab hat bewusst keinen Docker-Daemon. Container-Befehle übst du im simulierten
> Terminal; Dockerfiles und Compose-Dateien schreibst und prüfst du echt. Installiere für eigene Versuche
> [Docker Desktop oder die Docker Engine](https://docs.docker.com/get-started/get-docker/) auf deinem Rechner.

## Zusammenfassung

- Container verpacken eine Anwendung **mit** ihrer Umgebung – das löst „Works on my machine“.
- Eine VM simuliert einen ganzen Rechner mit eigenem Kernel; ein Container ist ein isolierter Prozess.
- Container sind dadurch klein und starten schnell, isolieren aber schwächer als VMs.
- Linux isoliert mit **Namespaces** (was ein Prozess sieht) und begrenzt mit **cgroups** (was er verbraucht).
- Docker besteht aus CLI, Daemon (`dockerd`) und Registries wie Docker Hub.
