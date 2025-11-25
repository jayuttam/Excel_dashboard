// State
let baseArray = [];
let array = [];
let delay = 300;
let isSorting = false;
let isPaused = false;
let comparisons = 0;
let swaps = 0;
let stopRequested = false;

// Elements
const arrayContainer = document.getElementById("array-container");
const sizeInput = document.getElementById("size");
const speedInput = document.getElementById("speed");
const sizeLabel = document.getElementById("sizeLabel");
const speedLabel = document.getElementById("speedLabel");
const algoSelect = document.getElementById("algorithm");

const cmpEl = document.getElementById("comparisons");
const swpEl = document.getElementById("swaps");
const bestEl = document.getElementById("best");
const avgEl = document.getElementById("avg");
const worstEl = document.getElementById("worst");

const btnGenerate = document.getElementById("generate");
const btnSort = document.getElementById("sort");
const btnPause = document.getElementById("pause");
const btnResume = document.getElementById("resume");
const btnReset = document.getElementById("reset");
const themeToggle = document.getElementById("themeToggle");

//Utils
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function tick() {
  // Respect Pause
  while (isPaused) {
    await sleep(50);
  }
  if (stopRequested) throw new Error("stopped");
  await sleep(delay);
}

function setCounters(c = 0, s = 0) {
  comparisons = c; swaps = s;
  cmpEl.textContent = comparisons;
  swpEl.textContent = swaps;
}

function updateCounters({ cmp = 0, swp = 0 } = {}) {
  if (cmp) comparisons += cmp;
  if (swp) swaps += swp;
  cmpEl.textContent = comparisons;
  swpEl.textContent = swaps;
}

function randomArray(n) {
  const arr = [];
  for (let i = 0; i < n; i++) arr.push(Math.floor(Math.random() * 320) + 20);
  return arr;
}

function render(arr) {
  arrayContainer.innerHTML = "";
  const width = arrayContainer.clientWidth || window.innerWidth;
  const maxBars = Math.min(arr.length, Math.floor(width / 10));
  const factor = arr.length > maxBars ? arr.length / maxBars : 1;

  arr.forEach((v, i) => {
    // Simple down-sampling if too many bars for tiny screens
    if (factor > 1 && i % Math.ceil(factor) !== 0) return;

    const bar = document.createElement("div");
    bar.className = "bar";
    bar.style.height = `${v}px`;
    arrayContainer.appendChild(bar);
  });
}

function setBarColor(i, color) {
  const bars = document.getElementsByClassName("bar");
  if (i >= 0 && i < bars.length) bars[i].style.background = color;
}

function setAllBarsColor(color) {
  const bars = document.getElementsByClassName("bar");
  for (let b of bars) b.style.background = color;
}

function setComplexity(algo) {
  const data = {
    bubble:   { best: "O(n)",       avg: "O(n²)",      worst: "O(n²)" },
    selection:{ best: "O(n²)",      avg: "O(n²)",      worst: "O(n²)" },
    insertion:{ best: "O(n)",       avg: "O(n²)",      worst: "O(n²)" },
    merge:    { best: "O(n log n)", avg: "O(n log n)", worst: "O(n log n)", extra: "Space: O(n)" },
    quick:    { best: "O(n log n)", avg: "O(n log n)", worst: "O(n²)",      extra: "Space: O(log n) avg" },
  };
  const c = data[algo];
  bestEl.textContent = c.best;
  avgEl.textContent = c.avg;
  worstEl.textContent = c.worst;
}

function lockControls(lock) {
  isSorting = lock;
  btnSort.disabled = lock;
  btnGenerate.disabled = lock;
  sizeInput.disabled = lock;
  speedInput.disabled = lock;
  algoSelect.disabled = lock;

  btnPause.disabled = !lock;
  btnReset.disabled = !lock;
  btnResume.disabled = true;
}

// Array + UI Events
function generateArray() {
  baseArray = randomArray(+sizeInput.value);
  array = baseArray.slice();
  render(array);
  setCounters(0, 0);
  setAllBarsColor(getComputedStyle(document.body).getPropertyValue("--bar").trim());
  stopRequested = false;
}

function resetArray() {
  array = baseArray.slice();
  render(array);
  setCounters(0, 0);
  isPaused = false;
  btnResume.disabled = true;
  btnPause.disabled = false;
  setAllBarsColor(getComputedStyle(document.body).getPropertyValue("--bar").trim());
}

sizeInput.addEventListener("input", () => {
  sizeLabel.textContent = sizeInput.value;
  generateArray();
});
speedInput.addEventListener("input", () => {
  speedLabel.textContent = speedInput.value;
  delay = +speedInput.value;
});
algoSelect.addEventListener("change", () => setComplexity(algoSelect.value));

btnGenerate.addEventListener("click", generateArray);

btnSort.addEventListener("click", async () => {
  if (isSorting) return;
  setCounters(0, 0);
  lockControls(true);
  isPaused = false;
  stopRequested = false;
  setComplexity(algoSelect.value);

  try {
    await runSort(algoSelect.value);
    // Mark done
    const bars = document.getElementsByClassName("bar");
    for (let i = 0; i < bars.length; i++) {
      bars[i].style.background = getComputedStyle(document.body).getPropertyValue("--bar-done").trim();
      await sleep(6);
    }
  } catch (e) {
    // stopped/reset
  } finally {
    lockControls(false);
    btnPause.disabled = true;
    btnResume.disabled = true;
    btnReset.disabled = true;
    isPaused = false;
    stopRequested = false;
  }
});

btnPause.addEventListener("click", () => {
  isPaused = true;
  btnPause.disabled = true;
  btnResume.disabled = false;
});

btnResume.addEventListener("click", () => {
  isPaused = false;
  btnResume.disabled = true;
  btnPause.disabled = false;
});

btnReset.addEventListener("click", () => {
  stopRequested = true;
  resetArray();
});

themeToggle.addEventListener("change", () => {
  document.body.setAttribute("data-theme", themeToggle.checked ? "dark" : "light");
});

// ====== Sorting Implementations ======
// Bars are mapped 1:1 to array indices at render time.
// For visual consistency after each write, update corresponding bar height.

function updateBar(i) {
  const bars = document.getElementsByClassName("bar");
  if (i >= 0 && i < bars.length) bars[i].style.height = `${array[i]}px`;
}

// Bubble Sort
async function bubbleSort() {
  const n = array.length;
  for (let i = 0; i < n - 1; i++) {
    for (let j = 0; j < n - i - 1; j++) {
      setBarColor(j, getVar("--bar-compare"));
      setBarColor(j + 1, getVar("--bar-compare"));
      updateCounters({ cmp: 1 });
      await tick();

      if (array[j] > array[j + 1]) {
        [array[j], array[j + 1]] = [array[j + 1], array[j]];
        updateBar(j);
        updateBar(j + 1);
        updateCounters({ swp: 1 });
      }

      setBarColor(j, getVar("--bar"));
      setBarColor(j + 1, getVar("--bar"));
    }
  }
}

// Selection Sort
async function selectionSort() {
  const n = array.length;
  for (let i = 0; i < n; i++) {
    let minIdx = i;
    setBarColor(minIdx, getVar("--bar-candidate"));
    for (let j = i + 1; j < n; j++) {
      setBarColor(j, getVar("--bar-compare"));
      updateCounters({ cmp: 1 });
      await tick();
      if (array[j] < array[minIdx]) {
        setBarColor(minIdx, getVar("--bar"));
        minIdx = j;
        setBarColor(minIdx, getVar("--bar-candidate"));
      } else {
        setBarColor(j, getVar("--bar"));
      }
    }
    if (minIdx !== i) {
      [array[i], array[minIdx]] = [array[minIdx], array[i]];
      updateBar(i); updateBar(minIdx);
      updateCounters({ swp: 1 });
    }
    setBarColor(i, getVar("--bar"));
    setBarColor(minIdx, getVar("--bar"));
  }
}

// Insertion Sort
async function insertionSort() {
  const n = array.length;
  for (let i = 1; i < n; i++) {
    const key = array[i];
    let j = i - 1;
    while (j >= 0) {
      setBarColor(j, getVar("--bar-compare"));
      updateCounters({ cmp: 1 });
      await tick();
      if (array[j] > key) {
        array[j + 1] = array[j];
        updateBar(j + 1);
        updateCounters({ swp: 1 });
        setBarColor(j, getVar("--bar"));
        j--;
      } else {
        setBarColor(j, getVar("--bar"));
        break;
      }
    }
    array[j + 1] = key;
    updateBar(j + 1);
  }
}

// Merge Sort (top-down, stable)
async function mergeSort(l = 0, r = array.length - 1) {
  if (l >= r) return;
  const m = Math.floor((l + r) / 2);
  await mergeSort(l, m);
  await mergeSort(m + 1, r);
  await merge(l, m, r);
}

async function merge(l, m, r) {
  const left = array.slice(l, m + 1);
  const right = array.slice(m + 1, r + 1);
  let i = 0, j = 0, k = l;
  while (i < left.length && j < right.length) {
    setBarColor(k, getVar("--bar-compare"));
    updateCounters({ cmp: 1 });
    await tick();
    if (left[i] <= right[j]) {
      array[k] = left[i++];
    } else {
      array[k] = right[j++];
    }
    updateBar(k);
    setBarColor(k, getVar("--bar"));
    k++;
  }
  while (i < left.length) {
    array[k] = left[i++]; updateBar(k); k++;
    await tick();
    updateCounters({ swp: 1 });
  }
  while (j < right.length) {
    array[k] = right[j++]; updateBar(k); k++;
    await tick();
    updateCounters({ swp: 1 });
  }
}

// Quick Sort (Lomuto partition)
async function quickSort(l = 0, r = array.length - 1) {
  if (l < r) {
    const p = await partition(l, r);
    await quickSort(l, p - 1);
    await quickSort(p + 1, r);
  }
}

async function partition(l, r) {
  const pivot = array[r];
  setBarColor(r, getVar("--bar-candidate"));
  let i = l - 1;
  for (let j = l; j < r; j++) {
    setBarColor(j, getVar("--bar-compare"));
    updateCounters({ cmp: 1 });
    await tick();
    if (array[j] < pivot) {
      i++;
      [array[i], array[j]] = [array[j], array[i]];
      updateBar(i); updateBar(j);
      updateCounters({ swp: 1 });
    }
    setBarColor(j, getVar("--bar"));
  }
  [array[i + 1], array[r]] = [array[r], array[i + 1]];
  updateBar(i + 1); updateBar(r);
  setBarColor(r, getVar("--bar"));
  updateCounters({ swp: 1 });
  return i + 1;
}

function getVar(name) {
  return getComputedStyle(document.body).getPropertyValue(name).trim();
}

//Sort Runner
async function runSort(algo) {
  try {
    if (algo === "bubble") await bubbleSort();
    else if (algo === "selection") await selectionSort();
    else if (algo === "insertion") await insertionSort();
    else if (algo === "merge") await mergeSort();
    else if (algo === "quick") await quickSort();
  } finally {
    // no-op
  }
}

//Boot
window.addEventListener("resize", () => render(array));
setComplexity(algoSelect.value);
sizeLabel.textContent = sizeInput.value;
speedLabel.textContent = speedInput.value;
delay = +speedInput.value;

generateArray();
