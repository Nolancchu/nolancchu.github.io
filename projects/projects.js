import { fetchJSON, renderProjects } from '../global.js';

async function loadProjects() {
    const projects = await fetchJSON('../lib/projects.json');
    
    const projectsTitle = document.querySelector('.projects-title');

    if (projects && Array.isArray(projects)) {
        projectsTitle.textContent = `${projects.length} Projects`;  
        
        const projectsContainer = document.querySelector('.projects');

        projects.forEach(project => {
            renderProjects(project, projectsContainer, 'h2');
        });
    } else {
        projectsTitle.textContent = 'No projects available';  
    }
}

loadProjects();
