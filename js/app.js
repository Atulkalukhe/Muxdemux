(() => {
  'use strict';

  const CHANNEL_OPTIONS = [2, 4, 8, 16];
  const state = {
    type: 'mux',
    channels: 2,
    data: [0, 1],
    muxData: [0, 1],
    demuxData: 0,
    selectValue: 0,
    step: -1,
    autoTimer: null,
    score: 0,
    questionNumber: 0,
    question: null,
    answered: false
  };

  const el = {
    type: document.querySelector('#circuitType'),
    ratio: document.querySelector('#ratioSelect'),
    muxDataGroup: document.querySelector('#muxDataGroup'),
    dataControls: document.querySelector('#dataControls'),
    dataHeading: document.querySelector('#dataHeading'),
    dataCount: document.querySelector('#dataCount'),
    selectControls: document.querySelector('#selectControls'),
    selectCount: document.querySelector('#selectCount'),
    binary: document.querySelector('#binaryValue'),
    decimal: document.querySelector('#decimalValue'),
    demuxInput: document.querySelector('#demuxInput'),
    demuxDataControl: document.querySelector('#demuxDataControl'),
    summary: document.querySelector('#circuitSummary'),
    diagramTitle: document.querySelector('#diagramTitle'),
    diagramWrap: document.querySelector('#diagramWrap'),
    diagram: document.querySelector('#circuitDiagram'),
    resultLabel: document.querySelector('#resultLabel'),
    result: document.querySelector('#resultText'),
    channel: document.querySelector('#channelText'),
    explanation: document.querySelector('#liveExplanation'),
    expression: document.querySelector('#booleanExpression'),
    stepExplanation: document.querySelector('#stepExplanation'),
    stepProgress: document.querySelector('#stepProgress'),
    previous: document.querySelector('#previousStep'),
    next: document.querySelector('#nextStep'),
    restart: document.querySelector('#restartSteps'),
    toggleDemo: document.querySelector('#toggleDemo'),
    demoStatus: document.querySelector('#demoStatus'),
    demoIndicator: document.querySelector('#demoIndicator'),
    demoCard: document.querySelector('.demo-card'),
    truth: document.querySelector('#truthTableWrap'),
    truthHint: document.querySelector('#truthHint'),
    quizScore: document.querySelector('#quizScore'),
    quizKind: document.querySelector('#quizKind'),
    quizNumber: document.querySelector('#quizNumber'),
    quizQuestion: document.querySelector('#quizQuestion'),
    quizAnswers: document.querySelector('#quizAnswers'),
    quizFeedback: document.querySelector('#quizFeedback'),
    newQuestion: document.querySelector('#newQuestion')
  };

  const bitsFor = (value, count = selectLineCount()) =>
    Array.from({ length: count }, (_, offset) => (value >> (count - offset - 1)) & 1).join('');
  const selectLineCount = () => Math.log2(state.channels);
  const channelLabel = (index) => `${state.type === 'mux' ? 'I' : 'Y'}${index}`;
  const selectedBit = () => state.type === 'mux' ? state.data[state.selectValue] : state.data[0];
  const binarySubscript = '₂';
  const decimalSubscript = '₁₀';

  function renderRatioOptions() {
    const current = state.channels;
    el.ratio.replaceChildren(...CHANNEL_OPTIONS.map((channels) => {
      const option = document.createElement('option');
      option.value = String(channels);
      option.textContent = state.type === 'mux' ? `${channels} : 1` : `1 : ${channels}`;
      return option;
    }));
    el.ratio.value = String(current);
  }

  function makeSwitch(label, value, kind, index, active = false) {
    const wrapper = document.createElement('div');
    wrapper.className = `data-switch${active ? ' active-channel' : ''}${kind === 'demux' ? ' single-data' : ''}`;
    wrapper.dataset.channel = String(index);

    const name = document.createElement('span');
    name.className = 'data-label';
    name.textContent = label;

    const button = document.createElement('button');
    button.className = 'switch-button';
    button.type = 'button';
    button.setAttribute('role', 'switch');
    button.setAttribute('aria-checked', String(value === 1));
    button.setAttribute('aria-label', `${label} data input, currently ${value}; switch to ${value ? 0 : 1}`);
    button.dataset.channel = String(index);
    button.dataset.kind = kind;
    button.innerHTML = `<span class="switch-thumb">${value}</span>`;
    wrapper.append(name, button);
    return wrapper;
  }

  function renderDataControls() {
    el.muxDataGroup.hidden = state.type === 'demux';
    el.demuxInput.hidden = state.type !== 'demux';
    el.dataHeading.textContent = 'Input switches';
    el.dataCount.textContent = state.type === 'mux' ? `${state.channels} INPUTS` : '';
    el.dataControls.replaceChildren(...state.data.map((value, index) =>
      makeSwitch(`I${index}`, value, 'mux', index, index === state.selectValue)));
    if (state.type === 'demux') {
      el.demuxDataControl.replaceChildren(makeSwitch('D', state.data[0], 'demux', 0));
    } else {
      el.demuxDataControl.replaceChildren();
    }
  }

  function renderSelectControls() {
    const lineCount = selectLineCount();
    el.selectCount.textContent = `${lineCount} LINES`;
    el.selectControls.replaceChildren(...Array.from({ length: lineCount }, (_, position) => {
      const bitIndex = lineCount - position - 1;
      const bit = (state.selectValue >> bitIndex) & 1;
      const button = document.createElement('button');
      button.className = 'select-switch';
      button.type = 'button';
      button.setAttribute('role', 'switch');
      button.setAttribute('aria-checked', String(bit === 1));
      button.setAttribute('aria-label', `Select line S${bitIndex}, currently ${bit}; switch to ${bit ? 0 : 1}`);
      button.dataset.bit = String(bitIndex);
      button.innerHTML = `<span class="select-name">S${bitIndex}</span><span class="select-bit">${bit}</span>`;
      return button;
    }));
  }

  function updateSwitches() {
    el.dataControls.querySelectorAll('.data-switch').forEach((wrapper) => {
      const index = Number(wrapper.dataset.channel);
      const value = state.data[index];
      const button = wrapper.querySelector('button');
      button.setAttribute('aria-checked', String(value === 1));
      button.setAttribute('aria-label', `I${index} data input, currently ${value}; switch to ${value ? 0 : 1}`);
      button.querySelector('.switch-thumb').textContent = String(value);
      wrapper.classList.toggle('active-channel', state.type === 'mux' && index === state.selectValue);
    });
    el.demuxDataControl.querySelectorAll('.data-switch').forEach((wrapper) => {
      const value = state.data[0];
      const button = wrapper.querySelector('button');
      button.setAttribute('aria-checked', String(value === 1));
      button.setAttribute('aria-label', `D data input, currently ${value}; switch to ${value ? 0 : 1}`);
      button.querySelector('.switch-thumb').textContent = String(value);
    });
    el.selectControls.querySelectorAll('.select-switch').forEach((button) => {
      const bit = Number(button.dataset.bit);
      const value = (state.selectValue >> bit) & 1;
      button.setAttribute('aria-checked', String(value === 1));
      button.setAttribute('aria-label', `Select line S${bit}, currently ${value}; switch to ${value ? 0 : 1}`);
      button.querySelector('.select-bit').textContent = String(value);
    });
  }

  function renderSummary() {
    const selectors = selectLineCount();
    const channels = state.channels;
    const chips = [
      `${channels} channels`,
      `${selectors} select ${selectors === 1 ? 'line' : 'lines'}`,
      state.type === 'mux' ? '1 output' : '1 input'
    ];
    el.summary.replaceChildren(...chips.map((text) => {
      const chip = document.createElement('span');
      chip.className = 'summary-chip';
      chip.textContent = text;
      return chip;
    }));
    el.diagramTitle.textContent = state.type === 'mux'
      ? `${channels} : 1 Multiplexer`
      : `1 : ${channels} Demultiplexer`;
    el.diagramWrap.setAttribute('aria-label', `${channels}-channel ${state.type.toUpperCase()} circuit diagram. ${channelLabel(state.selectValue)} is selected.`);
    el.resultLabel.textContent = state.type === 'mux' ? 'OUTPUT' : 'SELECTED OUTPUT';
    el.result.textContent = state.type === 'mux' ? `Y = ${selectedBit()}` : `${channelLabel(state.selectValue)} = ${selectedBit()}`;
    el.channel.textContent = channelLabel(state.selectValue);
    el.binary.textContent = bitsFor(state.selectValue);
    el.decimal.innerHTML = `${state.selectValue}<small>${decimalSubscript}</small>`;
  }

  function svgText(x, y, text, className, anchor = 'start') {
    return `<text x="${x}" y="${y}" text-anchor="${anchor}" class="${className}">${text}</text>`;
  }

  function renderDiagram() {
    const count = state.channels;
    const bitCount = selectLineCount();
    const height = Math.max(300, 170 + (count - 1) * 34);
    const inputX = 64;
    const blockLeft = 390;
    const blockRight = 600;
    const outputX = 824;
    const center = height / 2;
    const gap = count === 1 ? 0 : Math.min(34, (height - 125) / (count - 1));
    const firstY = (height - (count - 1) * gap) / 2;
    const ys = Array.from({ length: count }, (_, i) => firstY + i * gap);
    const selected = state.selectValue;
    const activeValue = selectedBit();
    const bits = bitsFor(selected);
    let svg = `<title>${state.type === 'mux' ? 'Multiplexer' : 'Demultiplexer'} signal diagram</title>`;

    if (state.type === 'mux') {
      svg += `<polygon class="diagram-block" points="${blockLeft},24 ${blockRight},${Math.max(58, center - 47)} ${blockRight},${Math.min(height - 58, center + 47)} ${blockLeft},${height - 24}"/>`;
      svg += `<path class="diagram-block-accent" d="M${blockLeft + 7},${center - 8} L${blockRight - 11},${center - 8} L${blockRight - 11},${center + 8} L${blockLeft + 7},${center + 8} Z"/>`;
      svg += svgText((blockLeft + blockRight) / 2, center - 3, 'MUX', 'diagram-label output-label', 'middle');
      svg += svgText((blockLeft + blockRight) / 2, center + 17, `${count} : 1`, 'diagram-pin-label', 'middle');
      ys.forEach((y, index) => {
        const active = index === selected;
        const wireClass = `diagram-wire${active ? ' active' : ''}${active && activeValue === 1 ? ' pulse' : ''}`;
        svg += `<path class="${wireClass}" d="M${inputX + 24},${y} H${blockLeft}"/>`;
        svg += svgText(inputX + 17, y + 4, `I${index}`, `diagram-label${active ? ' active' : ''}`, 'end');
      });
      svg += `<path class="diagram-wire${activeValue === 1 ? ' active pulse' : ' active'}" d="M${blockRight},${center} H${outputX - 30}"/>`;
      svg += svgText(outputX, center + 4, `Y = ${activeValue}`, 'diagram-label output-label');
    } else {
      svg += `<polygon class="diagram-block" points="${blockLeft},${center - 62} ${blockRight},28 ${blockRight},${height - 72} ${blockLeft},${center + 62}"/>`;
      svg += `<path class="diagram-block-accent" d="M${blockLeft + 12},${center - 9} H${blockRight - 15} V${center + 9} H${blockLeft + 12} Z"/>`;
      svg += svgText((blockLeft + blockRight) / 2, center - 3, 'DEMUX', 'diagram-label output-label', 'middle');
      svg += svgText((blockLeft + blockRight) / 2, center + 17, `1 : ${count}`, 'diagram-pin-label', 'middle');
      svg += `<path class="diagram-wire active${activeValue === 1 ? ' pulse' : ''}" d="M${inputX + 24},${center} H${blockLeft}"/>`;
      svg += svgText(inputX + 17, center + 4, `D = ${activeValue}`, 'diagram-label active', 'end');
      ys.forEach((y, index) => {
        const active = index === selected;
        const wireClass = `diagram-wire${active ? ' active' : ' inactive-demux'}${active && activeValue === 1 ? ' pulse' : ''}`;
        svg += `<path class="${wireClass}" d="M${blockRight},${y} H${outputX - 30}"/>`;
        svg += svgText(outputX, y + 4, `Y${index}${active ? ` = ${activeValue}` : ' = 0'}`, `diagram-label${active ? ' active' : ''}${active ? ' output-label' : ''}`);
      });
    }

    const pinStart = blockLeft + 27;
    const pinEnd = blockRight - 27;
    Array.from({ length: bitCount }, (_, offset) => {
      const x = bitCount === 1 ? (pinStart + pinEnd) / 2 : pinStart + (pinEnd - pinStart) * offset / (bitCount - 1);
      const pinY = height - 24;
      const bitNumber = bitCount - offset - 1;
      svg += `<path class="diagram-wire" d="M${x},${pinY - 15} V${pinY}"/>`;
      svg += svgText(x, pinY + 12, `S${bitNumber}=${bits[offset]}`, 'diagram-pin-label', 'middle');
    });

    el.diagram.setAttribute('viewBox', `0 0 900 ${height}`);
    el.diagram.innerHTML = svg;
  }

  function literalFor(value) {
    const count = selectLineCount();
    return Array.from({ length: count }, (_, offset) => {
      const bitNumber = count - offset - 1;
      return ((value >> bitNumber) & 1) ? `S${bitNumber}` : `S${bitNumber}′`;
    }).join(' · ');
  }

  function updateExplanation() {
    const bits = bitsFor(state.selectValue);
    const label = channelLabel(state.selectValue);
    const bit = selectedBit();
    const lines = Array.from({ length: selectLineCount() }, (_, offset) => `S${selectLineCount() - offset - 1}`);
    const prefix = `${lines.join(' ')} = ${bits}${binarySubscript} = ${state.selectValue}${decimalSubscript}`;
    if (state.type === 'mux') {
      el.explanation.textContent = `${prefix} → ${label} selected → ${label} = ${bit} → Y = ${bit}`;
      el.expression.textContent = `Selected Boolean term: I${state.selectValue} · ${literalFor(state.selectValue)} = ${bit}; therefore Y = ${bit}.`;
    } else {
      el.explanation.textContent = `${prefix} → ${label} selected → D = ${bit} → ${label} = ${bit}`;
      el.expression.textContent = `Selected output: Y${state.selectValue} = D · ${literalFor(state.selectValue)} = ${bit}; all other outputs = 0.`;
    }
  }

  function renderTruthTable() {
    const lineCount = selectLineCount();
    const selectHeaders = Array.from({ length: lineCount }, (_, offset) => `<th>S${lineCount - offset - 1}</th>`).join('');
    let headers;
    if (state.type === 'mux') {
      const inputs = state.data.map((_, index) => `<th>I${index}</th>`).join('');
      headers = `${selectHeaders}<th>Decimal</th><th>Selected input</th>${inputs}<th>Y</th>`;
    } else {
      const outputs = Array.from({ length: state.channels }, (_, index) => `<th>Y${index}</th>`).join('');
      headers = `${selectHeaders}<th>Decimal</th><th>Selected output</th><th>D</th>${outputs}`;
    }

    const rows = Array.from({ length: state.channels }, (_, selected) => {
      const bits = bitsFor(selected).split('').map((bit) => `<td>${bit}</td>`).join('');
      const isCurrent = selected === state.selectValue;
      if (state.type === 'mux') {
        const value = state.data[selected];
        const cells = state.data.map((input) => `<td>${input}</td>`).join('');
        return `<tr class="${isCurrent ? 'selected-row' : ''}"${isCurrent ? ' aria-current="true"' : ''}>${bits}<td>${selected}</td><td>${channelLabel(selected)}</td>${cells}<td class="selected-value">${value}</td></tr>`;
      }
      const outputs = Array.from({ length: state.channels }, (_, index) => `<td class="${isCurrent && index === selected ? 'selected-value' : ''}">${index === selected ? state.data[0] : 0}</td>`).join('');
      return `<tr class="${isCurrent ? 'selected-row' : ''}"${isCurrent ? ' aria-current="true"' : ''}>${bits}<td>${selected}</td><td>${channelLabel(selected)}</td><td>${state.data[0]}</td>${outputs}</tr>`;
    }).join('');
    el.truth.innerHTML = `<table class="truth-table"><caption class="sr-only">${state.channels}-channel ${state.type.toUpperCase()} truth table. The highlighted row is the current address.</caption><thead><tr>${headers}</tr></thead><tbody>${rows}</tbody></table>`;
    el.truthHint.textContent = state.type === 'mux'
      ? 'Data inputs stay live; the highlighted row shows the selected input and output.'
      : 'The selected Y column receives D; every other output stays 0.';
  }

  const walkthroughText = (index) => {
    const bits = bitsFor(state.selectValue);
    const label = channelLabel(state.selectValue);
    const value = selectedBit();
    if (index === 0) return `Read from left to right: ${bits}₂. The rightmost bit is S0, the least significant bit.`;
    if (index === 1) return `${bits}₂ equals ${state.selectValue}₁₀. That decimal address identifies channel ${state.selectValue}.`;
    if (index === 2) return state.type === 'mux'
      ? `A MUX chooses ${label}. Its switch is ${value}, so that is the value sent to the single output.`
      : `A DEMUX chooses ${label}. It routes D = ${value} to that output; every other output stays at 0.`;
    return state.type === 'mux'
      ? `Follow the highlighted wire: ${label} = ${value}, so the output is Y = ${value}.`
      : `Follow the highlighted wire: D = ${value} reaches ${label}, so ${label} = ${value}.`;
  };

  function updateStep() {
    el.previous.disabled = state.step <= 0;
    el.stepExplanation.textContent = state.step < 0
      ? 'Press Next to start the walkthrough.'
      : `STEP ${state.step + 1} OF 4 · ${walkthroughText(state.step)}`;
    [...el.stepProgress.children].forEach((bar, index) => bar.classList.toggle('done', index <= state.step));
    el.stepProgress.setAttribute('aria-label', `Step ${Math.max(0, state.step + 1)} of 4`);
  }

  function updateAll() {
    updateSwitches();
    renderSummary();
    renderDiagram();
    updateExplanation();
    renderTruthTable();
    updateStep();
  }

  function resetCircuitControls() {
    renderDataControls();
    renderSelectControls();
    updateAll();
  }

  function stopDemo() {
    if (state.autoTimer !== null) {
      window.clearInterval(state.autoTimer);
      state.autoTimer = null;
    }
    el.demoCard.classList.remove('is-running');
    el.toggleDemo.setAttribute('aria-pressed', 'false');
    el.toggleDemo.textContent = '▶ Start auto demo';
    el.demoStatus.textContent = 'Demo is paused';
    el.demoIndicator.setAttribute('aria-label', 'Paused');
  }

  function toggleAutoDemo() {
    if (state.autoTimer !== null) {
      stopDemo();
      return;
    }
    state.step = -1;
    updateStep();
    el.demoCard.classList.add('is-running');
    el.toggleDemo.setAttribute('aria-pressed', 'true');
    el.toggleDemo.textContent = 'Ⅱ Stop auto demo';
    el.demoStatus.textContent = 'Demo is running';
    el.demoIndicator.setAttribute('aria-label', 'Running');
    state.autoTimer = window.setInterval(() => {
      state.selectValue = (state.selectValue + 1) % state.channels;
      updateAll();
    }, 1100);
  }

  function setCircuitType(type) {
    stopDemo();
    if (state.type === 'mux') state.muxData = [...state.data];
    else state.demuxData = state.data[0] ?? 0;
    state.type = type;
    state.data = type === 'mux'
      ? Array.from({ length: state.channels }, (_, index) => state.muxData[index] ?? (index % 2))
      : [state.demuxData];
    state.step = -1;
    renderRatioOptions();
    resetCircuitControls();
  }

  function setChannelCount(count) {
    stopDemo();
    state.channels = count;
    state.data = state.type === 'mux'
      ? Array.from({ length: count }, (_, i) => state.data[i] ?? (i % 2))
      : [state.data[0] ?? 0];
    if (state.type === 'mux') state.muxData = [...state.data];
    else state.demuxData = state.data[0];
    state.selectValue = Math.min(state.selectValue, count - 1);
    state.step = -1;
    resetCircuitControls();
  }

  function handleDataToggle(event) {
    const button = event.target.closest('button[data-kind]');
    if (!button) return;
    stopDemo();
    const index = button.dataset.kind === 'demux' ? 0 : Number(button.dataset.channel);
    state.data[index] = state.data[index] ? 0 : 1;
    if (state.type === 'mux') state.muxData = [...state.data];
    else state.demuxData = state.data[0];
    updateAll();
  }

  function handleSelectToggle(event) {
    const button = event.target.closest('button[data-bit]');
    if (!button) return;
    stopDemo();
    state.selectValue ^= (1 << Number(button.dataset.bit));
    updateAll();
  }

  function restartSteps() {
    stopDemo();
    state.selectValue = 0;
    state.step = -1;
    updateAll();
  }

  function advanceStep(direction) {
    stopDemo();
    if (direction > 0 && state.step >= 3) {
      state.selectValue = (state.selectValue + 1) % state.channels;
      state.step = 0;
    } else {
      state.step = Math.max(0, Math.min(3, state.step + direction));
    }
    updateAll();
  }

  function randomItem(items) {
    return items[Math.floor(Math.random() * items.length)];
  }

  function shuffled(items) {
    return [...items].sort(() => Math.random() - 0.5);
  }

  function generateQuizQuestion() {
    const type = randomItem(['mux', 'demux']);
    const channels = randomItem(CHANNEL_OPTIONS);
    const address = Math.floor(Math.random() * channels);
    const data = Math.floor(Math.random() * 2);
    const bits = bitsFor(address, Math.log2(channels));
    let choices;
    let correct;
    let prompt;
    if (type === 'mux') {
      const inputValues = Array.from({ length: channels }, (_, index) => (index === address ? data : (index + address) % 2));
      correct = String(inputValues[address]);
      choices = ['0', '1'];
      prompt = `${channels}:1 MUX · S = ${bits}₂. The inputs are ${inputValues.join(' ')} (I0 first). What is Y?`;
    } else {
      correct = `Y${address}`;
      choices = shuffled(Array.from({ length: channels }, (_, index) => `Y${index}`).filter((label) => label !== correct)).slice(0, Math.min(3, channels - 1));
      choices.push(correct);
      choices = shuffled(choices);
      prompt = `1:${channels} DEMUX · S = ${bits}₂ and D = ${data}. Which output is selected?`;
    }
    state.questionNumber += 1;
    state.question = { type, channels, address, bits, data, choices, correct };
    state.answered = false;
    el.quizKind.textContent = type === 'mux' ? 'MUX · FIND Y' : 'DEMUX · FIND OUTPUT';
    el.quizNumber.textContent = `QUESTION ${state.questionNumber}`;
    el.quizQuestion.textContent = prompt;
    el.quizFeedback.textContent = 'Choose an answer. There is no time limit.';
    el.quizAnswers.replaceChildren(...choices.map((choice) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'answer-button';
      button.textContent = choice;
      button.dataset.answer = choice;
      return button;
    }));
  }

  function answerQuiz(event) {
    const button = event.target.closest('button[data-answer]');
    if (!button || !state.question || state.answered) return;
    state.answered = true;
    const { type, address, bits, data, correct } = state.question;
    const isCorrect = button.dataset.answer === correct;
    el.quizAnswers.querySelectorAll('button').forEach((answer) => {
      answer.disabled = true;
      if (answer.dataset.answer === correct) answer.classList.add('correct');
    });
    if (!isCorrect) button.classList.add('incorrect');
    if (isCorrect) {
      state.score += 1;
      el.quizScore.textContent = String(state.score);
    }
    const details = type === 'mux'
      ? `${bits}₂ is ${address}, so I${address} is selected and Y = ${correct}.`
      : `${bits}₂ is ${address}, so Y${address} is the selected output. D = ${data} goes only there; all other outputs stay 0.`;
    el.quizFeedback.textContent = `${isCorrect ? 'Correct!' : `Not quite. The answer is ${correct}.`} ${details}`;
  }

  function initialize() {
    renderRatioOptions();
    resetCircuitControls();
    el.type.addEventListener('change', () => setCircuitType(el.type.value));
    el.ratio.addEventListener('change', () => setChannelCount(Number(el.ratio.value)));
    el.dataControls.addEventListener('click', handleDataToggle);
    el.demuxDataControl.addEventListener('click', handleDataToggle);
    el.selectControls.addEventListener('click', handleSelectToggle);
    el.previous.addEventListener('click', () => advanceStep(-1));
    el.next.addEventListener('click', () => advanceStep(1));
    el.restart.addEventListener('click', restartSteps);
    el.toggleDemo.addEventListener('click', toggleAutoDemo);
    el.newQuestion.addEventListener('click', generateQuizQuestion);
    el.quizAnswers.addEventListener('click', answerQuiz);
    window.addEventListener('beforeunload', stopDemo, { once: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize, { once: true });
  } else {
    initialize();
  }
})();
