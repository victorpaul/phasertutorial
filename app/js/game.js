var playerId;
var player;
var onlinePlayers;

var stars;
var bombs;
var platforms;
var cursors;
var score = 0;
var gameOver = false;
var scoreText;
var playersCountText;

function preload() {
    this.load.image('sky', 'assets/sky.png');
    this.load.image('ground', 'assets/platform.png');
    this.load.image('star', 'assets/star.png');
    this.load.image('bomb', 'assets/bomb.png');
    this.load.spritesheet('dude', 'assets/dude.png', {frameWidth: 32, frameHeight: 48});

}

function create() {
    //  A simple background for our game
    this.add.image(400, 300, 'sky');

    //  The platforms group contains the ground and the 2 ledges we can jump on
    platforms = this.physics.add.staticGroup();

    //  Here we create the ground.
    //  Scale it to fit the width of the game (the original sprite is 400x32 in size)
    platforms.create(400, 568, 'ground').setScale(2).refreshBody();

    //  Now let's create some ledges
    platforms.create(600, 400, 'ground');
    platforms.create(50, 250, 'ground');
    platforms.create(750, 220, 'ground');

    // The player and its settings
    player = this.physics.add.sprite(100, 450, 'dude');

    //  Player physics properties. Give the little guy a slight bounce.
    player.setBounce(0.2);
    player.setCollideWorldBounds(true);

    //  Our player animations, turning, walking left and walking right.
    this.anims.create({
        key: 'left',
        frames: this.anims.generateFrameNumbers('dude', {start: 0, end: 3}),
        frameRate: 10,
        repeat: -1
    });

    this.anims.create({
        key: 'turn',
        frames: [{key: 'dude', frame: 4}],
        frameRate: 20
    });

    this.anims.create({
        key: 'right',
        frames: this.anims.generateFrameNumbers('dude', {start: 5, end: 8}),
        frameRate: 10,
        repeat: -1
    });

    //  Input Events
    cursors = this.input.keyboard.createCursorKeys();

    //  Some stars to collect, 12 in total, evenly spaced 70 pixels apart along the x axis
    stars = this.physics.add.group({
        key: 'star',
        repeat: 11,
        setXY: {x: 12, y: 0, stepX: 70}
    });

    stars.children.iterate(function (child) {

        //  Give each star a slightly different bounce
        child.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8));

    });

    bombs = this.physics.add.group();
    onlinePlayers = this.physics.add.group();

    //  The scorescoreText
    scoreText = this.add.text(16, 16, 'score: 0', {fontSize: '32px', fill: '#000'});
    playersCountText = this.add.text(16, 64, 'players: 0', {fontSize: '32px', fill: '#000'});

    //  Collide the player and the stars with the platforms
    this.physics.add.collider(player, platforms);
    this.physics.add.collider(onlinePlayers, platforms);
    this.physics.add.collider(stars, platforms);
    this.physics.add.collider(bombs, platforms);

    //  Checks to see if the player overlaps with any of the stars, if he does call the collectStar function
    this.physics.add.overlap(player, stars, collectStar, null, this);

    this.physics.add.collider(player, bombs, hitBomb, null, this);

    socket.on('count', function (data) {
        console.log("socket count:");
        console.log(data);
        playersCountText.setText("players: " + data.playerCount);
    });
    socket.on('connected', function (data) {
        console.log("socket connected:");
        console.log(data);
        playerId = data.playerId
    });
    socket.on('disconnect', function (data) {
        console.log("socket connected:");
        console.log(data);
        playerId = data.playerId
    });
    socket.on('updated', function (data) {
        console.log("socket updated:");
        console.log(data);

        var dude = onlinePlayers.getChildren().find(function (pl) {
            if (pl.id == data.playerId) return pl
        });
        if (!dude) {
            dude = onlinePlayers.create(data.x, data.y, 'dude');
            dude.id = data.playerId;
            //dude.setBounce(1);
            dude.allowGravity = false;
        }

        if (dude.x > data.x) {
            dude.anims.play('left', true);
        } else if (dude.x < data.x) {
            dude.anims.play('right', true);
        } else {
            dude.anims.play('turn');
        }

        dude.x = data.x;
        dude.y = data.y;
    });
}

var lastSentData = {playerId: 0, x: 0, y: 0};
var lastSentTime = 0;

function update() {
    if (gameOver) {
        return;
    }

    if (cursors.left.isDown) {
        player.setVelocityX(-160);

        player.anims.play('left', true);
    }
    else if (cursors.right.isDown) {
        player.setVelocityX(160);

        player.anims.play('right', true);
    }
    else {
        player.setVelocityX(0);

        player.anims.play('turn');
    }

    if (cursors.up.isDown && player.body.touching.down) {
        player.setVelocityY(jumpPower);
    }

    var now = new Date().getTime();
    if (playerId && (lastSentData.x != player.x || lastSentData.y != player.y || (lastSentTime + 1000) < now)) {
        lastSentTime = new Date().getTime();
        lastSentData = {playerId: playerId, x: player.x, y: player.y};
        socket.emit('update', lastSentData);
    }
}

function collectStar(player, star) {
    star.disableBody(true, true);

    //  Add and update the score
    score += 10;
    scoreText.setText('Score: ' + score);

    if (stars.countActive(true) === 0) {
        //  A new batch of stars to collect
        stars.children.iterate(function (child) {

            child.enableBody(true, child.x, 0, true, true);

        });

        var x = (player.x < 400) ? Phaser.Math.Between(400, 800) : Phaser.Math.Between(0, 400);

        var bomb = bombs.create(x, 16, 'bomb');
        bomb.setBounce(1);
        bomb.setCollideWorldBounds(true);
        bomb.setVelocity(Phaser.Math.Between(-200, 200), 20);
        bomb.allowGravity = false;

    }
}

function hitBomb(player, bomb) {
    this.physics.pause();

    player.setTint(0xff0000);

    player.anims.play('turn');

    gameOver = true;
}