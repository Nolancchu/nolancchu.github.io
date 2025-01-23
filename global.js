console.log('IT’S ALIVE!');
const ARE_WE_HOME = document.documentElement.classList.contains('home');
function $$(selector, context = document) {
    return Array.from(context.querySelectorAll(selector));
}

let pages = [

    { url: '/', title: 'Home' },
    { url: '/projects/', title: 'Projects' },
    { url: '/profile/', title: 'Profile' },
    { url: '/contact/', title: 'Contact' },
    { url: 'https://github.com/Nolancchu', title: 'Github'}
];

let nav = document.createElement('nav');

for (let p of pages) {
    let a = document.createElement('a');

    a.href = p.url;

    if (a.host === location.host && a.pathname === location.pathname) {
        a.classList.add('current');
    }
    if (a.host != location.host && a.pathname != location.pathname) {
        a.target = "_blank"
    }

    a.textContent = p.title;
    nav.appendChild(a);
}

document.body.insertAdjacentHTML(
    'afterbegin',
    `
      <label class="color-scheme">
          Theme:
          <select>
             <option>Automatic</option>
             <option>Light</option>
             <option>Dark</option>
          </select>
      </label>
    `
);

let label = document.querySelector('.color-scheme');
label.style.position = 'absolute';
label.style.top = '40px';   
label.style.right = '25px';  

document.body.prepend(nav);

let select = document.querySelector('select');

select.addEventListener('input', function (event) {
    console.log('color scheme changed to', event.target.value);
    localStorage.colorScheme = event.target.value
    document.documentElement.style.setProperty('color-scheme', localStorage.colorScheme);
    
});

if ('colorScheme' in localStorage) {
    const savedScheme = localStorage.colorScheme;
    select.value = savedScheme;
    document.documentElement.style.setProperty('color-scheme', savedScheme);
} else {
    select.value = 'automatic';
    document.documentElement.style.removeProperty('color-scheme'); 
}