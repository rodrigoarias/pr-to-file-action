const core = require('@actions/core')
const github = require('@actions/github')

const main = async (workspace) => {
	const myToken = core.getInput('git-token');
	const octokit = github.getOctokit(myToken);

	const committer =  {
		name: core.getInput('committer-name'),
		email: core.getInput('committer-email'),
	}

	if(github.context.payload.pull_request && validActivityType(github.context.payload.action)) {
		createPullRequestChangesFile(octokit, github.context, committer);
	} else {
		core.setFailed('This action should only be runned on a Pull Request (opened, edited, labeled, unlabeled)');
	}
}

const validActivityType = (type) => {
	validActivityTypes = ['labeled','unlabeled','opened','edited'];
	return validActivityTypes.includes(type);
}

const createPullRequestChangesFile = async (octo, context, committer) => {
	
	const pr = context.payload.pull_request
	const changelogFileName = `changes/PR-${pr.number}.json`
	const title = pr.title
	const body = pr.body
	const url = pr.html_url
	const owner = context.payload.repository.owner.login
	const repo = context.payload.repository.name
	
	const content = {
		title: pr.title,
		message: pr.body,
		url: pr.html_url,
		number: pr.number,
		labels: pr.labels
	}
	var contentBase64 = btoa(JSON.stringify(content));
	var fileSha = '';
	try {
		const existingFile = await findFile(octo, owner, repo, pr.head.ref, changelogFileName);
		fileSha = existingFile.data.sha;
		console.log('PR File already exists. Performing update...');
	} catch (e) {
		console.log('PR File does not exist. Performing create...');
	}
		
	const file = await addFile(octo, owner, repo, fileSha, pr.head.ref, contentBase64, changelogFileName, title, committer);	
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

const addFile = async(octo, organization, repo, sha, branch, content, fileName, feature, committer) => {
	const addedFile = await octo.rest.repos.createOrUpdateFileContents({
		owner: organization,
		repo,
		path: fileName,
		message: `Changelog file for: ${feature}`,
		content,
		sha,
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
