const test = require('node:test');
const assert = require('node:assert');
const { judge, prizeLabel, settle, parseInput, formatInput } = require('../src/lottery.js');

const cases = [
  ['1791', [['1等', 'AirPods Pro 3 MFHP4J/A'], ['4等', 'ポッキー']]],
  ['3786', [['1等', '美顔器'], ['4等', 'きつねうどん']]],
  ['1139', [['2等', 'モバイルバッテリー（Anker MagGo Power Bank）'], ['4等', 'ファンタブドウ']]],
  ['0122', [['3等', '図書カード（500円）'], ['4等', '堅あげポテト']]],
  ['1235', [['3等', '図書カード（500円）'], ['4等', 'たべっこ水族館']]],
  ['1230', [['4等', 'コアラのマーチ']]],
  ['1231', [['4等', 'ポッキー']]],
  ['1239', [['4等', 'ファンタブドウ']]],
];

for (const [number, expected] of cases) {
  test(`判定: ${number}`, () => {
    assert.deepStrictEqual(
      judge(number).map((w) => [w.grade, w.prize]),
      expected
    );
  });
}

test('先頭0の番号を文字列のまま扱う', () => {
  const { results } = settle(parseInput('0122'));
  assert.strictEqual(results[0].number, '0122');
});

test('連続入力を4桁ごとに区切る', () => {
  assert.deepStrictEqual(parseInput('179101221230'), ['1791', '0122', '1230']);
  assert.deepStrictEqual(parseInput('1791 01\n22,123'), ['1791', '0122', '123']);
  assert.deepStrictEqual(parseInput('１７９１'), ['1791']);
  assert.strictEqual(formatInput('17910122123'), '1791 0122 123');
});

test('同じ番号が複数あっても、それぞれ清算する', () => {
  const r = settle(['1230', '1230', '1231']);
  assert.strictEqual(r.results.length, 3);
  assert.strictEqual(r.prizeSummary.find((p) => p.prize === '0（コアラのマーチ）').count, 2);
});

test('4桁に満たない番号はエラーとして除外する', () => {
  const r = settle(parseInput('1230123'));
  assert.deepStrictEqual(r.errors, ['123']);
  assert.strictEqual(r.results.length, 1);
});

test('4等は「下1桁（景品名）」で表示する', () => {
  assert.strictEqual(prizeLabel(judge('1233')[0]), '3（じゃがりこ）');
  assert.strictEqual(prizeLabel(judge('1791')[0]), 'AirPods Pro 3 MFHP4J/A');
});

test('等級別件数と景品別個数を集計する', () => {
  const r = settle(parseInput('1791 0122 1222 1230 2230'));
  assert.deepStrictEqual(r.gradeCounts, { '1等': 1, '2等': 0, '3等': 2, '4等': 5 });
  const find = (prize, grade) => r.prizeSummary.find((p) => p.prize === prize && p.grade === grade).count;
  assert.strictEqual(find('図書カード（500円）', '3等'), 2);
  assert.strictEqual(find('2（堅あげポテト）', '4等'), 2);
  assert.strictEqual(find('0（コアラのマーチ）', '4等'), 2);
  assert.strictEqual(find('1（ポッキー）', '4等'), 1);
  // 4等は下1桁の番号順
  assert.deepStrictEqual(
    r.prizeSummary.filter((p) => p.grade === '4等').map((p) => p.prize),
    ['0（コアラのマーチ）', '1（ポッキー）', '2（堅あげポテト）']
  );
});
