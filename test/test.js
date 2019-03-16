
const lib = require('../index');

let succeeded = 0;
let failed = 0;

function runTest(testName, ssml, options, expectedResult) {
  const result = lib.check(ssml, options);

  if (result == expectedResult) {
    succeeded++;
  } else {
    console.log('FAIL: ' + testName + ' returned ' + result + ' rather than ' + expectedResult);
    failed++;
  }
}

runTest('Simple SSML', '<speak>Simple test</speak>', null, 'valid');
runTest('Invalid XML', '<tag>What is this?', null, 'Can\'t parse SSML');

// Duration checks

// Final summary
console.log('\r\nRan ' + (succeeded + failed) + ' tests; ' + succeeded + ' passed and ' + failed + ' failed');
