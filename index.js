//
// Check for valid SSML
//

const convert = require('xml-js');

function breakDuration(text) {
  // It must be of the form #s or #ms
  let time;
  if (text.match('[0-9]+ms')) {
    time = parseInt(text);
  } else if (text.match('[0-9]+s')) {
    time = 1000 * parseInt(text);
  } else {
    // No good
    return undefined;
  }
  return (time <= 10000) ? time : undefined;
}

function estimateDuration(element) {
  let duration = 0;

  if (element.elements) {
    element.elements.forEach((item) => {
      duration += estimateDuration(item);
    });
  } else if (element.name === 'audio') {
    // Count as 100 ms
    duration = 100;
  } else if (element.name === 'break') {
    if (element.attributes && element.attributes.time) {
      duration = breakDuration(element.attributes.time);
    }
  } else if ((element.type === 'text') && element.text) {
    duration = 60 * element.text.length;
  }

  return duration;
}

function findLongestText(element) {
  let longest = 0;

  if (element.elements) {
    let itemLen;
    element.elements.forEach((item) => {
      itemLen = findLongestText(item);
      if (itemLen > longest) {
        longest = itemLen;
      }
    });
  } else if ((element.type === 'text') && element.text) {
    longest = element.text.length;
  }

  return longest;
}

function countAudioFiles(element) {
  let files = 0;

  if (element.elements) {
    element.elements.forEach((item) => {
      files += countAudioFiles(item);
    });
  } else if (element.name === 'audio') {
    files = 1;
  }

  return files;
}

function checkForValidTags(element) {
  const validTags = ['amazon:effect', 'audio', 'break', 'emphasis',
    'lang', 'p', 'phoneme', 'prosody', 's', 'say-as', 'speak',
    'sub', 'voice', 'w'];
  let invalidTag;

  if (element.name) {
    if (validTags.indexOf(element.name) === -1) {
      invalidTag = element.name + ' is an invalid tag';
    } else {
      // Let's check values based on the tag
      const attributes = Object.keys(element.attributes || {});

      switch (element.name) {
        case 'amazon:effect':
          // Must be name attribute with whispered value
          if (attributes.length !== 1) {
            invalidTag = 'amazon:effect has invalid attributes';
          } else if (element.attributes.name !== 'whispered') {
            invalidTag = 'amazon:effect has invalid name value ' + element.attributes.name;
          }
          break;
        case 'audio':
          // src is required
          if (attributes.length !== 1) {
            invalidTag = 'audio has invalid attributes';
          } else if (attributes[0] !== 'src') {
            invalidTag = 'audio has invalid attribute ' + attributes[0];
          }
          break;
        case 'break':
          // Attribute must be time or strength
          attributes.forEach((attribute) => {
            if (attribute === 'strength') {
              if (['none', 'x-weak', 'weak', 'medium', 'strong', 'x-strong']
                .indexOf(element.attributes.strength) === -1) {
                invalidTag = 'break tag has invalid strength value ' + element.attributes.strength;
              }
            } else if (attribute === 'time') {
              // Must be valid duration
              if (breakDuration(element.attributes.time) === undefined) {
                invalidTag = 'break tag has invalid time value ' + element.attributes.time;
              }
            } else {
              // Invalid attribute
              invalidTag = 'break tag has invalid attribute ' + attribute;
            }
          });
          break;
        case 'emphasis':
          // Must be level attribute
          if (attributes.length !== 1) {
            invalidTag = 'amazon:effect has invalid attributes';
          } else if (attributes[0] !== 'level') {
            invalidTag = 'emphasis has invalid attribute ' + attributes[0];
          } else {
            if (['strong', 'moderate', 'reduced']
              .indexOf(element.attributes.level) === -1) {
              invalidTag = 'emphasis tag has invalid level value ' + element.attributes.level;
            }
          }
          break;
        case 'lang':
          // Must be xml:lang attribute
          if (attributes.length !== 1) {
            invalidTag = 'lang has invalid attributes';
          } else if (attributes[0] !== 'xml:lang') {
            invalidTag = 'lang has invalid attribute ' + attributes[0];
          } else {
            if (['en-US', 'en-GB', 'en-IN', 'en-AU', 'en-CA', 'de-DE', 'es-ES', 'it-IT', 'ja-JP', 'fr-FR']
              .indexOf(element.attributes['xml:lang']) === -1) {
              invalidTag = 'lang tag has invalid xml:lang value ' + element.attributes['xml:lang'];
            }
          }
          break;
        case 'p':
          if (attributes.length > 0) {
            invalidTag = 'p tag should have no attributes';
          }
          break;
        case 'phoneme':
          // Attribute must be time or strength
          attributes.forEach((attribute) => {
            if (attribute === 'alphabet') {
              if (['ipa', 'x-sampa']
                .indexOf(element.attributes.alphabet) === -1) {
                invalidTag = 'phoneme tag has invalid alphabet value ' + element.attributes.alphabet;
              }
            } else if (attribute !== 'ph') {
              // Invalid attribute
              invalidTag = 'phoneme tag has invalid attribute ' + attribute;
            }
          });
          break;
        case 'prosody':
          break;
        case 's':
          if (attributes.length > 0) {
            invalidTag = 's tag should have no attributes';
          }
          break;
        case 'say-as':
          break;
        case 'sub':
          // alias is optional
          attributes.forEach((attribute) => {
            if (attribute !== 'alias') {
              // Invalid attribute
              invalidTag = 'sub tag has invalid attribute ' + attribute;
            }
          });
          break;
        case 'voice':
          // Attribute must be name
          attributes.forEach((attribute) => {
            if (attribute === 'name') {
              if (['Ivy', 'Joanna', 'Joey', 'Justin', 'Kendra', 'Kimberly', 'Matthew', 'Salli',
                  'Nicole', 'Russell', 'Amy', 'Brian', 'Emma', 'Aditi', 'Raveena',
                  'Hans', 'Marlene', 'Vicki', 'Conchita', 'Enrique',
                  'Carla', 'Giorgio', 'Mizuki', 'Takumi', 'Celine', 'Lea', 'Mathieu']
                .indexOf(element.attributes.name) === -1) {
                invalidTag = 'voice tag has invalid name value ' + element.attributes.name;
              }
            } else {
              // Invalid attribute
              invalidTag = 'voice tag has invalid attribute ' + attribute;
            }
          });
          break;
        case 'w':
          // Attribute must be role
          attributes.forEach((attribute) => {
            if (attribute === 'role') {
              if (['amazon:VB', 'amazon:VBD', 'amazon:NN', 'amazon:SENSE_1']
                .indexOf(element.attributes.role) === -1) {
                invalidTag = 'w tag has invalid name value ' + element.attributes.role;
              }
            } else {
              // Invalid attribute
              invalidTag = 'w tag has invalid attribute ' + attribute;
            }
          });
          break;
        default:
          break;
      }
    }
  }

  if (!invalidTag && element.elements) {
    element.elements.forEach((item) => {
      let result = checkForValidTags(item);
      if (!invalidTag) {
        invalidTag = result;
      }
    });
  }

  return invalidTag;
}

function checkDuration(speech, options) {
  let maxDuration;
  let maxTextRun;
  let result;

  if (options.maxDuration) {
    maxDuration = parseInt(options.maxDuration);
  }
  if (!maxDuration || isNaN(maxDuration)) {
    maxDuration = 10000;
  }
  if (options.maxTextRun) {
    maxTextRun = parseInt(options.maxTextRun);
  }
  if (!maxTextRun || isNaN(maxTextRun)) {
    maxTextRun = 5000;
  }

  // Is this more than 6 seconds?
  const maxRun = findLongestText(speech);
  if (maxRun * 60 > maxTextRun) {
    result = 'Run-on text';
  }

  if (!result) {
    // Now check if the total response is more than 10 seconds
    const duration = estimateDuration(speech);
    if (duration > maxDuration) {
      result = 'Too long';
    }
  }

  return result;
}

module.exports = {
  check: function(ssml, options) {
    try {
      let result;
      let text = ssml;
      const userOptions = options || {platform: 'alexa'};
      userOptions.checkVUI = userOptions.checkVUI || {};

      // We only support (and default to) the Alexa platform
      if (userOptions.platform && (userOptions.platform !== 'alexa')) {
        return 'Invalid platform';
      }

      // Look for and turn periods into 100 ms pauses
      // and commas into 50 ms pauses
      text = text.replace(/[.?!] /g, ' <break time="100ms"/> ');
      text = text.replace(/, /g, ' <break time="50ms"/> ');

      // This needs to be a single item wrapped in a speak tag
      let speech;
      try {
        const result = JSON.parse(convert.xml2json(text, {compact: false}));
        if (result.elements && (result.elements.length === 1) &&
          (result.elements[0].name === 'speak')) {
          speech = result.elements[0];
        } else {
          return 'Not wrapped in speak';
        }
      } catch (err) {
        return 'Can\'t parse SSML';
      }

      // Make sure only valid tags are present
      const invalidTag = checkForValidTags(speech);
      if (invalidTag) {
        return invalidTag;
      }

      // Count the audio files - is it more than 5?
      const audio = countAudioFiles(speech);
      if (audio > 5) {
        return 'Too many audio files';
      }

      // Check the duration if requested
      if (userOptions.checkVUI.duration) {
        result = checkDuration(speech, userOptions.checkVUI);
        if (result) {
          return result;
        }
      }
    } catch (err) {
      return 'Unknown error';
    }

    // OK, looks like it's OK!
    return 'valid';
  }
};
