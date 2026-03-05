#!/bin/bash 
cd $(dirname $0)/..
emacs --batch -l org --eval "(progn (find-file \"AGENT.org\") (org-babel-tangle))"
emacs --batch -l org --eval "(progn (find-file \"README.org\") (org-babel-tangle))"
# emacs --batch -l org --eval "(progn (find-file \"AGENTS.md\") (org-babel-tangle))"