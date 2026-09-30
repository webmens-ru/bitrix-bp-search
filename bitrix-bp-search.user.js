// ==UserScript==
// @name         Bitrix24 BP — поиск в списках значений
// @namespace    local.bitrix24.bp.search
// @version      1.4.0
// @description  Добавляет строку поиска в выпадающие списки значений полей в дизайнере бизнес-процессов Битрикс24
// @author       Kimi Work
// @match        *://*/bitrix/admin/bizproc_activity_settings.php*
// @match        *://*/bitrix/admin/bizproc_workflow_edit.php*
// @match        *://*/crm/configs/bp/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function () {
    'use strict';

    /* ============================================================
       НАСТРОЙКИ
       ============================================================ */
    const MIN_OPTIONS = 8; // поиск включается, если в списке >= N вариантов

    /* Селекты дизайнера БП:
       - значения условий: id вида id_field_condition_value_0
       - списки самих полей: name вида field_condition_field_0 (id отсутствует) */
    const isTargetSelect = (sel) =>
        (/^id_field_/.test(sel.id || '') ||
         /^field_(condition_)?field_\d+$/.test(sel.name || '')) &&
        sel.options.length >= MIN_OPTIONS &&
        !sel.disabled;

    /* ============================================================
       СТИЛИ
       ============================================================ */
    const css = `
.bps-wrap { position: relative; box-sizing: border-box; width: 100%; max-width: 550px; }
.bps-wrap * { box-sizing: border-box; }
.bps-input { width: 100%; padding: 3px 24px 3px 6px; border: 1px solid #87939f;
             font: 13px "Segoe UI", Arial, sans-serif; color: #222; background: #fff; }
.bps-input:focus { outline: none; border-color: #2fc7f7; }
.bps-arrow { position: absolute; right: 1px; top: 1px; bottom: 1px; width: 20px;
             background: #f5f7f8; border-left: 1px solid #dfe5ea; cursor: pointer;
             text-align: center; line-height: 22px; color: #6a7a89; font-size: 10px;
             user-select: none; }
.bps-arrow:hover { background: #e8eef2; }
.bps-list { position: absolute; z-index: 99999; left: 0; right: 0; top: 100%;
            max-height: 260px; overflow-y: auto; background: #fff;
            border: 1px solid #87939f; border-top: none;
            box-shadow: 0 6px 14px rgba(0,0,0,.25); display: none; }
.bps-item { padding: 4px 8px; cursor: pointer; font: 13px "Segoe UI", Arial, sans-serif;
            white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.bps-item:hover, .bps-item-active { background: #2fc7f7; color: #fff; }
.bps-empty { padding: 6px 8px; color: #888; font-style: italic; font: 13px "Segoe UI", Arial, sans-serif; }
`;

    function injectStyles() {
        if (document.getElementById('bps-styles')) return;
        const style = document.createElement('style');
        style.id = 'bps-styles';
        style.textContent = css;
        document.head.appendChild(style);
    }

    /* ============================================================
       ПРЕВРАЩЕНИЕ СЕЛЕКТА В ПОЛЕ С ПОИСКОМ
       Оригинальный <select> остаётся в DOM и скрыт — Битрикс
       по-прежнему читает его .value при сохранении формы.
       ============================================================ */
    function enhance(select) {
        if (select.dataset.bpsWrapped) return;
        if (!isTargetSelect(select)) return;
        select.dataset.bpsWrapped = '1';

        const wrap = document.createElement('div');
        wrap.className = 'bps-wrap';
        select.parentNode.insertBefore(wrap, select);
        wrap.appendChild(select);
        select.style.display = 'none';

        wrap.insertAdjacentHTML('beforeend',
            '<input type="text" class="bps-input" placeholder="Поиск… (или выберите из списка)" autocomplete="off">' +
            '<div class="bps-arrow" title="Показать весь список">&#9660;</div>' +
            '<div class="bps-list"></div>'
        );
        const input = wrap.querySelector('.bps-input');
        const list = wrap.querySelector('.bps-list');
        const arrow = wrap.querySelector('.bps-arrow');

        const getOptions = () =>
            Array.from(select.options).map(o => ({ value: o.value, text: o.text }));

        const selectedText = () => {
            const o = select.options[select.selectedIndex];
            return o ? o.text : '';
        };
        const syncInput = () => {
            // Пустое значение («[не установлено]») не подставляем текстом —
            // поле остаётся пустым, чтобы можно было сразу печатать поиск
            if (select.value === '') {
                input.value = '';
                input.placeholder = '[не установлено] · начните ввод';
            } else {
                input.value = selectedText();
                input.placeholder = 'Поиск… (или выберите из списка)';
            }
        };

        function render(filter) {
            // Поиск по вхождению каждого слова: «билайн 9282» → «Билайн АТС 9282284349».
            // Слова ищутся и в тексте, и в значении option; порядок слов не важен.
            const words = (filter || '').toLowerCase().split(/\s+/).filter(Boolean);
            const matches = getOptions().filter(o => {
                if (!words.length) return true;
                const hay = (o.text + '\n' + o.value).toLowerCase();
                return words.every(w => hay.includes(w));
            });
            list.innerHTML = '';
            if (!matches.length) {
                list.innerHTML = '<div class="bps-empty">Нет совпадений</div>';
                return;
            }
            matches.forEach(o => {
                const div = document.createElement('div');
                div.className = 'bps-item';
                div.textContent = o.text || '[не установлено]';
                div.dataset.value = o.value;
                div.addEventListener('mousedown', e => { e.preventDefault(); pick(o); });
                list.appendChild(div);
            });
        }

        function open() {
            // Если поле показывает выбранное значение — при открытии показываем весь список
            render(input.value === selectedText() ? '' : input.value);
            list.style.display = 'block';
        }
        function close(revert) {
            list.style.display = 'none';
            if (revert) syncInput();
        }
        function pick(o) {
            select.value = o.value; // оригинальный select обновляется — форма сохранится корректно
            select.dispatchEvent(new Event('change', { bubbles: true }));
            input.value = o.value === '' ? '' : o.text; // «[не установлено]» не вставляем текстом
            close(false);
        }

        function moveActive(step) {
            const items = Array.from(list.querySelectorAll('.bps-item'));
            if (!items.length) return;
            let idx = items.findIndex(i => i.classList.contains('bps-item-active'));
            items.forEach(i => i.classList.remove('bps-item-active'));
            idx = (idx + step + items.length) % items.length;
            items[idx].classList.add('bps-item-active');
            items[idx].scrollIntoView({ block: 'nearest' });
        }

        input.addEventListener('focus', open);
        input.addEventListener('input', () => { render(input.value); list.style.display = 'block'; });
        input.addEventListener('keydown', e => {
            if (e.key === 'ArrowDown') { e.preventDefault(); moveActive(1); }
            else if (e.key === 'ArrowUp') { e.preventDefault(); moveActive(-1); }
            else if (e.key === 'Enter') {
                e.preventDefault();
                const active = list.querySelector('.bps-item-active');
                const target = active || list.querySelector('.bps-item');
                if (target) pick({ value: target.dataset.value, text: target.textContent });
            } else if (e.key === 'Escape') {
                close(true);
                input.blur();
            }
        });
        input.addEventListener('blur', () => setTimeout(() => close(true), 150));
        arrow.addEventListener('mousedown', e => {
            e.preventDefault();
            if (list.style.display === 'block') { close(true); }
            else { input.focus(); }
        });

        // Если Битрикс меняет значение или набор option извне — подтягиваем отображение
        select.addEventListener('change', syncInput);
        new MutationObserver(syncInput).observe(select, { childList: true });

        syncInput();
    }

    /* ============================================================
       ПОИСК СЕЛЕКТОВ НА СТРАНИЦЕ (дизайнер рисует их динамически)
       ============================================================ */
    let scanTimer = null;
    function scan() {
        clearTimeout(scanTimer);
        scanTimer = setTimeout(() => {
            document.querySelectorAll('select[id^="id_field_"], select[name^="field_condition_field_"]').forEach(enhance);
        }, 50);
    }

    injectStyles();
    scan();
    new MutationObserver(scan).observe(document.body, { childList: true, subtree: true });
})();
