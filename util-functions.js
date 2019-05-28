// =================== namespace for utility functions ===================

var Util = {

    /**
     * 
     * @param {Number} num         element to search for
     * @param {Array<Number>} arr  sorted Array to search in
     * @param {Number} index       index at which to start searching
     * 
     * @return {Number}            index of a, or -1 if not found
     */
    findIndex: function(num, arr, index) {
        index = index || 0;
        var queryNum = arr[index];
        while (num !== queryNum) {
            if (num > queryNum) 
                queryNum = arr[++index];
            else 
                return -1;
        }
        return index;
    },
    
    /**
     * find nth harmonic of a MIDI note
     * 
     * @param {MIDINumber} f1   fundamental pitch
     * @param {Number} n        partial number (1-indexed!)
     * @param {Number} stretch  amount to stretch spectrum by
     * 
     * @return {MIDINumber}     pitch of nth harmonic
     */
    MIDIHarmonic: function(f1, n, stretch) {
        stretch = stretch || 1;
        return f1 + 12 * Math.log(stretch * (n-1) + 1)/Math.log(2);
    },
    
    /**
     * find nth subharmonic of a MIDI note
     * 
     * @param {MIDINumber} f1   fundamental pitch
     * @param {Number} n        partial number (1-indexed!)
     * @param {Number} stretch  amount to stretch spectrum by
     * 
     * @return {MIDINumber}     pitch of nth subharmonic
     */
    MIDISubHarmonic: function(f1, n, stretch) {
        stretch = stretch || 1;
        return f1 - 12 * Math.log(stretch * (n-1) + 1)/Math.log(2);
    },

    // checks if the last elements, rounded, cover every chromatic pitch in an octave
    hasChromaticOctave: function(arr) {
        var count = 0;
        i = arr.length - 1;
        while (i) {
            var a = Math.round(arr[i]);
            var b = Math.round(arr[i-1]);

            if (a - b === 1) {
                count++;
                i--;
            } else if (a === b) {
                i--;
            } else {
                break;
            }
        }
        return count === 12;
    }
}