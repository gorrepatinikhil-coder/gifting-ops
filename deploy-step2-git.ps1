# GiftingOps — Step 2: Git init, commit, and push to GitHub
# ─────────────────────────────────────────────────────────
# BEFORE RUNNING:
#   1. Create an EMPTY repo on GitHub (no README, no .gitignore, no license)
#   2. Set your GitHub username and repo name below

$GITHUB_USERNAME = "YOUR_USERNAME"    # <-- change this
$REPO_NAME       = "gifting-ops"      # <-- change if your GitHub repo has a different name

# ─── 1. Init ──────────────────────────────────────────────
Set-Location "C:\Users\gorre\Desktop\CLAUDE\Sessions\gifting-ops"
git init

# ─── 2. Stage everything ──────────────────────────────────
git add .

# ─── 3. Preview — review this before continuing ───────────
Write-Host ""
Write-Host "─── Files staged for commit (review before continuing) ───" -ForegroundColor Cyan
git status
Write-Host ""
Write-Host "Press Enter to commit, or Ctrl+C to abort." -ForegroundColor Yellow
Read-Host

# ─── 4. Commit ────────────────────────────────────────────
git commit -m "Initial commit: GiftingOps operations platform"

# ─── 5. Connect to GitHub and push ────────────────────────
$remote = "https://github.com/$GITHUB_USERNAME/$REPO_NAME.git"
git remote add origin $remote
git branch -M main
git push -u origin main

Write-Host ""
Write-Host "Done! Repo pushed to: $remote" -ForegroundColor Green
Write-Host "Next: import this repo in Vercel and configure environment variables." -ForegroundColor Cyan
