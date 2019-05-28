// =================== retrieved data ===================

var Results = {

    _fundamental: 0,
    _equalPitches: [],
    _justPitches: [],
    _offsets: [],
    _partialNums: [],
    _latency: [],
    _offsetOctave: [],
    _offsetList: [],

    fullKeyboardSpectrum: [],

    set fundamental(num) {
        this._fundamental = num;
        output("fundamental", num);
        post("fundamental: " + num)

        this.makeKeyboardSpectrum();
    },
    set justPitches(arr) {
        this._justPitches = arr;
        output("justPitches", arr);
    },
    set equalPitches(arr) {
        this._equalPitches = arr;
        output("equalPitches", arr);
    },
    set partialNums(arr) {
        this._partialNums = arr;
        output("partialNums", arr);
    },
    set latency(num) {
        this._latency = num;
        output('latency', num);
    },
    set offsetOctave(arr) {
        this._offsetOctave = arr;
        output("offsetOctave", arr);
    },
    set offsetList(arr) {
        this._offsetList = arr;
        output("offsetList", arr);
    },

    makeKeyboardSpectrum: function() {
        //TODO: get current spectrum in rounded MIDI between bottom of keyboard and top, not including equalPitches
        //don't include duplicates from spectrum array
        postError("makeKeyboardSpectrum");
    },

    // outputs list of all just pitches
    genJustList: function(noteArr) {
        this.justPitches = noteArr.map(function(N) {
            return (N.offset * PREFS.intensity) + N.equalPitch;
        });
    },

    // outputs list of all equal pitches
    genEqualList: function(noteArr) {
        this.equalPitches = noteArr.map(function(N) {
            return N.equalPitch;
        });
    },

    // sends out a list of the offset of every pitch in the heldNotes Array
    genOffsetList: function(noteArr) {
        this.offsetList = noteArr.map(function(N) {
            return N.offset * PREFS.intensity * 100;
        });
    },

    // sends out a list of the offset of every pitch in an octave
    genOffsetOctave: function(noteArr) {
        var offsetArr = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        for (i = 0; i < noteArr.length; i++) {
            var N = noteArr[i];
            offsetArr[N.equalPitch % 12] = N.offset * PREFS.intensity;
        }
        this.offsetOctave = offsetArr;
    },
}