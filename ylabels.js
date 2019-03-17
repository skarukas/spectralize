var yLabels = [];

function setRange(min, max) {
    yLabels = [];
    var range = max - min;
    if (range < 5) {
        addLabelEveryX(1);
    } else if (range < 15) {
        addLabelEveryX(2);
    } else if (range < 40) {
        addLabelEveryX(5);
    } else if (range < 80) {
        addLabelEveryX(10);        
    } else {
        addLabelEveryX(20);
    }


    // adds labels at a specified frequency
    function addLabelEveryX(x) {
        var modMin = closestMod(x, min);
        var modMax = closestMod(x, max);

    for (i = modMin; i <= modMax; i = i + x) {
            yLabels.push(i);
            yLabels.push(i.toString());
        }
    }

    // returns the multiple of m closest to n
    function closestMod(n, m) {
        return Math.round(m / n) * n;
    } 
}

function bang() {
    outlet(0, "defineylabels", yLabels);
}