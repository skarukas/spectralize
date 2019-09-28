//include("spectralize");

// =================== special prototypes for Array<Note> ===================

/**
 * - Determines if the Array contains a value.
 * 
 * @param {*} val 
 * 
 */
Array.prototype.contains = function(val) {
    for (i in this) {
        if (this[i] === val) return true;
    }
    return false;
}

/**
 * Filters an array by mutation.
 * - mutates <code>this</code> (Array)
 * 
 * @param {Function} fn    function to evaluate on each Array member (must return a Boolean)
 * 
 */
Array.prototype.mutatorFilter = function(fn) {
    for (i = 0; i < this.length; i++) {
        if (!fn(this[i])) {
            this.splice(i, 1);
            i--;
        }
    }
}

// =================== Array<Note> methods ===================

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
            output("allnotesoff");
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


/**
 * - Sorts <code>Array<Note></code> by <code>equalPitch</code>
 * - mutates <code>this</code> (<code>Array<Note></code>)
 * 
 */
Array.prototype.sortNotesAscending = function() {
    this.sort(function (a, b) {
        return a.equalPitch - b.equalPitch;
    });
}

/**
 * - Sets lowest <code>Note</code>'s offset to 0 and adjusts all others to follow
 * - mutates <code>this</code> (<code>Array<Note></code>)
 * 
 */
Array.prototype.normalizeToLowestNote = function() {
    this.map(function(note) {
        return note.offset -= this[0].offset;
    });
}

/**
 * - Resets every <code>Note</code>'s offset and order
 * - mutates <code>this</code> (<code>Array<Note></code>)
 * 
 */
Array.prototype.resetNotes = function() {
    for (i = 0; i < this.length; i++) {
        this[i].offset = 0;
        this[i].order = -1;           
    }
}

/**
 * - Shifts every <code>Note</code>'s offset
 * - mutates <code>this</code> (<code>Array<Note></code>)
 * 
 * @param {Number} shift  amount in semitones to shift by
 */
Array.prototype.shiftNoteOffsets = function(shift) {
    for (i = 0; i < this.length; i++) {
        this[i].offset += shift;
    }
}

// PUT THIS IN RESULTS
// sends noteMessages for every held note
Array.prototype.outputNoteMsgs = function() {
    this.forEach(function (obj) {
        output('noteMessage', obj.equalPitch, obj.offset * PREFS.intensity);
    });
}

// PUT THIS IN RESULTS
// sends noteControls for every held note
Array.prototype.outputNoteCtrls = function() {
    this.forEach(function (obj) {
        output('noteControl', obj.equalPitch, obj.velocity);
    });
}


// returns a new an Array of ascending MIDI pitches transposed so the first is equal to 0
Array.prototype.transposeToZero = function() {
    var transposition = this[0].equalPitch;
    return this.map(function(N) {return N.equalPitch - transposition});
}

// returns a new Array of ascending MIDI pitches transposed to the lowest octave
Array.prototype.transposeToLowestOctave = function() {
    var transposition = 12 * Math.floor(this[0].equalPitch / 12);
    return this.map(function(N) {return N.equalPitch - transposition});
}

Array.prototype.getAvgDeviation = function() {
    var total = 0;
    for (N in this) {
        total += N.offset;
    }
    return total / this.length * 100;
}

// alters all Notes' offsets so that the mean of all justPitches equals the mean of all equalPitches.
// -this causes smaller pitch differences from equal temperament, and therefore reduces the 
// size of microtonal steps between chords as well (see meanMode definition)
Array.prototype.getMeanDifference = function() {
    var equalTotal = 0;
    var justTotal = 0;

    for (N in this) {
        equalTotal += N.equalPitch;
        justTotal += N.equalPitch + N.offset;
    }
    return (equalTotal - justTotal) / this.length;
}

// modifies the offset value of all Notes in heldNotes to fit exactly in the harmonic series
Array.prototype.createOffsetsByPartials = function(partialNums, partialOffsets) {
    for (i = 0; i < partialNums.length; i++) {
        this[i].offset = partialOffsets[partialNums[i]];
    }
}

// outputs list of all just pitches
Array.prototype.getJustList = function() {
    return this.map(function(N) {
        return (N.offset * PREFS.intensity) + N.equalPitch;
    });
}

// outputs list of all equal pitches
Array.prototype.getEqualList = function() {
    return this.map(function(N) {
        return N.equalPitch;
    });
}

// sends out a list of the offset of every pitch in the heldNotes Array
Array.prototype.getOffsetList = function() {
    return this.map(function(N) {
        return N.offset * PREFS.intensity * 100;
    });
}

// sends out a list of the offset of every pitch in an octave
Array.prototype.getOffsetOctave = function() {
    var offsetArr = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    for (i = 0; i < this.length; i++) {
        var N = this[i];
        offsetArr[N.equalPitch % 12] = N.offset * PREFS.intensity;
    }
    return offsetArr;
}

/* 
//NOT USED
// sends note-offs then empties the array
Array.prototype.clearNotes = function() {
    this.forEach(function (N) {
        noteCtrlOut(N.equalPitch, 0);
    });
    this.length = 0;
}
 */
