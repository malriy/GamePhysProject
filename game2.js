class StartScene extends Phaser.Scene {
    constructor() {
        super({ key: 'StartScene' });
    }

    preload() {
        this.load.image('backgroundLayer1', 'images/3179875.jpg');
    }

    create() {
        background1 = this.add.tileSprite(0, 0, this.scale.width, this.scale.height, 'backgroundLayer1').setOrigin(0, 0);
        
        // Add text or graphics for the start scene
        const startText = this.add.text(this.scale.width / 2, this.scale.height / 2, 'Click to Start', { fontSize: '32px', fill: '#fff' });
        startText.setOrigin(0.5);

        // Set up input event to start the game
        this.input.on('pointerup', () => {
            this.scene.start('GameScene');
        });
    }

    update(){
        background1.tilePositionX += 2;
    }
}

// Initialisation
let background1;
let player;
let gameOverText;
let restartText;

class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    preload() {
        this.load.image('backgroundLayer1', 'images/3179875.jpg');
        this.load.image('square', 'images/blue.png');
    }
    
    create() {
    
        gameState.active = true;
    
        //--------------Create a red square to use as the player sprite-----------
        const playerGraphics = this.add.graphics();
        playerGraphics.fillStyle(0xff0000, 1.0);
        playerGraphics.fillRect(0, 0, 50, 50); 
        playerGraphics.generateTexture('playerTexture', 50, 50);
        playerGraphics.destroy(); 
    
        // Create ball texture (orange circle)
        const ballGraphics = this.add.graphics();
        ballGraphics.fillStyle(0xff7300, 1.0);
        ballGraphics.fillCircle(25, 25, 25); 
        ballGraphics.generateTexture('ballTexture', 50, 50);
        ballGraphics.destroy();
    
        // Create hunter texture (green triangle)
        const hunterGraphics = this.add.graphics();
        hunterGraphics.fillStyle(0x00ff00, 1.0);
        hunterGraphics.beginPath();
        hunterGraphics.moveTo(25, 0); 
        hunterGraphics.lineTo(50, 50); 
        hunterGraphics.lineTo(0, 50); 
        hunterGraphics.closePath();
        hunterGraphics.fillPath();
        hunterGraphics.generateTexture('hunterTexture', 50, 50);
        hunterGraphics.destroy();
    
        // ----------------------Cursors for input--------------------
        gameState.cursors = this.input.keyboard.createCursorKeys();
    
        // ----------------------------Background-----------------------
        background1 = this.add.tileSprite(0, 0, this.scale.width, this.scale.height, 'backgroundLayer1').setOrigin(0, 0);
    
        //-------------------------Obstacles------------------------
        gameState.balls = this.physics.add.group({
            defaultKey: 'ballTexture',
            bounceX: 1,
            bounceY: 1,
            collideWorldBounds: false,
            allowGravity: true,
        });
        const genBalls = () => {
            const ball = gameState.balls.create(config.width, Phaser.Math.Between(0, config.height), 'ballTexture');
            ball.setVelocityX(-200); // Move the ball to the left
            ball.body.onWorldBounds = true;
            ball.body.world.setBoundsCollision(true, false, true, true); // Disable collision with the left side
        };
    
        gameState.ballsLoop = this.time.addEvent({
            delay: 300,
            callback: genBalls,
            callbackScope: this,
            loop: true,
        })
    
        // -----------------Create a player-----------------
        gameState.player = this.physics.add.sprite(350, 500, 'playerTexture');
        gameState.player.setCollideWorldBounds(true); 
    
        // -----------------Create a hunter-----------------
        gameState.hunter = this.physics.add.sprite(100, 100, 'hunterTexture');
        gameState.hunter.speed = 1; // Normal speed
    
        gameState.scoreText = this.add.text(16, 16, 'Score: 0', { fontSize: '32px', fill: '#fff' });
    
        gameOverText = this.add.text(this.scale.width / 2, this.scale.height / 2, 'Game Over', { fontSize: '32px', fill: '#fff' });
        gameOverText.setOrigin(0.5);
        gameOverText.setVisible(false);
    
        //--------------------Add restart text--------------------
        restartText = this.add.text(this.scale.width / 2, this.scale.height / 2 + 50, 'Press Spacebar to Restart', { fontSize: '24px', fill: '#fff' });
        restartText.setOrigin(0.5);
        restartText.setVisible(false);
    
        this.physics.add.collider(
            gameState.balls, gameState.player, 
            function() {
                gameState.active = false;
                gameOverText.setVisible(true);
                restartText.setVisible(true);
                this.physics.pause();
            }, 
            null, 
            this
        );
    }
    
    update() {
        //---------------------Game still ongoing----------------------
        if (gameState.active){
            const player = gameState.player;
    
            background1.tilePositionX += 2;
    
            gameState.balls.children.iterate((balls) => {
                balls.x -= gameState.ballSpeed;
                gameState.score += 2;
                gameState.scoreText.setText(`Score: ${gameState.score}`);
            });
    
            // Jump
            if (Phaser.Input.Keyboard.JustDown(gameState.cursors.space)) {
                player.setVelocityY(-300);
            }
    
            // Calculate the direction vector from the hunter to the player
            let directionX = gameState.player.x - gameState.hunter.x;
            let directionY = gameState.player.y - gameState.hunter.y;
        
            // Normalize the direction vector
            let length = Math.sqrt(directionX * directionX + directionY * directionY);
            directionX /= length;
            directionY /= length;
        
            // Set the velocity of the hunter to move it towards the player
            gameState.hunter.setVelocity(directionX * 100, directionY * 100);    
    
            //console.log(config.height)
    
            if (gameState.cursors.left.isDown) {
                player.setVelocityX(-200);
            } else if (gameState.cursors.right.isDown) {
                player.setVelocityX(200);
            } else {
                player.setVelocityX(0);
            }
    
            // Detect collision between the hunter and the player
            this.physics.collide(gameState.hunter, gameState.player, () => {
                gameState.active = false;
                gameOverText.setVisible(true);
                restartText.setVisible(true);
                this.physics.pause();
            });
    
            // Find if player loses
            if (gameState.player === null){
                gameState.active = false;
                gameOverText.setVisible(true);
                restartText.setVisible(true);
                this.physics.pause();
            }
        }
        // ---------------------Game Over state-------------------------
        else{
            if (Phaser.Input.Keyboard.JustDown(gameState.cursors.space)) {
                this.scene.restart();
            }
        }
    }
    
}

const config = {
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    backgroundColor: "#588fed",
    scene: [StartScene, GameScene],
    physics: {
        default: 'arcade',
        arcade: {
          gravity: {y: 500},
          enableBody: true,
        }
    },
    scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH
    }
};

const gameState = {
    active: true,
    cursors: null,
    player: null,
    hunter: null,
    groundGroup: null, // Group to hold ground sprites
    ballSpeed: 12, // Ground movement speed
    score: 0,
    scoreText: null,
};

const game = new Phaser.Game(config);

window.addEventListener('resize', () => {
    game.scale.resize(window.innerWidth, window.innerHeight);
});
