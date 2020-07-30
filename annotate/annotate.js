(function () {
  'use strict';

  const ANNOTATION_TYPES = new Map([
    ['c', 'content' ],
    ['f', 'form'    ],
    ['g', 'grammar' ],
    ['s', 'spelling'],
    ['t', 'tense'   ],
  ]);

  function insertAnnotation(inputArea, key) {
    let start = inputArea.selectionStart;
    let end   = inputArea.selectionEnd;
    if (start !== undefined && end !== undefined) {
      let input  = inputArea.value;
      let before = input.substring(0, start);
      let match  = input.substring(start, end);
      let after  = input.substring(end);
      let value  = `${before}[${match}](${key}|)${after}`;
      let pos    = value.length - after.length - 1;
      inputArea.value          = value;
      inputArea.selectionStart = pos;
      inputArea.selectionEnd   = pos;
      inputArea.dispatchEvent(new Event('change'));
    }
  }

  function onKeyDown(e) {
    let key = String.fromCharCode(e.keyCode).toLowerCase();
    if (e.altKey && e.shiftKey && ANNOTATION_TYPES.has(key)) {
      insertAnnotation(this, key);
      return false;
    }
    else {
      return true;
    }
  }

  function setUpKeyboardShortcuts() {
    let inputArea = document.querySelector('#input-area');
    inputArea.addEventListener('keydown', onKeyDown);
  }

  function haveText(s) {
    return s !== undefined && s !== null && s !== '';
  }

  function toKnownType(type) {
    if (haveText(type)) {
      let annotationType = ANNOTATION_TYPES.get(type.substr(0, 1));
      if (annotationType) {
        return annotationType;
      }
    }
    return null;
  }

  function* findAnnotations(input) {
    // Matches something like [text](annotation) or [text](type|annotation).
    let rx        = /(.*?)\[([^\]]*)\]\((?:(\w+)\|)?([^)]*)\)/gs;
    let lastIndex = 0;
    let match;

    while ((match = rx.exec(input))) {
      let [before, marked, type, annotation] = match.slice(1);
      if (haveText(before)) {
        yield ['text', before];
      }
      yield ['annotation', [marked, toKnownType(type), annotation]];
      lastIndex = rx.lastIndex;
    }

    if (lastIndex < input.length) {
      yield ['text', input.substr(lastIndex)];
    }
  }

  function makeAnnotation(marked, type, annotation) {
    let a = document.createElement('a');
    a.classList.add('tooltip');
    a.appendChild(document.createTextNode(marked));

    let annotationSpan = document.createElement('span');
    annotationSpan.appendChild(document.createTextNode(annotation));

    if (type) {
      a.classList.add(type);
      let typeSpan = document.createElement('span');
      typeSpan.classList.add('annotation-type');
      typeSpan.appendChild(document.createTextNode(`(${type})`));
      annotationSpan.appendChild(typeSpan);
    }

    a.appendChild(annotationSpan);
    return a;
  }

  function annotate(input) {
      let output = document.createElement('div');

      for (let [type, value] of findAnnotations(input)) {
        let element = type === 'annotation'
                    ? makeAnnotation(...value)
                    : document.createTextNode(value);
        output.appendChild(element);
      }

      output.classList.add('output-div');
      return output;
  }

  function setOutputSection(output) {
    let outputSection = document.querySelector('#output');
    for (let div of outputSection.querySelectorAll('.output-div')) {
      outputSection.removeChild(div);
    }
    outputSection.appendChild(output);
  }

  function process() {
    let inputArea = document.querySelector('#input-area');
    setOutputSection(annotate(inputArea.value));
  }

  let lastTimeoutId;
  function onChange() {
    if (lastTimeoutId !== undefined) {
      window.clearTimeout(lastTimeoutId);
    }
    lastTimeoutId = window.setTimeout(process, 300);
  }

  function setUpChangeListener() {
    let inputArea = document.querySelector('#input-area');
    inputArea.addEventListener('change', onChange);
    inputArea.addEventListener('keyup',  onChange);
  }

  setUpKeyboardShortcuts();
  setUpChangeListener();
  process();
}());
