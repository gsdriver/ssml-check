
const lib = require('../index');

let succeeded = 0;
let failed = 0;

function runTest(testName, ssml, options, expectedResult) {
  const retVal = lib.check(ssml, options);
  let result;

  if (retVal) {
    result = '';
    retVal.forEach((value) => {
      if (value.tag) {
        result += value.tag + ' tag has invalid ';
        if (value.value) {
          result += value.attribute + ' value ' + value.value;
        } else if (value.attribute) {
          result += 'attribute ' + value.attribute;
        }
      } else {
        result = value.type;
      }
    });
  } else {
    result = 'valid';
  }

  if (result == expectedResult) {
    succeeded++;
  } else {
    console.log('FAIL: ' + testName + ' returned ' + result + ' rather than ' + expectedResult);
    failed++;
  }
}

const start = Date.now();

runTest('Simple SSML', '<speak>Simple test</speak>', null, 'valid');

// Whisper tests
runTest('Whisper effect', '<speak><amazon:effect name="whispered">Simple test <break strength="medium"/> code</amazon:effect></speak>', {platform: 'amazon'}, 'valid');
runTest('Whisper effect', '<speak><amazon:effect name="whispering">Simple test <break strength="medium"/> code</amazon:effect></speak>', {platform: 'amazon'}, 'amazon:effect tag has invalid name value whispering');

// Audio tests
runTest('Valid audio', '<speak><audio src="foo.mp3" clipBegin="2.2s" clipEnd="3000ms" repeatCount="3"/> You like that?</speak>', {platform: 'google'}, 'valid');
runTest('Invalid Amazon audio', '<speak><audio src="foo.mp3" clipBegin="2.2s" clipEnd="3000ms" repeatCount="3"/> You like that?</speak>', {platform: 'amazon'}, 'audio tag has invalid attribute clipBeginaudio tag has invalid attribute clipEndaudio tag has invalid attribute repeatCount');

// Break tests
runTest('With break', '<speak>You lost <break time="200ms"/> Getting used to losing?  Take a break and come back tomorrow</speak>', null, 'valid');
runTest('With break in seconds', '<speak>You lost <break time="2.5s"/> Getting used to losing?  Take a break and come back tomorrow</speak>', null, 'valid');
runTest('Break with bad attribute', '<speak>You lost <break tim="200ms"/> Getting used to losing?  Take a break and come back tomorrow</speak>', null, 'break tag has invalid attribute tim');
runTest('Break with long attribute', '<speak>You lost <break time="200s"/> Getting used to losing?  Take a break and come back tomorrow</speak>', null, 'break tag has invalid time value 200s');

// Emphasis tests
runTest('Valid emphasis', '<speak>I already told you I <emphasis level="strong">really like</emphasis> that person. </speak>', null, 'valid');
runTest('Bad emphasis', '<speak>I already told you I <emphasis level="cute">really like</emphasis> that person. </speak>', null, 'emphasis tag has invalid level value cute');
runTest('Google emphasis', '<speak>I already told you I <emphasis level="none">really like</emphasis> that person. </speak>', {platform: 'google'}, 'valid');

// Lang tests
runTest('Valid lang', '<speak><lang xml:lang="fr-FR">J\'adore chanter</lang></speak>', {platform: 'amazon'}, 'valid');
runTest('Invalid lang', '<speak><lang xml:lang="pt-BR">Blame it on Rior</lang></speak>', {platform: 'amazon'}, 'lang tag has invalid xml:lang value pt-BR');

// p tests
runTest('Valid p', '<speak><p>This is the first paragraph. There should be a pause after this text is spoken.</p><p>This is the second paragraph.</p></speak>', null, 'valid');
runTest('Invalid p', '<speak><p dog="cute">This is the first paragraph. There should be a pause after this text is spoken.</p><p>This is the second paragraph.</p></speak>', null, 'p tag has invalid attribute dog');

// phoneme tests
runTest('Valid phoneme', '<speak>You say, <phoneme alphabet="ipa" ph="pɪˈkɑːn">pecan</phoneme>. I say, <phoneme alphabet="ipa" ph="ˈpi.kæn">pecan</phoneme>.</speak>', {platform: 'amazon'}, 'valid');
runTest('Invalid phoneme', '<speak>You say, <phoneme alphabet="ipa2">pecan</phoneme>. I say, <phoneme alphabet="ipa" ph="ˈpi.kæn">pecan</phoneme>.</speak>', {platform: 'amazon'}, 'phoneme tag has invalid alphabet value ipa2');

// prosody tests
runTest('Valid rate', '<speak><prosody rate="slow">Hello world</prosody></speak>', null, 'valid');
runTest('Invalid rate', '<speak><prosody rate="xx-large">Hello world</prosody></speak>', null, 'prosody tag has invalid rate value xx-large');
runTest('Valid rate percent', '<speak><prosody rate="150%">Hello world</prosody></speak>', null, 'valid');
runTest('Invalid rate percent', '<speak><prosody rate="5%">Hello world</prosody></speak>', null, 'prosody tag has invalid rate value 5%');
runTest('Valid pitch', '<speak><prosody pitch="low">Hello world</prosody></speak>', null, 'valid');
runTest('Invalid pitch', '<speak><prosody pitch="x-small">Hello world</prosody></speak>', null, 'prosody tag has invalid pitch value x-small');
runTest('Valid pitch percent positive', '<speak><prosody pitch="+20%">Hello world</prosody></speak>', null, 'valid');
runTest('Valid pitch percent negative', '<speak><prosody pitch="-10.5%">Hello world</prosody></speak>', null, 'valid');
runTest('Invalid pitch percent positive', '<speak><prosody pitch="+60%">Hello world</prosody></speak>', null, 'prosody tag has invalid pitch value +60%');
runTest('Invalid pitch percent negative', '<speak><prosody pitch="-40%">Hello world</prosody></speak>', null, 'prosody tag has invalid pitch value -40%');
runTest('Invalid pitch percent format', '<speak><prosody pitch="+2.5.6%">Hello world</prosody></speak>', null, 'prosody tag has invalid pitch value +2.5.6%');
runTest('Valid volume', '<speak><prosody volume="loud">Hello world</prosody></speak>', null, 'valid');
runTest('Invalid volume', '<speak><prosody volume="xx-large">Hello world</prosody></speak>', null, 'prosody tag has invalid volume value xx-large');
runTest('Valid volume dB', '<speak><prosody volume="+4.5dB">Hello world</prosody></speak>', null, 'valid');
runTest('Invalid volume dB', '<speak><prosody volume="-5.5.5dB">Hello world</prosody></speak>', null, 'prosody tag has invalid volume value -5.5.5dB');

// say-as tests
runTest('Valid say-as Amazon', '<speak><say-as interpret-as="interjection">Wow</say-as></speak>', {platform: 'amazon'}, 'valid');
runTest('Valid say-as Google', '<speak><say-as interpret-as="bleep">Wow</say-as></speak>', {platform: 'google'}, 'valid');
runTest('Invalid say-as all', '<speak><say-as interpret-as="bleep">Wow</say-as></speak>', {platform: 'all'}, 'say-as tag has invalid interpret-as value bleep');
runTest('Valid say-as date', '<speak><say-as interpret-as="date" format="mdy">September 22</say-as></speak>', null, 'valid');
runTest('Invalid say-as', '<speak><say-as interpret-as="interjections">Wow</say-as></speak>', null, 'say-as tag has invalid interpret-as value interjections');
runTest('Invalid say-as date', '<speak><say-as interpret-as="date" format="mddy">September 22</say-as></speak>', null, 'say-as tag has invalid format value mddy');

// voice tests
runTest('Valid voice', '<speak>I want to tell you a secret. <voice name="Kendra">I am not a real human.</voice>. Can you believe it?</speak>', {platform: 'amazon'}, 'valid');
runTest('Valid voice', '<speak>I want to tell you a secret. <voice name="Samantha">I am not a real human.</voice>. Can you believe it?</speak>', {platform: 'amazon'}, 'voice tag has invalid name value Samantha');

// Media tests
runTest('Valid media', '<speak><seq><media begin="0.5s"><speak>Who invented the Internet?</speak></media><media begin="2.0s"><speak>The Internet was invented by cats.</speak></media><media soundLevel="-6dB"><audio src="https://actions.google.com/.../cartoon_boing.ogg"/></media><media repeatCount="3" soundLevel="+2.28dB" fadeInDur="2s" fadeOutDur="0.2s"><audio src="https://actions.google.com/.../cat_purr_close.ogg"/></media></seq> </speak>', {platform: 'google'}, 'valid');

// Multiple errors
runTest('Bad break and invalid prosody rate', '<speak>You lost <break tim="200ms"/> Getting used to losing?  <prosody rate="xx-large">Take a break and come back tomorrow</prosody></speak>', null, 'break tag has invalid attribute timprosody tag has invalid rate value xx-large');

// Invalid formats
runTest('Invalid XML', '<tag>What is this?', null, 'Can\'t parse SSML');
runTest('Too many audio files', '<speak><audio src=\"https://www.foo.com/foo.mp3\"/> one <audio src=\"https://www.foo.com/foo.mp3\"/> two <audio src=\"https://www.foo.com/foo.mp3\"/> three <audio src=\"https://www.foo.com/foo.mp3\"/> four <audio src=\"https://www.foo.com/foo.mp3\"/> five <audio src=\"https://www.foo.com/foo.mp3\"/> six </speak>', null, 'Too many audio files');
runTest('Invalid platform', '<speak>Hello there</speak>', {platform: 'siri'}, 'invalid platform');

// Final summary
console.log('\r\nRan ' + (succeeded + failed) + ' tests in ' + (Date.now() - start) + 'ms; ' + succeeded + ' passed and ' + failed + ' failed');
