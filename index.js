import { fetchJSON, renderProjects, fetchGitHubData} from '../global.js';

const projects = await fetchJSON('../lib/projects.json');
const latestProjects = projects.slice(0, 3);

const projectsContainer = document.querySelector('.projects');

latestProjects.forEach(project => {
    renderProjects(project, projectsContainer, 'h2');
});

const githubData = await fetchGitHubData('Nolancchu');
const profileStats = document.querySelector('#profile-stats');

if (profileStats) {
    profileStats.innerHTML = `
        <dl class="github-stats">
            <dt>Username:</dt><dd>${githubData.name}</dd>
            <dt>Blog:</dt><dd>${githubData.blog}</dd>
            <dt>Bio:</dt><dd>${githubData.bio}</dd>
            <dt>Public Repos:</dt><dd>${githubData.public_repos}</dd>
            <dt>Followers:</dt><dd>${githubData.followers}</dd>
            <dt>Following:</dt><dd>${githubData.following}</dd>
        </dl>
    `;
}
else {
    console.error('Missing required github data');
}