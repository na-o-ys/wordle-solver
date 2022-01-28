import fs from "fs/promises";
import path from "path";
import readline from "readline";

let QueryWordSet: string[] = [];

function approxScore(S: string[], word: string): number {
  let avgMoves = 1;
  for (const subset of split(word, S)) {
    if (subset.length <= 0) continue;
    avgMoves +=
      (subset.length / S.length) * (0.43 * Math.log(subset.length) + 1);
  }
  return avgMoves;
}

function solve(
  S: string[],
  depth: number,
  hard: boolean,
  beamSize: number,
  debug?: boolean,
  firstWord?: string
): { word: string; score: number } {
  if (S.length === 0) return { word: "", score: 0 };
  if (S.length === 1) return { word: S[0], score: 1 };
  if (S.length === 2) return { word: S[0], score: 1.5 };
  if (depth <= 0) return { word: "", score: 0.43 * Math.log(S.length) + 1 };

  let topQueryWords = firstWord ? [firstWord] : hard ? S : QueryWordSet;
  if (topQueryWords.length > beamSize) {
    const topQwords = topQueryWords
      .map((word) => ({ word, score: approxScore(S, word) }))
      .sort((a, b) => a.score - b.score)
      .slice(0, beamSize);
    if (debug) console.log(topQwords);
    topQueryWords = topQwords.map(({ word }) => word);
  }

  let bestScore = Infinity;
  let bestWord = "";
  for (const word of topQueryWords) {
    let avgMoves = 1;
    for (const subset of split(word, S)) {
      avgMoves +=
        (subset.length / S.length) *
        solve(subset, depth - 1, hard, beamSize).score;
    }
    if (debug) log(`${word} ${avgMoves}`);
    if (avgMoves < bestScore) {
      bestScore = avgMoves;
      bestWord = word;
    }
  }
  return { word: bestWord, score: bestScore };
}

function split(qword: string, wordSet: string[]): string[][] {
  const map = new Map<number, string[]>();
  for (const word of wordSet) {
    const v = query(qword, word);
    const arr = map.get(v) || [];
    arr.push(word);
    map.set(v, arr);
  }
  if (map.has(242)) map.set(242, []);
  return [...map.values()];
}

let AnswerWordSet: string[] = [];
let QueryWordsIdx = new Map<string, number>();
let AnswerWordsIdx = new Map<string, number>();
const Dict: number[] = [];

function query(qword: string, aword: string): number {
  const qidx = QueryWordsIdx.get(qword);
  const aidx = AnswerWordsIdx.get(aword);
  if (qidx === undefined || aidx === undefined)
    throw `index not found (${qword}, ${aword})`;
  return Dict[qidx * AnswerWordSet.length + aidx];
}

function genDict(queryWords: string[], answerWords: string[]): number[] {
  for (const [qidx, qword] of queryWords.entries()) {
    for (const [aidx, aword] of answerWords.entries()) {
      Dict[qidx * AnswerWordSet.length + aidx] = calcValue(qword, aword);
    }
  }
  return Dict;
}

function calcValue(qword: string, aword: string): number {
  let ans = 0;
  const q = [0, 1, 2, 3, 4].map((e) => qword[e]);
  const a = [0, 1, 2, 3, 4].map((e) => aword[e]);
  for (let i = 0; i < 5; i++) {
    let v = 1;
    if (q[i] === a[i]) v = 2;
    else if (
      a
        .map((e, j) => [e, j] as const)
        .filter(([e, j]) => e === q[i] && q[j] !== q[i]).length === 0
    )
      v = 0;
    ans *= 3;
    ans += v;
  }
  return ans;
}

async function interactiveSolve(
  wordSet: string[],
  depth: number,
  hard: boolean,
  beamSize: number,
  firstWord?: string
) {
  for (let i = 0; i < 6; i++) {
    log(`round ${i}; wordSet.length: ${wordSet.length}`);
    let moves = 0;
    let qword = "";
    if (i === 0 && firstWord) {
      qword = firstWord;
    } else {
      const result = solve(wordSet, depth, hard, beamSize, true);
      qword = result.word;
      moves = result.score;
    }
    log(`est. moves: ${moves + i}`);
    log(`${qword} ? (black: 0, yellow: 1, green: 2)`);
    const v = hintToValue(await getline());
    wordSet = wordSet.filter((word) => query(qword, word) === v);
    console.log(wordSet);
  }
}

function hintToValue(hint: string): number {
  let v = 0;
  for (let i = 0; i < 5; i++) {
    v *= 3;
    v += Number.parseInt(hint[i]);
  }
  return v;
}

async function main() {
  await initialize();

  const mode = process.argv[2];
  const depth = Number.parseInt(process.argv[3]);
  const hard = process.argv[4] === "true";
  const beamSize = Number.parseInt(process.argv[5]);
  const firstWord = process.argv[6] || undefined;
  if (mode === "solve") {
    log(solve(AnswerWordSet, depth, hard, beamSize, true, firstWord));
  }
  if (mode === "interactive") {
    log(interactiveSolve(AnswerWordSet, depth, hard, beamSize, firstWord));
  }
}

async function initialize() {
  const short = (await fs.readFile(path.join(__dirname, "../dict/short.txt")))
    .toString()
    .split("\n");
  QueryWordSet = short;
  AnswerWordSet = short;
  for (const [idx, word] of QueryWordSet.entries())
    QueryWordsIdx.set(word, idx);
  for (const [idx, word] of AnswerWordSet.entries())
    AnswerWordsIdx.set(word, idx);

  genDict(QueryWordSet, AnswerWordSet);
  log("genDict finished");
}

let startAt = Date.now();
function log(message: any) {
  if (typeof message === "object") {
    console.log(message);
    message = "";
  }
  console.log(`${message} (${((Date.now() - startAt) / 1000).toFixed(2)}s)`);
}

const readlineInterface = readline.createInterface(
  process.stdin,
  process.stdout
);
const getline = () =>
  new Promise<string>((resolve) => readlineInterface.question("", resolve));

main();
