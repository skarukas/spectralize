sketch.default2d();
var vbrgb = [1.,1.,1.,1.];

inlets = 1;
var WIDTH = 400;
var HEIGHT = 300;
var maxValue = 3000;
var aspect = 1;
var pitchArr;

function notes() {
    pitchArr = Array.prototype.slice.call(arguments);
    draw();
}

draw();

function draw() {
    HEIGHT = box.rect[3] - box.rect[1]; 
    WIDTH = box.rect[2] - box.rect[0];
	aspect = WIDTH/HEIGHT;
    
    sketch.glclearcolor(0, 0, 0, 0.02);
    sketch.glclear();
    sketch.gllinewidth(2);

    sketch.glcolor(1, 0, 0, 1);
    post(aspect);
    /*
    sketch.moveto(0, 0);
    sketch.lineto(-0.5, -0.5); */
    sketch.linesegment(-5, 1, 1, aspect, -1, 1);

    var y = 0;
    var nextY;
    if (pitchArr) {
        var len = pitchArr.length;
        for (i = 0; i < len; i++) {
            var currentPitch = pitchArr[i];
            y = i / len;
            nextY = (i + 1) / len;
            //var frgb = getNoteColor(currentPitch);
            var frgb = [0, 0, 0];
            var freq = midiToFreq(currentPitch);
            var partial = freq;
            var alpha = 1.;
            while (partial < maxValue && alpha > 0.1) {
                sketch.glcolor(frgb[0], frgb[1], frgb[2], alpha);
                sketch.linesegment(convertX(partial), convertY(y), 1, convertX(partial), convertY(nextY), 1);
                partial += freq;
                alpha *= 0.95;
            }
        }
    }
    refresh();
}

function convertX(x) {
    return (x / (maxValue/2) - 1) * aspect;
}

function convertY(y) {
    return y * -2 + 1;
}

function getNoteColor(midiNote) {
    var rgb;
    switch (Math.round(midiNote) % 12) {
        case 0:
            rgb = [0.996078, 0.933333, 0.039216]; //yellow
            break;
        case 1:
            rgb = [0.992157, 0.764706, 0.035294]; //orange-yellow
            break;
        case 2:
            rgb = [0.988235, 0.4, 0.031373]; //orange
            break; 
        case 3:
            rgb = [0.058824, 0.462745, 0.160784]; //dark green
            break;
        case 4:
            rgb = [0.113725, 0.866667, 0.286275]; //green
            break;
        case 5:
            rgb = [0.352941, 1., 0.027451]; //yellow-green
            break;
        case 6:
            rgb = [0.439216, 0.372549, 0.317647]; //dark pink
            break;
        case 7:
            rgb = [0.403922, 0.313725, 0.458824]; //dark purple
            break;
        case 8:
            rgb = [0.819608, 0.537255, 0.694118]; //pink
            break; 
        case 9:
            rgb = [0.815686, 0.117647, 0.25098]; //red
            break;
        case 10:
            rgb = [0.431373, 0.290196, 0.760784]; //purple
            break;   
        case 11:
            rgb = [0.12549, 0.301961, 0.760784]; //blue
            break;                    
    }
    return rgb;
}

function bang()
{
	draw();
	refresh();
}

function onresize(w,h)
{
    aspect = w/h;
	draw();
	refresh();
}
onresize.local = 1; //private

function maxvalue(val) {
    maxValue = val;
    draw();
}

function midiToFreq(m) {
    return Math.pow(2, (m - 69) / 12) * 440;
}