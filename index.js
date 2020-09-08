const core = require('@actions/core'),
  github = require('@actions/github');

async function run() {
  try {
    const token = core.getInput('token');
    const labels = Object.keys(process.env).filter(e => e !== 'INPUT_TOKEN' && e.startsWith('INPUT_')).map(e => e.replace('INPUT_', '').toLowerCase());
    console.log(`Checking for labels: ` + labels.join(', '));

    const prNumber = getPrNumber();
    if (!prNumber) {
      console.log('Could not get pull request number from context, exiting');
      return;
    }

    const client = github.getOctokit(token);

    const repo = github.context.payload.repository;

    const data = await client.pulls.get({
      owner: repo.owner.login,
      repo: repo.name,
      pull_number: prNumber,
    });

    const branch = data.data.head.ref;

    for (let prefix of labels) {
      let tmp = prefix;
      if (!prefix.endsWith('/'))
        prefix += '/';

      console.log(`If ${branch} startsWith ${prefix}`)
      if (branch.startsWith(prefix)) {
        const label = process.env['INPUT_' + tmp.toUpperCase()];
        console.log(`Adding ${label} to #${prNumber}`);
        await addLabels(client, prNumber, [label]);
      }
    }
  } catch (error) {
    console.error(error);
    core.setFailed(error.message);
  }
}

async function addLabels(client, prNumber, labels) {
  await client.issues.addLabels({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    issue_number: prNumber,
    labels: labels
  });
}

function getPrNumber() {
  const pullRequest = github.context.payload.pull_request;
  if (!pullRequest) {
    return undefined;
  }

  return pullRequest.number;
}

run();