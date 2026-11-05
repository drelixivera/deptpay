// Matches production normalizeMatric in src/lib/api.ts
function normalizeMatric(matric: string): string {
  return matric
    .trim()
    .toUpperCase()
    .replace(/[\s\-_.]+/g, '/')
    .replace(/\/+/g, '/')
    .replace(/^\/|\/$/g, '');
}

const cases = [
  { input: '2024/410200', expected: '2024/410200', note: 'already canonical' },
  { input: '2024-410200', expected: '2024/410200', note: 'dash normalized to slash' },
  { input: '2024 410200', expected: '2024/410200', note: 'space normalized to slash' },
  { input: '2024.410200', expected: '2024/410200', note: 'dot normalized to slash' },
  { input: '2024_410200', expected: '2024/410200', note: 'underscore normalized to slash' },
  { input: '  2024/410200  ', expected: '2024/410200', note: 'extra outer spaces trimmed' },
  { input: '2024//410200', expected: '2024/410200', note: 'multiple slashes collapsed' },
  { input: '/2024/410200/', expected: '2024/410200', note: 'leading and trailing slashes stripped' },
  { input: 'che/2024/410200', expected: 'CHE/2024/410200', note: 'lowercase prefix uppercased' },
  { input: '2024410200', expected: '2024410200', note: 'continuous digits preserved' },
  { input: '  ', expected: '', note: 'whitespace only' },
  { input: '', expected: '', note: 'empty string' },
];

let failures = 0;

for (const c of cases) {
  const actual = normalizeMatric(c.input);
  if (actual === c.expected) {
    console.log(`✅ ${c.input} → ${actual}`);
  } else {
    console.log(`❌ ${c.input} → ${actual} (Expected ${c.expected})`);
    failures++;
  }
}

if (failures === 0) {
  console.log('\n🎉 All tests passed!');
} else {
  console.log(`\n💥 ${failures} tests failed.`);
}