const validUnits = {
  s: 1, m: 60, h: 3600, d: 86400, w: 604800, y: 31536000
} // Time units used in parseDuration function

const stringNumbers = new Set(["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"]);

module.exports = {
  /**
 * Parses a valid formatted duration string into seconds.
 * Supported time units: s, m, h, d, w, y.
 * @param {String} string String to parse into seconds
 * @param {Number} [minSeconds] Integer of minimum seconds. Cannot be negative.
 * @param {Number} [maxSeconds] Integer of maximum seconds. Cannot be negative.
 * @returns 
 */
  parseDuration(string, minSeconds = 0, maxSeconds) {
    if (!Number.isInteger(minSeconds) || minSeconds < 0) {
      throw new RangeError("The parameter 'minSeconds' must be a non-negative integer.")
    }
    if (maxSeconds !== undefined && (!Number.isInteger(maxSeconds) || maxSeconds < 0)) {
      throw new RangeError("The parameter 'maxSeconds' must be a non-negative integer.")
    }

    const usedUnits = new Set();

    let seconds = 0;
    let numString = "";
    let error;
    
    const newString = string.trim().toLowerCase();
    
    for (const char of newString) {
      if (char in validUnits) {
        if (!usedUnits.has(char)) {
          if (numString !== "") {
            seconds += Number(numString) * validUnits[char];
            numString = "";
            usedUnits.add(char);
          }
          else {
            error = `Time unit '${char}' was specified without a time value.`;
            break;
          }
        } else {
          error = `A duplicate time unit '${char}' was specified.`;
          break;
        }
      } else if (stringNumbers.has(char)) {
        numString += char;
      } else {
        error = `An invalid character '${char}' was specified.`;
        break;
      }
    }

    if (newString !== "" && !(newString[newString.length - 1] in validUnits)) {
      error = "No time unit was specified at the end.";
    } else if (seconds < minSeconds) {
      error = `The minimum duration is ${minSeconds} seconds.`;
    } else if (maxSeconds !== undefined && seconds > maxSeconds) {
      error = `The maximum duration is ${maxSeconds} seconds.`;
    }
    
    return [error ?? null, error ? null : seconds];
  }

  
}
