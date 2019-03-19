inlets = 2;
outlets = 1;

var leftIn = [];
var rightIn = [];

function anything() {
    var lacedArr = [];

	if (inlet===1) {
        rightIn = arguments;
    } else {
        leftIn = arguments;
        for (i = 0; i < leftIn.length; i++) {
            r = rightIn[i] || 0;
            lacedArr.push(leftIn[i]);
            lacedArr.push(r); 
        }
        outlet(0, lacedArr);
    }
}