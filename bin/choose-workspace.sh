#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

pick() {
  case "$(uname -s)" in
    Darwin)
      osascript -e 'POSIX path of (choose folder with prompt "Stacklab: Wähle deinen Workspace-Ordner")' 2>/dev/null
      ;;
    Linux)
      if command -v zenity >/dev/null 2>&1; then
        zenity --file-selection --directory --title="Stacklab: Workspace-Ordner wählen" 2>/dev/null
      elif command -v kdialog >/dev/null 2>&1; then
        kdialog --getexistingdirectory "$HOME" --title "Stacklab: Workspace-Ordner wählen" 2>/dev/null
      else
        read -r -p "Kein grafischer Dialog gefunden. Pfad eingeben: " path && echo "$path"
      fi
      ;;
    MINGW*|MSYS*|CYGWIN*)
      powershell.exe -NoProfile -Command "Add-Type -AssemblyName System.Windows.Forms; \$d = New-Object System.Windows.Forms.FolderBrowserDialog; \$d.Description = 'Stacklab: Workspace-Ordner wählen'; if (\$d.ShowDialog() -eq 'OK') { \$d.SelectedPath }" | tr -d '\r' | sed 's#\\#/#g'
      ;;
    *)
      read -r -p "Pfad zum Workspace-Ordner: " path && echo "$path"
      ;;
  esac
}

folder="$(pick || true)"
folder="${folder%/}"
if [ -z "$folder" ]; then
  echo "Keine Auswahl getroffen – nichts geändert."
  exit 1
fi

if [ -d "$folder" ] && [ ! -f "$folder/.stacklab-workspace" ] && [ -n "$(ls -A "$folder" 2>/dev/null | grep -v '^.DS_Store$')" ]; then
  echo "In $folder liegen schon andere Dateien. Stacklab braucht einen eigenen, leeren Ordner – lege im Dialog einen neuen an."
  exit 1
fi

[ -f .env ] || cp .env.example .env
if grep -q '^STACKLAB_WORKSPACE=' .env; then
  tmp="$(mktemp)"
  grep -v '^STACKLAB_WORKSPACE=' .env > "$tmp"
  printf 'STACKLAB_WORKSPACE="%s"\n' "$folder" >> "$tmp"
  mv "$tmp" .env
else
  printf '\nSTACKLAB_WORKSPACE="%s"\n' "$folder" >> .env
fi

echo "Workspace-Ordner gesetzt: $folder"
echo "Übungs-Terminal wird neu gestartet …"
docker compose up -d --force-recreate sandbox php nginx >/dev/null
echo "Fertig. Lade Stacklab im Browser neu."
