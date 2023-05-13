
const lib = require('../index');

let succeeded = 0;
let failed = 0;

function runTest(testName, ssml, options, expectedResult) {
  return lib.check(ssml, options).then((retVal) => {
    let result;

    if (retVal) {
      result = '';
      retVal.forEach((value) => {
        if (value.position) {
          // Mark the position
          result += 'at position ' + value.position + ' ';
        }

        if (value.type === 'audio') {
          // It's an audio error
          result += 'audio file ' + value.value + ' ' + value.detail;
        } else if (value.tag) {
          result += value.tag + ' tag has invalid ';
          if (value.value) {
            result += value.attribute + ' value ' + value.value;
          } else if (value.attribute) {
            result += 'attribute ' + value.attribute;
          }
        } else {
          result += value.type;
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

    return 0;
  });
}

function runCorrection(testName, ssml, options, expectedResult) {
  return lib.verifyAndFix(ssml, options).then((retVal) => {
    let result = (retVal.fixedSSML) ? retVal.fixedSSML : 'valid';
    if (result == expectedResult) {
      succeeded++;
    } else {
      result = retVal.fixedSSML || JSON.stringify(retVal.errors) || 'valid';
      console.log('FAIL: ' + testName + ' returned ' + result + ' rather than ' + expectedResult);
      failed++;
    }

    return 0;
  });
}

const start = Date.now();
const promises = [];

promises.push(runTest('Simple SSML', '<speak>Simple test</speak>', null, 'valid'));

// Whisper tests
promises.push(runTest('Whisper effect', '<speak><amazon:effect name="whispered">Simple test <break strength="medium"/> code</amazon:effect></speak>', {platform: 'amazon'}, 'valid'));
promises.push(runTest('Whisper effect', '<speak><amazon:effect name="whispering">Simple test <break strength="medium"/> code</amazon:effect></speak>', {platform: 'amazon'}, 'amazon:effect tag has invalid name value whispering'));

// Amazon:emotion and amazom:domain
promises.push(runTest('Valid emotion', '<speak><amazon:emotion name="excited" intensity="medium">Christina wins this round!</amazon:emotion></speak>', {platform: 'amazon', locale: 'en-US'}, 'valid'));
promises.push(runTest('Valid emotion', '<speak><amazon:emotion name="disappointed" intensity="high">Here I am with a brain the size of a planet and they ask me to pick up a piece of paper.</amazon:emotion></speak>', {platform: 'amazon', locale: 'en-US'}, 'valid'));
promises.push(runTest('Valid domain', '<speak><amazon:domain name="news">TA miniature manuscript written by the teenage Charlotte Bronte is returning to her childhood home in West Yorkshire after it was bought by a British museum at auction in Paris. </amazon:domain></speak>', {platform: 'amazon', locale: 'en-AU'}, 'valid'));
promises.push(runTest('Invalid locale', '<speak><amazon:domain name="music">Sweet Child O’ Mine by Guns N’ Roses became one of their most successful singles, topping the billboard Hot 100 in 1988. Slash’s guitar solo on this song was ranked the 37th greatest solo of all time. Here’s Sweet Child O’ Mine. </amazon:domain></speak>', {platform: 'amazon', locale: 'en-AU'}, 'amazon:domain tag has invalid name value music'));
promises.push(runTest('No locale domain', '<speak><amazon:domain name="conversational">Hi! Hello World</amazon:domain></speak>', {platform: 'amazon'}, 'valid'));
promises.push(runTest('No locale breath', '<speak><amazon:breath duration="medium" volume="x-loud">Agents are assisting other callers</amazon:breath></speak>', {platform: 'amazon'}, 'valid'));

// Audio tests
promises.push(runTest('Valid audio', '<speak><audio src="foo.mp3" clipBegin="2.2s" clipEnd="3000ms" repeatCount="3"/> You like that?</speak>', {platform: 'google'}, 'valid'));
promises.push(runTest('Invalid Amazon audio', '<speak><audio src="foo.mp3" clipBegin="2.2s" clipEnd="3000ms" repeatCount="3"/> You like that?</speak>', {platform: 'amazon'}, 'audio tag has invalid attribute clipBeginaudio tag has invalid attribute clipEndaudio tag has invalid attribute repeatCount'));

// Break tests
promises.push(runTest('With break', '<speak>You lost <break time="200ms"/> Getting used to losing?  Take a break and come back tomorrow</speak>', null, 'valid'));
promises.push(runTest('With break in seconds', '<speak>You lost <break time="2.5s"/> Getting used to losing?  Take a break and come back tomorrow</speak>', null, 'valid'));
promises.push(runTest('Break with bad attribute', '<speak>You lost <break tim="200ms"/> Getting used to losing?  Take a break and come back tomorrow</speak>', null, 'break tag has invalid attribute tim'));
promises.push(runTest('Break with long attribute', '<speak>You lost <break time="200s"/> Getting used to losing?  Take a break and come back tomorrow</speak>', null, 'break tag has invalid time value 200s'));

// Emphasis tests
promises.push(runTest('Valid emphasis', '<speak>I already told you I <emphasis level="strong">really like</emphasis> that person. </speak>', null, 'valid'));
promises.push(runTest('Bad emphasis', '<speak>I already told you I <emphasis level="cute">really like</emphasis> that person. </speak>', null, 'emphasis tag has invalid level value cute'));
promises.push(runTest('Google emphasis', '<speak>I already told you I <emphasis level="none">really like</emphasis> that person. </speak>', {platform: 'google'}, 'valid'));

// Lang tests
promises.push(runTest('Valid lang', '<speak><lang xml:lang="fr-FR">J\'adore chanter</lang></speak>', {platform: 'amazon'}, 'valid'));
promises.push(runTest('Valid lang Brazil', '<speak><lang xml:lang="pt-BR">Blame it on Rio</lang></speak>', {platform: 'amazon'}, 'valid'));
promises.push(runTest('Invalid lang', '<speak><lang xml:lang="pt-DE">German Portguese</lang></speak>', {platform: 'amazon'}, 'lang tag has invalid xml:lang value pt-DE'));

// p tests
promises.push(runTest('Valid p', '<speak><p>This is the first paragraph. There should be a pause after this text is spoken.</p><p>This is the second paragraph.</p></speak>', null, 'valid'));
promises.push(runTest('Invalid p', '<speak><p dog="cute">This is the first paragraph. There should be a pause after this text is spoken.</p><p>This is the second paragraph.</p></speak>', null, 'p tag has invalid attribute dog'));

// phoneme tests
promises.push(runTest('Valid phoneme', '<speak>You say, <phoneme alphabet="ipa" ph="pɪˈkɑːn">pecan</phoneme>. I say, <phoneme alphabet="ipa" ph="ˈpi.kæn">pecan</phoneme>.</speak>', {platform: 'amazon'}, 'valid'));
promises.push(runTest('Invalid phoneme', '<speak>You say, <phoneme alphabet="ipa2">pecan</phoneme>. I say, <phoneme alphabet="ipa" ph="ˈpi.kæn">pecan</phoneme>.</speak>', {platform: 'amazon'}, 'phoneme tag has invalid alphabet value ipa2'));

// prosody tests
promises.push(runTest('Valid rate', '<speak><prosody rate="slow">Hello world</prosody></speak>', null, 'valid'));
promises.push(runTest('Invalid rate', '<speak><prosody rate="xx-large">Hello world</prosody></speak>', null, 'prosody tag has invalid rate value xx-large'));
promises.push(runTest('Valid rate percent', '<speak><prosody rate="150%">Hello world</prosody></speak>', null, 'valid'));
promises.push(runTest('Invalid rate percent', '<speak><prosody rate="5%">Hello world</prosody></speak>', null, 'prosody tag has invalid rate value 5%'));
promises.push(runTest('Valid pitch', '<speak><prosody pitch="low">Hello world</prosody></speak>', null, 'valid'));
promises.push(runTest('Invalid pitch', '<speak><prosody pitch="x-small">Hello world</prosody></speak>', null, 'prosody tag has invalid pitch value x-small'));
promises.push(runTest('Valid pitch percent positive', '<speak><prosody pitch="+20%">Hello world</prosody></speak>', null, 'valid'));
promises.push(runTest('Valid pitch percent negative', '<speak><prosody pitch="-10.5%">Hello world</prosody></speak>', null, 'valid'));
promises.push(runTest('Invalid pitch percent positive', '<speak><prosody pitch="+60%">Hello world</prosody></speak>', null, 'prosody tag has invalid pitch value +60%'));
promises.push(runTest('Invalid pitch percent negative', '<speak><prosody pitch="-40%">Hello world</prosody></speak>', null, 'prosody tag has invalid pitch value -40%'));
promises.push(runTest('Invalid pitch percent format', '<speak><prosody pitch="+2.5.6%">Hello world</prosody></speak>', null, 'prosody tag has invalid pitch value +2.5.6%'));
promises.push(runTest('Valid volume', '<speak><prosody volume="loud">Hello world</prosody></speak>', null, 'valid'));
promises.push(runTest('Invalid volume', '<speak><prosody volume="xx-large">Hello world</prosody></speak>', null, 'prosody tag has invalid volume value xx-large'));
promises.push(runTest('Valid volume dB', '<speak><prosody volume="+4.5dB">Hello world</prosody></speak>', null, 'valid'));
promises.push(runTest('Invalid volume dB', '<speak><prosody volume="-5.5.5dB">Hello world</prosody></speak>', null, 'prosody tag has invalid volume value -5.5.5dB'));

// say-as tests
promises.push(runTest('Valid say-as Amazon', '<speak><say-as interpret-as="interjection">Wow</say-as></speak>', {platform: 'amazon'}, 'valid'));
promises.push(runTest('Valid say-as Google', '<speak><say-as interpret-as="bleep">Wow</say-as></speak>', {platform: 'google'}, 'valid'));
promises.push(runTest('Invalid say-as all', '<speak><say-as interpret-as="bleep">Wow</say-as></speak>', {platform: 'all'}, 'say-as tag has invalid interpret-as value bleep'));
promises.push(runTest('Valid say-as date', '<speak><say-as interpret-as="date" format="mdy">September 22</say-as></speak>', null, 'valid'));
promises.push(runTest('Invalid say-as', '<speak><say-as interpret-as="interjections">Wow</say-as></speak>', null, 'say-as tag has invalid interpret-as value interjections'));
promises.push(runTest('Invalid say-as date', '<speak><say-as interpret-as="date" format="mddy">September 22</say-as></speak>', null, 'say-as tag has invalid format value mddy'));
promises.push(runTest('Valid Google time', '<speak><say-as interpret-as="time" format="hms12">2:30pm</say-as></speak>', {platform: 'google'}, 'valid'));
promises.push(runTest('Another valid Google time', '<speak><say-as interpret-as="time" format="hh:mms12">2:30pm</say-as></speak>', {platform: 'google'}, 'valid'));
promises.push(runTest('Invalid Google time', '<speak><say-as interpret-as="time" format="hqs12">2:30pm</say-as></speak>', {platform: 'google'}, 'say-as tag has invalid format value hqs12'));

// voice tests
promises.push(runTest('Valid voice', '<speak>I want to tell you a secret. <voice name="Kendra">I am not a real human.</voice>. Can you believe it?</speak>', {platform: 'amazon'}, 'valid'));
promises.push(runTest('Valid voice', '<speak>I want to tell you a secret. <voice name="Samantha">I am not a real human.</voice>. Can you believe it?</speak>', {platform: 'amazon'}, 'voice tag has invalid name value Samantha'));

// Media tests
promises.push(runTest('Valid media', '<speak><seq><media begin="0.5s"><speak>Who invented the Internet?</speak></media><media begin="2.0s"><speak>The Internet was invented by cats.</speak></media><media soundLevel="-6dB"><audio src="https://actions.google.com/.../cartoon_boing.ogg"/></media><media repeatCount="3" soundLevel="+2.28dB" fadeInDur="2s" fadeOutDur="0.2s"><audio src="https://actions.google.com/.../cat_purr_close.ogg"/></media></seq> </speak>', {platform: 'google'}, 'valid'));

// Audio validation tests
promises.push(runTest('Verify valid audio', '<speak><audio src="https://s3-us-west-2.amazonaws.com/alexasoundclips/casinowelcome.mp3"/> You like that?</speak>', {platform: 'amazon', validateAudioFiles: true}, 'valid'));
promises.push(runTest('Verify invalid audio', '<speak><audio src="https://foo.ogg"/> You like that?</speak>', {platform: 'google', validateAudioFiles: true}, 'audio file https://foo.ogg Can\'t access file'));
promises.push(runTest('Verify invalid file', '<speak><audio src="https://foo.wav"/> You like that?</speak>', {validateAudioFiles: true}, 'audio file https://foo.wav Not correct audio format on HTTPS'));
promises.push(runTest('Verify soundbank file', '<speak><audio src="soundbank://soundlibrary/ambience/amzn_sfx_crowd_bar_01"/> You like that?</speak>', {platform: 'amazon', validateAudioFiles: true}, 'valid'));
promises.push(runTest('Invalid soundbank file', '<speak><audio src="soundbank://soundlibrary/ambience/amzn_sfx_crowd_bar_01"/> You like that?</speak>', {validateAudioFiles: true}, 'audio file soundbank://soundlibrary/ambience/amzn_sfx_crowd_bar_01 Not correct audio format on HTTPS'));
promises.push(runTest('Invalid soundbank category', '<speak><audio src="soundbank://soundlibrary/test/amzn_sfx_crowd_bar_01"/> You like that?</speak>', {platform: 'amazon', validateAudioFiles: true}, 'audio file soundbank://soundlibrary/test/amzn_sfx_crowd_bar_01 Invalid soundbank category test'));
promises.push(runTest('Valid Google OOG', '<speak><audio speed="80%" soundLevel="-20.5dB" src="https://actions.google.com/sounds/v1/animals/cat_purr_close.ogg"><desc>a cat purring</desc>PURR (sound didn\'t load)</audio></speak>', {platform: 'google', validateAudioFiles: true}, 'valid'));
promises.push(runTest('Invalid Google speed', '<speak><audio speed="40%" src="https://actions.google.com/sounds/v1/animals/cat_purr_close.ogg"><desc>a cat purring</desc>PURR (sound didn\'t load)</audio></speak>', {platform: 'google'}, 'audio tag has invalid speed value 40%'));
promises.push(runTest('Invalid Google sound level', '<speak><audio soundLevel="+50dB" src="https://actions.google.com/sounds/v1/animals/cat_purr_close.ogg"><desc>a cat purring</desc>PURR (sound didn\'t load)</audio></speak>', {platform: 'google'}, 'audio tag has invalid soundLevel value +50dB'));
promises.push(runTest('Stray desc', '<speak><desc>Some Text</desc></speak>', {platform: 'google'}, 'desc tag has invalid '));

// Unsupported tags
promises.push(runTest('Prosody unsupported', '<speak><prosody rate="slow">Hello world</prosody></speak>', {unsupportedTags: ['prosody']}, 'prosody tag has invalid '));

// Multiple errors
promises.push(runTest('Bad break and invalid prosody rate', '<speak>You lost <break tim="200ms"/> Getting used to losing?  <prosody rate="xx-large">Take a break and come back tomorrow</prosody></speak>', null, 'break tag has invalid attribute timprosody tag has invalid rate value xx-large'));

// Invalid formats
promises.push(runTest('Invalid XML', '<tag>What is this?', null, 'Can\'t parse SSML'));
promises.push(runTest('Too many audio files', '<speak><audio src=\"https://www.foo.com/foo.mp3\"/> one <audio src=\"https://www.foo.com/foo.mp3\"/> two <audio src=\"https://www.foo.com/foo.mp3\"/> three <audio src=\"https://www.foo.com/foo.mp3\"/> four <audio src=\"https://www.foo.com/foo.mp3\"/> five <audio src=\"https://www.foo.com/foo.mp3\"/> six </speak>', null, 'Too many audio files'));
promises.push(runTest('Invalid platform', '<speak>Hello there</speak>', {platform: 'siri'}, 'invalid platform'));
promises.push(runTest('Invalid ampersand', '<speak>This & that</speak>', null, 'Invalid & character'));

// Position tests
promises.push(runTest('Invalid say-as all with position', '<speak><say-as interpret-as="bleep">Wow</say-as></speak>', {platform: 'all', getPositions: true}, 'at position 7 say-as tag has invalid interpret-as value bleep'));
promises.push(runTest('Invalid locale with position', '<speak><amazon:domain name="music">Sweet Child O’ Mine by Guns N’ Roses became one of their most successful singles, topping the billboard Hot 100 in 1988. Slash’s guitar solo on this song was ranked the 37th greatest solo of all time. Here’s Sweet Child O’ Mine. </amazon:domain></speak>', {platform: 'amazon', locale: 'en-AU', getPositions: true}, 'at position 7 amazon:domain tag has invalid name value music'));
promises.push(runTest('Invalid Phonation with position', '<speak><amazon:effect name="drc" phonation="softly">Simple test with phonation<break strength="medium"/> code</amazon:effect></speak>', {platform: 'amazon', getPositions: true}, 'at position 7 amazon:effect tag has invalid phonation value softly'));
promises.push(runTest('Bad break and invalid prosody rate with position', '<speak>You lost <break tim="200ms"/> Getting used to losing?  <prosody rate="xx-large">Take a break and come back tomorrow</prosody></speak>', {getPositions: true}, 'at position 16 break tag has invalid attribute timat position 62 prosody tag has invalid rate value xx-large'));
promises.push(runTest('Too many audio files with position', '<speak><audio src=\"https://www.foo.com/foo.mp3\"/> one <audio src=\"https://www.foo.com/foo.mp3\"/> two <audio src=\"https://www.foo.com/foo.mp3\"/> three <audio src=\"https://www.foo.com/foo.mp3\"/> four <audio src=\"https://www.foo.com/foo.mp3\"/> five <audio src=\"https://www.foo.com/foo.mp3\"/> six </speak>', {getPositions: true}, 'at position 246 Too many audio files'));
promises.push(runTest('Invalid tag with position', '<speak><break time="20000ms"/><tag>What is this?</tag>This &amp; that</speak>', {getPositions: true}, 'at position 7 break tag has invalid time value 20000msat position 30 tag tag has invalid '));

// Test correct function
promises.push(runCorrection('Too many audio files', '<speak><audio src=\"https://www.foo.com/foo.mp3\"/> one <audio src=\"https://www.foo.com/foo.mp3\"/> two <audio src=\"https://www.foo.com/foo.mp3\"/> three <audio src=\"https://www.foo.com/foo.mp3\"/> four <audio src=\"https://www.foo.com/foo.mp3\"/> five <audio src=\"https://www.foo.com/foo.mp3\"/> six </speak>', null, '<speak><audio src="https://www.foo.com/foo.mp3"/> one <audio src="https://www.foo.com/foo.mp3"/> two <audio src="https://www.foo.com/foo.mp3"/> three <audio src="https://www.foo.com/foo.mp3"/> four <audio src="https://www.foo.com/foo.mp3"/> five  six </speak>'));
promises.push(runCorrection('Invalid ampersand', '<speak>This & that</speak>', null, '<speak>This &amp; that</speak>'));
promises.push(runCorrection('Invalid prosody rate', '<speak><prosody rate="5%">Hello world</prosody></speak>', null, '<speak><prosody rate="20%">Hello world</prosody></speak>'));
promises.push(runCorrection('Invalid volume', '<speak><prosody pokemon="pikachu" volume="louder">Hello <break time="200ms"/> world</prosody></speak>', null, '<speak><prosody volume="+0dB">Hello <break time="200ms"/> world</prosody></speak>'));
promises.push(runCorrection('Whisper effect', '<speak><amazon:effect>Simple test <break strength="medium"/> code</amazon:effect></speak>', {platform: 'amazon'}, '<speak><amazon:effect name="whispered">Simple test <break strength="medium"/> code</amazon:effect></speak>'));
promises.push(runCorrection('Invalid tag', '<speak><tag>What is this?</tag><break time="20000ms"/>This & that</speak>', null, '<speak>What is this?<break time="10s"/>This &amp; that</speak>'));
promises.push(runCorrection('Correct voice', '<speak>I want to tell you a secret. <voice name="Samantha">I am not a real human.</voice>. Can you believe it?</speak>', {platform: 'amazon'}, '<speak>I want to tell you a secret. <voice name="Ivy">I am not a real human.</voice>. Can you believe it?</speak>'));
promises.push(runCorrection('Correct say-as all', '<speak><say-as interpret-as="bleep">Wow</say-as></speak>', {platform: 'all'}, '<speak><say-as interpret-as="cardinal">Wow</say-as></speak>'));
promises.push(runCorrection('Invalid Google speed', '<speak><audio speed="140" src="https://actions.google.com/sounds/v1/animals/cat_purr_close.ogg"><desc>a cat purring</desc>PURR (sound didn\'t load)</audio></speak>', {platform: 'google'}, '<speak><audio speed="140%" src="https://actions.google.com/sounds/v1/animals/cat_purr_close.ogg"><desc>a cat purring</desc>PURR (sound didn\'t load)</audio></speak>'));
promises.push(runCorrection('Prosody invalid', '<speak><prosody rate="slow" pitch="soft">Come in!<break time="0.5"/>Welcome to the terrifying world of the imagination.</prosody></speak>', {platform: 'google'}, '<speak><prosody rate="slow" pitch="+0%">Come in!<break time="0.5"/>Welcome to the terrifying world of the imagination.</prosody></speak>'));
promises.push(runCorrection('Bad audio', '<speak><audio src="https://foo.mp3"/>This & that</speak>', {validateAudioFiles: true}, '<speak>This &amp; that</speak>'));
promises.push(runCorrection('One bad one good audio', '<speak><audio src="https://foo.mp3"/><audio src="https://s3-us-west-2.amazonaws.com/alexasoundclips/casinowelcome.mp3"/>This & that</speak>', {platform: 'amazon', validateAudioFiles: true}, '<speak><audio src="https://s3-us-west-2.amazonaws.com/alexasoundclips/casinowelcome.mp3"/>This &amp; that</speak>'));
promises.push(runCorrection('Invalid soundbank category', '<speak><audio src="soundbank://soundlibrary/test/amzn_sfx_crowd_bar_01"/> You like that?</speak>', {platform: 'amazon', validateAudioFiles: true}, '<speak> You like that?</speak>'));
promises.push(runCorrection('Valid Google OOG', '<speak><audio speed="80%" soundLevel="-20.5dB" src="https://actions.google.com/sounds/v1/animals/cat_purr_close.ogg"><desc>a cat purring</desc>PURR (sound didn\'t load)</audio></speak>', {platform: 'google', validateAudioFiles: true}, 'valid'));
promises.push(runCorrection('Readme sample', '<speak><tag><prosody rate="60">Hello world</prosody></tag></speak>', null, '<speak><prosody rate="60%">Hello world</prosody></speak>'));

// Final summary
Promise.all(promises).then(() => {
  console.log('\r\nRan ' + (succeeded + failed) + ' tests in ' + (Date.now() - start) + 'ms; ' + succeeded + ' passed and ' + failed + ' failed');
});
