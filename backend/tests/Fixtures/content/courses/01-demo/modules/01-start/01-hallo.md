---
title: Hallo Welt
summary: Die erste Lektion.
duration: 5
quiz:
  - type: single
    question: Was ist 1+1?
    options: ["1", "2"]
    answer: 1
    explanation: Zwei.
  - type: cloze
    text: Ein ___ speichert Werte.
    blanks: [[Variable, Variablen]]
    explanation: Variable.
  - type: find-bug
    question: Wo ist der Fehler?
    language: js
    code: |
      const a = 1
      console.log(b)
    bug_line: 2
    explanation: b existiert nicht.
tasks:
  - id: sortieren
    type: order
    title: Sortieren
    description: Sortiere.
    items: [A, B, C]
  - id: datei-anlegen
    type: terminal
    title: Datei anlegen
    description: Lege hallo.txt an.
    workdir: hallo
    checks:
      - type: file_exists
        path: hallo.txt
        message: Datei fehlt.
---

Eine [[variable]] ist ein Name für einen Wert. Diese Lektion ist absichtlich lang genug, damit der Validator
nicht warnt. Lorem-freier Fülltext: Wir lernen hier, wie Werte in Programmen gespeichert werden, warum Namen
wichtig sind und wie man sie sinnvoll wählt. Eine [[variable|Variable]] kann sich ändern. Wir schauen uns das
im Detail an, mit Beispielen und Übungen, damit alles klar wird. Danach geht es mit Datentypen weiter, die
festlegen, welche Art von Wert gespeichert ist. Volltextsuche sollte das Wort Schnappschuss finden.
