import fs from "fs/promises";

import { shuffle } from "d3-array";

import Block from "./block.js";
import Twitter from "./twitter.js";

import { uniq } from "./util.js";

const twitter = new Twitter();

const hour = new Date().getHours();

const dark = hour >= 23 || hour < 10;

const background = "⬛";
const lightBackground = "⬜";
const newline = "\n";

//you can ignore these probably I just like my words
/**
 * @typedef {Array<Array<String|null>>} ShapeLike an {@link Array2d} of text making a tetris piece shape
 * @typedef {Array<Array<[number, number, string|null]>>} BlockLike an {@link Array3d} of coordinates and pixels
 * @typedef {[number, number]} Vector an array of two numbers
 * @typedef {Array<Array<*>>} Array2d any 2d array
 * @typedef {Array<Array<Array<*>>>} Array3d any 3d array
 */

/**
 * @constant shapes array of all possible tetris shapes.
 * @type {Array<ShapeLike>}
 */
const shapes = [
    [
        ["🟦", null, null],
        ["🟦", "🟦", "🟦"],
    ],
    [
        ["🟥", "🟥", "🟥"],
        ["🟥", null, null],
    ],
    [
        ["🟨", "🟨"],
        ["🟨", "🟨"],
    ],
    [
        ["🟧", "🟧", "🟧", "🟧"]
    ],
    [
        ["🟪", "🟪", "🟪"],
        [null, "🟪", null],
    ],
    [
        ["🟩", "🟩", null],
        [null, "🟩", "🟩"],
    ],
    [
        [null, "🟫", "🟫"],
        ["🟫", "🟫", null],
    ],
];
/**
 * @class The basic game class
 */
class Game {

    /**
     * @constructor creates a new game instance
     * @param {number} width 
     * @param {number} height 
     * @param {number} interval 
     * @param {boolean} paused 
     */
    constructor(width = 10, height = 18, interval = 500, paused = false) {
        this.interval = interval;
        this.paused = paused;
        this.width = width;
        this.height = height;
        this.start();
    }

    /**
     * @function Start
     * @description creates a 2d array of empty space
     */
    start() {
        this.blocks = [];
        this.rows = new Array(this.height)
            .fill(null)
            .map((row) => new Array(this.width).fill(background));
        this.addBlock(shapes);
    }

    /**
     * @function addBlock
     * @description adds a random block from a shape array
     * @param {Array<ShapeLike>} possibleshapes 
     */
    addBlock(possibleshapes) {
        const shape = shuffle([...possibleshapes])[0];
        let block = new Block(shape);
        const coords = block.translate();
        const x = Math.floor(Math.random() * (this.width - coords[0].length));
        block.position = [-1, x];
        block.rotation = Math.floor(Math.random() * 4);
        if (!this.checkCollision(block)) {
            this.blocks.push(block);
        } else {
            this.start();
        }
    }

    /**
     * @function shouldFix
     * @description checks if a block should be frozen.
     * @param {Block} block 
     * @returns {Boolean}
     */
    //TODO allow block sliding
    shouldFix(block) {
        const rows = block.translate();

        if (rows.flat(1).some(([y, x, cell]) => y >= this.height - 1)) {
            return true;
        }

        return rows.some((row, rowPos) =>
            row.some(
                ([y, x, cell], colPos) =>
                cell &&
                (rowPos + 1 >= rows.length || rows[rowPos + 1][colPos][2] == null) &&
                this.withinBounds(y + 1, x) &&
                this.rows[y + 1][x] != background
            )
        );
    }

    /**
     * @function withinBounds
     * @description makes sure that the block is still inside the screen
     * @param {Number} y 
     * @param {Number} x 
     * @returns {Boolean}
     */
    withinBounds(y, x) {
        return y >= 0 && x >= 0 && y < this.height && x < this.width;
    }

    /**
     * @function clearBlock
     * @description deletes a block from the board, replacing it with {@link background}
     * @param {Block} block 
     */
    clearBlock(block) {
        block
            .translate()
            .flat(1)
            .filter(([y, x, cell]) => this.withinBounds(y, x) && cell)
            .forEach(([y, x, cell]) => (this.rows[y][x] = background));
    }

    /**
     * @function drawBlock
     * @description draws a given block instance at its internal position
     * @param {Block} block
     */
    drawBlock(block) {
        block
            .translate()
            .flat(1)
            .filter(([y, x, cell]) => this.withinBounds(y, x) && cell)
            .forEach(([y, x, cell]) => (this.rows[y][x] = cell));
    }

    /**
     * @function checkCollision
     * @description returns true if a block would collide with something at a given coordinate
     * @param {Block} block 
     * @param {Number} y 
     * @param {Number} x 
     * @returns {Boolean}
     */
    //TODO read this until I understand it
    checkCollision(block, y, x) {
        //save a microscopic amount of memory by replacing var with direct return
        return block.translate().some((row, rowPos) =>
            row
            .filter(
                (cell, colPos) =>
                cell[2] &&
                this.withinBounds(cell[0] + y, cell[1] + x) &&
                (rowPos + y >= rows.length ||
                    rowPos + y < 0 ||
                    colPos + x >= rows[0].length ||
                    colPos + x < 0 ||
                    rows[rowPos + y][colPos + x][2] == null)
            )
            .some((cell) => this.rows[cell[0] + y][cell[1] + x] != background)
        );
    }

    /**
     * @function move
     * @description moves a block relative to its current position
     * @param {Block} block 
     * @param {Number} y 
     * @param {Number} x 
     */
    move(block, y = 0, x = 0) {
        if (!this.checkCollision(block, y, x)) {
            this.clearBlock(block);
            if (!block.fixed) {
                block.position[0] += y;
            }
            block.position[1] += x;
            this.drawBlock(block);
        }
    }

    /**
     * @function rowsToClear
     * @description checks to see if any rows are full and need to be cleared. counts from bottom to top.
     * @param {Block} block 
     * @returns {Array<Number>}
     */
    rowsToClear(block) {
        return uniq(
                block
                .translate()
                .flat(1)
                .map(([y]) => y)
            )
            .filter((y) => y > 0 && y < this.height)
            .filter((y) => this.rows[y].every((cell) => cell != background));
    }

    /**
     * @function clearRows
     * @description clears a row or rows by setting each one to the one above it recursively
     * @param {Array<Number>} rows 
     */
    clearRows(rows) {
        for (const row of rows) {
            for (let cur = row, above = row - 1; above >= 0; cur--, above--) {
                for (let i = 0; i < this.width; i++) {
                    this.rows[cur][i] = this.rows[above][i];
                }
            }
        }
    }

    /**
     * @function update
     * @description Game update function, calls practically all other functions
     * @returns {void}
     */
    async update() {
        //for every block on the board
        for (const block of this.blocks) {
            //check if the block is fixed
            if (!block.fixed) {
                //and make sure to fix it if it should be
                if (this.shouldFix(block)) {
                    block.fixed = true;
                }
                //move down before anything
                this.move(block, 1);

                try {
                    //listen to the community
                    const replies = await twitter.getReplies(
                        (
                            await twitter.getLastTweet()
                        ).id
                    );

                    const left = replies.filter(
                        (tweet) =>
                        tweet.text.toLowerCase().includes("left") ||
                        tweet.text.includes("⬅️")
                    ).length;
                    const right = replies.filter(
                        (tweet) =>
                        tweet.text.toLowerCase().includes("right") ||
                        tweet.text.includes("➡️")
                    ).length;
                    const spin = replies.filter(
                        (tweet) =>
                        tweet.text.toLowerCase().includes("spin") ||
                        tweet.text.toLowerCase().includes("tilt") ||
                        tweet.text.toLowerCase().includes("turn") ||
                        tweet.text.toLowerCase().includes("flip") ||
                        tweet.text.includes("⤴️") ||
                        tweet.text.includes("↩️")
                    ).length;
                    const down = replies.filter(
                        (tweet) =>
                        tweet.text.toLowerCase().includes("down") ||
                        tweet.text.toLowerCase().includes("drop") ||
                        tweet.text.includes("⬇️")
                    ).length;

                    //port priority
                    if (spin > 0 && spin > left && spin > right && spin > down) {
                        console.log("spin left");
                        this.tiltLeft();
                    } else if (left > 0 && left > right && left > down) {
                        console.log("go left");
                        this.left();
                    } else if (right > 0 && right > down) {
                        console.log("go right");
                        this.right();
                    } else if (down > 0) {
                        console.log("go down");
                        this.down();
                    }
                } catch (e) {
                    console.log(e);
                }

                //after the block is placed
                if (block.fixed) {
                    //if the block is above the screen
                    if (block.position[0] <= 0) {
                        //die
                        this.start();
                        return;
                    }
                    //clear rows around this
                    this.clearRows(this.rowsToClear(block));
                }
            }
        }

        //if everything is fixed, add a new block
        if (this.blocks.map((block) => block.fixed).every((fixed) => fixed)) {
            this.addBlock(shapes);
        }
    }

    /**
     * @function left
     * @description move the newest block left
     */
    left() {
        let block = this.blocks[this.blocks.length - 1];
        if (block.position[1] > 0) {
            this.move(block, 0, -1);
        }
    }

    /**
     * @function right
     * @description move the newest block right
     */
    right() {
        let block = this.blocks[this.blocks.length - 1];
        if (
            Math.max(
                ...block
                .translate()
                .flat(1)
                .map(([_, x]) => x)
            ) <
            this.width - 1
        ) {
            this.move(block, 0, 1);
        }
    }

    /**
     * @function down
     * @description hard drop the newest block
     */
    down() {
        let block = this.blocks[this.blocks.length - 1];
        const rows = block.translate();
        for (let y = block.position[0] + rows.length; y <= this.height - 1; y++) {
            this.move(block, 1);
        }
    }

    /**
     * @function tiltLeft
     * @description spin the newest block to the left
     * @note maybe add super wall kicks? after right spin is implemented obv
     */
    tiltLeft() {
        for (const block of this.blocks) {
            if (!block.fixed) {
                this.clearBlock(block);
                block.rotation++;

                const rows = block.translate();

                if (block.position[0] + rows.length >= this.height) {
                    block.position[0] = this.height - rows.length;
                }
                if (block.position[1] + rows[0].length >= this.width) {
                    block.position[1] = this.width - rows[0].length;
                }

                this.drawBlock(block);
            }
        }
    }

    /**
     * @function tiltRight
     * @description spin the newest block to the right 
     */
    tiltRight() {
        for (const block of this.blocks) {
            if (!block.fixed) {
                this.clearBlock(block);
                block.rotation--;

                const rows = block.translate();

                if (block.position[0] + rows.length >= this.height) {
                    block.position[0] = this.height - rows.length;
                }
                if (block.position[1] + rows[0].length >= this.width) {
                    block.position[1] = this.width - rows[0].length;
                }

                console.log(block.rotation);

                this.drawBlock(block);
            }
        }
    }

    /**
     * @function wait
     * @description waits for a certain amount of time
     * @returns {Promise<void>}
     */
    wait() {
        return new Promise((accept) =>
            setTimeout(() => requestAnimationFrame(accept), this.interval)
        );
    }

    /**
     * @function draw
     * @description draws the current game state as text
     * @returns {String}
     */
    draw() {
        return this.rows
            .map((row) => row.join(""))
            .join(newline)
            .replaceAll(background, dark ? background : lightBackground);
    }

    /**
     * @function show
     * @unused
     * @yields html representation of the current {@link Array2d} gamestate
     */
    async * show() {
            while (!this.paused) {
                this.update();
                yield html `<center>${this.draw()}</center>`;
                await this.wait();
            }
        }
        /**
         * 
         * @returns {{blocks:String}}
         */
    toJSON() {
        return {
            blocks: this.blocks.map((block) => block.toJSON()),
            rows: this.rows,
        };
    }
    static fromJSON(json) {
        const game = new Game(json.rows[0].length, json.rows.length);
        game.blocks = json.blocks.map((block) => Block.fromJSON(block));
        game.rows = json.rows;
        return game;
    }
    static async readFile(file) {
        const json = await fs.readFile(file, "utf8");
        const data = JSON.parse(json);
        return Game.fromJSON(data);
    }
    async writeFile(file) {
        await fs.writeFile(file, JSON.stringify(this, null, 2));
    }
}

export default Game;