include("array-prototype-methods.js");
include("assert-log.js");

function Note(_pitch, _velocity) {
    this.equalPitch = _pitch;
    this.offset = 0;
    this.partialNum = 0;
    this.velocity = _velocity;

    this.toString = function() {
        return this.equalPitch + " {#" + this.partialNum + "}";
    }
}

function test() {
    try {
        log.begin();
        
        checkChord(notesIn)
        ([30],                                     [1]) // singleton
        ([60, 60],                              [1, 1]) // duplicates
        ([60, 64, 67, 70],                      [4, 5, 6, 7]) // dominant chord
        ([0, 1, 2, 4, 6, 7, 8],                 [13, 14, 15, 16, 18, 19, 21])
        ([46, 47, 48, 49, 50, 62, 70],          [14, 15, 16, 17, 18, 35, 56])
        ([46, 48, 50, 53, 56, 58, 60, 70, 71],  [8, 9, 10, 12, 14, 16, 18, 32, 34]);

        log.end();
    } catch (e) {
        postError(e);
        log.print();
    }
}

var heldNotes = [];

// main function--processes incoming MIDI notes, sending out noteControls (MIDI notes) 
//      and noteMessages (pitch bend for each note).
function notesIn() {
    var start = Date.now();

    var pitches = arguments;
    /* var velocities = [];

    // get input pitch and velocity arrays from laced arguments
    for (i = 0; i < arguments.length; i++) {
        var elem = arguments[i];
        if (i%2 === 0) {
            pitches.push(elem);
        } else {
            velocities.push(elem);
        }
    } */

/*     // reset offset and order properties
    heldNotes.resetNotes();

    // add or remove notes
    //heldNotes.handleMidiNotes(pitches, velocities);
    heldNotes.handleMidiNotes(pitches, pitches);

    // output note-on/off messages
    //heldNotes.outputNoteCtrls(); // change??? */
    heldNotes = [];
    for (var i = 0; i < pitches.length; i++) {
        heldNotes.push(new Note(pitches[i], 60));
    }

    log.add("Added notes to heldNotes. " + heldNotes, "action");

    getPartials(heldNotes);

    log.add("Calculated partials. " + heldNotes, "action");

    // output pitch adjustments from processing
    //heldNotes.outputNoteMsgs(); // change???

    //justCompOut();

    var end = Date.now();
    var latency = end - start;

    return heldNotes.map(function(note) { return note.partialNum });
}

/**
 * - Resets every <code>Note</code>'s offset and order
 * - mutates <code>this</code> (<code>Array<Note></code>)
 * 
 */
Array.prototype.resetNotes = function() {
    for (i = 0; i < this.length; i++) {
        this[i].offset = 0;
        this[i].partial = -1;
    }
}

/**
 * - Applies <code>Array.prototype.addOrRemoveNote()</code> for every pitch/velocity pair recieved
 * - mutates <code>this</code> (Array<Note>)
 * 
 * @param {Array<Number>} pitches       pitches to be added or removed
 * @param {Array<Number>} velocities    velocities corresponding to pitches (must be same length)
 * 
 */
Array.prototype.handleMidiNotes = function(pitches, velocities) {
    for (i = 0; i < pitches.length; i++) {
        this.addOrRemoveNote(pitches[i], velocities[i]);
    }
}

/**
 * - Adds a Note of given pitch and velocity if <code>velocity</code> < 0 and pitch is not already in the Array. 
 * - Removes all Notes of given pitch if <code>velocity</code> == 0.
 * - mutates <code>this</code> (Array<Note>)
 * 
 * @param {Number} pitch       pitch to be added or removed
 * @param {Number} velocity    velocity corresponding to pitch
 * 
 */
Array.prototype.addOrRemoveNote = function(pitch, velocity) {
    var noteArr = this;
    if (velocity) {
        addNote();
    } else {
        noteArr.mutatorFilter(notPitchMatch);
        if (!noteArr.length) {
            //output("allnotesoff");
        }
    }

    // checks whether a Note does not match pitch
    function notPitchMatch(N) {
        return N.equalPitch !== pitch;
    }

    // adds the Note to heldNotes[]
    function addNote() {
        var hasNoPitch = noteArr.every(notPitchMatch);
        if (hasNoPitch) {
            noteArr.push(new Note(pitch, velocity));
        }
    }
}

function getPartials(arr) {

    var minIndex = getMinIndex(arr);

    function getMinIndex(a) {
        var min = 0;
        for (var i = 1; i < a.length; i++) {
            if (a[i] < a[min]) min = i;
        }
        return min;
    }

    var i = 1;
    var j = 0;
    arr[minIndex].partialNum = i;

    // get ratios from minimum
    for (var k = 0; k < arr.length; k++) {
        arr[k].ratioFromMin = Math.pow(2, (arr[k].equalPitch - arr[minIndex].equalPitch)/12);
    }
    var quarterToneRatio = Math.pow(2, -24);

    while (j < arr.length) {

        var integerRatio = i / j;
        var trueRatio = arr[j].ratioFromMin;
/*         var testPartial = i * Math.pow(2, (arr[j].equalPitch - arr[minIndex].equalPitch)/12);
        var roundedPartial = Math.round(testPartial);
        var midiError = 12 * Math.abs(log2(testPartial/roundedPartial)); */

        //if (midiError < 0.5) {
        if (trueRatio / integerRatio < quarterToneRatio) {
            arr[j].partialNum = roundedPartial; //find roundedPartial???
            j++;
        } else {
            j = 0;
            i++;
            arr[minIndex].partialNum = i;
        }
    }
    var partials = arr.map(function(n) {
        return n.partialNum;
    });
    log.add("Ratios are [" + partials + "]: " + i);
    return;
}

function log2(n) {
    return Math.log(n) / Math.log(2);
}

/* function getPartials(arr) {
    var i = 1;
    var j = 1;
    while (j < arr.length-1) {
        log.add("Assuming " + heldNotes[0].equalPitch + " is {#" + i + "}", "bullet");
        arr[0].partialNum = i;
        
        var testPartial = i * Math.pow(2, (arr[j].equalPitch - arr[0].equalPitch)/12);
        var roundedPartial = Math.round(testPartial);
        var midiError = 12 * Math.abs(log2(testPartial/roundedPartial));
        if (midiError < 0.5) {
            arr[j].partialNum = roundedPartial;
            j++;
        } else {
            j = 0;
            i++;
        }
    }
} */