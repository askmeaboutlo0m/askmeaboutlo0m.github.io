(function () {
  'use strict';

  const PARAGRAPH_WEIGHT = 50.0;
  const WORD_WEIGHT      = 1.0;
  const LAST_MULTIPLIER  = 0.0;
  const STONE_COLD       = 100.0;

  function splitIntoLines(input) {
    return input.split(/\r?\n/).filter(line => /\S/.test(line));
  }

  function normalizeWord(fragment) {
    return fragment.toLowerCase()
        .replace(/\u0027[ds]/g, '') // remove 's and 'd
        .replace(/\P{L}/gu,     ''); // remove all non-letters
  }

  function* splitIntoFragments(line, stopwords) {
    for (let match of line.matchAll(/(\s+|-+)|([^\s-]+)/g)) {
      if (match[1]) {
        yield ['whitespace', match[1], ''];
      }
      else {
        let fragment = match[2];
        let word     = normalizeWord(fragment);
        yield [stopwords.has(word) ? 'stopword' : 'word', fragment, word];
      }
    }
  }

  function calculateHeat(word, current, heats) {
    if (/\S/.test(word)) {
      if (heats.has(word)) {
        let last  = heats.get(word);
        let delta = current - last;
        heats.set(word, delta * LAST_MULTIPLIER + current);
        return delta;
      }
      else {
        heats.set(word, current);
        return STONE_COLD;
      }
    }
    return null;
  }

  function toHeatIntensity(heat) {
    if (heat === undefined || heat === null || heat > STONE_COLD) {
      return 0.0;
    }
    else if (heat <= 0.0) {
      return 1.0;
    }
    else {
      return 1.0 - heat / STONE_COLD;
    }
  }

  function appendTextNode(parent, text) {
    let textNode = document.createTextNode(text);
    parent.appendChild(textNode);
    return textNode;
  }

  function appendNewElement(parent, tag, text) {
    let element = document.createElement(tag);
    parent.appendChild(element);

    if (text) {
      appendTextNode(element, text);
    }

    return element;
  }

  function unmarkWords() {
    for (let elem of document.querySelectorAll('.marked')) {
      elem.classList.remove('marked');
    }
  }

  function markWords(e) {
    let span = e.target;
    let word = span.dataset.word;

    window.requestAnimationFrame(() => {
      unmarkWords();
      window.requestAnimationFrame(() => {
        for (let elem of document.querySelectorAll(`[data-word="${word}"]`)) {
          elem.classList.add('marked');
        }
      });
    });
  }

  function setUpWordSpan(span, word, heat) {
    span.setAttribute('data-word', word);
    span.classList.add('word');

    if (heat === undefined) {
      span.setAttribute('style', 'color:rgb(0,0,0,0.5);');
      span.setAttribute('title', 'Stopword, no heat');
    }
    else {
      let alpha = toHeatIntensity(heat);
      span.setAttribute('style', `background-color:rgba(255,100,0,${alpha});`);
      span.setAttribute('title', `Heat: ${Math.round(alpha * 100)}%`);
    }

    span.addEventListener('click', markWords);
  }

  function generateHeatMap(input, stopwords) {
    let output  = document.createElement('div');
    let heats   = new Map();
    let current = 1.0;

    for (let line of splitIntoLines(input)) {
      let p = appendNewElement(output, 'p');

      for (let [type, fragment, word] of splitIntoFragments(line, stopwords)) {
        if (type === 'word') {
          let span = appendNewElement(p, 'span', fragment);
          let heat = calculateHeat(word, current, heats);
          setUpWordSpan(span, word, heat);
          current += WORD_WEIGHT;
        }
        else if (type === 'stopword') {
          let span = appendNewElement(p, 'span', fragment);
          setUpWordSpan(span, word);
        }
        else {
          appendTextNode(p, fragment);
        }
      }

      current += PARAGRAPH_WEIGHT;
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
    let inputArea     = document.querySelector('#input-area');
    let stopwordsArea = document.querySelector('#stopwords-area');
    let stopwords     = new Set(stopwordsArea.value.trim().split(/\s+/g));
    setOutputSection(generateHeatMap(inputArea.value, stopwords));
  }

  let lastTimeoutId;
  function onChange() {
    if (lastTimeoutId !== undefined) {
      window.clearTimeout(lastTimeoutId);
    }
    lastTimeoutId = window.setTimeout(process, 300);
  }

  function setUpChangeListener() {
    for (let area of document.querySelectorAll('#input-area, #stopwords-area')) {
      area.addEventListener('change', onChange);
      area.addEventListener('keyup',  onChange);
    }
  }

  setUpChangeListener();
  process();
}());
