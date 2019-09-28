include("util-functions");

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
    //_freqShiftHz: 0,
    _fundamental: 0,
    _determineFundamental: true,

    // internal set for automatically calculating roundedMidiPartials and offsets
    set transformedMidiPartials(arr) {
        postError("Called! w/ :" + arr);
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
/*     set freqShiftHz(hz) {
        this._freqShiftHz = hz;
        this.applyTransformations();
    }, */

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
        var chromaticOctave = false;
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
        //var f1 = this._fundamental;
        //var shift = this._freqShiftHz;
        this.transformedMidiPartials = this._midiPartials.map(function(midiPitch) {
            // scary math: transposes the stretched spectrum, then shifts it
            //var result = 12 * Math.log(Math.pow(2, (midiPitch + f1 - 69) / 12) + (shift / 440)) / Math.log(2) + 69;
            return midiPitch + MasterSpectrum._fundamental;
        });
    }
}