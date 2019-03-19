var letterNames = [];

function equalPitchList() {
	if (arguments !== "bang") {
		letterNames = [];
		var args = Array.prototype.slice.call(arguments);
		for (i = 0; i < args.length; i++) {
			letterNames.push(getMIDILetter(args[i]));
		}
	}
}

function getMIDILetter(n) {
	var noteNames = ["C", "C\u266F", "D", "D\u266F", "E", "F", "F\u266F", "G", "G\u266F", "A", "A\u266F", "B"];
	var modPitch = getModPitch(n);
	var noteName = noteNames[modPitch];
	var octaveNum = Math.floor(n / 12);

	function getModPitch(note) {
		if (note % 12 < 0) {
			getModPitch(note + 12);
		} else {
			return note % 12;
		}
	}
	return noteName + octaveNum;
	
}

function harmonicNums() {
	var labelArr = [];
	for (i = 0; i < arguments.length; i++) {
		labelArr.push(i);
		labelArr.push(letterNames[i] + "\n (" + arguments[i] + ")");
	}
	outlet(0, "definexlabels", labelArr);
	outlet(0, "definedomain", 0, arguments.length - 1);
}