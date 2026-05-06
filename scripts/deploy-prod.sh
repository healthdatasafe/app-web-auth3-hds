#!/usr/bin/env bash
# Deploy to production (app-web-auth3-hds-prod repo).
set -euo pipefail

scriptsFolder=$(cd $(dirname "$0"); pwd)
cd "$scriptsFolder/.."

MAIN_BRANCH="main"
BRANCH="$(git rev-parse --abbrev-ref HEAD)"
if [ "$BRANCH" != "$MAIN_BRANCH" ]; then
  echo "ERROR: Deploy only allowed from '$MAIN_BRANCH' (current: $BRANCH)."
  exit 1
fi

if [ -n "$(git status --porcelain)" ]; then
  echo "ERROR: Working tree is not clean."
  git status --short
  exit 1
fi

if [ ! -d distprod/.git ]; then
  echo "ERROR: distprod/ is not set up. Run 'npm run setup' first."
  exit 1
fi

COMMIT_SHORT="$(git rev-parse --short HEAD)"
COMMIT_FULL="$(git rev-parse HEAD)"
echo "Deploying commit $COMMIT_SHORT to production..."

# Reset distprod/ to origin/main so the deploy starts from a known state
# (avoids accumulated cruft from previous local builds).
echo "Resetting distprod/ to origin/main..."
git -C distprod fetch origin main
git -C distprod reset --hard origin/main
git -C distprod clean -fdx

echo "Building..."
npm run build
echo "Build OK."

# Generate version.json
cat > dist/version.json << VEOF
{
  "commit": "$COMMIT_FULL",
  "commitShort": "$COMMIT_SHORT",
  "branch": "$MAIN_BRANCH",
  "buildDate": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
VEOF

# Copy build output to distprod/docs/ (prod repo serves from docs/).
# `mkdir -p` keeps the path predictable on a fresh distprod/ clone.
mkdir -p distprod/docs
rm -rf distprod/docs/*
cp -r dist/* distprod/docs/
# Hidden files (e.g. .nojekyll) aren't matched by `dist/*` — copy explicitly.
[ -f dist/.nojekyll ] && cp dist/.nojekyll distprod/docs/.nojekyll || touch distprod/docs/.nojekyll
echo "account.datasafe.dev" > distprod/docs/CNAME

# Generate settings.json (production environment)
cat > distprod/docs/settings.json << SEOF
{
  "serviceInfoUrl": "https://reg.api.datasafe.dev/service/info"
}
SEOF

# Post-build sanity check — fail loud if a required artifact is missing.
for required in distprod/docs/index.html distprod/docs/404.html distprod/docs/CNAME distprod/docs/.nojekyll distprod/docs/settings.json; do
  if [ ! -e "$required" ]; then
    echo "ERROR: required file missing after build: $required"
    exit 1
  fi
done
if ! ls distprod/docs/assets/index-*.js >/dev/null 2>&1; then
  echo "ERROR: no distprod/docs/assets/index-*.js found after build."
  exit 1
fi
EXPECTED_CNAME="account.datasafe.dev"
ACTUAL_CNAME="$(tr -d '[:space:]' < distprod/docs/CNAME)"
if [ "$ACTUAL_CNAME" != "$EXPECTED_CNAME" ]; then
  echo "ERROR: distprod/docs/CNAME='$ACTUAL_CNAME' does not match expected '$EXPECTED_CNAME'."
  exit 1
fi
echo "Sanity check OK."

git -C distprod add -A
if git -C distprod diff --cached --quiet; then
  echo "No changes in distprod/ — nothing to deploy."
  exit 0
fi
git -C distprod commit -m "deploy $COMMIT_SHORT ($COMMIT_FULL)"
git -C distprod push

echo "Deployed $COMMIT_SHORT to production."
