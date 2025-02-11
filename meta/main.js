let data = [];
let commits = [];

document.addEventListener('DOMContentLoaded', async () => {
    await loadData();
    await createScatterPlot();
});

function processCommits() {
    commits = d3.groups(data, (d) => d.commit).map(([commit, lines]) => {
        let first = lines[0];
        let { author, date, time, timezone, datetime } = first;
        let ret = {
            id: commit,
            url: 'https://github.com/Nolancchu/nolancchu.github.io/commit/' + commit,
            author,
            date,
            time,
            timezone,
            datetime,
            hourFrac: datetime.getHours() + datetime.getMinutes() / 60,
            totalLines: lines.length,
        };

        Object.defineProperty(ret, 'lines', {
            value: lines,
            writable: false, 
            enumerable: false, 
            configurable: false 
        });

        return ret;
    });
}

function displayStats() {
    // Process commits first
    processCommits();

    // Create the dl element with inline styles
    const dl = d3.select('#stats')
        .append('dl')
        .attr('class', 'stats')
        .style('padding', '1rem')
        .style('margin', '1rem auto')
        .style('border', '1px solid #ddd')
        .style('border-radius', '8px')
        .style('background-color', '#fff')
        .style('max-width', '400px')
        .style('font-family', 'sans-serif')
        .style('font-size', '14px');

    // Style the dt elements
    dl.selectAll('dt')
        .style('font-weight', 'bold')
        .style('margin-top', '1rem')
        .style('color', '#333')
        .style('font-size', '1.1rem');

    // Style the dd elements
    dl.selectAll('dd')
        .style('margin', '0.5rem 0 1rem 0')
        .style('color', '#555');

    // Add total LOC
    dl.append('dt').html('Total lines of code');
    dl.append('dd').text(data.length);

    // Add total commits
    dl.append('dt').text('Total commits');
    dl.append('dd').text(commits.length);

    // Add more stats as needed
    dl.append('dt').text('Average commit length');
    dl.append('dd').text(data.length / commits.length);

    let charCount = 0;
    data.forEach((d) => {
        charCount += d.length;
    });
    dl.append('dt').text('Total characters');
    dl.append('dd').text(charCount);

    dl.append('dt').text('Average characters per file');
    dl.append('dd').text(charCount / data.length);
}

async function loadData() {
    data = await d3.csv('loc.csv', (row) => ({
        ...row,
        line: Number(row.line),
        depth: Number(row.depth),
        length: Number(row.length),
        date: isNaN(Date.parse(row.date)) ? null : new Date(row.date + 'T00:00' + row.timezone),
        datetime: isNaN(Date.parse(row.datetime)) ? null : new Date(row.datetime),
    }));
    displayStats();
}

function updateTooltipVisibility(isVisible) {
    const tooltip = document.getElementById('commit-tooltip');
    tooltip.hidden = !isVisible;
}

let xScale 
let yScale

async function createScatterPlot() {
    const width = 1000;
    const height = 600;
    const margin = { top: 10, right: 10, bottom: 30, left: 20 };

    const svg = d3
        .select('#chart')
        .append('svg')
        .attr('viewBox', `0 0 ${width} ${height}`)
        .style('overflow', 'visible');

    xScale = d3
        .scaleTime()
        .domain(d3.extent(commits, (d) => d.datetime))
        .range([0, width])
        .nice();

    yScale = d3.scaleLinear().domain([0, 24]).range([height, 0]);

    const usableArea = {
        top: margin.top,
        right: width - margin.right,
        bottom: height - margin.bottom,
        left: margin.left,
        width: width - margin.left - margin.right,
        height: height - margin.top - margin.bottom,
    };

    // Update scales with new ranges
    xScale.range([usableArea.left, usableArea.right]);
    yScale.range([usableArea.bottom, usableArea.top]);

    // Add gridlines BEFORE the axes
    const gridlines = svg
        .append('g')
        .attr('class', 'gridlines')
        .attr('transform', `translate(${usableArea.left}, 0)`);

    gridlines.call(
        d3.axisLeft(yScale)
            .tickFormat('')
            .tickSize(-usableArea.width)
    )
    .selectAll('line')
    .style('stroke', '#ccc')
    .style('stroke-dasharray', '2,2')
    .style('opacity', 0.7);

    // Remove the vertical domain line
    gridlines.select('.domain').remove();

    // Create the axes
    const xAxis = d3.axisBottom(xScale);
    const yAxis = d3
        .axisLeft(yScale)
        .tickFormat((d) => String(d % 24).padStart(2, '0') + ':00');

    svg
        .append('g')
        .attr('transform', `translate(0, ${usableArea.bottom})`)
        .call(xAxis);

    svg
        .append('g')
        .attr('transform', `translate(${usableArea.left}, 0)`)
        .call(yAxis);

    const dots = svg.append('g').attr('class', 'dots');
    const [minLines, maxLines] = d3.extent(commits, (d) => d.totalLines);
    const rScale = d3
        .scaleSqrt()
        .domain([minLines, maxLines])
        .range([2, 30]);

    const sortedCommits = d3.sort(commits, (d) => -d.totalLines);

    // Render dots
    dots
        .selectAll('circle')
        .data(sortedCommits)
        .join('circle')
        .attr('cx', (d) => xScale(d.datetime))
        .attr('cy', (d) => yScale(d.hourFrac))
        .attr('r', (d) => rScale(d.totalLines))
        .style('fill-opacity', 0.7)
        .on('mouseenter', (event, d) => {
            console.log("Hovered on commit", d);  // Check if event is firing
            d3.select(event.currentTarget).style('fill-opacity', 1);
            updateTooltipVisibility(true);  // Show tooltip
            updateTooltipPosition(event);
            updateTooltipContent(d);  // Update tooltip with commit data
        })
        .on('mouseleave', (event, d) => {
            console.log("Stopped hovering");
            d3.select(event.currentTarget).style('fill-opacity', 0.7); // Restore transparency
            updateTooltipVisibility(false);  // Hide tooltip
            updateTooltipContent(d);  // Clear tooltip
        });

    // Add brush functionality here, but place it behind the dots
    brushSelector();
}

function updateTooltipContent(commit) {
    console.log("Commit data:", commit);
    const tooltip = document.getElementById('commit-tooltip');
    const link = document.getElementById('commit-link');
    const date = document.getElementById('commit-date');

    if (!commit || Object.keys(commit).length === 0) {
        link.href = "#";  // Remove previous link
        link.textContent = "Hover over a commit to see details";
        date.textContent = "";
        tooltip.classList.remove('show');  // Hide tooltip
        return;
    }

    link.href = commit.url;
    link.textContent = commit.id;
    date.textContent = commit.datetime?.toLocaleString('en', {
        dateStyle: 'full',
    });

    tooltip.classList.add('show');  // Show the tooltip with the commit data
}

function updateTooltipPosition(event) {
    const tooltip = document.getElementById('commit-tooltip');
    tooltip.style.left = `${event.clientX}px`;
    tooltip.style.top = `${event.clientY}px`;
}

function brushSelector() {
    const svg = document.querySelector('svg');
    const brush = d3.brush()
        .on('start', () => console.log('Brush start'))
        .on('brush', (event) => console.log('Brushing', event.selection))
        .on('end', (event) => {
            if (!event.selection) return; // Only act if there's a selection
            const [[x0, y0], [x1, y1]] = event.selection;
            console.log('Brushed area:', x0, y0, x1, y1);
            // Handle the selected area, e.g., filter data points
        });

    // Append brush group, ensuring it's placed behind the dots
    d3.select(svg)
        .append('g')
        .attr('class', 'brush')
        .call(d3.brush().on('start brush end', brushed))
        .lower(); // Ensure this is below the dots (use .lower() to send it back)
}
let brushSelection = null;

function brushed(event) {
    brushSelection = event.selection;
    updateSelection();
    updateSelectionCount();
    updateLanguageBreakdown();
}

function isCommitSelected(commit) {
    if (!brushSelection) return false;

    const min = {
        x: brushSelection[0][0],
        y: brushSelection[0][1],
    };

    const max = {
        x: brushSelection[1][0],
        y: brushSelection[1][1],
    };

    const x = xScale(commit.date);
    const y = yScale(commit.hourFrac);

    return x >= min.x && x <= max.x && y >= min.y && y <= max.y;
}

function updateSelection() {
  // Update visual state of dots based on selection
    d3.selectAll('circle').classed('selected', (d) => isCommitSelected(d));
}
function updateSelectionCount() {
    const selectedCommits = brushSelection
        ? commits.filter(isCommitSelected)
        : [];

    const countElement = document.getElementById('selection-count');
    countElement.textContent = `${
        selectedCommits.length || 'No'
    } commits selected`;

    return selectedCommits;
}

function updateLanguageBreakdown() {
    const selectedCommits = brushSelection
        ? commits.filter(isCommitSelected)
        : [];
    const container = document.getElementById('language-breakdown');

    if (selectedCommits.length === 0) {
        container.innerHTML = '';
        return;
    }
    const requiredCommits = selectedCommits.length ? selectedCommits : commits;
    const lines = requiredCommits.flatMap((d) => d.lines);

    // Use d3.rollup to count lines per language
    const breakdown = d3.rollup(
        lines,
        (v) => v.length,
        (d) => d.type
    );

    // Update DOM with breakdown
    container.innerHTML = '';

    for (const [language, count] of breakdown) {
        const proportion = count / lines.length;
        const formatted = d3.format('.1~%')(proportion);

    container.innerHTML += `
            <dt>${language}</dt>
            <dd>${count} lines (${formatted})</dd>
        `;
    }

    return breakdown;
}