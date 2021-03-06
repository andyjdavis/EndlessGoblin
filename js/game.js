/*
 * A simple class that draws a block to the screen.
 * The block is affected by gravity, can jump and changes shape as it moves.
 *
 * This code does not come with any sort of warranty.
 * You are welcome to use it for whatever you like.
 * A credit would be nice but is not required.
 */
(function() {

window.game = window.game || { };

gCanvas = document.createElement("canvas");
gContext = gCanvas.getContext("2d");
gCanvas.width = 512;
gCanvas.height = 480;
document.body.appendChild(gCanvas);

gWorld = {
    keyState: Array(),
    state: new game.StateManager(),
    images: new game.ImageManager(),
    sounds: new game.SoundManager(),
    player: new game.Player([gCanvas.width/2, gCanvas.height/2]),
    enemies: Array(),
    projectiles: Array(),
    explosions: Array(),
    loopCount: 0,
    score: 0,
    
    textcolor: 'White',
    textsize: '18pt Arial'
};
gWorld.state.setState(gWorld.state.states.LOADING);

function onKeyDown(event) {
    var state = gWorld.state.getState();
    if (state == gWorld.state.states.PREGAME || state == gWorld.state.states.END) {
        if (event.keyCode == 68) {
            newGame();
        }
    }
    gWorld.keyState[event.keyCode] = true;
}
function onKeyUp(event) {
    gWorld.keyState[event.keyCode] = false;
}
function onMouseClick(event) {
    var state = gWorld.state.getState();

    if (state == gWorld.state.states.INGAME) {
        var mouseX;
        var mouseY;
        if ( event.offsetX == null ) { // Firefox
            if (event.pageX || event.pageY) { 
              mouseX = event.pageX;
              mouseY = event.pageY;
            }
            else { 
              mouseX = event.clientX + document.body.scrollLeft + document.documentElement.scrollLeft; 
              mouseY = event.clientY + document.body.scrollTop + document.documentElement.scrollTop; 
            } 
            mouseX -= gCanvas.offsetLeft;
            mouseY -= gCanvas.offsetTop;
        } else {                       // Other browsers
           mouseX = event.offsetX;
           mouseY = event.offsetY;
        }
        target = [mouseX, mouseY];
        
        var playerX = gWorld.player.pos[0] + gWorld.player.size[0]/2;
        var playerY = gWorld.player.pos[1] + gWorld.player.size[1]/2;
        var vector = calcNormalVector(target, [playerX, playerY]);

        /*h = gWorld.player.size[0]/2 + 3 + 1; //player approx radius + projectile radius + 1
        var x = gWorld.player.pos[0] + gWorld.player.size[0]/2 + (vector[0] * h);
        var y = gWorld.player.pos[1] + gWorld.player.size[1]/2 + (vector[1] * h);
        var pos = [Math.round(x), Math.round(y)];*/
        var pos = [gWorld.player.pos[0], gWorld.player.pos[1]];

        var projectile = new game.Projectile(pos, [vector[0]*100, vector[1]*100]);
        gWorld.projectiles.push(projectile);
    }
}
window.addEventListener('keydown', onKeyDown, false);
window.addEventListener('keyup', onKeyUp, false);
gCanvas.addEventListener('click', onMouseClick);

function newGame() {
    gWorld.level = 0;
    gWorld.score = 0;
    gWorld.state.setState(gWorld.state.states.INGAME);
    nextLevel();
    
    //gSounds.play("music", true);
    spawnMonster();
}
function nextLevel() {
    
    gWorld.level++;
    setupLevel();
}
function setupLevel() {
    gWorld.enemies = Array();
    gWorld.projectiles = Array();
    gWorld.explosions = Array();
    
    gWorld.player.pos = [gCanvas.width/2, gCanvas.height/2];
}
function spawnMonster() {
    var n = 1;
    if (Math.random() < 0.4) {
        n = 2;
    }

    var door, pos, m;
    for (var i = 0;i< n;i++) {
        door = Math.floor(Math.random() * 4) + 1;

        if (door == 1) {
            pos = [-40, gCanvas.height/2];
        } else if (door == 2) {
            pos = [gCanvas.width/2, -40];
        } else if (door == 3) {
            pos = [gCanvas.width +10, gCanvas.height/2];
        } else if (door == 4) {
            pos = [gCanvas.width/2, gCanvas.height+10];
        }
        m = new game.Monster(pos);
        gWorld.enemies.push(m);
    }
}

function updateGame(dt) {
    if (gWorld.player) {
        gWorld.player.update(dt);
    }
    for (var i in gWorld.enemies) {
        gWorld.enemies[i].update(dt);
    }
    for (var i = gWorld.projectiles.length - 1;i >= 0;i--) {
        if (gWorld.projectiles[i].update(dt) == false) {
            gWorld.projectiles.splice(i, 1);
        }
    }
    for (var i = gWorld.explosions.length - 1;i >= 0;i--) {
        if (gWorld.explosions[i].update(dt) == false) {
            gWorld.explosions.splice(i, 1);
        }
    }
}

function checkCollisions() {
    var m, p;
    
    for (var j = gWorld.enemies.length - 1; j >= 0;j--) {
        m = gWorld.enemies[j];
        
        if (m.collideThing(gWorld.player)) {
            gWorld.state.setState(gWorld.state.states.END);
            return;
        }
    
        for (var i = gWorld.projectiles.length - 1;i >= 0;i--) {
            p = gWorld.projectiles[i];
        
            if (p.collideThing(m)) {
                //gWorld.sounds.play("explosion");
                gWorld.explosions.push(new game.Explosion(m.pos));
                gWorld.score++;
                gWorld.enemies.splice(j, 1);
                gWorld.projectiles.splice(i, 1);
                spawnMonster();
                continue;
            }
        }
    }
}

function drawInstructions(showImages) {
    drawText(gContext, "Endless Goblin", gWorld.textsize, gWorld.textcolor, gCanvas.width/3, 100);
    drawText(gContext, "How many goblins can you destroy?", gWorld.textsize, gWorld.textcolor, gCanvas.width/5, 200);
    drawText(gContext, "WASD to move", gWorld.textsize, gWorld.textcolor, gCanvas.width/3, 300);
    drawText(gContext, "Use the mouse to aim and fire", gWorld.textsize, gWorld.textcolor, gCanvas.width/5, 350);
    if (showImages) {
        //gContext.drawImage(gImages.getImage('exit'), 40, gCanvas.height/2, gSettings.tilesize, gSettings.tilesize);
        //gContext.drawImage(gImages.getImage('starship'), gCanvas.width - 80, gCanvas.height/2, 30, 30);
    }
}
function drawGame() {
    var img = gWorld.images.getImage('background');
    if (img) {
        gContext.drawImage(img, 0, 0);
    }
    
    var state = gWorld.state.getState();
    if (state == gWorld.state.states.LOADING) {
        drawInstructions(false);
        var total = gWorld.sounds.sounds.length + gWorld.images.images.length;
        var loaded = gWorld.sounds.numSoundsLoaded + gWorld.images.numImagesLoaded;
        if (loaded < total) {
            gContext.clearRect(0, 0, gCanvas.width, gCanvas.height);
            var text = "Loading...    "+loaded+"/"+total;
            drawText(gContext, text, gWorld.textsize, gWorld.textcolor, gCanvas.width/5,400);
            //return;
        } else {
            gWorld.state.setState(gWorld.state.states.PREGAME);
        }
    } else if (state == gWorld.state.states.PREGAME) {
        drawInstructions(true);
        drawText(gContext, "Press d to begin", gWorld.textsize, "white", gCanvas.width/3, 400);
    } else if (state == gWorld.state.states.INGAME) {
        gWorld.player.draw();
        for (var i in gWorld.projectiles) {
            gWorld.projectiles[i].draw();
        }
        for (var i in gWorld.enemies) {
            gWorld.enemies[i].draw();
        }
        for (var i in gWorld.explosions) {
            gWorld.explosions[i].draw();
        }
        drawText(gContext, gWorld.score, gWorld.textsize, gWorld.textcolor, 37, 55);
    } else if (state == gWorld.state.states.END) {
        drawText(gContext, "Endless Goblin", gWorld.textsize, gWorld.textcolor, gCanvas.width/3, 100);
        drawText(gContext, "You left "+gWorld.score+" flaming corpses in your wake.", gWorld.textsize, gWorld.textcolor, 50, 200);
        drawText(gContext, "Press d to play again", gWorld.textsize, gWorld.textcolor, 150, 350);
    }
}

var then = Date.now();
var now = null;
var dt = null;

//executed 60/second
var mainloop = function() {
    state = gWorld.state.getState();
    //if (state == gWorld.state.states.INGAME) {
        now = Date.now();
        dt = (now - then)/1000;
        then = now;
        
        gWorld.loopCount++;
        gWorld.loopCount %= 8; //stop it going to infinity

        updateGame(dt);
        if (state == gWorld.state.states.INGAME) {
            checkCollisions();
        }
    //}
    drawGame();
};

var ONE_FRAME_TIME = 1000 / 60; // 60 per second
setInterval( mainloop, ONE_FRAME_TIME );

}());
