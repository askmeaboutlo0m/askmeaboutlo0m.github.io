(function () {
  'use strict';

  function makeStemmer(stem) {
    let mem = new Map();
    return function (fragment) {
      let memoized = mem.get(fragment);
      if (memoized) {
        return memoized;
      }
      else {
        let result = stem(fragment);
        mem.set(fragment, result);
        return result;
      }
    };
  }

  function noneStemmer(fragment) {
    return fragment;
  }

  let stemmers = new Map([
    ['porter',    makeStemmer(window.stemmer)],
    ['lancaster', makeStemmer(window.lancasterStemmer)],
  ]);

  function splitIntoLines(input) {
    return input.split(/\r?\n/).filter(line => /\S/.test(line));
  }

  function normalizeWord(fragment) {
    return fragment.toLowerCase().replace(/\P{L}/gu, '');
  }

  function extractStopwordsSet(value, stemmer) {
    return new Set(value.trim().split(/\s+/g).map(normalizeWord));
  }

  function parseNumberFromField(selector, defaultValue) {
    let field = document.querySelector(selector);
    let value = Number.parseFloat(field.value);
    return Number.isNaN(value) ? defaultValue : value;
  }

  function* splitIntoFragments(line, stopwords, stemmer) {
    for (let [, whitespace, fragment] of line.matchAll(/(\s+|-+)|([^\s-]+)/g)) {
      if (whitespace) {
        yield ['whitespace', whitespace, ''];
      }
      else {
        let word = normalizeWord(fragment);
        let type = stopwords.has(word) ? 'stopword' : 'word';
        yield [type, fragment, stemmer(word)];
      }
    }
  }

  function toHeatIntensity(heat, stoneCold) {
    if (heat === undefined || heat === null || heat > stoneCold) {
      return 0.0;
    }
    else if (heat <= 0.0) {
      return 1.0;
    }
    else {
      return 1.0 - heat / stoneCold;
    }
  }

  function calculateHeat(word, current, heats, stoneCold) {
    if (/\S/.test(word)) {
      if (heats.has(word)) {
        let last  = heats.get(word);
        let delta = current - last;
        heats.set(word, current);
        return toHeatIntensity(delta, stoneCold);
      }
      else {
        heats.set(word, current);
      }
    }
    return toHeatIntensity(null, stoneCold);
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
      span.setAttribute('style', `background-color:rgba(255,100,0,${heat});`);
      span.setAttribute('title', `Stem: "${word}"\n` +
                                 `Heat: ${Math.round(heat * 100)}%`);
    }

    span.addEventListener('click', markWords);
  }

  function generateHeatMap(input, stopwords, stemmer, wordWeight,
                           paragraphWeight, stoneCold) {
    let output  = document.createElement('div');
    let heats   = new Map();
    let current = 1.0;

    for (let line of splitIntoLines(input)) {
      let p = appendNewElement(output, 'p');

      for (let [type, fragment, word] of
          splitIntoFragments(line, stopwords, stemmer)) {
        if (type === 'word') {
          let span = appendNewElement(p, 'span', fragment);
          let heat = calculateHeat(word, current, heats, stoneCold);
          setUpWordSpan(span, word, heat);
          current += wordWeight;
        }
        else if (type === 'stopword') {
          let span = appendNewElement(p, 'span', fragment);
          setUpWordSpan(span, word);
        }
        else {
          appendTextNode(p, fragment);
        }
      }

      current += paragraphWeight;
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
    let inputArea       = document.querySelector('#input-area');
    let stopwordsArea   = document.querySelector('#stopwords-area');
    let stemmerSelect   = document.querySelector('#stemmer-select');
    let stemmer         = stemmers.get(stemmerSelect.value) || noneStemmer;
    let stopwords       = extractStopwordsSet(stopwordsArea.value);
    let wordWeight      = parseNumberFromField('#word-weight-field',       1.0);
    let paragraphWeight = parseNumberFromField('#paragraph-weight-field', 50.0);
    let stoneCold       = parseNumberFromField('#stone-cold-field',      100.0);
    setOutputSection(generateHeatMap(inputArea.value, stopwords, stemmer,
                                     wordWeight, paragraphWeight,
                                     Math.max(stoneCold, 1.0)));
  }

  let lastTimeoutId;
  function onChange() {
    if (lastTimeoutId !== undefined) {
      window.clearTimeout(lastTimeoutId);
    }
    lastTimeoutId = window.setTimeout(process, 300);
  }

  function setUpChangeListener() {
    for (let area of document.querySelectorAll('.want-change-listener')) {
      area.addEventListener('change', onChange);
      area.addEventListener('keyup',  onChange);
    }
  }

  function setUpOptionsButtonListener() {
    let button  = document.querySelector('#more-options-button');
    let options = document.querySelector('#options-collapse');
    button.addEventListener('click', () => {
      let verb = options.classList.toggle('visible') ? 'Hide' : 'Show';
      button.firstChild.nodeValue = verb + ' More Options';
    });
  }

  setUpChangeListener();
  setUpOptionsButtonListener();
  process();
}());
