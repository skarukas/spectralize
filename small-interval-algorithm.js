outlets = 2;

var log = {
    arr: [],

    add: function (str, type) {
        switch(type) {
            case "bullet": 
                str = "    - " + str;
                break;
            case "action": 
                str = "    <<< " + str + " >>>";
                break;
            case "header":
                str = "===== " + str + " =====";
                break;
            case "error":
                str = "****** " + str + " ******";
        }
        this.arr.push(str);
    },

    clear: function() {
        this.arr = [];
    },

    print: function() {
        postError("    # =========== STATEMENT LOG ===========");
        for (var i = 0; i < this.arr.length; i++) {
            postError("    #    " + this.arr[i]);
        }
    }
}

function postError(str) {
    post(str + "\n");
}

function test() {
    try {
        postError("\n************* BEGIN TEST *************\n");

        noteTest([0, 1, 2, 4, 6, 7, 8], [13, 14, 15, 16, 18, 19, 21]);
        noteTest([60, 64, 67, 70], [4, 5, 6, 7]); // dominant chord
        noteTest([64, 60, 70, 67], [4, 5, 6, 7]); // unsorted dominant chord
        noteTest([30], [1]); // singleton
        //noteTest([60, 60], [1, 1]); // duplicates
        noteTest([46, 47, 48, 49, 50, 62, 70], [14, 15, 16, 17, 18, 36, 56]); // out of range of model
        noteTest([46, 48, 50, 53, 56, 58, 60, 70, 71], [8, 9, 10, 12, 14, 16, 18, 32, 34]); // out of range of model and smallest interval highest (out of range!)



        postError("Testing Completed Successfully.");
    } catch (e) {
        postError(e);
        log.print();
    }
}

function noteTest(args, expect) {
    return assertApply(notesIn, args, expect);
}

function assertApply(fn, args, expect) {
    log.clear();
    var error;
    try {
        var result = fn.apply(null, args);
    } catch (e) {
        error = e;
        postError("EEEEE" + e);
    }
    if (JSON.stringify(result) == JSON.stringify(expect)) {
        return;
    } else {
        throw "<<< Test Failed: " + fn.name + "(" + args + "). " +
              "Expected value: " + expect + ", " + 
              "Actual value: " + result + " >>>\n";
    }
}

// ========= MODEL =========
var c = 1;
var harmonicSeriesModel = createModel(c);

harmonicSeriesModel.forEach(function(p) {p.show()});

function showModel() {
    log.clear();
    var msg = "[00]   | ";
    for (var i = 1; i < harmonicSeriesModel.length; i++) {
        msg += fixDigits(harmonicSeriesModel[i].roundedMIDI, 2) + "  | ";
    }

    log.add(msg);
    for (var i = 0; i < harmonicSeriesModel[1].intervalsUp.length; i++) {
        msg = "[" + fixDigits(i+1, 2) + "]   | ";
        for (j = 1; j < harmonicSeriesModel.length; j++) {
            if (i >= harmonicSeriesModel[j].intervalsUp.length) break;
            msg += fixDigits(harmonicSeriesModel[j].intervalsUp[i].interval, 2) + "  | ";
        }
        log.add(msg);
    }
    log.print();
}

function fixDigits(n, len) {
    var zeroes = "";
    for (var i = 1; i < len; i++) {
        zeroes += "0";
    }
    return (zeroes + n).slice(-len);
}

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

    this.intervalUp = null;
    this.partialNum = 1;
    this.octavesAdded = 0;

    this.velocity = _velocity;

    this.order = -1;

    this.toString = function() {
        return this.equalPitch + " {#" + this.partialNum + "}";
    }

    this.transposePartialNum = function() {
        this.partialNum *= Math.pow(2, this.octavesAdded);
        log.add("Setting " + this.equalPitch + "'s partialNum := " + this.partialNum, "action");
    }
};

function createModel(c) {
    var partialArray = [];
    var chromaticOctave = false;
    var i = 0;
    while (!chromaticOctave && i < 100) {
        partialArray[i] = new Partial(i, MIDIHarmonic(0, i, c));
        if (partialArray.length > 11) chromaticOctave = hasChromaticOctave(partialArray);
        i++;
    }

    // create lists of all intervals between elements of the model
    for (var i = 1; i < partialArray.length; i++) {
        var j = 0;
        var k = i + 1;
        var partial = partialArray[i];

        while (k < partialArray.length) {
            partial.intervalsUp[j] = new Interval(partialArray[k], partialArray[k].roundedMIDI - partial.roundedMIDI);
            k++;
            j++;
        }

        j = 0;
        k = i - 1;
        while (k > 0) {
            partial.intervalsDown[j] = new Interval(partialArray[k], partial.roundedMIDI - partialArray[k].roundedMIDI);
            k--;
            j++;
        }
    }
    return partialArray;
}

function Interval(ref, interval) {
    this.ref = ref;
    this.interval = interval;

    this.toString = function() {
        return this.interval + "->" + this.ref.roundedMIDI;
    }
}

function hasChromaticOctave(arr) {
    var count = 0;
    var i = arr.length - 1;
    var a = arr[i].roundedMIDI;
    var b = arr[i-1].roundedMIDI;

    while (i) {
        var delta = a - b;
        if (delta > 1) {
            break;
        } else {
            i--;
            if (delta === 1) count++;
        }

        a = b;
        b = arr[i-1].roundedMIDI;
    }
    return count === 12;
}

//uncle bob's blog
function MIDIHarmonic(f1, n, c) {
    c = c || 1;
    return f1 + 12 * c * Math.log(n)/Math.log(2);
}

function Partial(num, val) {
    this.MIDI = val;
    this.roundedMIDI = Math.round(val);
    this.offset = val - Math.round(val);
    this.partialNum = num;
    this.intervalsUp = [];
    this.intervalsDown = [];

    this.getLinkedPartial = function(n, partialArr) {
        if (n === 0) return this;
        
        var i = 0;
        var elem = partialArr[i];

        while (i < partialArr.length && n > elem.interval) {
            elem = partialArr[i];
            i++;
            log.add("Searching for " + n + " at index " + i + " of " + this + ", found " + elem.interval, "bullet");
        }
        if (n == elem.interval) return elem.ref;
        else return null;
    }

    this.hasIntervals = function(inputIntervals, n, noteArr) {
        return this.hasLowerIntervals(inputIntervals, n, noteArr) && 
               this.hasHigherIntervals(inputIntervals, n, noteArr);
    };

    // confirms that the set of higher Intervals creates an ascending Partial chain within the model
    this.hasHigherIntervals = function(intervals, n, noteArr) {
        log.add("Testing interval sequence above " + "noteArr[" + n + "]", "header");
        //var inputIntervals = intervals.slice(0);

        // retrieve a copy of all intervals (for mutation)
        var inputIntervals = getIntervalArr(noteArr);
        var p = this;

        while (n < inputIntervals.length) {
            if (p.intervalsDown.length === 0) return false;

            // transpose large intervals into range
            var octaves = getOctaveTransposition(inputIntervals[n], p.intervalsUp.last().interval);
            inputIntervals[n] -= 12 * octaves; // octaveSize
            for (var i = n+1; i < noteArr.length; i++) {
                noteArr[i].octavesAdded += octaves;
                log.add(noteArr[i].equalPitch + "'s offset: " + noteArr[i].octavesAdded, "bullet");
            }

            
            // retrieve the next partial, if it exists
            p = p.getLinkedPartial(inputIntervals[n], p.intervalsUp);

            if (p == null) {
                log.add("Test failed on higher notes. Interval " + inputIntervals[n] + " not found.", "bullet");
                return false;
            } else {
                n++;
                noteArr[n].partialNum = p.partialNum;
                log.add("Setting " + noteArr[n].equalPitch + "'s partialNum := " + noteArr[n].partialNum, "action");
            }
        }
        log.add("Successfully tested higher notes.", "bullet");
        return true;
    }

    // confirms that the set of lower Intervals creates a descending Partial chain within the model
    this.hasLowerIntervals = function(intervals, n, noteArr) {
        log.add("Testing interval sequence below " + "noteArr[" + n + "]", "header");

        // retrieve a copy of all intervals (for mutation)
        var inputIntervals = getIntervalArr(noteArr);
        
        var p = this;
        while (n > 0) {
            if (p.intervalsDown.length === 0) return false;

            // transpose large intervals into range
            var octaves = getOctaveTransposition(inputIntervals[n-1], p.intervalsDown.last().interval);
            inputIntervals[n-1] -= 12 * octaves; // octaveSize
            for (var i = n; i < noteArr.length; i++) {
                noteArr[i].octavesAdded += octaves;
                log.add(noteArr[i].equalPitch + "'s offset: " + noteArr[i].octavesAdded, "bullet");
            }


            // retrieve the previous partial, if it exists
            p = p.getLinkedPartial(inputIntervals[n-1], p.intervalsDown);

            if (p == null) {
                log.add("Test failed on lower notes. Interval " + inputIntervals[n-1] + " not found.", "bullet");
                return false;
            } else {
                n--;
                noteArr[n].partialNum = p.partialNum;
                log.add("Setting " + noteArr[n].equalPitch + "'s partialNum := " + noteArr[n].partialNum, "action");
            } 
        }
        log.add("Successfully tested lower notes.", "bullet");
        return true;
    }

    this.toString = function() {
        return this.roundedMIDI + " {#" + this.partialNum + "}";
    }

    this.show = function() {
        log.add(this.partialNum + ": " + this.roundedMIDI + "    ========================");
        log.add("intervals up: [" + this.intervalsUp + "]");
        log.add("intervals down: [" + this.intervalsDown + "]");
    }
}

Array.prototype.last = function() {
    return this[this.length - 1];
}

function getIntervalArr(arr) {
    return arr.map(function(n) { return n.intervalUp; }).slice(0, -1);
}

function showPartial(n) {
    harmonicSeriesModel[n].show();
}

showModel();
test();

function notesIn() {
    try {
        var args = Array.prototype.slice.call(arguments);
        var heldNotes = [];
        // just for prototyping, notes come in as array of pitches
        for (var i = 0; i < args.length; i++) heldNotes.push(new Note(args[i], 127));
        //postError("heldNotes: " + heldNotes);
        getPartials(heldNotes, harmonicSeriesModel);
        getOffsetsFromPartials(heldNotes, harmonicSeriesModel);

        var partialArr = [];
        for (var i = 0; i < heldNotes.length; i++) partialArr.push(heldNotes[i].partialNum);
        outlet(0, partialArr);
        return partialArr;
    } catch (e) {
        log.add(e + ", line " + (e.lineNumber + 1), "error");
        log.add(e.stack);
    }
}

//sort ascending
//find difference between all elements
//make intervals a part of Note
function getPartials(noteArr, model) {
    if (noteArr.length === 1) return;

    noteArr.sort(function (a, b) {
        return a.equalPitch - b.equalPitch;
    });
    
    getIntervals(noteArr);

    function getIntervals(arr) {
        for (var i = 0; i < arr.length - 1; i++) {
            arr[i].intervalUp = arr[i+1].equalPitch - arr[i].equalPitch;
        }
    }

    var inputIntervals = getIntervalArr(noteArr);
    var minIndex = getMinIndex(inputIntervals);

    function getMinIndex(arr) {
        var min = 0;
        for (var i = 1; i < arr.length; i++) {
            if ((arr[i] < arr[min]) && arr[i] != 0) min = i;
        }
        return min;
    }
    var j = 0;
    var i = 1;
    while (i < model.length) {
        log.clear();
        if (j >= model[i].intervalsUp.length) j--;
        log.add("Beginning analysis of intervals: " + inputIntervals);

        for (var k = 0; k < noteArr.length; k++) noteArr[k].octavesAdded = 0;

        // transposes large intervals into range
        var octaves = getOctaveTransposition(inputIntervals[minIndex], model[model.length-1].roundedMIDI);
        inputIntervals[minIndex] -= 12 * octaves; // octaveSize
        for (var l = minIndex+1; l < noteArr.length; l++) {
            noteArr[l].octavesAdded += octaves;
            log.add(noteArr[l].equalPitch + "'s offset: " + noteArr[l].octavesAdded, "bullet");
        }
        if (!model[i].intervalsUp[j]) j--;
        postError("j: " + i + ", " + j);
        log.add("Comparing " + inputIntervals[minIndex] + " to " + model[i].intervalsUp[j].interval + " at (" + i + ", " + j + ")", "bullet");

        while (inputIntervals[minIndex] < model[i].intervalsUp[j].interval) {
            i++;
            if (!model[i].intervalsUp[j]) j--;
            log.add("Comparing " + inputIntervals[minIndex] + " to " + model[i].intervalsUp[j].interval + " at (" + i + ", " + j + ")", "bullet");
        }

        if (inputIntervals[minIndex] === model[i].intervalsUp[j].interval) {
            log.add("Found inputIntervals[" + minIndex + "] at (" + i + ", " + j + "), testing it as " + model[i].roundedMIDI + " {#" + i + "}");
            
            //noteArr[minIndex].setPartialNum(i);
            noteArr[minIndex].partialNum = i;
            //noteArr[minIndex+1].setPartialNum(i + j + 1);

            if (model[i].hasIntervals(inputIntervals, minIndex, noteArr)) {
                for (var k = 0; k < noteArr.length; k++) noteArr[k].transposePartialNum();
                log.add("Successfully assigned partial numbers to " + noteArr);
                return;
            }
            else i++;
        } else {
            j++;
            log.add("Looking in row " + j, "bullet");
        }
    }
}

function getOffsetsFromPartials(noteArr, model) {
    for (var i = 0; i < noteArr.length; i++) {
        var realPartial = noteArr[i].partialNum / Math.pow(2, noteArr[i].octavesAdded);
        noteArr[i].offset = model[realPartial].offset;
    }
}

function getOctaveTransposition(n, max) {
    var octaves = 0;
    if (n > max) {
        octaves =  Math.ceil((n - max) / 12);
        log.add("Out of range. Transposing " + n + " down " + octaves + " octave(s).", "action");
    }
    return octaves;
} 