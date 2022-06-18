let canvas;
var pg;
var svgout;
var mask;
var blurpass1;
var blurpass2;
var effectpass;

let helvetica;
let effect;
let blurH;
let blurV;

var envelope, osc;
var envelope2, osc2;

var cl1, cl2, cl3;

var heads = [];
var ofrq;
let mic;
let fft;
let oscCount = 10;
let allOscs = [];
let minFreq = 100;
let maxFreq = 1000;

var oscillators = [];
var panners = [];
var mm;
var res = 1400;
var globalseed = Math.round(fxrand()*10000);

function fxrandom(a, b){
    if(a && b){
        return a + fxrand()*(b-a);
    }
    if(a && !b){
        return fxrand()*a;
    }
    if(!a && !b){
        return fxrand();
    }
}




var palettes0 = [
    '001d3d-003566-001d3d-003566-ffd60a',
]
function shuffle(array) {
    let currentIndex = array.length
    var randomIndex;

  
    // While there remain elements to shuffle.
    while (currentIndex != 0) {
  
      // Pick a remaining element.
      randomIndex = Math.floor(fxrand() * currentIndex);
      currentIndex--;
  
      // And swap it with the current element.
      [array[currentIndex], array[randomIndex]] = [
        array[randomIndex], array[currentIndex]];
    }
  
    return array;
  }
var palettes = [];
function hexToRgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [
      parseInt(result[1], 16),
      parseInt(result[2], 16),
      parseInt(result[3], 16)
    ] : null;
}
var palette;
var thidx;


function preload() {
    effect = loadShader('assets/effect.vert', 'assets/effect.frag');
    blurH = loadShader('assets/blur.vert', 'assets/blur.frag');
    blurV = loadShader('assets/blur.vert', 'assets/blur.frag');
}

var movers = [];

function setup(){
    mm = min(windowWidth, windowHeight);
    pixelDensity(2);
    canvas = createCanvas(mm, mm, WEBGL);
    imageMode(CENTER);
    
    randomSeed(globalseed);
    noiseSeed(round(fxrand()*100000));

    for(var k = 0; k < palettes0.length; k++){
        let text = palettes0[k];
        let cols = text.split('-')
        let caca = [];
        cols.forEach((e)=>{
            var hhh = hexToRgb(e);
            console.log(hhh)
            var gg = 0.3*hhh[0] + 0.59*hhh[1] + 0.11*hhh[2];
            if(gg < 127){
                //hhh[0] *= .5/gg;
                //hhh[1] *= .5/gg;
                //hhh[2] *= .5/gg;
            }
            caca.push(hhh);
        });
        shuffle(caca)
        var coco = [];
        caca.forEach((e, i)=>{coco.push([(caca[i][0]+0*.01*map(fxrand(), 0, 1, -.2, .2)), (caca[i][1]+0*.01*map(fxrand(), 0, 1, -.2, .2)), (caca[i][2]+0*.01*map(fxrand(), 0, 1, -.2, .2))])});
        palettes[k] = coco;
    }

    thidx = Math.floor(map(fxrand(), 0, 1, 0, palettes.length));
    palette = palettes[thidx]
    shuffle(palette)

    pg = createGraphics(res, res, WEBGL);
    pg.noStroke();
    //pg.colorMode(HSB, 100);
    //pg.strokeJoin(ROUND);
    pg.ortho(-res/2, res/2, -res/2, res/2, 0, 4444);
    mask = createGraphics(res, res, WEBGL);
    mask.noStroke();
    mask.ortho(-res/2, res/2, -res/2, res/2, 0, 4444);
    mask.background(255);
    //mask.strokeJoin(ROUND);
    colorMode(HSB, 100);
    pg.rectMode(CENTER);

    blurpass1 = createGraphics(res, res, WEBGL);
    blurpass2 = createGraphics(res, res, WEBGL);
    effectpass = createGraphics(res, res, WEBGL);
    blurpass1.noStroke();
    blurpass2.noStroke();
    effectpass.noStroke();
    imageMode(CENTER);
    //noCursor();

    //envelope.play(osc);

    cl1 = color(0, 0, 100);
    cl2 = color(0, 0, 10);

    //generateHeads(20, 31114);
    //frameRate(5);
    initLines(its);
    //move();
    //showall();
    //showall();
    //fxpreview();

}

var s = "HELLO";
var binsum = 0;
var timer = -1;
var num = 20;

var shapes = [];

function subdivide(shape, le=30){
    var nshape = [];
    for(var k = 0; k < shape.length; k++){
        var s = shape[k];
        var ns = shape[(k+1)%shape.length];
        var di = s.dist(ns);
        var subs = ceil(di/le);
        var verts = 1 + subs;
        for(var v = 0; v < verts; v++){
            var p = map(v, 0, verts, 0, 1);
            var cx = lerp(s.x, ns.x, p);
            var cy = lerp(s.y, ns.y, p);
            nshape.push(createVector(cx, cy));
        }
    }
    return nshape;
}

function disturb(shape, amp){
    var nshape = [];
    for(var k = 0; k < shape.length; k++){
        var cx = shape[k].x;
        var cy = shape[k].y;
        var aamp = amp * power(noise((cx+res/2)*.01, (cy+res/2)*.01), 4);
        cx += aamp*(-1 + 2*fxrand());
        cy += aamp*(-1 + 2*fxrand());
        nshape.push(createVector(cx, cy));
    }
    return nshape;
}

function drawColor(){
    pg.colorMode(RGB, 255);
    pg.background(palette[0][0], palette[0][1], palette[0][2]);
    pg.background(20, 20, 20);
    //pg.colorMode(HSB, 100);

    var id1 = floor(fxrand()*palette.length);
    var id2 = floor(fxrand()*palette.length);
    var c1 = palette[id1];
    var c2 = palette[id2];

    var cols = [ [255,0,0],  [255,60,0]]

    var r = 200;
    var n = 3;
    for(var k = 0; k < n; k++){
        var p = map(k, 0, n-1, 0, 1);
        var ang = map(k, 0, n, 0, 2*PI);
        var x = r*cos(ang);
        var y = r*sin(ang);
        //shape.push(createVector(x, y));
    }

    shapes.push(
        [
            createVector(-100, -200),
            createVector(+100, -200),
            createVector(+100, +200),
            createVector(-100, +200),
        ],
        [
            createVector(+44, -133),
            createVector(+244, -133),
            createVector(+244, +277),
            createVector(+44, +277),
        ]
    )

    var maxits = 5;
    var maxdraws = 15;
    for(var it = 0; it < maxits; it++){
        var le = map(it, 0, maxits-1, 30, 25);

        for(var ss = 0; ss < shapes.length; ss++){
            shapes[ss] = subdivide(shapes[ss], le);
        }

        var numdraws = maxdraws -  maxdraws*pow(map(it, 0, maxits, 0, 1), 2);
        for(var dr = 0; dr < numdraws; dr++){

            for(var ss = 0; ss < shapes.length; ss++){
                var shape2 = disturb(shapes[ss], map(it, 0, maxits-1, 40, 2));

                pg.noStroke();
                pg.beginShape(TESS);
                for(var k = 0; k < shape2.length; k++){
                    var x = shape2[k].x;
                    var y = shape2[k].y;
                    var aa = power(noise((x+res/2)*0.01, (y+res/2)*0.01), 3);
                    var c = [0,0,0];
                    c[0] = aa*c1[0]+(1-aa)*c2[0];
                    c[1] = aa*c1[1]+(1-aa)*c2[1];
                    c[2] = aa*c1[2]+(1-aa)*c2[2];
                    pg.fill(cols[ss][0], cols[ss][1], cols[ss][2], 5);
                    pg.vertex(x, y, 0);
                }
                pg.endShape();
                
                pg.noFill();
                pg.stroke(255, 5);
                pg.strokeWeight(.1)
                pg.beginShape(TESS);
                for(var k = 0; k < shape2.length; k++){
                    var x = shape2[k].x;
                    var y = shape2[k].y;
                    //pg.vertex(x, y, 0);
                }
                pg.endShape();

                if(dr == 5-1){
                    shapes[ss] = shape2;
                }
            }
        }
    }


}

function showall(){
    background(14);
    pg.push();
    //pg.scale(0.8);
    pg.pop();
    //pg.line(0,0,mouseX-width/2,mouseY-height/2);

    blurH.setUniform('tex0', pg);
    blurH.setUniform('tex1', mask);
    blurH.setUniform('texelSize', [1.0/res, 1.0/res]);
    blurH.setUniform('direction', [1.0, 0.0]);
    blurH.setUniform('u_time', frameCount*0+globalseed*.01);
    blurH.setUniform('amp', .07);
    blurH.setUniform('seed', (globalseed*.12134)%33.);
    blurpass1.shader(blurH);
    blurpass1.quad(-1,-1,1,-1,1,1,-1,1);
    
    blurV.setUniform('tex0', blurpass1);
    blurV.setUniform('tex1', mask);
    blurV.setUniform('texelSize', [1.0/res, 1.0/res]);
    blurV.setUniform('direction', [0.0, 1.0]);
    blurV.setUniform('u_time', frameCount*0+globalseed*.01);
    blurV.setUniform('amp', .07);
    blurV.setUniform('seed', (globalseed*.12134)%33.);
    blurpass2.shader(blurV);
    blurpass2.quad(-1,-1,1,-1,1,1,-1,1);

    effect.setUniform('tex0', blurpass2);
    effect.setUniform('tex1', pg);
    effect.setUniform('u_resolution', [res, res]);
    effect.setUniform('u_mouse', [res, res]);
    effect.setUniform('u_time', frameCount);
    effect.setUniform('incolor', [random(.99, 1.), random(.99, 1.), .99, 1.]);
    effect.setUniform('seed', globalseed);
    effectpass.shader(effect);
    effectpass.quad(-1,-1,1,-1,1,1,-1,1);
  
    // draw the second pass to the screen
    image(effectpass, 0, 0, mm-18, mm-18);

}

var N = 30;
var all = 0;

function initLines(its){
    if(its == numits)
        N = 30;
    else
        N = 30;
    for(var k = 0; k < N; k++){
        var x = map(fxrand(), 0, 1, -res/2*sc*.98, res/2*sc*.98);
        var y = map(pow(fxrand(),1), 0, 1, -res/2*sc*.98, res/2*sc*.98);
        var dir = createVector(1, 0);
        if(its == numits){
            //dir.rotate(radians(map(fxrand(), 0, 1, -1, 1)));
            //dir.rotate(PI/2);
        }
        else{
            //dir.rotate(radians(map(fxrand(), 0, 1, -77, 77)));
        }
        dir.rotate(fxrand()*100);
        movers.push({'pos': createVector(x, y), 'dir': dir, 'id': all++});
        movers.push({'pos': createVector(x, y), 'dir': p5.Vector.mult(dir, -1), 'id': all++});
    }
    return movers;
}

var sc = .9;
var step = 0;
numits = 12;

function move(){
    var toremove = [];
    for(var k = 0; k < movers.length; k++){
        var p = movers[k]['pos'];
        var dir = movers[k]['dir'];
        var id = movers[k]['id'];

        var frq = 1.;
        if(its < numits){
            frq = 1.;
        }
        var amp = 1.;
        if(its < numits){
            amp = 1 + 5*power(noise(its), 4);
        }
        
        var option = 0;
        if(option == 0){
            var acc = createVector(0, 0);
            acc.x = (-.5+power(noise(id, step*.01*frq, 8833.3), 2));
            acc.y = (-.5+power(noise(id, step*.01*frq, 221.21), 2));
            acc.normalize();
            acc.mult(.0015*amp);
            dir.add(acc);
            dir.mult(.99);
            dir.normalize();
        }
        else{
            dir.x += .5*amp*(-.5+power(noise(k, step*.000001*frq, 8833.3), 2));
            dir.y += .5*amp*(-.5+power(noise(k, step*.000001*frq, 221.21), 2));
            dir.normalize();
        }

        var pn = p.copy();
        pn.add(dir);
        pn.add(dir);
        pn.add(dir);
        pn.add(dir);

        var maskvalue = round(mask.get(pn.x+res/2, -pn.y+res/2)[0]/255.);
        
        /*let d = 1;
        let off = (round(pn.y+res/2) * mask.width + round(pn.x+res/2)) * d * 4;
        let components = [
          mask.pixels[off],
          mask.pixels[off + 1],
          mask.pixels[off + 2],
          mask.pixels[off + 3]
        ];*/
        if(maskvalue > 0){
            p.add(dir);
        }
        else{
            toremove.push(k);
        }
        if(p.x > res/2*sc || p.x < -res/2*sc){
            //dir.x *= -1;
            //p.add(dir);
            //p.add(dir);
            //p.add(dir);
            toremove.push(k);
        }
        if(p.y > res/2*sc || p.y < -res/2*sc){
            //dir.y *= -1;
            //p.add(dir);
            //p.add(dir);
            //p.add(dir);
            toremove.push(k);
        }
    }

    for(var k = 0; k < toremove.length; k++){
        movers.splice(toremove[toremove.length-k-1], 1);
    }
    
    step++;
}

function render(){
    pg.noStroke();
    mask.noStroke();
    mask.fill(0);

    //pg.colorMode(HSB, 100);
    pg.colorMode(RGB, 255);
    for(var k = 0; k < movers.length; k++){
        var p = movers[k]['pos'];
        var pn = p.copy();
        var dir = movers[k]['dir'];
        var id = movers[k]['id'];
        var rr = 4*(1+1*power(noise(step*0.01, id), 3));
        pn.add(dir);
        //pg.fill(k%25*3,40);
        //pg.rect(p.x+220/2, p.y, 220., rr);
        //pg.rect(p.x, p.y, rr, rr);
        var col = palette[its%palette.length];
        if(its == numits && false){
            pg.fill(90, 50);
            pg.rect(pn.x, pn.y, rr, rr);
        }
        else{
            pg.fill(col[0], col[1], col[2]);
            pg.rect(pn.x, pn.y, rr, rr);
        }

        mask.ellipse(p.x, p.y, 2, 2);
    }
    pg.colorMode(RGB, 255);

    if(frameCount%10 == 0){
        //print(frameRate());
    }
}

var its = numits;

function draw(){
    for(var k = 0; k < 10; k++){
        move();
        render();
    }

    if(movers.length == 0 && its > 0){
        initLines(--its);
    }

    pg.noFill();
    pg.stroke(250);
    pg.strokeWeight(4);
    pg.rect(0, 0, res*sc, res*sc);
    
    showall();
}

var wheads = [];

function rnoise(s, v1, v2){
    return v1 + (v2-v1)*((power(noise(s), 3)*1)%1.0);
}



function windowResized() {
    mm = min(windowWidth, windowHeight);
    resizeCanvas(mm, mm);
    image(effectpass, 0, 0, mm-18, mm-18);
}

function power(p, g) {
    if (p < 0.5)
        return 0.5 * pow(2*p, g);
    else
        return 1 - 0.5 * pow(2*(1 - p), g);
}

var zas = 0;
var started = false;

var autoPanner;
// route an oscillator through the panner and start it
var oscillator;

function mouseClicked(){
    return;
    globalseed = random(1000000);
    Tone.start();
    //getAudioContext().resume();
    //osc.start();
    //osc2.start();
    //envelope.play(osc);
    //envelope.play(osc2);
    zas = (zas+1)%2;

    const now = Tone.now()
    // trigger the attack immediately
   
    var N = 3;
    if(!started){
        started = true;
        
        for(var k = 0; k < 10; k++){
            const autoPanner = new Tone.AutoPanner("16n").toDestination();
            // route an oscillator through the panner and start it
            const oscillator = new Tone.Oscillator(random(100, 1000), "sine").toDestination();
            panners.push(autoPanner);
            oscillators.push(oscillator);
        }
    }else{
        for(var k = 0; k < 10; k++){
            if(k <= N){
                panners[k].start();
                oscillators[k].frequency.value = random(100, 1000);
                //oscillators[k].start();
            }
            else{
                panners[k].stop();
                //oscillators[k].stop();
            }
        }
    }
    generateHeads(20, random(10000));
}
function keyPressed(){
    return;
    globalseed = random(1000000);

    Tone.start();
    //getAudioContext().resume();

    if(keyCode == 83 || keyCode == 115){ // 's'
    }

    if(keyCode-48 >=0 && keyCode-48 <= 9){
        num = (keyCode-48);
        if(num <= 3)
            num = num;
        else if(num == 4)
            num = 7;
        else if(num == 5)
            num = 12;
        else if(num == 6)
            num = 15;
        else if(num == 7)
            num = 20;
        else if(num == 8)
            num = 44;
        else if(num == 9)
            num = 255/3;

        var N = 2 + (keyCode-48-1)/4.;
        if(!started){
            started = true;
            for(var k = 0; k < 10; k++){
                const autoPanner = new Tone.AutoPanner("6n").toDestination();
                // route an oscillator through the panner and start it
                const oscillator = new Tone.Oscillator(random(100, 333), "sine").connect(autoPanner);
                panners.push(autoPanner);
                oscillators.push(oscillator);
            }
        }else{
            for(var k = 0; k < 10; k++){
                if(k < N){
                    //panners[k].start();
                    oscillators[k].frequency.value = map(pow(random(1), 2), 0, 1, 100, 333);
                    oscillators[k].volume.value = 1./N*.1;
                    //oscillators[k].start();
                }
                else{
                    panners[k].stop();
                    oscillators[k].stop();
                }
            }
        }
        //getAudioContext().resume();
        //osc.start();
        //osc2.start();
        //envelope.play(osc);
        //envelope.play(osc2);
        zas = (zas+1)%2;
        // trigger the attack immediately
    

        //getAudioContext().resume();
        
        //osc.start();
        //osc2.start();
        //envelope.play(osc);
        //envelope.play(osc2);

        generateHeads(num, 311413);
    }
}