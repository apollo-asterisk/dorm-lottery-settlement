// 当選判定と一括清算の集計
(function (root) {
  const PRIZES = typeof require === 'function' ? require('./prizes.js') : root.PRIZES;

  const GRADES = ['1等', '2等', '3等', '4等'];

  // 1つのくじ番号（4桁の文字列）を判定し、当選のリストを返す。
  // 1〜3等は上位優先で最大1つ、4等はそれとは別に判定する。
  function judge(number, prizes = PRIZES) {
    const wins = [];
    if (prizes.first[number]) {
      wins.push({ grade: '1等', prize: prizes.first[number] });
    } else if (prizes.second[number]) {
      wins.push({ grade: '2等', prize: prizes.second[number] });
    } else if (prizes.third[number.slice(-2)]) {
      wins.push({ grade: '3等', prize: prizes.third[number.slice(-2)] });
    }
    const digit = number.slice(-1);
    const fourth = prizes.fourth[digit];
    if (fourth) wins.push({ grade: '4等', prize: fourth, digit });
    return wins;
  }

  // 表示用の景品名。4等は「下1桁（景品名）」で表す
  function prizeLabel(win) {
    return win.grade === '4等' ? `${win.digit}（${win.prize}）` : win.prize;
  }

  // 入力から数字だけを取り出し、4桁ごとに区切って番号の配列にする
  // （4桁に満たない端数はそのまま最後の要素になり、settle でエラー扱いになる）
  function parseInput(text) {
    const digits = text
      .replace(/[０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0))
      .replace(/\D/g, '');
    return digits.match(/\d{1,4}/g) || [];
  }

  // 入力欄の表示用に、数字を4桁ごとにスペース区切りにする
  function formatInput(text) {
    return parseInput(text).join(' ');
  }

  // 番号の配列を一括清算する（同じ番号が複数あっても、それぞれ清算する）
  function settle(numbers, prizes = PRIZES) {
    const results = [];
    const errors = [];
    const gradeCounts = Object.fromEntries(GRADES.map((g) => [g, 0]));
    const prizeTotals = new Map();

    for (const raw of numbers) {
      const number = String(raw).trim();
      if (!/^\d{4}$/.test(number)) {
        errors.push(number);
        continue;
      }
      const wins = judge(number, prizes);
      results.push({ number, wins });
      for (const win of wins) {
        const { grade } = win;
        gradeCounts[grade]++;
        const prize = prizeLabel(win);
        const key = grade + '\u0000' + prize;
        const total = prizeTotals.get(key) || { prize, grade, count: 0 };
        total.count++;
        prizeTotals.set(key, total);
      }
    }

    // 4等は下1桁の番号順、それ以外は個数の多い順
    const prizeSummary = [...prizeTotals.values()].sort(
      (a, b) =>
        GRADES.indexOf(a.grade) - GRADES.indexOf(b.grade) ||
        (a.grade === '4等' ? a.prize.localeCompare(b.prize) : b.count - a.count)
    );
    return { results, errors, gradeCounts, prizeSummary };
  }

  const api = { GRADES, judge, prizeLabel, parseInput, formatInput, settle };
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else {
    root.Lottery = api;
  }
})(this);
