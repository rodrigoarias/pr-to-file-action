const core = require('@actions/core')
const github = require('@actions/github')

const main = async (workspace) => {
	const myToken = core.getInput('git-token');
	const octokit = github.getOctokit(myToken);

	const committer =  {
		name: core.getInput('committer-name'),
		email: core.getInput('committer-email'),
	}


	if(github.context.payload.pull_request) {
		createPullRequestChangesFile(octokit, github.context, committer)
	} else {
		core.setFailed('This action should only be runned on a Pull Request')
	}
}

const createPullRequestChangesFile = async (octo, context, committer) => {
	console.log('Here we are in a PR, this is what we have:');

	const pr = context.payload.pull_request
	const changelogFileName = `changes/PR-${pr.number}.json`
	const title = pr.title
	const body = pr.body
	const url = pr.html_url
	const owner = context.payload.repository.owner.login
	const repo = context.payload.repository.name

	console.log(JSON.stringify(github, null, 4));
	console.log(`Owner ${owner}`)
	
	const content = {
		title: pr.title,
		message: pr.body,
		url: pr.html_url,
		number: pr.number,
		labels: pr.labels
	}
	var contentBase64 = btoa(JSON.stringify(content))

	try {
		const existingFile = await findFile(octo, owner, repo, pr.head.ref, changelogFileName);
		console.log("Changelog file already exists. Finishing action.")
	} catch (e) {
		console.log("Changelog file already doesn't exists. I'll create it")
		const blob = await createBlob(octo, owner, repo, contentBase64);
		const file = await addFile(octo, owner, repo, blob, pr.head.ref, contentBase64, changelogFileName, title, committer);	
	}
}

const createBlob = async (octo, organization, repo, content) => {
	const blobData = await octo.rest.git.createBlob({
        owner: organization,
        repo,
        content,
        encoding: 'base64',
    })

    return blobData.data
}

const addFile = async(octo, organization, repo, blob, branch, content, fileName, feature, committer) => {
	const addedFile = await octo.rest.repos.createOrUpdateFileContents({
		owner: organization,
		repo,
		path: fileName,
		message: `Changelog file for: ${feature}`,
		content,
		sha: blob.sha,
		branch,
		committer,
	});

	return addedFile
}

const findFile = async(octo, organization, repo, branch, fileName) => {
	gitFile = await octo.rest.repos.getContent({
		owner: organization,
		repo,
		path: fileName,
		ref: branch
	})
	return gitFile;
}

main()
