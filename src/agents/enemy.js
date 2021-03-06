var SKELETON_ATTR = {
    STARTING_HEALTH: 1,
    SPEED: 3,
    INVULNERABILITY_FRAMES: 40,
    ATTENTION_DISTANCE: 400,
    VERTICAL_TOLERANCE: -250,
    Y_ACCELERATION: .5,
    TERMINAL_VELOCITY: 6
}

var SKELETON_ANIM = {
    STAND_RIGHT: 0,
    STAND_LEFT: 1,
    RUN_RIGHT: 2,
    RUN_LEFT: 3,
    DYING: 4
}

var ARCHER_ATTR = {

    VISION_RADIUS: 2000,
    STARTING_HEALTH: 1,
    SHOOTING_TIME: 120,
    INVULNERABILITY_FRAMES: 40,
    ARROW_SPEED: 8
}

var ARCHER_ANIM = {
    IDLE_LEFT: 0,
    IDLE_RIGHT: 1,
    ATK_STRAIGHT_LEFT: 2,
    ATK_STRAIGHT_RIGHT: 3,
    ATK_DOWN_LEFT: 4,
    ATK_DOWN_RIGHT: 5,
    ATK_UP_LEFT: 6,
    ATK_UP_RIGHT: 7,
    DYING: 8,
}

var WISP_ATTR = {
    STARTING_HEALTH: 1,
    SPEED: 2,
    ATTENTION_DISTANCE: 500,
    TOUCH_DISTANCE: 50,
    FLEE_TIME: 45,
    FLEE_ACCELERATION: 4
    //This should be true: SPEED*FLEE_TIME*FLEE_ACCELERATION < ATTENTION_DISTANCE
}

var WISP_ANIM = {
    FLOATING_RIGHT: 0,
    FLOATING_LEFT: 1,
    DYING: 2
}

/**
  * Create a new Normal Skeleton.
  */
function Skeleton(game, AM, x, y) {
    this.entity = new Entity(x, y, 52, 59);
    this.entity.moveable = true;
    this.game = game;

    this.health = SKELETON_ATTR.STARTING_HEALTH;
    this.invulnerableFrames = 0;
    this.yVelocity = 0;
    this.xDestination = x;
    this.yDestination = y;
    this.confused = false;

    var skeletonIdleRight = new Animation(AM.getAsset("./img/enemy/chaser.png"), 31, 59, 0.05, true);
    skeletonIdleRight.addFrame(31, 0);
    var skeletonIdleLeft = new Animation(AM.getAsset("./img/enemy/chaser.png"), 31, 59, 0.05, true);
    skeletonIdleLeft.addFrame(0, 0);
    var skeletonRunRight = new Animation(AM.getAsset("./img/enemy/chaser.png"), 52, 59, 0.1, true);
    skeletonRunRight.addFrame(0, 118, 3);
    var skeletonRunLeft = new Animation(AM.getAsset("./img/enemy/chaser.png"), 52, 59, 0.1, true);
    skeletonRunLeft.addFrame(0, 59, 3);
    var skeletonDeath = new Animation(AM.getAsset("./img/enemy/death anim.png"), 15, 15, 0.1, false);
    skeletonDeath.addFrame(0, 0, 7);

    this.entity.addAnimation(skeletonIdleRight);
    this.entity.addAnimation(skeletonIdleLeft);
    this.entity.addAnimation(skeletonRunRight);
    this.entity.addAnimation(skeletonRunLeft);
    this.entity.addAnimation(skeletonDeath);
    this.entity.setAnimation(SKELETON_ANIM.STAND_RIGHT);
}

Skeleton.prototype = {

    update: function () {
        if (this.entity.collidable) {
            //compute updates that are independent of player distance
            if (this.invulnerableFrames > 0) {
                this.invulnerableFrames--;

                if (this.invulnerableFrames === 0) {
                    this.confused = false;
                }
            }
            
            //Skeletons should always know if they're falling
            if (this.game.getBottomCollisions(this).length === 0) {
                //If there is no bottom collision, then the agent is in the air, and should accelerate downwards.
                this.yVelocity += SKELETON_ATTR.Y_ACCELERATION;
                if (this.yVelocity >= SKELETON_ATTR.TERMINAL_VELOCITY) this.yVelocity = SKELETON_ATTR.TERMINAL_VELOCITY;
            } else if (this.yVelocity > 0) {
                //If there is a bottom collision, then the agent is on the ground, and should have no downwards velocity.
                this.yVelocity = 0;
            }

            if (this.yVelocity !== 0) {
                this.game.requestMove(this, 0, this.yVelocity);
            }

            //Skeletons should only do math if they are not confused
            if (!this.confused) {
                var player = this.game.playerAgent;
                if (player.yVelocity === 0) {

                    var knightPoint = player.entity.getCenter();
                    var skeletonPoint = this.entity.getCenter();

                    var verticalDistance = skeletonPoint.y - knightPoint.y;

                    if (verticalDistance > SKELETON_ATTR.VERTICAL_TOLERANCE
                        && verticalDistance < 0
                        && Math.abs(knightPoint.x - skeletonPoint.x) <= SKELETON_ATTR.ATTENTION_DISTANCE) {
                        this.xDestination = knightPoint.x; //The skeleton noticed you
                    }
                }

                if (this.entity.x !== this.xDestination) {
                    var distance = -(this.entity.x - this.xDestination);                     //Reassign so negative values are to your left, positive values are to your right

                    if (distance < 0) {
                        this.game.requestMove(this, Math.max(distance, -SKELETON_ATTR.SPEED), 0);
                        if (this.entity.x != this.xDestination) {
                            this.entity.currentAnimation = SKELETON_ANIM.RUN_LEFT;
                        } else {
                            this.entity.currentAnimation = SKELETON_ANIM.STAND_LEFT;
                        }
                    } else { //distance >= 0
                        this.game.requestMove(this, Math.min(distance, SKELETON_ATTR.SPEED), 0);
                        if (this.entity.x != this.xDestination) {
                            this.entity.currentAnimation = SKELETON_ANIM.RUN_RIGHT;
                        } else {
                            this.entity.currentAnimation = SKELETON_ANIM.STAND_RIGHT;
                        }
                    }
                }
            } else {
                if (this.entity.currentAnimation === SKELETON_ANIM.RUN_LEFT) {
                    this.entity.currentAnimation = SKELETON_ANIM.STAND_LEFT;
                } else if (this.entity.currentAnimation === SKELETON_ANIM.RUN_RIGHT) {
                    this.entity.currentAnimation = SKELETON_ANIM.STAND_RIGHT;
                }
            }
         } else {
             this.entity.setAnimation(SKELETON_ANIM.DYING); // DEATH_ANIMATION
            if (this.entity.animationList[SKELETON_ANIM.DYING].isDone()) {
                this.entity.removeFromWorld = true;
            }
        }
    },

    readInput: function (input, modifier) {
        if (input === "damage") {
            if (this.invulnerableFrames === 0) {
                this.invulnerableFrames = SKELETON_ATTR.INVULNERABILITY_FRAMES;
                this.health--;
                if (this.health <= 0) {
                    this.entity.x += this.entity.width / 2;
                    this.entity.y += this.entity.height / 2;
                    this.entity.collidable = false;
                } else {
                    this.confused = true;
                }
            }
        }
        if (input === "reset") {
            this.entity.collidable = true;
            this.health = SKELETON_ATTR.STARTING_HEALTH;
            this.entity.currentAnimation = SKELETON_ANIM.STAND_RIGHT;
            this.yVelocity = 0;
            this.xDestination = this.entity.originX;
            this.yDestination = this.entity.originY;
            this.entity.animationList[SKELETON_ANIM.DYING].elapsedTime = 0;
        }
    },

    checkListeners: function (agent) {
        if (agent.entity.controllable) {
            this.game.requestInputSend(agent, "damage", 1);
        }
    }
}

function Wisp(game, AM, x, y) {
    this.entity = new Entity(x, y, 44, 50);
    this.entity.moveable = true;
    this.alive = true;
    this.game = game;
    this.struckRecently = false;
    this.timeToStrikeAgain = 0;
    this.health = WISP_ATTR.STARTING_HEALTH;
    this.invulnerableFrames = 0;

    var wispRight = new Animation(AM.getAsset("./img/enemy/wisp.png"), 44, 50, 0.17, true);
    wispRight.addFrame(0, 50, 4);
    var wispLeft = new Animation(AM.getAsset("./img/enemy/wisp.png"), 44, 50, 0.17, true);
    wispLeft.addFrame(0, 0, 4);
    var wispDie = new Animation(AM.getAsset("./img/enemy/death anim.png"), 15, 15, 0.1, false);
    wispDie.addFrame(0, 0, 7);

    this.entity.addAnimation(wispRight);
    this.entity.addAnimation(wispLeft);
    this.entity.addAnimation(wispDie);
}

Wisp.prototype = {

    update: function () {
        if (this.alive) {
            if (this.timeToStrikeAgain > 0) {
                this.timeToStrikeAgain--;
            } else {
                this.struckRecently = false;
                this.entity.collidable = true;
            }
            
            if (this.invulnerableFrames > 0) {
                this.invulnerableFrames--;
            }

            var knightPoint = this.game.playerAgent.entity.getCenter();

            if (this.invulnerableFrames > 0) {
                this.invulnerableFrames--;
            }

            var knightPoint = this.game.playerAgent.entity.getCenter();
            var wispPoint = this.entity.getCenter();

            //If the knight is close enough, start chasing.
            var distanceToKnight = getDistance(wispPoint, knightPoint)
            if (distanceToKnight <= WISP_ATTR.ATTENTION_DISTANCE) {
                
                if (wispPoint.x - knightPoint.x !== 0) {
                    var movementVector = getNormalizedSlope(wispPoint, knightPoint, distanceToKnight);

                    if (this.struckRecently) {
                        this.entity.x += movementVector.x * WISP_ATTR.SPEED * WISP_ATTR.FLEE_ACCELERATION;
                        this.entity.y += movementVector.y * WISP_ATTR.SPEED * WISP_ATTR.FLEE_ACCELERATION;

                        if (movementVector.x > 0) {
                            this.entity.currentAnimation = WISP_ANIM.FLOATING_RIGHT;
                        }
                        else {
                            this.entity.currentAnimation = WISP_ANIM.FLOATING_LEFT;
                        }
                    } else {
                        this.entity.x -= movementVector.x * WISP_ATTR.SPEED;
                        this.entity.y -= movementVector.y * WISP_ATTR.SPEED;

                        if (movementVector.x < 0) {
                            this.entity.currentAnimation = WISP_ANIM.FLOATING_RIGHT;
                        } else {
                            this.entity.currentAnimation = WISP_ANIM.FLOATING_LEFT;
                        }
                    }
                }
            }

            if (distanceToKnight < WISP_ATTR.TOUCH_DISTANCE) {
                this.struckRecently = true;
                this.timeToStrikeAgain = WISP_ATTR.FLEE_TIME;
                this.entity.collidable = false;
                this.game.requestInputSend(this.game.playerAgent, "damage", 1);
            }
        } else {
            this.entity.setAnimation(WISP_ANIM.DYING);
            if (this.entity.animationList[WISP_ANIM.DYING].isDone()) {
                this.entity.removeFromWorld = true;
            }
        }
    },

    readInput: function (input, modifier) {
        if (input === "damage") {
            if (this.invulnerableFrames === 0) {
                this.invulnerableFrames = WISP_ATTR.INVULNERABILITY_FRAMES;
                this.health--;
                if (this.health <= 0) {
                    this.entity.x += this.entity.width / 2;
                    this.entity.y += this.entity.height / 2;
                    // this.entity.removeFromWorld = true;
                    this.entity.collidable = false;
                    this.alive = false;
                }
            }
        }
        if (input === "reset") {
            this.alive = true;
            this.entity.collidable = true;
            this.health = WISP_ATTR.STARTING_HEALTH;
            this.invulnerableFrames = 0;
            this.entity.animationList[WISP_ANIM.DYING].elapsedTime = 0;
        }
    },
}

function Archer (game, AM, x, y) {
    this.entity = new Entity(x, y, 68, 60);
    this.game = game;

    this.timeDurationNextArrow = ARCHER_ATTR.SHOOTING_TIME;
    this.health = ARCHER_ATTR.STARTING_HEALTH;
    this.vision = ARCHER_ATTR.VISION_RADIUS;
    this.invulnerableFrames = 0;

    var archerImg = AM.getAsset("./img/enemy/archer.png");
    var archerRight = new Animation(archerImg, 73, 64, 0.05, true);
    archerRight.addFrame(73, 0);
    var archerLeft = new Animation(archerImg, 73, 64, 0.05, true);
    archerLeft.addFrame(0, 0);
    var archerLeftShooting = new Animation(archerImg, 73, 64, 0.2, false);
    archerLeftShooting.addFrame(0, 64, 3);
    var archerRightShooting = new Animation(archerImg, 73, 64, 0.2, false);
    archerRightShooting.addFrame(0, 128, 3);
    var archerLeftShootingDown = new Animation(archerImg, 73, 64, 0.2, false);
    archerLeftShootingDown.addFrame(0, 192, 3);
    var archerRightShootingDown = new Animation(archerImg, 73, 64, 0.2, false);
    archerRightShootingDown.addFrame(0, 256, 3);
    var archerLeftShootingUp = new Animation(archerImg, 73, 64, 0.2, false);
    archerLeftShootingUp.addFrame(0, 320, 3);
    var archerRightShootingUp = new Animation(archerImg, 73, 64, 0.2, false);
    archerRightShootingUp.addFrame(0, 384, 3);
    var archerDeath = new Animation(AM.getAsset("./img/enemy/death anim.png"), 15, 15, 0.1, false);
    archerDeath.addFrame(0, 0, 7);

    this.entity.animationList.push(archerLeft);
    this.entity.animationList.push(archerRight);
    this.entity.animationList.push(archerLeftShooting);
    this.entity.animationList.push(archerRightShooting);
    this.entity.animationList.push(archerLeftShootingDown);
    this.entity.animationList.push(archerRightShootingDown);
    this.entity.animationList.push(archerLeftShootingUp);
    this.entity.animationList.push(archerRightShootingUp);
    this.entity.animationList.push(archerDeath);
}

Archer.prototype = {

    update: function () {
        if (this.entity.collidable) {
            var knightPoint = this.game.playerAgent.entity.getCenter();

            var archerPoint = {
                x: this.entity.x + this.entity.width / 2,
                y: this.entity.y + this.entity.height / 2
            };

            var distanceX = knightPoint.x - archerPoint.x;
            var distanceY = knightPoint.y - archerPoint.y;

            var angle = Math.atan2(-distanceY, distanceX);
            var distance = getDistance(archerPoint, knightPoint);

            if (distance < this.vision) {
                if (this.timeDurationNextArrow === ARCHER_ATTR.SHOOTING_TIME) {
                    this.setAnimationFromAngle(angle);
                }
                this.timeDurationNextArrow--;
                if (this.timeDurationNextArrow <= 0) {
                    this.timeDurationNextArrow = ARCHER_ATTR.SHOOTING_TIME;
                }
            }
            if (this.entity.currentAnimation !== ARCHER_ANIM.IDLE_LEFT && this.entity.currentAnimation !== ARCHER_ANIM.IDLE_RIGHT) {
                if (this.entity.animationList[this.entity.currentAnimation].isFinalFrame()) {
                    this.entity.animationList[this.entity.currentAnimation].elapsedTime = 0;
                    var arrow = new Arrow(this, archerPoint.x, archerPoint.y, distanceX, distanceY, angle, this.game);
                    this.game.addAgent(arrow);
                    if (knightPoint.x > this.entity.x) {
                        this.entity.currentAnimation = ARCHER_ANIM.IDLE_RIGHT;
                    } else {
                        this.entity.currentAnimation = ARCHER_ANIM.IDLE_LEFT;
                    }
                }
            }
        } else {
            this.entity.setAnimation(ARCHER_ANIM.DYING);
            if (this.entity.animationList[ARCHER_ANIM.DYING].isDone()) {
                this.entity.removeFromWorld = true;
            }
        }
    },

    readInput: function (input, modifier) {
        if (input === "damage") {
            this.health--;
            if (this.health <= 0) {
                this.entity.x += this.entity.width / 2;
                this.entity.y += this.entity.height / 2;
                this.entity.collidable = false;
            }
        }
        if (input === "reset") {
            this.entity.collidable = true;
            this.health = ARCHER_ATTR.STARTING_HEALTH;
            this.entity.animationList[ARCHER_ANIM.DYING].elapsedTime = 0;
        }
    },

    setAnimationFromAngle: function (angle) {
        if (angle >= Math.PI / (-6) && angle <= Math.PI / 6) {   // [-30, 30] degree
            this.entity.currentAnimation = ARCHER_ANIM.ATK_STRAIGHT_RIGHT;
        } else if (angle > Math.PI / 6 && angle <= Math.PI / 2) {   // (30, 90] degree
            this.entity.currentAnimation = ARCHER_ANIM.ATK_UP_RIGHT;
        } else if (angle > Math.PI / 2 && angle < 5 * Math.PI / 6) {   // (90, 150) degree
            this.entity.currentAnimation = ARCHER_ANIM.ATK_UP_LEFT;
        } else if (angle >= 5 * Math.PI / 6 || angle <= (-5) * Math.PI / 6) {
            this.entity.currentAnimation = ARCHER_ANIM.ATK_STRAIGHT_LEFT;
        } else if (angle > (-5) * Math.PI / 6 && angle <= Math.PI / (-2)) {    // (-150, -90] degree
            this.entity.currentAnimation = ARCHER_ANIM.ATK_DOWN_LEFT;
        } else {
            this.entity.currentAnimation = ARCHER_ANIM.ATK_DOWN_RIGHT;
        }
    },

    checkListeners: function (agent) {
        if (agent.entity.controllable) {
            this.game.requestInputSend(agent, "damage", 1);
        }
    }
}

function Arrow(source, x, y, distanceX, distanceY, angle, game) {
    this.source = source;
    this.entity = new Entity(x, y, 25, 5);
    this.game = game;
    this.entity.x = x - Math.ceil(25 / 2);
    this.entity.y = y - Math.ceil(5 / 2);
    this.centerX = x;
    this.centerY = y;
    this.entity.temporary = true;

    var scale = ARCHER_ATTR.ARROW_SPEED / Math.sqrt(distanceX * distanceX + distanceY * distanceY);
    this.xVel = distanceX * scale;
    this.yVel = distanceY * scale;
    this.angle = angle;

    var arrowAnimation = new Animation(AM.getAsset("./img/enemy/archer.png"), this.entity.width, this.entity.height, 0.2, true);
    arrowAnimation.addFrame(146, 5);
    this.entity.animationList.push(arrowAnimation);
}

Arrow.prototype = {

    obstacleAt: function (x, y) {
        for (var i = 0; i < this.game.agents.length; i += 1) {
            var obstacle = this.game.agents[i];
            if (this !== obstacle && this.source !== obstacle) {
                if (x + this.entity.width > obstacle.entity.x &&
                    x < obstacle.entity.x + obstacle.entity.width &&
                    y + this.entity.height > obstacle.entity.y &&
                    y < obstacle.entity.y + obstacle.entity.height) {
                    return obstacle;
                }
            }
        }
    },

    update: function () {
        var tempX = this.centerX + this.xVel;
        var tempY = this.centerY + this.yVel;
        var obstacle = this.obstacleAt(tempX, tempY);
        if (!obstacle) {
            this.centerX = tempX;
            this.centerY = tempY;
        } else {
            if (obstacle.entity.controllable) {
                this.checkListeners(obstacle);
            }
            this.entity.removeFromWorld = true;
        }
        this.entity.x = this.centerX - Math.ceil(25 / 2);
        this.entity.y = this.centerY - Math.ceil(25 / 2);
    },

    draw: function (game, cameraX, cameraY) {
        game.ctx.save();
        game.ctx.translate(this.entity.x + cameraX, this.entity.y - cameraY + 10);
        game.ctx.rotate(-this.angle);
        this.entity.animationList[this.entity.currentAnimation].drawFrame(game.clockTick,
                            game.ctx, 0, 0);
        game.ctx.restore();
    },

    checkListeners: function (agent) {
        if (agent.entity.controllable) {
            this.game.requestInputSend(agent, "damage", 1);
            this.entity.removeFromWorld = true;
        }
    }
}

function getDistance(myPoint, theirPoint) {
    return Math.sqrt(Math.pow((myPoint.x - theirPoint.x), 2) + Math.pow((myPoint.y - theirPoint.y), 2));
}

function getNormalizedSlope(myPoint, theirPoint, distance) {
    return {
        x: (myPoint.x - theirPoint.x) / distance,
        y: (myPoint.y - theirPoint.y) / distance
    }
}