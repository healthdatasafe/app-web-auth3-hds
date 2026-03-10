#!/bin/sh

set -e

# working dir fix
scriptsFolder=$(cd $(dirname "$0"); pwd)
cd "$scriptsFolder/.."

echo "
Installing Node modules...
"
npm install

# Set up pre-commit lint hook
if [ ! -f .git/hooks/pre-commit ]; then
  echo "Setting up pre-commit lint hook..."
  mkdir -p .git/hooks
  cat > .git/hooks/pre-commit << 'HOOK'
#!/bin/sh
npm run lint
HOOK
  chmod +x .git/hooks/pre-commit
fi

if [ -d dist ] && [ ! -d dist/.git ]; then
  echo "
  Conflict with previous unpublished build, cleaning 'dist' folder."
  rm -rf dist/
fi

if [ ! -d dist ]; then
  echo "
Setting up 'dist' folder for publishing to GitHub pages...
"
  git clone -b gh-pages git@github.com:healthdatasafe/app-web-auth3-hds.git dist
fi

if [ ! -d distprod ]; then
  echo "
Setting up 'distprod' folder for publishing to production...
"
  git clone git@github.com:healthdatasafe/app-web-auth3-hds-prod.git distprod
fi

echo "
Setup is complete, you can proceed with building and publishing.
"
