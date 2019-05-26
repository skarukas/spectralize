/*
Spectralize/JustIn: Adaptive just intonation system for MIDI pitches. 

Version for JS object in Max/MSP (ECMAScript 2015)

Copyright Stephen Karukas, 2019
*/

//================Variables/Structs================

var PREFS = {
    intensity: 1, 
    mode: "spectralize",
    fundamentalPitch: "auto",
    meanMode: false
}

// a ratio (0.-1.) that determines how much the intervals will be corrected.

// mode controls the higher-level method of correction. It is one of:
// - "spectralize"      corrects pitches based off the exact harmonic series
// - "justify"          corrects pitches based off interval content, loosely based around harmonic series

/*
meanMode is a Boolean value.
    -when true, every reevaluation of the chord puts the justly tuned chord directly between 
        the equal tempered pitches, making microtonal steps between chords smaller
        example: playing a major 3rd will raise the low pitch by 7 cents and lower the high pitch by 7 cents 
    -when false, the lowest pitch is always presented in its 12TET value
        example: playing a major 3rd will lower the high pitch by 14 cents 
*/

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
}

// =========spectralize-specific==========

// the guessed fundamental of the held pitches
var fundamental;

// creates an Array of rounded harmonics n elements long
function createPartials(n) {
    var arr = [];
    for (i = 1; i <= n; i++) {
        arr.push(new Partial(i));
    }
    return arr;
}

//Array of Partials representing the harmonic series of MIDI-pitch 0
var HARMONICS = createPartials(300);
//postError(JSON.stringify(HARMONICS));

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

/*
// using OOP for harmonic series manipulation

var spectrumTemplate = {
    constants: {
        roundedHarmonics: [],
        harmonics: [],
    },

    roundedHarmonics: [],
    harmonics: [],
    offsets: [],

    stretchFactor: 1,
    freqShift: 0,

    set stretchFactor(val) {

    },
    set freqShift(hertz) {
        
    },

    createSpectrum: function(numHarmonics) {

    },
    applyTransformations: function() {
        // create arrs from constants using stretch/shift vals
    }
}

var results = {
    fundamental: "",
    equalPitches: [],
    justPitches: [],
    offsets: [],
    fullKeyboardSpectrum: [],

    makeKeyboardSpectrum: function() {
        //TODO: get current spectrum in rounded MIDI between bottom of keyboard and top, not including equalPitches
        //don't include duplicates from spectrum array
    },
    set fundamental(str) {
        this.fundamental = str;
        output("fundamental", str);
        //update keyboard spectrum
    },
    set justPitches(arr) {
        this.justPitches = arr;
        output("justPitches", arr);
    },
    set equalPitches(arr) {
        this.equalPitches = arr;
        output("equalPitches", arr);
    }
}
*/

// =========justIn-specific==========

// an Array of JustObj's containing the orders and offsets for each chromatic pitch 0-11
var justSystem = createLimits(5);

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



function setLimit(n) {
    justSystem = createLimits(n);
}

// sets the JI system to n-limit tuning (n = 5, 7, 11, or 13)
function createLimits(n) {
    switch (n) {
        case 5: return fiveLimit;
        case 7: return sevenLimit;
        case 11: return elevenLimit;
        case 13: return thirteenLimit;
        default: return fiveLimit;
    }
}

// sets the meanMode value (Boolean)
function setMeanMode(bool) {
    PREFS.meanMode = bool;
}

// sets the mode value ("spectralize" or "justify")
function setMode(s) {
    PREFS.mode = s;
}

// sets the intensity of pitch correction
function setIntensity(n) {
    PREFS.intensity = n;
    if (heldNotes) {
        adjustPitches(heldNotes);
    }
    allNoteMsgOut();
    justCompOut();
} 

function setFundamental (n) {
    PREFS.fundamentalPitch = n;
    var pc = (function () {
        if (n === "auto") {
            return 0;
        } else {
            return n;
        }
    })();
    var transposition = pc - HARMONICS[0].equalPitch;
    HARMONICS.forEach(function (P) {P.equalPitch += transposition});
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
    var start = Date.now();
    resetNotes();
    for (i = 0; i < arguments.length/2; i++) {
        var index = i * 2;
        noteHandler(arguments[index], arguments[index + 1]);
        noteCtrlOut(arguments[index], arguments[index + 1]);
    }
    if (heldNotes.length > 1 || (PREFS.fundamentalPitch !== "auto" && heldNotes)) {
        adjustPitches(heldNotes);
    }
    allNoteMsgOut();
    justCompOut();
    var end = Date.now();
    output('latency', end - start);

    // resets all offsets and orders
    function resetNotes() {
        for (i = 0; i < heldNotes.length; i++) {
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

// JI comparison: for analysis purposes
function justCompOut() {
    pitchListsOut();
    offsetOctaveOut();
    offsetListOut();
    output("fundamental", fundamental);

    // outputs lists of all equal and just pitches
    function pitchListsOut() {
        // a list of all justPitches (String)
        var justList = heldNotes.map(function(N) {
        return (N.offset * PREFS.intensity) + N.equalPitch;
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
        for (i = 0; i < heldNotes.length; i++) {
            var N = heldNotes[i];
            offsetArr[N.equalPitch % 12] = N.offset * PREFS.intensity;
        }
        outlet(0, "offsetOctave", offsetArr);
    }

    // sends out a list of the offset of every pitch in the heldNotes Array
    function offsetListOut() {
        var offsetArr = [];
        for (i = 0; i < heldNotes.length; i++) {
        var N = heldNotes[i];
        offsetArr.push(N.offset * PREFS.intensity * 100);
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
        output('noteMessage', obj.equalPitch, obj.offset * PREFS.intensity);
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

// puts noteArr in ascending order by equalPitch
function sortPitchesAscending(noteArr) {
    return noteArr.sort(function (a, b) {
      return a.equalPitch - b.equalPitch;
    });
}

Array.prototype.contains = function(val) {
    for (i in this) {
        if (this[i] === val) return true;
    }
    return false;
}

var harmonicNums;
// parent function for pitch correction
function adjustPitches(noteArr) {
    if (PREFS.mode === "spectralize") {
        spectralize(noteArr);
    } else {
        justify(noteArr);
	}
    //postError(JSON.stringify(heldNotes));
	if (PREFS.meanMode) {
		meanAdjust();
  	} else {
        //adjustToLowestPitch();
    }
    fundamental = MIDISubHarmonic(heldNotes[0].equalPitch + heldNotes[0].offset, harmonicNums[0]); // if the lowest MIDI pitch is the harmonicNums[0]th harmonic, find fundamental
}

// alters justPitches so that the mean of all justPitches equals the mean of all equalPitches.
// -this causes smaller pitch differences from equal temperament, and therefore reduces the 
// size of microtonal steps between chords as well (see meanMode definition)
function meanAdjust() {
    var equalTotal = 0;
    var justTotal = 0;
    var numNotes = heldNotes.length;

    for (i = 0; i < numNotes; i++) {
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
        for (i = 0; i < numNotes; i++) {
            heldNotes[i].offset += meanOffset;
        }
        fundamental += meanOffset;
    }
}

// sets lowest pitch to zero cents off
function adjustToLowestPitch() {
    heldNotes.map(function(N) {
        return N.offset -= heldNotes[0].offset;
    });
}

// =============spectralize Code==============

// determines the location of an [ArrayOf Note] in the harmonic series and tunes each note to match
function spectralize(noteArr) {
    var roundedHarmonics = HARMONICS.map(function(H) {return H.equalPitch;});
    /**
     * returns the "zero form" of the pitches of all notes held down
     * 
     * @param {Array<Note>} noteArr    an unsorted, unoffset list of Notes
     * 
     * @return {Array<Number>}         an Array of ascending MIDI pitches transposed so the first is equal to 0
     */
    var reducedForm = reduce(noteArr);
    function reduce(arr) {
        var sorted = sortPitchesAscending(arr);
        if (PREFS.fundamentalPitch == "auto") {
            var transposition = sorted[0].equalPitch;
        } else {
            var transposition = 12 * Math.floor(sorted[0].equalPitch / 12);
        }
        return sorted.map(function(N) { 
            return N.equalPitch - transposition});
    }

    noteArr[0].offset = 0;
    //var transposedForm = reducedForm.map(function(n) {return n + roundedHarmonics[i] - roundedHarmonics[0]}); // the reducedForm, transposed for comparison with higher harmonics

    /* // returns the harmonic numbers of an array of MIDI pitches
    function findHarmonics(pitchArr, harmonicPitchArr, startIndex) {
        startIndex = (typeof startIndex !== 'undefined') ?  startIndex : 0;
        var sliceMatch = pitchArr.every(function(n) {
            return harmonicPitchArr.contains(n);
        }); // slice exists in the harmonic series
        if (startIndex === harmonicPitchArr.length) {
            postError("Error: not found in harmonic series. Make sure to use integer values. Stopped at " + pitchArr.join(", ") + " after " + startIndex + " times.");
        } else if (sliceMatch) {
            return pitchArr.map(function(n) {
                return harmonicPitchArr.indexOf(n) + 1});
        } else {
            var newIndex = startIndex + 1;

            function transposePitch(n) {
                if (PREFS.fundamentalPitch === "auto") {
                    var originalPitchArr = n - harmonicPitchArr[startIndex];
                    return originalPitchArr + harmonicPitchArr[newIndex];
                } else {
                    return n + 12;
                }
            }

            var newArr = pitchArr.map(transposePitch);

            return findHarmonics(newArr, harmonicPitchArr, newIndex);
        }
    } */
    //postError("transposedForm: " + reducedForm);
    harmonicNums = findHarmonics(reducedForm, roundedHarmonics);
    createOffsets(noteArr, harmonicNums);

    //postError("harmonicNums: " + harmonicNums);
    //postError("fundamental: " + fundamental);
}

// append previous index
// search for next element starting at that index
// if result == -1 then search at higher transposition level
function findHarmonics(pitchArr, harmonicPitchArr, startIndex) {
    startIndex = startIndex || 0;
    var harmonicNums = [];
    var harmonic = 0;

    for (i = 0; i < pitchArr.length; i++) {
        //postError(pitchArr[i] + " " + harmonic + "!");
        harmonic = findIndex(pitchArr[i], harmonicPitchArr, harmonic); // search starting at past index
        if (harmonic >= 0) {
            harmonicNums.push(harmonic);
        } else {
            var newArr = pitchArr.map(nextTransposition);
            harmonic++;
            return findHarmonics(newArr, harmonicPitchArr, startIndex + 1);
        }
    }
    return harmonicNums;


    // transposes a pitch to either the next octave or the next harmonic, depending on if the fundamental pitch is predetermined
    function nextTransposition(n) {
        if (PREFS.fundamentalPitch === "auto") {
            var untransposedArr = n - harmonicPitchArr[startIndex];
            return untransposedArr + harmonicPitchArr[startIndex + 1];
        } else {
            return n + 12;
        }
    }

    // searches for n in a sorted array starting at index
    function findIndex(n, sortedArr, index) {
        var m = sortedArr[index];
        //postError("comparing " + n + " " + m);
        //postError("index " + index);
        if (n > m) {
            return findIndex(n, sortedArr, index + 1);
        } else if (n === m) {
            return index + 1;
        } else {
            return -1;
        }
    }
}


// modifies the offset value of all Notes in heldNotes to fit exactly in the harmonic series
function createOffsets(noteArr, harmonicNums) {
    //var lowestHarmonic = harmonicNums[0]; // lowest harmonic currently held
    //var firstOffset = HARMONICS[lowestHarmonic - 1].offset;
    for (i = 0; i < harmonicNums.length; i++) {
        noteArr[i].offset = HARMONICS[harmonicNums[i] - 1].offset; // - firstOffset; // equalizes everything to the lowestHarmonic
    }
    outlet(0, "harmonicNums", harmonicNums);
}

        //
 
        /* 
        var len = reducedForm.length;
        var i = 0;

        bigloop:
        // searches for the reducedForm in the harmonic series from bottom to top (iterates up the harmonic series)
        while (i<roundedHarmonics.length) {
            var transposedForm = reducedForm.map(function(n) {return n + roundedHarmonics[i] - roundedHarmonics[0]}); // the reducedForm, transposed for comparison with higher harmonics
            postError(transposedForm);
            postError(roundedHarmonics);
            var j = 0;
            // continues iterating through the transposedForm until there is a mismatch
            while (j<=len) {
				if (j === len) { // success; roundedHarmonics contains all notes of transposedForm
					
                    var harmonicNums = transposedForm.map(function(n) {
                        return roundedHarmonics.indexOf(n) + 1}); // what harmonics the transposedForm corresponds to
					// modifies the offset value of all Notes in heldNotes to fit exactly in the harmonic series
					function createOffsets() {
						var lowestHarmonic = harmonicNums[0]; // lowest harmonic currently held
						fundamental = MIDISubHarmonic(heldNotes[0].equalPitch, lowestHarmonic);
                        var firstOffset = HARMONICS[lowestHarmonic - 1].offset;
						for (i = 0; i < harmonicNums.length; i++) {
							heldNotes[i].offset = HARMONICS[harmonicNums[i] - 1].offset - firstOffset; // equalizes everything to the lowestHarmonic
						}
						outlet(0, "harmonicNums", harmonicNums);
					}
					
					createOffsets();
					
					break bigloop;
                } else if (roundedHarmonics.contains(transposedForm[j], i + 1)) {
                    j++; // match, try again with the next element
                } else {
                    break;
                }
            }
            i++;*/



// =============justify Code==============

// compares all members of an [ArrayOf Note], adjusting a Note's justPitch 
//      to create intervals of the highest order with other members.
function justify(noteArr) {
    fundamental = NaN;
    var numNotes = noteArr.length;
  
    sortPitchesAscending(noteArr);
    
    // lower pitched Note for comparison
    for (lo = 0; lo < numNotes - 1; lo++) {
		var LoNote = noteArr[lo]; 
		
		// higher pitched Note for comparison, starting at the next highest Note from lo
		for (hi = lo + 1; hi < numNotes; hi++) {
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