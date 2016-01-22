////// Animation Code starts below//////
var AM = new AssetManager();

function Animation(spriteSheet, startX, startY, frameWidth, frameHeight, frameDuration, frames, loop, reverse) {
    this.spriteSheet = spriteSheet;
    this.startX = startX;
    this.startY = startY;
    this.frameWidth = frameWidth;
    this.frameDuration = frameDuration;
    this.frameHeight = frameHeight;
    this.frames = frames;
    this.totalTime = frameDuration * frames;
    this.elapsedTime = 0;
    this.loop = loop;
    this.reverse = reverse;
}

Animation.prototype.drawFrame = function (tick, ctx, x, y, scaleBy) {
    var scaleBy = scaleBy || 1;
    this.elapsedTime += tick;
    if (this.loop) {
        if (this.isDone()) {
            this.elapsedTime = 0;
        }
    } else if (this.isDone()) {
        return;
    }
    var index = this.reverse ? this.frames - this.currentFrame() - 1 : this.currentFrame();
    var vindex = 0;
    if ((index + 1) * this.frameWidth + this.startX > this.spriteSheet.width) {
        index -= Math.floor((this.spriteSheet.width - this.startX) / this.frameWidth);
        vindex++;
    }
    while ((index + 1) * this.frameWidth > this.spriteSheet.width) {
        index -= Math.floor(this.spriteSheet.width / this.frameWidth);
        vindex++;
    }

    var locX = x;
    var locY = y;
    var offset = vindex === 0 ? this.startX : 0;

    ctx.drawImage(this.spriteSheet,
                  index * this.frameWidth + offset, vindex * this.frameHeight + this.startY,  // source from sheet
                  this.frameWidth, this.frameHeight,
                  locX, locY,
                  this.frameWidth * scaleBy,
                  this.frameHeight * scaleBy);

}

Animation.prototype.currentFrame = function () {
    return Math.floor(this.elapsedTime / this.frameDuration);
}

Animation.prototype.isDone = function () {
    return (this.elapsedTime >= this.totalTime);
}

function Crusader(game, spritesheet) {
    this.idleAnimation = new Animation(spritesheet, 0, 0, 120, 96, .4, 10, true, false);
    this.idleAnimationFlipped = new Animation(spritesheet, 0, 192, 120, 96, .4, 10, true, true);

    this.walkAnimation = new Animation(spritesheet, 0, 96, 120, 96, .25, 8, true, false);
    this.walkAnimationFlipped = new Animation(spritesheet, 0, 288, 120, 96, .25, 8, true, true);
    this.x = 0;
    this.y = 0;
    this.xDest = 0;
    this.yDest = 0;
    this.game = game;
    this.ctx = game.ctx;
    this.moving = false;
    this.flipped = false;
}

Crusader.prototype.draw = function () {
    if (this.moving) {
        if (this.flipped) {
            this.walkAnimationFlipped.drawFrame(this.game.clockTick, this.ctx, this.x, this.y);
        } else {
            this.walkAnimation.drawFrame(this.game.clockTick, this.ctx, this.x, this.y);
        }
    } else {
        if (this.flipped) {
            this.idleAnimationFlipped.drawFrame(this.game.clockTick, this.ctx, this.x, this.y);
        } else {
            this.idleAnimation.drawFrame(this.game.clockTick, this.ctx, this.x, this.y);
        }
    }
}

Crusader.prototype.update = function () {
    if (this.game.click) {
        this.xDest = this.game.click.x;
        this.yDest = this.game.click.y;
    }

    if (this.x != this.xDest || this.y != this.yDest) {
        this.moving = true;

        //x logix
        if (this.x < this.xDest) {
            this.flipped = false;
            this.x++;
        } else if (this.x > this.xDest) {
            this.flipped = true;
            this.x--;
        }
        //y logic
        if (this.y < this.yDest) {
            this.y++;
        } else if (this.y > this.yDest) {
            this.y--;
        }
    } else {
        this.moving = false;
    }
}

AM.queueDownload("./img/crusader.png");

AM.downloadAll(function () {
    console.log("Downloads finished.");
    var canvas = document.getElementById("gameWorld");
    var ctx = canvas.getContext("2d");

    var img = AM.getAsset("./img/crusader.png");

    var gameEngine = new GameEngine();
    gameEngine.init(ctx);
    gameEngine.start();

    var crus = new Crusader(gameEngine, AM.getAsset("./img/crusader.png"), 120, 96);
    gameEngine.addEntity(crus);
    gameEngine.crusader = crus;
    
    console.log("All Done!");
    console.log("Click the canvas!");
});