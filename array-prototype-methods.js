
Array.prototype.contains = function(val) {
    for (i in this) {
        if (this[i] === val) return true;
    }
    return false;
}

// =================== special prototypes for Array<Note> ===================

Array.prototype.handleMidiNotes = function(pitches, velocities) {
    for (i = 0; i < pitches.length; i++) {
        this.addOrRemoveNote(pitches[i], velocities[i]);
    }
}

// adds or removes a Note from noteArr[]
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

// filters an array by mutation
Array.prototype.mutatorFilter = function(fn) {
    for (i = 0; i < this.length; i++) {
        if (!fn(this[i])) {
            this.splice(i, 1);
            i--;
        }
    }
}

// sorts a noteArray by equalPitch
Array.prototype.sortNotesAscending = function() {
    return this.sort(function (a, b) {
        return a.equalPitch - b.equalPitch;
    });
}

// sets lowest Note's offset to 0 and adjusts all others to follow
Array.prototype.normalizeToLowestNote = function() {
    this.map(function(note) {
        return note.offset -= this[0].offset;
    });
}

// resets offsets and order
Array.prototype.resetNotes = function() {
    for (i = 0; i < this.length; i++) {
        this[i].offset = 0;
        this[i].order = -1;           
    }
}

// transposes all offsets by shift
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
Array.prototype.makeZeroForm = function() {
    this.sortNotesAscending();
    var transposition;  

    if (MasterSpectrum.determineFundamental) {
        transposition = this[0].equalPitch;
    } else {
        transposition = 12 * Math.floor(this[0].equalPitch / 12);
    }
    return this.map(function(N) {return N.equalPitch - transposition});
}

// alters all Notes' offsets so that the mean of all justPitches equals the mean of all equalPitches.
// -this causes smaller pitch differences from equal temperament, and therefore reduces the 
// size of microtonal steps between chords as well (see meanMode definition)
Array.prototype.meanAdjust = function() {
    var equalTotal = 0;
    var justTotal = 0;

    for (N in this) {
        equalTotal += N.equalPitch;
        justTotal += N.equalPitch + N.offset;
    }
    
    var meanDifference = (equalTotal - justTotal) / this.length;
    this.shiftNoteOffsets(meanDifference);

    Results.fundamental += meanDifference;
}

// modifies the offset value of all Notes in heldNotes to fit exactly in the harmonic series
Array.prototype.createOffsetsByPartials = function(partialNums) {
    //var lowestHarmonic = harmonicNums[0]; // lowest harmonic currently held
    //var firstOffset = HARMONICS[lowestHarmonic - 1].offset;
    for (i = 0; i < partialNums.length; i++) {
        this[i].offset = MasterSpectrum.offsets[partialNums[i]]; // - firstOffset; // equalizes everything to the lowestHarmonic
    }
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
