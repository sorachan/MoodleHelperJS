const moodleHelper = document.getElementById('moodle-helper');

/* language support: feel free to contribute translations! */
const i18n = {
    en: {
        languageName: 'English',
        csv: {
            quoteInUnquotedField: 'invalid CSV: " in unquoted field',
            quoteInQuotedField: 'invalid CSV: " in quoted field'
        },
        label: {
            firstName: 'First name',
            lastName: 'Last name',
            studentID: 'Student ID',
            grade: 'Grade',
        },
        gradeInput: {
            inputGrade: 'input grade',
            query: 'Query: ',
            grade: 'Grade: ',
            result: 'Result: ',
            upgrade: (oldGrade,newGrade) => `Upgrade grade from ${oldGrade} to ${newGrade}?`,
            delete: 'Delete grade?',
            NaN: 'invalid grade: not a number',
            negative: 'invalid grade: must not be negative'
        },
        ui: {
            upload: 'upload',
            ok: 'OK',
            save: 'save to file',
            empty: 'the uploaded file is empty'
        }
    },
    de: {
        languageName: 'Deutsch',
        csv: {
            quoteInUnquotedField: 'ungültiges CSV: " in Feld ohne Anführungszeichen',
            quoteInQuotedField: 'ungültiges CSV: " in Feld mit Anführungszeichen'
        },
        label: {
            firstName: 'Vorname',
            lastName: 'Nachname',
            studentID: 'Matrikelnummer',
            grade: 'Note',
        },
        gradeInput: {
            inputGrade: 'Note eingeben',
            query: 'Suchanfrage: ',
            grade: 'Note: ',
            result: 'Ergebnis: ',
            upgrade: (oldGrade,newGrade) => `Note von ${oldGrade} auf ${newGrade} ändern?`,
            delete: 'Note löschen?',
            NaN: 'ungültige Note: keine Zahl',
            negative: 'ungültige Note: darf nicht negativ sein'
        },
        ui: {
            upload: 'hochladen',
            ok: 'OK',
            save: 'in Datei speichern',
            empty: 'die hochgeladene Datei ist leer'
        }
    },
};

let inFile;
let data;
let current;
let gradeTable;
let tableRows;
let columns = {};
let filename;
let dirty;

/* use English as fallback language */
let lang = 'en';

/* UI definition: file upload / language selection */
const filePicker = document.createElement('input');
filePicker.setAttribute('type', 'file');
const uploadBtn = document.createElement('button');
uploadBtn.setAttribute('type', 'submit');
const uploader = document.createElement('form');
uploader.classList.add('uploader');
uploader.appendChild(filePicker);
uploader.appendChild(uploadBtn);
uploader.addEventListener('submit', event => {
    event.preventDefault();
    if (!inFile) return;
    filename = filePicker.value.split(/(\\|\/)/g).pop();
    let reader = new FileReader();
    reader.addEventListener('load', event => {
        try {
            data = parseCSV(event.target.result);
            if (!data[0]) {
                throw new Error(i18n[lang].ui.empty);
                return;
            }
            selectKeys();
        } catch (err) {
            alert(err);
        }
    });
    reader.readAsText(inFile);
});
const langSelector = document.createElement('select');
for (key in i18n) {
    let option = document.createElement('option');
    option.innerText = i18n[key].languageName;
    option.setAttribute('value', key);
    langSelector.appendChild(option);
}
uploader.appendChild(langSelector);
langSelector.value = lang;
langSelector.addEventListener('change', () => {
    setLanguage([langSelector.value]);
});

/* UI definition: grade input mask */
const inputMask = document.createElement('div');
inputMask.classList.add('input-mask');
const queryBox = document.createElement('form');
queryBox.classList.add('query');
const queryBoxLabel = document.createElement('label');
queryBoxLabel.setAttribute('for', 'query-input');
const queryBoxInput = document.createElement('input');
queryBoxInput.id = 'query-input';
const queryResultLabel = document.createElement('span');
const queryResult = document.createElement('span');
queryBox.appendChild(queryBoxLabel);
queryBox.appendChild(queryBoxInput);
const queryResultSpan = document.createElement('span');
queryResultSpan.appendChild(queryResultLabel);
queryResultSpan.appendChild(queryResult);
queryBox.appendChild(queryResultSpan);
const gradeBox = document.createElement('form');
const gradeBoxLabel = document.createElement('label');
gradeBoxLabel.setAttribute('for', 'grade-input');
const gradeBoxInput = document.createElement('input');
gradeBoxInput.id = 'grade-input';
const button = document.createElement('button');
button.setAttribute('type', 'submit');
gradeBox.appendChild(gradeBoxLabel);
gradeBox.appendChild(gradeBoxInput);
gradeBox.appendChild(button);
inputMask.appendChild(queryBox);
inputMask.appendChild(gradeBox);
queryBox.addEventListener('input', query);
queryBox.addEventListener('submit', event => {
    event.preventDefault();
    gradeBoxInput.focus();
});
gradeBox.addEventListener('submit', event => {
    event.preventDefault();
    let grade = gradeBoxInput.value.replace(',', '.');
    try {
        if (grade == '-') {
            if (!confirm(i18n[lang].gradeInput.delete)) return;
        } else {
            grade = Number(grade);
            if (Number.isNaN(grade)) throw new Error(i18n[lang].gradeInput.NaN);
            grade = grade.toFixed(2);
            if (grade < 0) throw new Error(i18n[lang].gradeInput.negative);
            if (data[current][columns.grade.index] != '-') {
                if (!confirm(i18n[lang].gradeInput.upgrade(data[current][columns.grade.index],grade))) return;
            }
        }
        data[current][columns.grade.index] = grade;
        tableRows[current].tr.classList.add('modified');
        tableRows[current].td[columns.grade.index].innerText = grade;
        dirty = true;
        queryBoxInput.value = '';
        gradeBoxInput.value = '';
        queryBoxInput.focus();
    } catch (err) {
        alert(err);
    }
});

/* UI definition: save button */
const saveForm = document.createElement('form');
saveForm.classList.add('save');
const saveBtn = document.createElement('button');
saveBtn.setAttribute('type', 'submit');
saveForm.appendChild(saveBtn);
saveForm.addEventListener('submit', event => {
    event.preventDefault();
    let blob = new Blob([writeCSV(data)], { type: 'text/csv' });
    let url = URL.createObjectURL(blob);
    let a = document.createElement('a');
    a.href = url;
    if (filename) a.download = filename;
    a.click();
    dirty = false;
    tableRows.forEach(row => { if (row) row.tr.classList.remove('modified') });
});

/* initalize application */
moodleHelper.innerHTML = '';
filePicker.value = '';
moodleHelper.appendChild(uploader);

/* i18n helper functions */
function applyLanguage() {
    uploadBtn.innerText = i18n[lang].ui.upload;
    queryBoxLabel.innerText = i18n[lang].gradeInput.query;
    queryResultLabel.innerText = i18n[lang].gradeInput.result;
    gradeBoxLabel.innerText = i18n[lang].gradeInput.grade;
    button.innerText = i18n[lang].gradeInput.inputGrade;
    saveBtn.innerText = i18n[lang].ui.save;
}

function setLanguage(arr) {
    for (str of arr) {
        for (key in i18n) {
            if (str.startsWith(key)) {
                lang = key;
                langSelector.value = key;
                applyLanguage();
                return;
            }
        }
    }
}

/* attempt to set language according to browser preferences */
setLanguage(navigator.languages || [navigator.language]);

filePicker.addEventListener('change', event => {
    let file = event.target.files[0];
    if (!file) return;
    inFile = file;
});

/* generate table from grading data */
function buildTable() {
    tableRows = [null];
    let table = document.createElement('table');
    let thead = document.createElement('thead');
    let tr = document.createElement('tr');
    for (key in columns) {
        let th = document.createElement('th');
        let span = document.createElement('span');
        span.innerText = columns[key].label;
        th.appendChild(span);
        tr.appendChild(th);
    }
    thead.appendChild(tr);
    table.appendChild(thead);
    let tbody = document.createElement('tbody');
    for (let i = 1; i < data.length; i++) {
        let tr = document.createElement('tr');
        let tdIdx = {};
        tr.dataset.row = i;
        for (key in columns) {
            let td = document.createElement('td');
            td.innerText = data[i][columns[key].index];
            tdIdx[columns[key].index] = td;
            tr.appendChild(td);
        }
        tbody.appendChild(tr);
        tableRows.push({ tr, td: tdIdx });
    }
    table.appendChild(tbody);
    tbody.addEventListener('click', event => {
        let row;
        switch (event.target.tagName) {
            case 'TD':
                row = event.target.parentElement;
                break;
            case 'TR':
                row = event.target;
                break;
            default:
                return;
        }
        if (tableRows[current]) tableRows[current].tr.classList.remove('current');
        current = row.dataset.row;
        let stud = data[current];
        tableRows[current].tr.classList.add('current');
        queryResult.innerText = `${stud[columns.lastName.index]}, ${stud[columns.firstName.index]} (${stud[columns.studentID.index]})`;
        gradeBoxInput.focus();
    });
    return table;
}

/* select first entry matching all query terms */
function query() {
    let terms = queryBoxInput.value.toLowerCase().split(' ');
    for (let i = 1; i < data.length; i++) {
        let stud = data[i];
        if (terms.every(term => !['firstName', 'lastName', 'studentID'].every(key => !stud[columns[key].index].toLowerCase().includes(term)))) {
            if (tableRows[current]) tableRows[current].tr.classList.remove('current');
            current = i;
            tableRows[current].tr.classList.add('current');
            tableRows[current].tr.scrollIntoView({ block: 'center' });
            queryResult.innerText = `${stud[columns.lastName.index]}, ${stud[columns.firstName.index]} (${stud[columns.studentID.index]})`;
            break;
        }
    }
}

/* present screen for mapping CSV columns to first name, last name etc. */
function selectKeys() {
    moodleHelper.innerHTML = '';
    dirty = false;
    let form = document.createElement('form');
    form.classList.add('key-picker');
    let keyPickers = ['firstName', 'lastName', 'studentID', 'grade'].reduce((obj, key) => {
        obj[key] = { label: i18n[lang].label[key], selector: document.createElement('select') };
        obj[key].selector.id = key;
        return obj;
    }, {});
    for (key in keyPickers) {
        let label = document.createElement('label');
        label.setAttribute('for', key);
        label.innerText = keyPickers[key].label + ': ';
        form.appendChild(label);
        for (index in data[0]) {
            let option = document.createElement('option');
            option.innerText = data[0][index];
            option.setAttribute('value', index);
            keyPickers[key].selector.appendChild(option);
        }
        form.appendChild(keyPickers[key].selector);
    }
    Object.keys(keyPickers).forEach((key, index) => keyPickers[key].selector.value = index);
    let button = document.createElement('button');
    button.setAttribute('type', 'submit');
    button.innerText = i18n[lang].ui.ok;
    form.appendChild(button);
    form.addEventListener('submit', event => {
        event.preventDefault();
        Object.keys(keyPickers).forEach(key => columns[key] = { label: keyPickers[key].label, index: keyPickers[key].selector.value });
        moodleHelper.removeChild(form);
        moodleHelper.appendChild(inputMask);
        gradeTable = buildTable();
        const tableScroll = document.createElement('div');
        tableScroll.classList.add('table-scroll');
        const tableWrapper = document.createElement('div');
        tableWrapper.classList.add('table-wrapper');
        tableScroll.appendChild(gradeTable);
        tableWrapper.appendChild(tableScroll);
        moodleHelper.appendChild(tableWrapper);
        moodleHelper.appendChild(saveForm);
        query();
    });
    moodleHelper.appendChild(form);
}

/* ask to save unsaved changes */
window.addEventListener('beforeunload', event => {
    if (dirty) {
        event.preventDefault();
        event.returnValue = '';
    }
})

/* CSV helper functions */
function parseCSV(input) {
    let data = [];
    let it = input[Symbol.iterator]();
    let next = it.next();
    let quoted = false;
    let escape = false;
    let token = '';
    let dataRow = [];
    while (!next.done) {
        char = next.value;
        if (!quoted || escape) {
            switch (char) {
                case '"':
                    if (!quoted) {
                        if (!token) quoted = true;
                        else throw Error(i18n[lang].csv.quoteInUnquotedField);
                    } else {
                        token += char;
                        escape = false;
                    }
                    break;
                case '\r':
                    break;
                case ',':
                case '\n':
                    dataRow.push(token);
                    token = '';
                    quoted = false;
                    escape = false;
                    break;
                default:
                    if (!quoted) token += char;
                    else throw Error(i18n[lang].csv.quoteInQuotedField);
            }
            if (char == '\n' && '' + dataRow) {
                data.push(dataRow);
                dataRow = [];
            }
        } else {
            if (char == '"') escape = true;
            else token += char;
        }
        next = it.next();
    }
    if (token) dataRow.push(token);
    if ('' + dataRow) data.push(dataRow);
    return data;
}

function writeCSV(data) {
    let csv = '';
    for (row of data) {
        for (let i = 0; i < row.length; i++) {
            let cell = '' + row[i];
            if (['"',' ','\r','\n'].every(char => !cell.includes(char))) {
                csv += cell;
            } else {
                csv += '"' + cell.replace(/"/, '""') + '"';
            }
            if (i < row.length - 1) csv += ',';
            else csv += '\n';
        }
    }
    return csv;
}