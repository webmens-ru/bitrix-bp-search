# Bitrix24 BP Search

Поиск по выпадающим спискам в дизайнере бизнес-процессов Битрикс24 (коробка и облако).
Расширение для Chrome / Firefox и userscript для Tampermonkey.

## Что делает

- Превращает длинные выпадающие списки дизайнера БП в поле с поиском:
  - списки значений в условиях (`id_field_*`);
  - списки самих полей «Поле документа» (`field_condition_field_*`).
- Поиск по вхождению каждого слова: `билайн 9282` → «Билайн АТС 9282284349»,
  слова в любом порядке, поиск по тексту и по техническому значению.
- Оригинальный `<select>` остаётся в форме — сохранение бизнес-процесса работает как раньше.
- Новые условия («Добавить условие») подхватываются автоматически.

## Установка

**Chrome / Edge** — `chrome://extensions` → «Режим разработчика» →
«Загрузить распакованное расширение» → папка `chrome-extension`.

**Firefox** — временно: `about:debugging` → «Загрузить временное дополнение» →
`firefox-extension/manifest.json`. Постоянно: подписать архив
`bitrix-bp-search-firefox.zip` на addons.mozilla.org (self-distribution).

**Любой браузер** — userscript: Tampermonkey → перетащить `bitrix-bp-search.user.js`
в окно браузера → «Установить».

## Настройки

В расширении: страница настроек (режим поиска — по вхождению слов или строгая подстрока).
В userscript: константы в начале файла.

## Состав

| Файл | Назначение |
|---|---|
| `chrome-extension/` | Расширение Chrome/Edge (manifest v3) |
| `firefox-extension/` | Расширение Firefox (manifest v3 + gecko id) |
| `bitrix-bp-search.user.js` | Userscript для Tampermonkey |
| `test-page.html` | Демо-страница без доступа к Битрикс24 |
| `test.js` | Автотесты логики (`npm install jsdom && node test.js`) |

## Лицензия

MIT
