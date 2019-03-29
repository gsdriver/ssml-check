# SSML-Check

SSML-Check will verify that a given input is valid SSML

# Usage

The exposed function from this library is `check` which verifies whether the given input is a valid SSML string on either the Amazon Alexa or Google Assistant platform (or both). This function returns a Promise with an array of errors indicating how the input fails validation, or a Promise of undefined if there are no errors.

```
check(ssml, options)
```

The arguments to these functions are:

 * ssml - The SSML to check
 * options - Options for evaluating the SSML as noted below
 
The options structure is composed of the following fields with the following default values:

```
{
  platform:all,             // The voice platform to evaluate this SSML against.
                            // Valid values are "all", "amazon", or "google".
  validateAudioFiles:false, // Whether to validate audio files against
                            // acceptable formats (bit rate, sample rate, etc)
}
```

The return value is a Promise resolving to an array of errors that were encountered in processing the SSML, or `undefined` if no errors were encountered.  The format of each error object is as follows:

```
{
  type,       // The type of error encountered ("tag," "audio" or a specific error)
  tag,        // The tag that had an error (set if type is "tag")
  attribute,  // The attribute that had an error (set if type is "tag")
  value,      // The attribute value that was in error (set if type is "tag" or "audio")
  detail,     // Further details about the error (set if type is "audio")
}
```
The current version of ssml-check will check for the following:

 * Valid XML format
 * All tags are valid tags for their platform with valid attributes and values
 * No more than five `audio` tags in the response
 * Note invalid & character
 * Valid audio file format (HTTPS, MP3, length, bit rate, sample rate), if validateAudioFiles is set
 
# Examples

```
const ssmlCheck = require('ssml-check');
ssmlCheck.check('<speak><prosody rate="5%">Hello world</prosody></speak>')
.then((errors) => {
  if (errors) {
    console.log(JSON.stringify(errors));
  } else {
    console.log('SSML is clean');
  }
});
```
will output `[{"type":"tag","tag":"prosody","attribute":"rate","value":"5%"}]`

```
const ssmlCheck = require('ssml-check');
ssmlCheck.check('<speak><audio src="https://foo.mp3"/></speak>', {validateAudioFiles: true})
.then((errors) => {
  if (errors) {
    console.log(JSON.stringify(errors));
  } else {
    console.log('SSML is clean');
  }
});
```
will output `[{"type":"audio","value":"https://foo.mp3","detail":"Can't access file"}]`

# Contributions

Contributions are welcome! Please feel free to fork this code and submit pull requests, for bug fixes or feature enhancements.
