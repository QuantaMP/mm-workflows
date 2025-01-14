// See https://docs.github.com/en/actions/creating-actions/creating-a-javascript-action
// NOTE: Every time you modify this file, you need to run
// `ncc build index.js && git add -f dist/index.js index.js package.json package-lock.json`
// You do NOT need to git add node_modules/*

const core = require('@actions/core');
const github = require('@actions/github');
import fetch from "node-fetch";

try {
  const event_name = core.getInput('event_name');
  const repository = core.getInput('repository');
  const owner = core.getInput('owner');
  const ref_name = core.getInput('ref_name');
  const commit_message = core.getInput('commit_message');
  const target_repository = core.getInput('target_repository');
  const access_token = core.getInput('access_token');

  if (!access_token) {
    console.log("Error! Authentication token is not defined! (or expired)");
  }

  const run_name = `${commit_message} - ${repository} - ${ref_name}`;
  if (run_name.length >= 100) {
    console.log(`Error! 'event_type' must be < 100 characters: '${run_name}'`)
  }

  const repo_owner = event_name == "pull_request_target" ? github.context.payload.repository.owner.login : owner;
  const url_dispatches = `https://api.github.com/repos/${repo_owner}/${target_repository}/dispatches`;
  console.log(`Sending repository_dispatch to repo: ${repo_owner}/${target_repository}`);
  console.log(`url_dispatches: ${url_dispatches}`);

  const response = await fetch(url_dispatches, {
    method: "POST",
    body: JSON.stringify({
      // Value of "event_type" is passed into "github.event.action" in the receiving workflow.
      event_type: "repository_dispatch_mm-workflows",
      client_payload: {
        'repository': repository,
        'owner': owner,
        'ref_name': ref_name,
        'commit_message': commit_message,
        'run_name': run_name
      },
    }),
    headers: {
//      "Accept": "application/vnd.github+json",
//      "X-GitHub-Api-Version": "2022-11-28",
      'Authorization': `Bearer ${access_token}`
    }
  });
  const response_str = await response.text();
  console.log(`response: ${response_str}`);
  core.setOutput("response", response_str);

  // Get the JSON webhook payload for the event that triggered the workflow
  const payload = JSON.stringify(github.context.payload, undefined, 2)
  console.log(`The event payload: ${payload}`);
} catch (error) {
  core.setFailed(error.message);
}
