var arr = [];

function note(p, v) {
	if (v) arr.push(p);
	else arr = arr.filter(function(e) {
		return e !== p;
	});
	outlet(0, arr);
}