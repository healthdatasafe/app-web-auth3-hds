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

# Copy build output to distprod/docs/ (prod repo serves from docs/)
rm -rf distprod/docs/*
cp -r dist/* distprod/docs/
echo "auth.datasafe.dev" > distprod/docs/CNAME

# Generate settings.json (production environment)
cat > distprod/docs/settings.json << SEOF
{
  "serviceInfoUrl": "https://reg.api.datasafe.dev/service/info"
}
SEOF

git -C distprod add -A
if git -C distprod diff --cached --quiet; then
  echo "No changes in distprod/ — nothing to deploy."
  exit 0
fi
git -C distprod commit -m "deploy $COMMIT_SHORT ($COMMIT_FULL)"
git -C distprod push

echo "Deployed $COMMIT_SHORT to production."
