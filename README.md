# pr-to-file-javascript-action

This action adds a file for a PR to a "./changes/" folder. The added file is named after the PR number (e.g: "PR#201.json") with:
* PR Title
* PR Message
* PR Url
* PR Labels
in a json format.

## Inputs

## `git-token`

**Required** A GITHUB_SECRET with enough permissions to add a file.

## `committer-name`

A string with the name that will be used as a committer for the added file. Default: `"PR-to-file-bot"`.

## `committer-email`

A string with the email that will be used as a committer for the added file. Default: `"pr-to-file@bot.com"`.

## Outputs
This action has no outputs.

## Example usage

```
uses: rodrigoarias/hello-world-javascript-action@v1.2
with:
  git-token: ${{ secrets.GITHUB_TOKEN }}
```
