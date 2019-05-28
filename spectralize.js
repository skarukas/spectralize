/*
Spectralize/JustIn: Adaptive just intonation system for MIDI pitches. 

Version for JS object in Max/MSP (ECMAScript 2015)

Copyright Stephen Karukas, 2019
*/

/* 
// for debugging with nodeJS
var maxApi = require("max-api");

maxApi.addHandler(maxApi.MESSAGE_TYPES.ALL, (handled, ...args) => {
    var fnString = args[0] + "(" + args.slice(1) + ")";
    eval(fnString);
});
function outlet(num, msg) {
    maxApi.outlet([msg]);
}
function postError(msg) {
    maxApi.postError(msg);
} 
*/

include("util-functions");
include("limits");
include("spectralize-results");
include("array-prototype-methods");

//================Variables/Structs================

var PREFS = {
    // a ratio (0.-1.) that determines how much the intervals will be corrected.
    intensity: 1,

    /* 
    mode controls the higher-level method of correction, either
        - "spectralize"      corrects pitches based off the exact harmonic series
        - "justify"          corrects pitches based off interval content, loosely based around harmonic series
    */
    mode: "spectralize",

    /*
    -when meanMode is true, every reevaluation of the chord puts the justly tuned chord directly "in the center" of
        the equal tempered chord, making microtonal steps between chords smaller
        example: playing a major 3rd will raise the low pitch by 7 cents and lower the high pitch by 7 cents 
    -when false, the lowest pitch is always presented in its 12TET value
        example: playing a major 3rd will lower the high pitch by 14 cents 
    */
    meanMode: false
}


// =================== Master Spectrum ===================
/*
Incoming MIDI notes are compared to the values in this spectrum and adjusted accordingly
The spectrum may be manipulated by changing the following properties:
    - stretchFactor: stretches or compresses the distance (Hz) between partials
    - determineFundamental: if true, interprets the input MIDI notes as the lowest possible partials and determines the fundamental
    - fundamental: MIDI pitch value (0-11) of the fundamental note to use. Only valid if determineFundamental is false.
    - freqShiftHz: amount in Hz to shift every partial

    NOTE: For our purposes, partials are 1-indexed (the fundamental is partial 1, not 0), so for consistency throughout the code, 
        arrays of partials begin with an empty element so the index corresponds to the partial number (sorry!)
*/
var MasterSpectrum = {
    // generated harmonic series (stretched)
    _midiPartials: [null],

    // transformed spectrum
    _transformedMidiPartials: [null],
    _roundedMidiPartials: [null],
    _offsets: [null],

    // transformations
    _stretchFactor: 1,
    _freqShiftHz: 0,
    _fundamental: 0,
    _determineFundamental: true,

    // internal set for automatically calculating roundedMidiPartials and offsets
    set transformedMidiPartials(arr) {
        this._transformedMidiPartials = arr;
        this._roundedMidiPartials = this._transformedMidiPartials.map(Math.round);
        this._offsets = getOffsets(this._transformedMidiPartials, this._roundedMidiPartials);

        function getOffsets(partials, roundedPartials) {
            var offsets = [];
            for (i = 1; i < partials.length; i++) {
                offsets[i] = partials[i] - roundedPartials[i];
            }
            return offsets;
        }
    },
    set stretchFactor(val) {
        this._stretchFactor = val;
        this.createSpectrum();
    },
    set fundamental(n) {
        this._fundamental = n;
        this.applyTransformations();
    },
    set freqShiftHz(hz) {
        this._freqShiftHz = hz;
        this.applyTransformations();
    },

    get roundedMidiPartials() {
        return this._roundedMidiPartials;
    },
    get transformedMidiPartials() {
        return this._transformedMidiPartials;
    },
    get offsets() {
        return this._offsets;
    },
    get determineFundamental() {
        return this._determineFundamental;
    },

    createSpectrum: function() {
        var partialArray = [];
        var chromaticOctave = Util.hasChromaticOctave(partialArray);
        var i = 0;
        while (!chromaticOctave && i < 100) {
            partialArray[i] = Util.MIDIHarmonic(0, i, this._stretchFactor);
            chromaticOctave = Util.hasChromaticOctave(partialArray);
            i++;
        }
        this._midiPartials = partialArray;
        this.applyTransformations();
    },
    applyTransformations: function() {
        var f1 = this._fundamental;
        var shift = this._freqShiftHz;
        this.transformedMidiPartials = this._midiPartials.map(function(midiPitch) {
            // scary math: transposes the stretched spectrum, then shifts it
            var result = 12 * Math.log(Math.pow(2, (midiPitch + f1 - 69) / 12) + (shift / 440)) / Math.log(2) + 69;
            return result;
        });
    }
}


// =================== output methods ===================

// sends messages to Max
function output() {
    var args = Array.prototype.slice.call(arguments);
    outlet(0, args);
}

// posts errors to the Max console
function postError(err) {
    if (typeof err === 'object') {
        err = JSON.stringify(err);
    }
    post(err + "\n");
}

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
};

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

// =========spectralize-specific==========

// PORT THESE INTO MASTERSPECTRUM

/*
// creates an Array of rounded harmonics n elements long
function createPartials(n) {
    var arr = [];
    for (i = 1; i <= n; i++) {
        arr.push(new Partial(i));
    }
    return arr;
}
*/

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

/*
function Partial(n) {
    var harmonic = Util.MIDIHarmonic(0, n);
    var roundedHarmonic = Math.round(harmonic);

    this.equalPitch = roundedHarmonic;
    this.offset = harmonic - roundedHarmonic;
}
*/

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



// ===========Inputs==========

function setLimit(n) {
    justSystem = createLimits(n);
}

// sets the JI system to n-limit tuning (n = 5, 7, 11, or 13)
function createLimits(n) {
    switch (n) {
        case 5: return Limits.fiveLimit;
        case 7: return Limits.sevenLimit;
        case 11: return Limits.elevenLimit;
        case 13: return Limits.thirteenLimit;
        default: return Limits.fiveLimit;
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

// main function--processes incoming MIDI notes, sending out noteControls (MIDI notes) 
//      and noteMessages (pitch bend for each note).
function notesIn() {
    var start = Date.now();

    var pitches = [];
    var velocities = [];

    // get input pitch and velocity arrays from laced arguments
    for (i = 0; i < arguments.length; i++) {
        var elem = arguments[i];
        if (i%2 === 0) {
            pitches.push(elem);
        } else {
            velocities.push(elem);
        }
    }

    // reset offset and order properties
    heldNotes.resetNotes();

    // add or remove notes
    heldNotes.handleMidiNotes(pitches, velocities);

    // output note-on/off messages
    heldNotes.outputNoteCtrls(); // change???

    // process array
    if (heldNotes.length > 1 || (MasterSpectrum.determineFundamental && heldNotes.length)) {
        postError("sending " + heldNotes + " to adjustPitches()");
        adjustPitches(heldNotes);
    }

    // output pitch adjustments from processing
    heldNotes.outputNoteMsgs(); // change???

    justCompOut();

    var end = Date.now();
    Results.latency = end - start;
}

// ===========Outputs==========

// JI comparison: for analysis purposes
function justCompOut() {
    var fundamental;
    Results.genEqualList(heldNotes);
    Results.genJustList(heldNotes);
    Results.genOffsetOctave(heldNotes);
    Results.genOffsetList(heldNotes);
    Results.fundamental = fundamental; // ????????
}

//========Global Functions========



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
		noteArr.meanAdjust();
  	} else {
        //adjustToLowestPitch();
    }
    //FIXME: NEEDS PARTIALNUMS; also with stretched spectra i can't see how this would work
    fundamental = Util.MIDISubHarmonic(heldNotes[0].equalPitch + heldNotes[0].offset, partialNums[0]); 
    // if the lowest MIDI pitch is the harmonicNums[0]th harmonic, find fundamental 
}


// =============spectralize Code==============

// determines the location of an [ArrayOf Note] in the harmonic series and tunes each note to match
function spectralize(noteArr) {
    var zeroForm = noteArr.makeZeroForm();
    //noteArr[0].offset = 0; // ?????
    var partialNums = findHarmonics(zeroForm, MasterSpectrum.roundedMidiPartials);
    noteArr.createOffsetsByPartials(partialNums);
    Results.partialNums = partialNums;
}

/*
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
    postError("cycles: " + i);
    return harmonicNums;


    // transposes a pitch to either the next octave or the next harmonic, depending on if the fundamental pitch is predetermined
    function nextTransposition(n) {
        if (MasterSpectrum.determineFundamental) {
            var originalPitch = n - harmonicPitchArr[startIndex];
            return originalPitch + harmonicPitchArr[startIndex + 1];
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
*/
function findHarmonics(pitchArr, midiPartials) {
    var currentPartialNum = 1;
    var pitchArrPartials = [];
    var staticPitchArr = pitchArr.slice();
    var maxMidiPartial = midiPartials[midiPartials.length-1];
    //postError("pitchArr: " + pitchArr);

    while (!pitchArrPartials[pitchArr.length - 1]) {
        for (i = 0; i < pitchArr.length; i++) {
            var elem = pitchArr[i];
            var n = 0;

            while (elem > maxMidiPartial) {
                // if larger than the greatest partial, determine the partial number of a pitch n octaves lower that is within range, 
                //   then multiply that partial number by 2^n
                elem -= 12;
                n++;
            }

            var foundIndex = Util.findIndex(elem, midiPartials, currentPartialNum);
            if (foundIndex === -1) {
                currentPartialNum++;
                pitchArr = staticPitchArr.map(function(midiPitch) {
                    var nextTransposition = getNextTransposition(midiPitch, currentPartialNum, midiPartials);
                    //postError("transposed: " + nextTransposition);
                    return nextTransposition;
                });
                break;
            } else {
                var partialNum = foundIndex * Math.pow(2, n);
                pitchArrPartials[i] = partialNum;
            }
        }
        if (currentPartialNum > midiPartials.length) {
            postError("Master Spectrum Error. Terminated at: " + pitchArr);
            break;
        }
    }
    return pitchArrPartials;

    // transposes a pitch to either the next octave or the next harmonic, depending on if the fundamental pitch is predetermined
    function getNextTransposition(midiPitch, currentIndex, midiPartials) {
        if (MasterSpectrum.determineFundamental) {
            // transpose to next partial
            return midiPitch + midiPartials[currentIndex];
        } else {
            // transpose to next octave
            return midiPitch + 12;
        }
    }
}

// =============justify Code==============

// compares all members of noteArr, adjusting a Note's justPitch 
//      to create intervals of the highest order with other members.
function justify(noteArr) {
    fundamental = NaN;
    var numNotes = noteArr.length;
  
    noteArr.sortNotesAscending();
    
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