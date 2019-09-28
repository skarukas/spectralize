//include("spectralize");
include("master-spectrum");

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
    _averageDeviation: [],

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
    set averageDeviation(d) {
        this._averageDeviation = d;
        output("averageDeviation", d);
    },

    makeKeyboardSpectrum: function() {
        //TODO: get current spectrum in rounded MIDI between bottom of keyboard and top, not including equalPitches
        //don't include duplicates from spectrum array
        var arr = [];

        var f0 = Math.round(this._fundamental);
        var partials = MasterSpectrum._roundedMidiPartials;
        var i = 1;
        var pitch = 0;
        while (i < partials.length && pitch < 108) {
            pitch = f0 + partials[i];
            arr[i-1] = pitch;
            i++;
        }
        // if out of range of spectrum, fill in the rest of the keyboard with chromatic pitches
        while (pitch < 108) {
			pitch++;
            arr[i-1] = pitch;
            i++;
			
        }

        // don't include notes already held down or notes below the range
        arr.mutatorFilter(function(elem) {
            !this._equalPitches.contains(elem) || elem < 21;
        });

        this.fullKeyboardSpectrum = arr;
        output("fullKeyboardSpectrum", arr);
    }
}