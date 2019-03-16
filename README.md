# SSML-Check

SSML-Check will verify that you have valid SSML, with optional checks for run-on sentences that detract from the customer experience.

# Usage

The exposed function from this library is `check` which returns a string inidicating whether the SSML string is valid or, if not, how it fails validation

```
check(ssml, options)
```

The arguments to these functions are:

 * ssml - The SSML to check
 * options - Options for evaluating the SSML as noted below
 
The options structure is composed of the following fields with the following default values:

```
{
  platofrm:alexa,       // The voice platform to evaluate this SSML against.
                        // Currently only "alexa" is supported.
  checkDuration:false,  // Whether to check the length of the SSML to see
                        // if it is either too long or contains run-on text.
  maxDuration:10000,    // Value, in ms, to check SSML length against.
                        // This parameter is only considered when checkDuration is true           
  maxTextRun:5000,      // Value, in ms, of the maximum amount of run-on text
                        // (text without pauses). This value is only considered
                        // when checkDuration is true.
}
```

If the SSML passes all checks in this library, then the return value is `valid`. Otherwise, the return value is a string indicating how the SSML fails validation.

The current version of SSML-Check will check for the following:

 * Valid XML format
 * No more than five `audio` tags in the response
 * All tags are valid Alexa tags
 * Duration checks (if checkDuration is set to true)