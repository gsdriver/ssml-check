//
// Check for valid SSML
//

const convert = require('xml-js');
const https = require('https');
const mm = require('music-metadata');
const ssmlCheckCore = require('ssml-check-core');

function getAudioFiles(element) {
  let files = [];

  if ((element.name === 'audio') && (element.attributes.src)) {
    files.push(element.attributes.src);
  }

  if (element.elements) {
    element.elements.forEach((item) => {
      files = files.concat(getAudioFiles(item));
    });
  }

  return files;
}

function validateAudio(src, platform) {
  const errors = [];

  // It can be one of the built-in Amazon sounds (from the soundbank)
  // We'll check if it has the appropriate structure
  // soundbank://soundlibrary/category/sound
  if (platform === 'amazon') {
    const prefix = 'soundbank://soundlibrary/';
    if (src.indexOf(prefix) === 0) {
      // Parse out the category and sound
      const path = src.slice(prefix.length - src.length).split('/');

      // Does it have a valid category?
      if ((path.length === 2) && (['ambience', 'animals', 'battle',
        'cartoon', 'foley', 'gameshow', 'home', 'human', 'impact',
        'magic', 'musical', 'nature', 'office', 'scifi', 'transportation'].indexOf(path[0]) !== -1)) {
        // We'll say this is good
        return Promise.resolve(errors);
      } else {
        errors.push({type: 'audio', value: src, detail: `Invalid soundbank category ${path[0]}`});
        return Promise.resolve(errors);
      }
    }
  }

  // Alexa - Must be MP3 at HTTPS endpoint
  // Google - Must be MP3 or OGG at HTTPS endpoint
  if (!src.match(/^https(.)+\.mp3/gi)) {
    // It can be OGG if Google platform
    if ((platform !== 'google') || !src.match(/^https(.)+\.ogg/gi)) {
      errors.push({type: 'audio', value: src, detail: 'Not correct audio format on HTTPS'});
      return Promise.resolve(errors);
    }
  }

  // Make sure we can access the audio file
  // The sample rate must be 22050Hz, 24000Hz, or 16000Hz (24000Hz on google)
  // and the bit rate must be 48kbps on amazon or 24-96kpbs on google
  // audio file length cannot be more than 240 seconds (120 seconds on google)
  return new Promise((resolve) => {
    const request = https.get(src, (resp) => {
      const bufs = [];

      resp.on('data', (d) => { bufs.push(d); });

      resp.on('end', () => {
        const buf = Buffer.concat(bufs);
        return mm.parseBuffer(buf, 'audio/mpeg')
        .then((metadata) => {
          metadata.format = metadata.format || {};
          if ([22050, 24000, 16000].indexOf(parseInt(metadata.format.sampleRate)) === -1) {
            errors.push({type: 'audio', value: src, detail: `Invalid sample rate ${metadata.format.sampleRate} Hz`})
          }
          if (((platform !== 'google') || (metadata.format.bitrate < 24000) || (metadata.format.bitrate > 96000))
            && (metadata.format.bitrate != 48000)) {
            errors.push({type: 'audio', value: src, detail: `Invalid bit rate ${metadata.format.bitrate}`})
          }
          if (((platform !== 'amazon') || (metadata.format.duration > 240000))
            && (metadata.format.duration > 120000)) {
            errors.push({type: 'audio', value: src, detail: `Invalid duration ${metadata.format.duration} ms`})
          }
          resolve(errors);
        });
      });
    });

    request.on('error', () => {
      errors.push({type: 'audio', value: src, detail: 'Can\'t access file'});
      resolve(errors);
    });
  });
}

module.exports = {
  check: function(ssml, options) {
    const userOptions = options || {};
    userOptions.platform = userOptions.platform || 'all';

    return ssmlCheckCore.check(ssml, options)
    .then((coreErrors) => {
      let errors = coreErrors || [];

      // If they asked to validate audio files, do that now
      if (userOptions.validateAudioFiles) {
        const promises = [];

        // The input is either a string or a JSON object - convert it if
        // it is a string into a JSON object
        try {
          const result = JSON.parse(convert.xml2json(ssml, {compact: false}));
          const audio = getAudioFiles(result.elements[0]);

          audio.forEach((file) => {
            promises.push(validateAudio(file, userOptions.platform));
          });

          return Promise.all(promises).then((audioErrors) => {
            audioErrors.forEach((audioError) => {
              errors = errors.concat(audioError);
            });
            return (errors.length ? errors : undefined);
          });
        } catch (err) {
          // Just return the errors we already have
          return (errors.length ? errors : undefined);
        }
      } else {
        return coreErrors;
      }
    });
  },
};
