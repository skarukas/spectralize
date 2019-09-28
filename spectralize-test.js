include("util-functions");
include("array-prototype-methods");
include("spectralize");

function test() {
    postError("========START TESTS========");
    postError("hasChromaticOctave([]): " + Util.hasChromaticOctave([])); //false (0)
    postError("hasChromaticOctave([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]): " + 
                Util.hasChromaticOctave([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13])); //true (1)
    MasterSpectrum.createSpectrum();
    //postError("midiPartials: " + MasterSpectrum._transformedMidiPartials); // Array<Number> around 30 elements long, starting with null
    postError("roundedMidiPartials: " + MasterSpectrum.roundedMidiPartials); // the same but rounded
    MasterSpectrum.stretchFactor = 2;
    postError("stretch factor: " + MasterSpectrum._stretchFactor);
    postError("roundedMidiPartials after stretch: " + MasterSpectrum.roundedMidiPartials); // a wider spaced version
    postError("offsets: " + MasterSpectrum.offsets); // decimal array, same length

    MasterSpectrum.stretchFactor = 1;
    MasterSpectrum.freqShiftHz = 10;
    postError("roundedMidiPartials after 10Hz freqShift: " + MasterSpectrum.roundedMidiPartials); // a higher, stretched version

    MasterSpectrum.fundamental = 4;
    postError("roundedMidiPartials after harmonic set to E and stretched: " + MasterSpectrum.roundedMidiPartials); // a lower version

    var testNoteArr = [
        new Note(70, 70),
        new Note(64, 80),
        new Note(60, 100),
        new Note(67, 90),
        new Note(74, 65)];

    testNoteArr.sortNotesAscending();
    //postError(testNoteArr); // Note Objs in order: 60, 64, 67, 70, 74
    var zeroForm = testNoteArr.makeZeroForm();
    postError("zeroForm: " + zeroForm); // [0, 4, 7, 10, 14]

    var partialNums = findHarmonics(zeroForm, MasterSpectrum.roundedMidiPartials);
    // postError("partialNums: " + partialNums); // [4, 5, 6, 7, 9]

    spectralize(testNoteArr);
    //postError("noteArr with offsets: ");
    //postError(testNoteArr); // Note Objs with offsets 0, -0.14, 0.02, -0.31, 0.04
    postError("Results._partialNums: " + Results._partialNums); // [4, 5, 6, 7, 9]
    postError("==ADD/REMOVE TESTS==");
    testNoteArr.addOrRemoveNote(60, 0);
    postError("remove 60:");
    postError(testNoteArr); // Note Objs in order: 64, 67, 70, 74
    testNoteArr.addOrRemoveNote(64, 67);
    postError("attempt add 64:");
    postError(testNoteArr); // should be the same as the last
    testNoteArr.addOrRemoveNote(71, 50);
    postError("add 71:");
    postError(testNoteArr); // Note Objs: 71, 64, 67, 70, 74

    /*
    program stopping for stretched spectrum!!
    stretched spectrum changes size of octave, so anything that relies on that (higher partials, octave transposition)
    will be wrong
    */
   postError("========END TESTS========\n");
}