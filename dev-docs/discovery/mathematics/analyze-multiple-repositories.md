# Analyze multiple repositories
for repo in react vue angular; do
  mind-git kernel:analyze ~/projects/$repo
done
