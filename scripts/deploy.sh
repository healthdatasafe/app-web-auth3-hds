#!/usr/bin/env bash
# Deploy to gh-pages.
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

if [ ! -d dist/.git ]; then
  echo "ERROR: dist/ is not a gh-pages checkout. Run 'npm run setup' first."
  exit 1
fi

COMMIT_SHORT="$(git rev-parse --short HEAD)"
COMMIT_FULL="$(git rev-parse HEAD)"
echo "Deploying commit $COMMIT_SHORT ..."

# Reset dist/ to origin/gh-pages so the deploy starts from a known state
# (avoids accumulated cruft from previous local builds).
echo "Resetting dist/ to origin/gh-pages..."
git -C dist fetch origin gh-pages
git -C dist reset --hard origin/gh-pages
git -C dist clean -fdx

echo "Building..."
npm run build
echo "Build OK."

# Generate settings.json (dev environment)
cat > dist/settings.json << SEOF
{
  "serviceInfoUrl": "https://demo.datasafe.dev/reg/service/info"
}
SEOF

# .nojekyll prevents GH Pages from running Jekyll preprocessing on the
# build output (otherwise files starting with '_' are dropped).
touch dist/.nojekyll

# Post-build sanity check — fail loud if a required artifact is missing
# rather than push a broken deploy.
for required in dist/index.html dist/404.html dist/CNAME dist/.nojekyll; do
  if [ ! -e "$required" ]; then
    echo "ERROR: required file missing after build: $required"
    exit 1
  fi
done
if ! ls dist/assets/index-*.js >/dev/null 2>&1; then
  echo "ERROR: no dist/assets/index-*.js found after build."
  exit 1
fi
EXPECTED_CNAME="demo-account.datasafe.dev"
ACTUAL_CNAME="$(tr -d '[:space:]' < dist/CNAME)"
if [ "$ACTUAL_CNAME" != "$EXPECTED_CNAME" ]; then
  echo "ERROR: dist/CNAME='$ACTUAL_CNAME' does not match expected '$EXPECTED_CNAME'."
  echo "       Update public/CNAME (source of truth) and rebuild."
  exit 1
fi
echo "Sanity check OK."

# Generate version.json
cat > dist/version.json << VEOF
{
  "commit": "$COMMIT_FULL",
  "commitShort": "$COMMIT_SHORT",
  "branch": "$MAIN_BRANCH",
  "buildDate": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
VEOF
git -C dist add -A
if git -C dist diff --cached --quiet; then
  echo "No changes in dist/ — nothing to deploy."
  exit 0
fi
git -C dist commit -m "deploy $COMMIT_SHORT ($COMMIT_FULL)"
git -C dist push

echo "Deployed $COMMIT_SHORT to gh-pages."
