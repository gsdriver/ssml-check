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
  platform:all,         // The voice platform to evaluate this SSML against.
                        // Valid values are "all", "amazon", or "google".
}
```

The return value is an array of errors that were encountered in processing the SSML, or `undefined` if no errors were encountered.  The format of each error object is as follows:

```
{
  type,       // The type of error encountered
  tag,        // The tag that had an error (set if type is "tag")
  attribute,  // The attribute that had an error (set if type is "tag")
  value,      // The attribute value that was in error (set if type is "tag")
}
```
The current version of SSML-Check will check for the following:

 * Valid XML format
 * No more than five `audio` tags in the response
 * All tags are valid tags for their platform with valid attributes and values
