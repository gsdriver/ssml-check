//
// Check for valid SSML
//

const convert = require('xml-js');

function createTagError(element, attribute, undefinedValue) {
  const error = {type: 'tag', tag: element.name};

  error.type = 'tag';
  error.tag = element.name;
  error.attribute = attribute;
  error.value = (undefinedValue) ? undefined : element.attributes[attribute];
  return error;
}

function prosodyRate(text) {
  const rates = ['x-slow', 'slow', 'medium', 'fast', 'x-fast'];
  const values = [0.3, 0.6, 1, 1.5, 2];

  let i = rates.indexOf(text);
  if (i > -1) {
    return values[i];
  }

  // It must be of the form #%
  let rate;
  if (text.match('[0-9]+%')) {
    rate = parseInt(text);
    if (rate < 20) {
      rate = undefined;
    }
  }

  return (rate) ? (rate / 100.0) : undefined;
}

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

function checkForValidTags(errors, element) {
  const validTags = ['amazon:effect', 'audio', 'break', 'emphasis',
    'lang', 'p', 'phoneme', 'prosody', 's', 'say-as', 'speak',
    'sub', 'voice', 'w'];

  if (element.name) {
    if (validTags.indexOf(element.name) === -1) {
      errors.push({type: 'tag', tag: element.name});
    } else {
      // Let's check values based on the tag
      const attributes = Object.keys(element.attributes || {});

      switch (element.name) {
        case 'amazon:effect':
          // Must be name attribute with whispered value
          attributes.forEach((attribute) => {
            if (attribute === 'name') {
              if (['whispered'].indexOf(element.attributes.name) === -1) {
                errors.push(createTagError(element, attribute));
              }
            } else {
              // Invalid attribute
              errors.push(createTagError(element, attribute, true));
            }
          });

          // Also, name is required
          if (attributes.length === 0) {
            errors.push(createTagError(element, 'none'));
          }
          break;
        case 'audio':
          // Must be src attribute
          attributes.forEach((attribute) => {
            if (attribute !== 'src') {
              // Invalid attribute
              errors.push(createTagError(element, attribute, true));
            }
          });

          // Also, src is required
          if (attributes.length === 0) {
            errors.push(createTagError(element, 'none'));
          }
          break;
        case 'break':
          // Attribute must be time or strength
          attributes.forEach((attribute) => {
            if (attribute === 'strength') {
              if (['none', 'x-weak', 'weak', 'medium', 'strong', 'x-strong']
                .indexOf(element.attributes.strength) === -1) {
                errors.push(createTagError(element, attribute));
              }
            } else if (attribute === 'time') {
              // Must be valid duration
              if (breakDuration(element.attributes.time) === undefined) {
                errors.push(createTagError(element, attribute));
              }
            } else {
              // Invalid attribute
              errors.push(createTagError(element, attribute, true));
            }
          });
          break;
        case 'emphasis':
          // Must be level attribute
          attributes.forEach((attribute) => {
            if (attribute === 'level') {
              if (['strong', 'moderate', 'reduced']
                .indexOf(element.attributes.level) === -1) {
                errors.push(createTagError(element, attribute));
              }
            } else {
              // Invalid attribute
              errors.push(createTagError(element, attribute, true));
            }
          });

          // Also, level is required
          if (attributes.length === 0) {
            errors.push(createTagError(element, 'none'));
          }
          break;
        case 'lang':
          // Must be xml:lang attribute
          attributes.forEach((attribute) => {
            if (attribute === 'xml:lang') {
              if (['en-US', 'en-GB', 'en-IN', 'en-AU', 'en-CA', 'de-DE', 'es-ES', 'it-IT', 'ja-JP', 'fr-FR']
                .indexOf(element.attributes['xml:lang']) === -1) {
                errors.push(createTagError(element, attribute));
              }
            } else {
              // Invalid attribute
              errors.push(createTagError(element, attribute, true));
            }
          });

          // Also, xml:lang is required
          if (attributes.length === 0) {
            errors.push(createTagError(element, 'none'));
          }
          break;
        case 'p':
          // No attributes allowed
          attributes.forEach((attribute) => {
            errors.push(createTagError(element, attribute, true));
          });
          break;
        case 'phoneme':
          // Attribute must be time or strength
          attributes.forEach((attribute) => {
            if (attribute === 'alphabet') {
              if (['ipa', 'x-sampa']
                .indexOf(element.attributes.alphabet) === -1) {
                errors.push(createTagError(element, attribute));
              }
            } else if (attribute !== 'ph') {
              // Invalid attribute
              errors.push(createTagError(element, attribute, true));
            }
          });
          break;
        case 'prosody':
          // Attribute must be time or strength
          attributes.forEach((attribute) => {
            if (attribute === 'rate') {
              if (!prosodyRate(element.attributes.rate)) {
                errors.push(createTagError(element, attribute));
              }
            } else if (attribute === 'pitch') {
              if (['x-low', 'low', 'medium', 'high', 'x-high'].indexOf(element.attributes.pitch) === -1) {
                // It's OK, it has to be of the form +x% or -x%
                if (element.attributes.pitch.match(/^\+[0-9]+(\.[0-9]+)?%$/g)) {
                  // Number must be less than 50
                  if (parseFloat(element.attributes.pitch) > 50) {
                    errors.push(createTagError(element, attribute));
                  }
                } else if (element.attributes.pitch.match(/^\-[0-9]+(\.[0-9]+)?%$/g)) {
                  // Number must be less than 33.3
                  if (parseFloat(element.attributes.pitch) < -33.3) {
                    errors.push(createTagError(element, attribute));
                  }
                } else {
                  errors.push(createTagError(element, attribute));
                }
              }
            } else if (attribute === 'volume') {
              if (['silent', 'x-soft', 'soft', 'medium', 'loud', 'x-loud'].indexOf(element.attributes.volume) === -1) {
                // It's OK if it's of the form +xdB or - xdB; value doesn't matter
                if (!element.attributes.volume.match(/^[+-][0-9]+(\.[0-9]+)?dB$/g)) {
                  errors.push(createTagError(element, attribute));
                }
              }
            } else {
              // Invalid attribute
              errors.push(createTagError(element, attribute, true));
            }
          });
          break;
        case 's':
          // No attributes allowed
          attributes.forEach((attribute) => {
            errors.push(createTagError(element, attribute, true));
          });
          break;
        case 'say-as':
          // Attribute must be interpret-as or format
          attributes.forEach((attribute) => {
            if (attribute === 'interpret-as') {
              if (['characters', 'spell-out', 'cardinal', 'number', 'ordinal',
                  'digits', 'fraction', 'unit', 'date', 'time', 'telephone',
                  'address', 'interjection', 'expletive'].indexOf(element.attributes['interpret-as']) === -1) {
                errors.push(createTagError(element, attribute));
              }
            } else if (attribute === 'format') {
              if (['mdy', 'dmy', 'ymd', 'md', 'dm', 'ym',
                  'my', 'd', 'm', 'y'].indexOf(element.attributes.format) === -1) {
                errors.push(createTagError(element, attribute));
              }
            } else {
              // Invalid attribute
              errors.push(createTagError(element, attribute, true));
            }
          });
          break;
        case 'sub':
          // alias is optional
          attributes.forEach((attribute) => {
            if (attribute !== 'alias') {
              // Invalid attribute
              errors.push(createTagError(element, attribute, true));
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
                errors.push(createTagError(element, attribute));
              }
            } else {
              // Invalid attribute
              errors.push(createTagError(element, attribute, true));
            }
          });
          break;
        case 'w':
          // Attribute must be role
          attributes.forEach((attribute) => {
            if (attribute === 'role') {
              if (['amazon:VB', 'amazon:VBD', 'amazon:NN', 'amazon:SENSE_1']
                .indexOf(element.attributes.role) === -1) {
                errors.push(createTagError(element, attribute));
              }
            } else {
              // Invalid attribute
              errors.push(createTagError(element, attribute, true));
            }
          });
          break;
        default:
          break;
      }
    }
  }

  if (element.elements) {
    element.elements.forEach((item) => {
      checkForValidTags(errors, item);
    });
  }
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
    const errors = [];

    try {
      let result;
      let text = ssml;
      const userOptions = options || {platform: 'alexa'};
      userOptions.checkVUI = userOptions.checkVUI || {};

      // We only support (and default to) the Alexa platform
      if (userOptions.platform && (userOptions.platform !== 'alexa')) {
        errors.push({type: 'invalid platform'});
        return errors;
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
          errors.push({type: 'tag', tag: 'speak'});
          return errors;
        }
      } catch (err) {
        errors.push({type: 'Can\'t parse SSML'});
        return errors;
      }

      // Make sure only valid tags are present
      checkForValidTags(errors, speech);

      // Count the audio files - is it more than 5?
      const audio = countAudioFiles(speech);
      if (audio > 5) {
        errors.push({type: 'Too many audio files'});
      }

      // Check the duration if requested
      if (userOptions.checkVUI.duration) {
        result = checkDuration(speech, userOptions.checkVUI);
        if (result) {
          errors.push({type: 'VUI', reason: result});
        }
      }
    } catch (err) {
      console.log(err);
      errors.push({type: 'unknown error'});
    }

    // OK, looks like it's OK!
    return (errors.length ? errors : undefined);
  }
};
