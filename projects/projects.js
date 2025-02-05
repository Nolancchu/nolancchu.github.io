import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm";
import { fetchJSON, renderProjects } from '../global.js';

const years = [2020, 2021, 2022, 2023, 2024];
const customColors = ['#097969', '#478778', '#5F9EA0', '#088F8F', '#228B22'];
const colors = d3.scaleOrdinal()
    .domain(years)
    .range(customColors);

function updateVisualization(filteredProjects) {
    let rolledData = d3.rollups(
        filteredProjects,
        (v) => v.length,
        (d) => d.year,
    );
    let data = rolledData.map(([year, count]) => {
        return { value: count, label: year };
    });
    
    data.sort((a, b) => Number(a.label) - Number(b.label));
    
    let sliceGenerator = d3.pie().value((d) => d.value);
    let arcData = sliceGenerator(data);
    
    d3.select('svg').selectAll('*').remove();
    d3.select('.legend').selectAll('*').remove();
    
    arcData.forEach((d) => {
        d3.select('svg')
            .append('path')
            .attr('d', arcGenerator(d))
            .attr('fill', colors(d.data.label))
            .on('click', function() {
                const path = d3.select(this);
                const isSelected = path.classed('selected');
                const year = d.data.label; 
                
                d3.selectAll('path').classed('selected', false);
                
                const projectsContainer = document.querySelector('.projects');
                projectsContainer.innerHTML = '';
                
                if (!isSelected) {
                    path.classed('selected', true);
                    
                    const filteredProjects = projects.filter(project => 
                        project.year === year
                    );
                    
                    filteredProjects.forEach(project => {
                        renderProjects(project, projectsContainer, 'h2');
                    });
                    
                    const projectsTitle = document.querySelector('.projects-title');
                    projectsTitle.textContent = `${filteredProjects.length} Projects (${year})`;
                } else {
                    projects.forEach(project => {
                        renderProjects(project, projectsContainer, 'h2');
                    });
                    
                    const projectsTitle = document.querySelector('.projects-title');
                    projectsTitle.textContent = `${projects.length} Projects`;
                }
            });
    });
    
    data.forEach((d) => {
        let li = legend.append('li')
            .attr('class', 'legend-item');
        
        li.append('span')
            .attr('class', 'legend-circle')
            .style('background-color', colors(d.label));
        
        li.append('span')
            .attr('class', 'legend-text')
            .text(`${d.label} (${d.value})`);
    });
}

async function loadProjects() {
    const projects = await fetchJSON('../lib/projects.json');
    const projectsTitle = document.querySelector('.projects-title');
    const projectsContainer = document.querySelector('.projects');
    const searchInput = document.querySelector('.searchBar');

    if (projects && Array.isArray(projects)) {
        projectsTitle.textContent = `${projects.length} Projects`;

        projects.forEach(project => {
            renderProjects(project, projectsContainer, 'h2');
        });
        updateVisualization(projects);  

        searchInput.addEventListener('input', (event) => {
            const query = event.target.value.toLowerCase();
            
            const filteredProjects = projects.filter(project => {
                const values = Object.values(project).join(' ').toLowerCase();
                return values.includes(query);
            });
            
            projectsContainer.innerHTML = '';
            
            filteredProjects.forEach(project => {
                renderProjects(project, projectsContainer, 'h2');
            });
            
            updateVisualization(filteredProjects); 
        });
    } else {
        projectsTitle.textContent = 'No projects available';
    }
}

let arcGenerator = d3.arc().innerRadius(0).outerRadius(50);

let projects = await fetchJSON('../lib/projects.json');
let rolledData = d3.rollups(
    projects,
    (v) => v.length,
    (d) => d.year,
);
let data = rolledData.map(([year, count]) => {
    return { value: count, label: year };
});

data.sort((a, b) => Number(b.label) - Number(a.label));

let sliceGenerator = d3.pie().value((d) => d.value);
let arcData = sliceGenerator(data);

d3.select('svg').selectAll('*').remove();

arcData.forEach((d) => {
    d3.select('svg')
        .append('path')
        .attr('d', arcGenerator(d))
        .attr('fill', colors(d.data.label))
        .on('click', function() {
            const path = d3.select(this);
            const isSelected = path.classed('selected');
            const year = d.data.label; 
            
            d3.selectAll('path').classed('selected', false);
            
            const projectsContainer = document.querySelector('.projects');
            projectsContainer.innerHTML = '';
            
            if (!isSelected) {
                path.classed('selected', true);
                
                const filteredProjects = projects.filter(project => 
                    project.year === year
                );
                
                filteredProjects.forEach(project => {
                    renderProjects(project, projectsContainer, 'h2');
                });
                
                const projectsTitle = document.querySelector('.projects-title');
                projectsTitle.textContent = `${filteredProjects.length} Projects (${year})`;
            } else {
                projects.forEach(project => {
                    renderProjects(project, projectsContainer, 'h2');
                });
                
                const projectsTitle = document.querySelector('.projects-title');
                projectsTitle.textContent = `${projects.length} Projects`;
            }
        });
});

let legend = d3.select('.legend');

data.forEach((d) => {
    let li = legend.append('li')
        .attr('class', 'legend-item');
    
    li.append('span')
        .attr('class', 'legend-circle')
        .style('background-color', colors(d.label));
    
    li.append('span')
        .attr('class', 'legend-text')
        .text(`${d.label} (${d.value})`);
});

loadProjects();