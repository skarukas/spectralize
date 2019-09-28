with (sketch) {
    default2d();
    textalign("right");
    fontsize(10);
    gllinewidth(2);
    glclearcolor(0, 0, 0, 0.02);
}

var vbrgb = [1.,1.,1.,1.];

inlets = 1;
var WIDTH = box.rect[2] - box.rect[0];
var HEIGHT = box.rect[3] - box.rect[1];
var maxValue = 3000;
var pitchArr, mouseX, mouseY;
var mouseIn = false;
var mouseHeld = false;

function notes() {
    pitchArr = Array.prototype.slice.call(arguments);
    draw();
}

draw();

function draw() {
    sketch.glclear();
    /*
    sketch.moveto(0, 0);
    sketch.lineto(-0.5, -0.5); */
    //sketch.linesegment(mouses[0], mouses[1], 0, mouses[0] + 0.1, mouses[1] + 0.1, 0);
    //sketch.linesegment(convertX(1000), convertY(0), 0, convertX(1000), convertY(1), 0);

    var x = 0;
    var nextX;
    if (pitchArr) {
        var len = pitchArr.length;
        for (i = 0; i < len; i++) {
            var currentPitch = pitchArr[i];
            x = i / len;
            nextX = (i + 1) / len;
            //var frgb = getNoteColor(currentPitch);
            var frgb = [0, 0, 0];
            var freq = midiToFreq(currentPitch);
            var partial = freq;
            var alpha = 1.;
            while (partial < maxValue && alpha > 0.1) {
                sketch.glcolor(frgb[0], frgb[1], frgb[2], alpha);
                sketch.linesegment(convertX(x), convertY(partial), 0, convertX(nextX), convertY(partial), 0);
                partial += freq;
                alpha *= 0.955;
            }
        }
    }

    if (mouseIn) {
        with (sketch) {
            glcolor(0, 0.7, 1);
            var mouses = screentoworld(mouseX, mouseY);
            moveto(mouses);
            text(Math.floor(screenToHz(mouseY)) + " Hz");
        }
    }

    if (mouseHeld) {
        with (sketch) {
            glcolor(0, 1, 1, 0.5);
            var mouses = screentoworld(mouseX, mouseY);
            moveto(mouses);
            circle(0.01);
        }
    }
    refresh();
}

function convertX(x) {
    return sketch.screentoworld(x * WIDTH)[0];
}

function convertY(y) {
    return sketch.screentoworld(0, hzToScreen(y))[1];
}


/* function getNoteColor(midiNote) {
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
} */

function bang()
{
	draw();
	refresh();
}

function onresize(w,h)
{
    WIDTH = w;
    HEIGHT = h;
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

function screenToHz(y) {
    return maxValue - (y / HEIGHT) * maxValue;
}

function hzToScreen(x) {
    return HEIGHT - (x / maxValue) * HEIGHT;
}

function onidle(x, y) {
    mouseIn = true;
    mouseY = y;
    mouseX = x;
    draw();
}

function ondrag(x, y, button) {
    mouseHeld = button;
    onidle(x,y);
    var freq = (button)? screenToHz(y) : 0;
    outlet(0, "clickedFreq", freq);
}

function onclick(x, y, button) {
    ondrag(x, y, button);
}

function onidleout() {
    mouseIn = false;
    draw();
}