const items = [...document.querySelectorAll('.atlas-item:not(.code-veil-item)')]
  .sort((a, b) => Number(a.style.getPropertyValue('--item-order')) - Number(b.style.getPropertyValue('--item-order')));
const search = document.querySelector('#atlas-search');
const results = document.querySelector('#search-results');
const codeControl = document.querySelector('#code-control');
const soundControl = document.querySelector('#sound-control');
const codeDrawer = document.querySelector('#code-drawer');
const codeSelect = document.querySelector('#code-select');
const selectedCode = document.querySelector('#selected-code');

function closeResults() {
  results.classList.remove('open');
  results.replaceChildren();
  search.setAttribute('aria-expanded', 'false');
}

function selectItem(item) {
  closeResults();
  search.value = '';
  item.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function showResults() {
  const query = search.value.trim().toLocaleLowerCase();
  results.replaceChildren();
  if (!query) return closeResults();
  const matches = items.filter(item => item.dataset.name.toLocaleLowerCase().includes(query) || item.dataset.group.toLocaleLowerCase().includes(query)).slice(0, 12);
  if (matches.length) {
    for (const item of matches) {
      const button = document.createElement('button');
      button.type = 'button';
      button.setAttribute('role', 'option');
      const name = document.createElement('span');
      name.textContent = item.dataset.name;
      const group = document.createElement('small');
      group.textContent = item.dataset.group;
      button.append(name, group);
      button.addEventListener('click', () => selectItem(item));
      results.append(button);
    }
  } else {
    const empty = document.createElement('p');
    empty.textContent = 'No matching control';
    results.append(empty);
  }
  results.classList.add('open');
  search.setAttribute('aria-expanded', 'true');
}

search.addEventListener('input', showResults);
search.addEventListener('keydown', event => {
  if (event.key === 'Escape') closeResults();
  if (event.key === 'Enter') {
    const first = results.querySelector('button');
    if (first) { event.preventDefault(); first.click(); }
  }
});
document.addEventListener('click', event => {
  if (!event.target.closest('.search-wrap')) closeResults();
});
document.addEventListener('keydown', event => {
  if (event.key === '/' && !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
    event.preventDefault(); search.focus();
  }
});

function setTheme(theme) {
  document.documentElement.dataset.theme = theme;
  document.querySelector('meta[name="theme-color"]').content = theme === 'dark' ? '#09090a' : '#ffffff';
  document.querySelectorAll('[data-theme-option]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.themeOption === theme)));
  for (const group of document.querySelectorAll('.source .rthemes')) {
    if (group.closest('[data-name="Obsidian Dial"], [data-name="Ivory Dial"]')) continue;
    const desired = group.querySelector(`[data-finish="${theme === 'dark' ? 'obsidian' : 'ivory'}"]`) || group.querySelector(`[data-theme="${theme === 'dark' ? 'black' : 'light'}"]`) || group.querySelector(`[data-theme="${theme === 'dark' ? 'black' : 'white'}"]`);
    if (desired && desired.getAttribute('aria-pressed') !== 'true') desired.click();
  }
  try { localStorage.setItem('enochian-theme', theme); } catch (_) { /* storage may be disabled */ }
}

document.querySelectorAll('[data-theme-option]').forEach(button => button.addEventListener('click', () => setTheme(button.dataset.themeOption)));
let storedTheme = null;
try { storedTheme = localStorage.getItem('enochian-theme'); } catch (_) { /* storage may be disabled */ }
setTheme(storedTheme === 'dark' ? 'dark' : 'light');

soundControl.addEventListener('click', () => {
  const enabled = soundControl.getAttribute('aria-pressed') !== 'true';
  soundControl.setAttribute('aria-pressed', String(enabled));
  soundControl.textContent = enabled ? 'Sound on' : 'Sound off';
  globalThis.__enochianSoundEnabled = enabled;
  globalThis.dispatchEvent(new Event('enochian-sound-change'));
  for (const button of document.querySelectorAll('.source #soundBtn')) {
    if ((button.getAttribute('aria-pressed') === 'true') !== enabled) button.click();
  }
});

for (const [index, item] of items.entries()) {
  const option = document.createElement('option');
  option.value = String(index);
  option.textContent = `${item.dataset.index}  ${item.dataset.name}`;
  codeSelect.append(option);
}

function showSelectedCode() {
  const item = items[Number(codeSelect.value)];
  selectedCode.textContent = item?.querySelector('.code-snippet pre code')?.textContent || 'Code sample unavailable for this control.';
}

codeSelect.addEventListener('change', showSelectedCode);
showSelectedCode();

codeControl.addEventListener('click', () => {
  const expanded = codeControl.getAttribute('aria-expanded') !== 'true';
  codeControl.setAttribute('aria-expanded', String(expanded));
  codeDrawer.hidden = !expanded;
  if (expanded) codeSelect.focus();
});
document.querySelector('#close-code').addEventListener('click', () => {
  codeDrawer.hidden = true;
  codeControl.setAttribute('aria-expanded', 'false');
  codeControl.focus();
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && !codeDrawer.hidden) document.querySelector('#close-code').click();
});
document.querySelector('#copy-selected-code').addEventListener('click', async event => {
  await navigator.clipboard.writeText(selectedCode.textContent);
  event.currentTarget.textContent = 'Copied';
  setTimeout(() => { event.currentTarget.textContent = 'Copy code'; }, 1500);
});

if (items.length !== 55) console.error(`Expected 55 Enochian controls; found ${items.length}`);
