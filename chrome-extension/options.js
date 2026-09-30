const DEFAULTS = { multiWord: true };
const box = document.getElementById('multiWord');
const status = document.getElementById('status');

chrome.storage.local.get(DEFAULTS, s => { box.checked = s.multiWord; });

box.addEventListener('change', () => {
    chrome.storage.local.set({ multiWord: box.checked }, () => {
        status.textContent = 'Сохранено. Применяется сразу — открытые страницы дизайнера БП не нужно обновлять.';
        setTimeout(() => { status.textContent = ''; }, 4000);
    });
});
