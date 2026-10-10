# Stacklab practice shell setup (sourced by login shells)
export NVM_DIR=/opt/nvm
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
[ -s "$NVM_DIR/bash_completion" ] && . "$NVM_DIR/bash_completion"
export BUN_INSTALL=/opt/bun
export PATH="./node_modules/.bin:./vendor/bin:$BUN_INSTALL/bin:/opt/composer/vendor/bin:$PATH"
export EDITOR=nano
export TMPDIR="$HOME/.tmp"
mkdir -p "$TMPDIR" 2>/dev/null || true

if [ -n "$PS1" ]; then
  __stacklab_branch() {
    git rev-parse --abbrev-ref HEAD 2>/dev/null | sed 's/.*/ (&)/'
  }
  PS1='\[\e[1;32m\]du@stacklab\[\e[0m\]:\[\e[1;34m\]\w\[\e[0;35m\]$(__stacklab_branch)\[\e[0m\]\$ '

  if [ -n "$STACKLAB_START_DIR" ] && [ -d "$STACKLAB_START_DIR" ]; then
    cd "$STACKLAB_START_DIR" || true
  fi

  if [ -z "$STACKLAB_QUIET" ]; then
    printf '\e[1;36mStacklab Übungs-Terminal\e[0m – Kurs-Ordner: \e[1m%s\e[0m\n' "${STACKLAB_COURSE:-?}"
    printf 'Alles, was du hier anlegst, liegt auch auf deinem Rechner im Workspace-Ordner.\n'
    printf 'Tipp: \e[1mhelp-stacklab\e[0m zeigt verfügbare Werkzeuge.\n\n'
  fi
fi

help-stacklab() {
  cat <<'HELP'
Verfügbare Werkzeuge im Übungs-Terminal:
  git, node, npm, npx, nvm, bun, bunx, php, composer, pint, phpstan, laravel
  sqlite3, jq, curl, tree, nano, vim, less, make, zip/unzip
Netzwerk: nur Paket-Registries (npm, Packagist, GitHub, nodejs.org) sind erreichbar.
Dein Workspace: /workspace  (pro Kurs ein Unterordner)
HELP
}
