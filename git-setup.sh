#!/usr/bin/env bash
#
# One-time GitHub setup for the Cosmic Insights app.
# Run this from inside the Astro-main folder on your Mac:
#     cd "/Users/srikanthrpatil/Downloads/Cowork Project/Astro-main"
#     bash git-setup.sh
#
# Read it first — every step is explained. Nothing here is destructive
# except removing a half-created .git folder (we recreate it cleanly).

set -e  # stop immediately if any command fails

# ---------------------------------------------------------------------------
# 0. Clean slate
# A partial .git was created in a sandbox that couldn't finish it. We remove it
# and start fresh. (Safe: .git is just version-control metadata, not your code.)
# ---------------------------------------------------------------------------
rm -rf .git

# ---------------------------------------------------------------------------
# 1. Initialise a new repository
# Creates a hidden .git/ folder. "-b main" names the default branch "main".
# A "branch" is just a movable pointer to a line of commits; "main" is the
# conventional name for the primary one.
# ---------------------------------------------------------------------------
git init -b main

# ---------------------------------------------------------------------------
# 2. Tell git who you are
# Every commit is stamped with an author name + email. --local keeps this
# setting to THIS repo only (drop --local to set it for all your repos).
# ---------------------------------------------------------------------------
git config --local user.name  "Srikanth Patil"
git config --local user.email "isrikanthpatil@gmail.com"

# ---------------------------------------------------------------------------
# 3. Stage everything
# "git add -A" moves files into the "staging area" — the set of changes that
# will go into the next commit. Your .gitignore automatically keeps out
# node_modules/, .env, build output, etc. Verify with the status line below:
# you should NOT see node_modules or a bare .env listed.
# ---------------------------------------------------------------------------
git add -A
echo "----- Files that will be committed -----"
git status --short
echo "----------------------------------------"

# ---------------------------------------------------------------------------
# 4. Make the first commit
# A "commit" is a permanent snapshot of the staged files, with a message.
# This is your clean, building baseline.
# ---------------------------------------------------------------------------
git commit -m "Initial commit: clean, building baseline

- Fix build-breaking security imports (named exports wrapping SecurityUtils)
- Deduplicate AstrologyAI; Home tab renders the canonical component
- Resolve all TypeScript errors (tsc --noEmit passes)
- Add Supabase schema migration + self-hosted infra drafts (Docker, Caddy, Ollama)
- Add .env.example; remove committed credentials from README"

echo ""
echo "✅ Local repository created with your first commit."
echo ""
echo "NEXT — connect it to GitHub (do this once):"
echo "  1. Create an EMPTY repo on github.com (no README/license — keep it empty)."
echo "     Name it e.g. 'cosmic-insights'. Copy its URL."
echo "  2. Link your local repo to that 'remote' (call it 'origin'):"
echo "        git remote add origin https://github.com/<your-username>/cosmic-insights.git"
echo "  3. Push your commit up:"
echo "        git push -u origin main"
echo ""
echo "  (-u sets 'origin main' as the default, so future pushes are just 'git push'.)"
echo "  If asked to log in, use a GitHub Personal Access Token as the password,"
echo "  or run 'gh auth login' if you have the GitHub CLI installed."
