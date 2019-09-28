var log = {
    arr: [],
    printStream: console.log,

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
        postError("    # =========== STATEMENT LOG ===========");
        for (var i = 0; i < this.arr.length; i++) {
            postError("    #    " + this.arr[i]);
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
        if (JSON.stringify(result) == JSON.stringify(expect)) {
            postError(fn.name + "(" + args + ") === [" + expect + "]");
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

// for functions that take many arguments and return an array of that same size
// checks that any order of arguments returns the corresponding result
function pAssert(fn) {
    return function(args, expect) {
        var permArgs = permutations(args);
        var permExpect = permutations(expect);
        // checks that any order of arguments creates the same ordered results
        for (var i = 0; i < permArgs.length; i++) {
            assertIO(fn)(permArgs[i], permExpect[i]);
        }
    }
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
