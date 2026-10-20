#!/usr/bin/env bash

set -euo pipefail

payload=$(cat)
root=
edited_path=
{
  IFS= read -r root || true
  IFS= read -r edited_path || true
} < <(
  node -e '
    const payload = JSON.parse(process.argv[1]);
    console.log(payload.cwd || process.cwd());
    console.log(payload.tool_input?.file_path || payload.tool_response?.filePath || "");
  ' "$payload"
)

root=${root:-$(pwd)}

# The hook's cwd can be a nested folder, and CLAUDE_PROJECT_DIR stays fixed
# across worktrees. The checkout that owns the edited file is authoritative.
if [[ -n "$edited_path" ]]; then
  edited_dir=$(dirname "$edited_path")
  if [[ -d "$edited_dir" ]] && toplevel=$(git -C "$edited_dir" rev-parse --show-toplevel 2>/dev/null); then
    root=$toplevel
  fi
fi

relative_path=$(
  node -e '
    const path = require("path");
    const root = path.resolve(process.argv[1]);
    const edited = path.resolve(root, process.argv[2]);
    const relative = path.relative(root, edited);
    if (relative === "" || relative === ".." || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
      process.exit(0);
    }
    process.stdout.write(relative.split(path.sep).join("/"));
  ' "$root" "$edited_path"
)

if [[ -z "$relative_path" ]]; then
  exit 0
fi

case "$relative_path" in
  app/*.ts | app/*.tsx | app/*.js | test/*.ts | test/*.tsx | test/*.js | __mocks__/*.ts | __mocks__/*.tsx | __mocks__/*.js | index.js | player-service.js) ;;
  *) exit 0 ;;
esac

# Nothing to check when the edited file is not inside a Yarn project.
if [[ ! -f "$root/package.json" ]]; then
  exit 0
fi

if ! command -v yarn >/dev/null 2>&1; then
  echo "yarn is not on PATH; cannot run typecheck/lint after editing $relative_path" >&2
  exit 2
fi

output_file=$(mktemp)
trap 'rm -f "$output_file"' EXIT

if (cd "$root" && yarn -s typecheck && yarn -s lint) >"$output_file" 2>&1; then
  exit 0
fi

echo "typecheck/lint failed after editing $relative_path; fix before committing" >&2
cat "$output_file" >&2
exit 2
