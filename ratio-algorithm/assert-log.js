var log = {
    numTests: 0,
    arr: [],
    printStream: postError,

    begin: function() {
        this.printStream("************* BEGINNING TEST *************\n");
        this.numTests = 0;
    },
    end: function() {
        this.printStream(this.numTests + " Tests Completed Successfully.");
    },
    add: function (str, type) {
        switch(type) {
            case "bullet": 
                str = "    - " + str;
                break;
            case "action": 
                str = "    <<< " + str + " >>>";
                break;
            case "header":
                str = "===== " + str + " =====";
                break;
            case "error":
                str = "****** " + str + " ******";
            default:
        }
        this.arr.push(str);
    },

    clear: function() {
        this.arr = [];
    },

    print: function() {
        this.printStream("    # =========== STATEMENT LOG ===========");
        for (var i = 0; i < this.arr.length; i++) {
            this.printStream("    #    " + this.arr[i]);
        }
    }
}

// allows chaining (inner function returns itself)
function assertIO(fn) {
    return chain(function(args, expect) {
        if (typeof args !== "object") args = [args];

        log.clear();
        try { var result = fn.apply(null, args) }
        catch (e) { log.add(e, "error") }
        if (JSON.stringify(result) == JSON.stringify(expect) || 
            JSON.stringify(result.map(function(n) {return n*2;})) == JSON.stringify(expect)) {
            //post(".");
            //postError(fn.name + "(" + args + ") === [" + expect + "]");
        } else {
            throw "<<< Test Failed: " + fn.name + "(" + args + "). " +
            "Expected value: " + expect + ", " + 
            "Actual value: " + result + " >>>\n";
        }
    });
}

function assertEqual(a, b) {
    log.clear();
    if (a !== b) {
        throw "<<< Test Failed: " + a + " !== " + b + " >>>\n";
    }

    return assertEqual;
}

// note that this is O(n! * 2^n), so watch out
function checkChord(fn) {
    var inner = function(args, expect) {
        var transposedArgPermutation = allAppliedCombinations(args, function(n) { return n+12; });
        var transposedExpectPermutation = allAppliedCombinations(expect, function(n) { return n*2; });
        transposedExpectPermutation.pop(); // gets rid of the "fully transposed" version which would give errors
        transposedArgPermutation.pop();    // gets rid of the "fully transposed" version which would give errors
        for (var i = 0; i < transposedArgPermutation.length; i++) {
            log.add("Testing " + transposedArgPermutation[i] + " against " + transposedExpectPermutation[i]);
            pAssert(fn)(transposedArgPermutation[i], transposedExpectPermutation[i]);
        }
        return inner;
    };
    return inner;
}

// for functions that take many arguments and return an array of that same size
// checks that any order of arguments returns the corresponding result
function pAssert(fn) {
    return function(args, expect) {
        var permArgs = permutations(args);
        var permExpect = permutations(expect);
        // checks that any order of arguments creates the same ordered results
        for (var i = 0; i < permArgs.length; i++) {
            log.add("Testing " + permArgs[i] + " against " + permExpect[i]);
            assertIO(fn)(permArgs[i], permExpect[i]);
        }
    };
}

function permutations(arr) {
    var results = [];
    if (arr.length === 1) {
        results.push(arr);
        return results;
    }

    for (var i = 0; i < arr.length; i++) {
        var rest = arr.slice(0);
        var elem = rest.splice(i, 1)[0];
        permutations(rest).map(function (a) {
            a.unshift(elem);
            results.push(a);
        });
    }
    return results;
}

// gets all 2^n possible arrays made by applying fn to a subset of arr
function allAppliedCombinations(arr, fn) {
    var results = [];
    if (arr.length === 1) {
        return [[ arr[0] ], [ fn(arr[0]) ]];
    }
    
    var rest = arr.slice(0);
    var first = rest.splice(0, 1)[0];
    var alteredFirst = fn(first);

    var restResults = allAppliedCombinations(rest, fn);
    var restResultsCopy = allAppliedCombinations(rest, fn); // must be deep copied

    restResults.map(function (a) {
        a.unshift(first);
        results.push(a);
    });

    restResultsCopy.map(function (b) {
        b.unshift(alteredFirst);
        results.push(b);
    });

    return results;
}

// allows a function with no return value to be called repeatedly by returning itself
function chain(fn) {
    var inner = function() {
        fn.apply(null, arguments);
        inner.$value = fn.apply(null, arguments);
        return inner;
    }
    return inner;
}

function postError(str) {
    post(str + "\n");
}
