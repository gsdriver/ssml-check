
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

// Whisper tests
runTest('Whisper effect', '<speak><amazon:effect name="whispered">Simple test <break strength="medium"/> code</amazon:effect></speak>', null, 'valid');
runTest('Whisper effect', '<speak><amazon:effect name="whispering">Simple test <break strength="medium"/> code</amazon:effect></speak>', null, 'amazon:effect has invalid name value whispering');

// Break tests
runTest('With break', '<speak>You lost <break time="200ms"/> Getting used to losing?  Take a break and come back tomorrow</speak>', null, 'valid');
runTest('Break with bad attirbute', '<speak>You lost <break tim="200ms"/> Getting used to losing?  Take a break and come back tomorrow</speak>', null, 'break tag has invalid attribute tim');
runTest('Break with long attribute', '<speak>You lost <break time="200s"/> Getting used to losing?  Take a break and come back tomorrow</speak>', null, 'break tag has invalid time attribute value 200s');

// Invalid formats
runTest('Invalid XML', '<tag>What is this?', null, 'Can\'t parse SSML');
runTest('Too many audio files', '<speak><audio src=\"https://www.foo.com/foo.mp3\"/> one <audio src=\"https://www.foo.com/foo.mp3\"/> two <audio src=\"https://www.foo.com/foo.mp3\"/> three <audio src=\"https://www.foo.com/foo.mp3\"/> four <audio src=\"https://www.foo.com/foo.mp3\"/> five <audio src=\"https://www.foo.com/foo.mp3\"/> six </speak>', null, 'Too many audio files');

// Duration checks

// Final summary
console.log('\r\nRan ' + (succeeded + failed) + ' tests; ' + succeeded + ' passed and ' + failed + ' failed');
