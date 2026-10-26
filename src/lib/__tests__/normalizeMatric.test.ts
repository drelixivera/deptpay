// We are copying the function here so the test runs standalone in Node
// without needing Vite's environment variables.
function normalizeMatric(matric: string): string {
  return matric.replace(/\D/g, '');
}

const cases = [
  { input: '2024410200', expected: '2024410200', note: 'already perfect' },
  { input: '2024/410200', expected: '2024410200', note: 'slash' },
  { input: '2024-410200', expected: '2024410200', note: 'dash' },
  { input: '2024 410200', expected: '2024410200', note: 'space' },
  { input: '2024.410200', expected: '2024410200', note: 'dot' },
  { input: '2024_410200', expected: '2024410200', note: 'underscore' },
  { input: '  2024/410200  ', expected: '2024410200', note: 'extra spaces' },
  { input: '2024/4102', expected: '20244102', note: 'incomplete (will NOT match)' },
  { input: 'abc', expected: '', note: 'letters only' },
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