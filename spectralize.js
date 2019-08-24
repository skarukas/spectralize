//@ts-check

/*
Spectralize/JustIn: Adaptive just intonation system for MIDI pitches. 

Version for JS object in Max/MSP (ES5)

Copyright Stephen Karukas, 2019
*/

//================Variables/Structs================

// a ratio (0.-1.) that determines how much the intervals will be corrected.
var intensity = 1;

// mode controls the higher-level method of correction. It is one of:
// - "spectralize"      corrects pitches based off the exact harmonic series
// - "justify"          corrects pitches based off interval content, loosely based around harmonic series
var mode = "spectralize";

/*
meanMode is a Boolean value.
    -when true, every reevaluation of the chord puts the justly tuned chord directly between 
        the equal tempered pitches, making microtonal steps between chords smaller
        example: playing a major 3rd will raise the low pitch by 7 cents and lower the high pitch by 7 cents 
    -when false, the lowest pitch is always presented in its 12TET value
        example: playing a major 3rd will lower the high pitch by 14 cents 
*/
var meanMode = false; 

// an Array of Note objects for each note currently active
var heldNotes = [];

/* 
a Note is an object containing:
-equalPitch : the MIDI pitch originally sent into the program
-offset : the number of semitones between the closest corrected pitch and the equalPitch
-order : the Order of the interval that made the most recent 
        change to the offset (justIn)
-velocity : the MIDI velocity sent into the program 
*/
function Note(_pitch, _velocity) {
    this.equalPitch = _pitch;
    this.offset = 0;
    this.velocity = _velocity;
    this.order = -1;
    this.partialNum = -1;
}


// =========spectralize-specific==========

// the guessed fundamental of the held pitches
var fundamental;

//Array of Partials representing the harmonic series of MIDI-pitch 0
var HARMONICS = [];

/**
 * an Object representing a partial of the harmonic series starting at MIDI pitch = 0
 * 
 * @constructor
 * 
 * - equalPitch : MIDI pitch of harmonic, rounded down to the nearest integer
 * - offset : amount rounded down
 * 
 * @param {Number} n       partial number to create (starts at 1)
 */
function Partial(n) {
    var harmonic = MIDIHarmonic(0, n);
    var roundedHarmonic = Math.round(harmonic);

    this.equalPitch = roundedHarmonic;
    this.offset = harmonic - roundedHarmonic;
}

createPartials(300);

// =========justIn-specific==========

// an Array of JustObj's containing the orders and offsets for each chromatic pitch 0-11
var justSystem = [];

/**
 * JustObj is a struct for storing data about an interval within a JI system
 * 
 * @constructor
 * 
 * @param {Number} equalInterval  the number of semitones in the equal tempered MIDI interval
 * @param {Number} offset         the offset in semitones from the justly-tuned MIDI interval
 * @param {Number} order          the Order of the interval
 */

function JustObj(equalInterval, offset, order) {
    this.equalInterval = equalInterval;
    this.offset = offset;
    this.order = order;
}

//====Limits====

// hard-coded JI and order values for intervals
var fiveLimit = [
    new JustObj(0, 0, 11), 
    new JustObj(1, 0.12, 1), 
    new JustObj(2, 0.04, 4), 
    new JustObj(3, 0.16, 6), 
    new JustObj(4, -0.14, 8), 
    new JustObj(5, -0.02, 9), 
    new JustObj(6, -0.1, 2), 
    new JustObj(7, 0.02, 10), 
    new JustObj(8, 0.14, 7), 
    new JustObj(9, -0.16, 5), 
    new JustObj(10, -0.04, 3), 
    new JustObj(11, -0.12, 0)];

var sevenLimit = [
    new JustObj(0, 0, 11), 
    new JustObj(1, 0.12, 1), 
    new JustObj(2, 0.04, 5), 
    new JustObj(3, 0.16, 4), 
    new JustObj(4, -0.14, 8), 
    new JustObj(5, -0.02, 9), 
    new JustObj(6, -0.1, 2), 
    new JustObj(7, 0.02, 10), 
    new JustObj(8, 0.14, 7), 
    new JustObj(9, -0.16, 3), 
    new JustObj(10, -0.31, 6), 
    new JustObj(11, -0.12, 0)]; 
  
var elevenLimit = [
    new JustObj(0, 0, 1), 
    new JustObj(1, 0.12, 1), 
    new JustObj(2, 0.04, 4), 
    new JustObj(3, 0.16, 3), 
    new JustObj(4, -0.14, 8), 
    new JustObj(5, -0.02, 9), 
    new JustObj(6, -0.49, 5), 
    new JustObj(7, 0.02, 10), 
    new JustObj(8, 0.14, 7), 
    new JustObj(9, -0.16, 2), 
    new JustObj(10, -0.31, 6), 
    new JustObj(11, -0.12, 0)]; 

var thirteenLimit = [
    new JustObj(0, 0, 1), 
    new JustObj(1, 0.12, 1), 
    new JustObj(2, 0.04, 4), 
    new JustObj(3, 0.16, 3), 
    new JustObj(4, -0.14, 8), 
    new JustObj(5, -0.02, 9), 
    new JustObj(6, -0.49, 5), 
    new JustObj(7, 0.02, 10), 
    new JustObj(8, 0.40, 7), 
    new JustObj(9, -0.16, 2), 
    new JustObj(10, -0.31, 6), 
    new JustObj(11, -0.12, 0)]; 

setLimit(5); 

// ===========I/O==========

/*
This program outputs the following messages:

"noteControl", pitch (Number), velocity (Number)
  - for controlling note-ons and offs. Essentially acts as a MIDI "thru" for the equal-tempered pitches, 
    as MIDI does not support floating-point values.

"noteMessage", targetPitch (Number), bend (Number)
  - specifices what already held pitch to target, and the decimal value that should be added to justly tune it

"justPitches", justPitches (Array)
  - a list of all justPitches currently held

"equalPitches", equalPitches (Array)
  - a list of all equalPitches currently held

"offsetList", offsetList (Array)
  - a list of offsets for each pitch currently held

"offsetOctave", offsetOctave (Array)
  - a list of current offsets for each chromatic pitch (0-11)

"done"
    -outputs when note processing has finished (for measuring latency).

*/

// sends messages to Max
function output() {
    var args = Array.prototype.slice.call(arguments);
    outlet(0, args);
} 

// posts errors to the Max console
function postError(err) {
    post(err + "\n");
} 

// ===========Inputs==========


// sets the JI system to n-limit tuning (n = 5, 7, 11, or 13)
function setLimit(n) {
    switch (n) {
      case 5:
        justSystem = fiveLimit;
        break;
      case 7:
        justSystem = sevenLimit;
        break;
      case 11:
        justSystem = elevenLimit;
        break;
      case 13:
        justSystem = thirteenLimit;
        break;
      default:
        postError('Tuning not available.\nValid arguments: 5, 7, 11, 13');
    }
}

// sets the meanMode value (Boolean)
function setMeanMode(bool) {
    if (bool == false) {
        meanMode = false;
    } else if (bool == true) {
        meanMode = true;
    } else {
        postError('Not valid.\nValid arguments: 1 or true, 0 or false');
    }
}

// sets the mode value ("spectralize" or "justify")
function setMode(s) {
    if (s == "spectralize" || s == "justify" ) {
        mode = s;
    } else {
        postError('Not valid.\nValid arguments: spectralize or justify');
    }
}

// sets the intensity of pitch correction
function setIntensity(val) {
    intensity = val;
    adjustPitches(heldNotes);
    allNoteMsgOut();
    justCompOut();
} 

// sends note-offs then empties the array
function clearNotes() {
    heldNotes.forEach(function (obj) {
        noteCtrlOut(obj.equalPitch, 0);
    });
    heldNotes = [];
}

// main function--processes incoming MIDI notes, sending out noteControls (MIDI notes) 
//      and noteMessages (pitch bend for each note).
function notesIn() {
    resetNotes();

    for (var i = 0; i < arguments.length/2; i++) {
        var index = i * 2;
        noteHandler(arguments[index], arguments[index + 1]);
        noteCtrlOut(arguments[index], arguments[index + 1]);
    }
    if (heldNotes.length > 1) {
        adjustPitches(heldNotes);
    }
    allNoteMsgOut();
    justCompOut();
    output('done');

    // resets all offsets and orders
    function resetNotes() {
        for (var i = 0; i < heldNotes.length; i++) {
            heldNotes[i].offset = 0;
            heldNotes[i].order = -1;           
        }
    }
    // adds or removes a Note from heldNotes[]
    function noteHandler(pitch, velocity) {
        var isNoteOn = velocity > 0;
        if (isNoteOn) {
            addNote();
        } else if (!isNoteOn) {
            heldNotes = heldNotes.filter(notPitchMatch);
        }

        // checks whether a Note does not match pitch
        function notPitchMatch(N) {
            return N.equalPitch !== pitch;
        }

        // adds the Note to heldNotes[]
        function addNote() {
            var hasNoPitch = heldNotes.every(notPitchMatch);
            if (hasNoPitch) {

                heldNotes.push(new Note(pitch, velocity));
            }
        }

        if (heldNotes.length === 0) {
            output("allnotesoff");
        }
    }
}

// ===========Outputs==========

// JI comparison: for demonstration purposes
function justCompOut() {
    pitchListsOut();
    offsetOctaveOut();
    offsetListOut();
    output("fundamental", fundamental);

    // outputs lists of all equal and just pitches
    function pitchListsOut() {
        // a list of all justPitches (String)
        var justList = heldNotes.map(function(N) {
        return (N.offset * intensity) + N.equalPitch;
        });
    
        // a list of all equalPitches (String)
        var equalList = heldNotes.map(function(N) {
        return N.equalPitch;
        });
    
        outlet(0, "justPitches", justList);
        outlet(0, "equalPitches", equalList);
    }

    // sends out a list of the offset of every pitch in an octave
    function offsetOctaveOut() {
        var offsetArr = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        for (var i = 0; i < heldNotes.length; i++) {
        var N = heldNotes[i];
        offsetArr[N.equalPitch % 12] = N.offset * intensity;
        }
        outlet(0, "offsetOctave", offsetArr);
    }

    // sends out a list of the offset of every pitch in the heldNotes Array
    function offsetListOut() {
        var offsetArr = [];
        for (var i = 0; i < heldNotes.length; i++) {
        var N = heldNotes[i];
        offsetArr.push(N.offset * intensity * 100);
        }
        outlet(0, "offsetList", offsetArr);
    }
}

// sends a message noteControl to the synthesizer.
// noteControl:
// -pitch : MIDI pitch (0-127)
// -velocity : MIDI velocity (0-127)
function noteCtrlOut(pitch, velocity) {
    output('noteControl', pitch, velocity);
} 

// sends noteMessages for every held note
function allNoteMsgOut() {
    heldNotes.forEach(function (obj) {
        output('noteMessage', obj.equalPitch, obj.offset * intensity);
    });
}


//========Global Functions========

// returns the nth harmonic of a fundamental MIDI note f
function MIDIHarmonic(f, n) {
    return f + 12 * (Math.log(n))/Math.log(2);
}

// returns the nth subharmonic of a fundamental MIDI note f
function MIDISubHarmonic(f, n) {
    return f - 12 * (Math.log(n))/Math.log(2);
}

// creates an Array of rounded harmonics n elements long
function createPartials(n) {
    var len = HARMONICS.length;
    if (n > len) {
        for (var i = len + 1; i <= n; i++) {
            HARMONICS.push(new Partial(i));
        }
    } else {
        HARMONICS = HARMONICS.slice(0, n);
    }
}

// puts noteArr in ascending order by equalPitch
function sortPitchesAscending(noteArr) {
    return noteArr.sort(function (a, b) {
      return a.equalPitch - b.equalPitch;
    });
}

Array.prototype.contains = function(val) {
    for (var i in this) {
        if (this[i] === val) return true;
    }
    return false;
}


// parent function for pitch correction
function adjustPitches(noteArr) {
    if (mode === "spectralize") {
        spectralize(noteArr);
    } else {
        justify(noteArr);
	}

	if (meanMode) {
		meanAdjust();
  	}
}

// alters justPitches so that the mean of all justPitches equals the mean of all equalPitches.
// -this causes smaller pitch differences from equal temperament, and therefore reduces the 
// size of microtonal steps between chords as well (see meanMode definition)
function meanAdjust() {
    var equalTotal = 0;
    var justTotal = 0;
    var numNotes = heldNotes.length;

    for (var i = 0; i < numNotes; i++) {
        var N = heldNotes[i];
        equalTotal += N.equalPitch;
        justTotal += N.equalPitch + N.offset;
    }
    
    // meanOffset is a Number representing the amount (in semitones) all pitches will be shifted
    var meanOffset = (equalTotal - justTotal) / numNotes;
    offsetAllPitches(meanOffset);

    // transposes all offsets by the meanOffset value
    function offsetAllPitches(meanOffset) {
        var numNotes = heldNotes.length;
        for (var i = 0; i < numNotes; i++) {
            heldNotes[i].offset += meanOffset;
        }
        fundamental += meanOffset;
    }
}

// =============spectralize Code==============

// determines the location of an Note[] in the harmonic series and tunes each note to match
function spectralize(arr) {

    sortPitchesAscending(arr);

    var i = 1;
    var j = 1;
    arr[0].partialNum = i;

    while (j < arr.length) {

        var testPartial = i * Math.pow(2, (arr[j].equalPitch - arr[0].equalPitch)/12); // the actual value of arr[j]'s ET "partial"
        var roundedPartial = Math.round(testPartial);
        var midiError = 12 * Math.abs(log2(testPartial/roundedPartial)); // the number of MIDI semitones between testPartial and roundedPartial

        // makes sure the rounding associated with assuming the interval doesn't take us to a different MIDI pitch
        if (midiError < 0.5) { 
            arr[j].partialNum = roundedPartial;
            j++;
        } else {
            j = 1;
            i++;
            arr[0].partialNum = i;
        }
    }
    createOffsets();
    
    function log2(n) {
        return Math.log(n) / Math.log(2);
    }
    
    // bases the operation off the first element of heldNotes (gets an offset of 0). notes should be sorted or else 
    //      the result will not be consistent with different orderings of the same set
    function createOffsets() {
        fundamental = MIDISubHarmonic(arr[0].equalPitch, arr[0].partialNum);
        var harmonicNums = [arr[0].partialNum];
        for (var i = 1; i < arr.length; i++) {
            arr[i].offset = MIDIHarmonic(fundamental, arr[i].partialNum) - arr[i].equalPitch;
            harmonicNums[i] = arr[i].partialNum;
        }
        outlet(0, "harmonicNums", harmonicNums);
    }
}


// =============justify Code==============

// compares all members of an [ArrayOf Note], adjusting a Note's justPitch 
//      to create intervals of the highest order with other members.
function justify(noteArr) {
    fundamental = NaN;
    var numNotes = noteArr.length;
  
    sortPitchesAscending(noteArr);
    
    // lower pitched Note for comparison
    for (var lo = 0; lo < numNotes - 1; lo++) {
		var LoNote = noteArr[lo]; 
		
		// higher pitched Note for comparison, starting at the next highest Note from lo
		for (var hi = lo + 1; hi < numNotes; hi++) {
			var HiNote = noteArr[hi];
			var interval = HiNote.equalPitch - LoNote.equalPitch;
			var IntervalObj = justSystem[interval % 12];
			var intervalIsHigherOrder = IntervalObj.order > HiNote.order || IntervalObj.order > LoNote.order;
	
			// if the order of the interval is greater than an existing order, create the just interval between the two pitches
			if (intervalIsHigherOrder) {
		
				// creates an interval between two Notes, offsetting the pitch of whichever has a lower order
				function createInterval(Hi, Lo, offset) {
					if (Hi.order > Lo.order) {
						Lo.offset = offset;
					} else {
						Hi.offset = offset;
					}
				} 
		
				// updates an Note's order if it is higher than queryOrder
				function updateOrder(N, order) {
					if (order > N.order) {
						N.order = order;
					}
                } 

                createInterval(HiNote, LoNote, IntervalObj.offset);
                updateOrder(HiNote, IntervalObj.order);
				updateOrder(LoNote, IntervalObj.order);
			}
		}
    }
}