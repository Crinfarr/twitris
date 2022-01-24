//you can ignore these probably I just like my words
/**
 * @typedef {Array<Array<String|null>>} ShapeLike an {@link Array2d} of text making a tetris piece shape
 * @typedef {Array<Array<[number, number, string|null]>>} BlockLike an {@link Array3d} of coordinates and pixels
 * @typedef {[number, number]} Vector an array of two numbers
 * @typedef {Array<Array<*>>} Array2d any 2d array
 * @typedef {Array<Array<Array<*>>>} Array3d any 3d array
 */

/**
 * @class Block
 * @description a tetris block
 */
class Block {
    /**
     * @constructor
     * @description creates a new tetris block
     * @param {ShapeLike} shape
     * @param {Vector} position
     * @param {Number} rotation 
     * @param {boolean} fixed
     * @implements {} &nbsp;{@link ShapeLike}, {@link Vector}
     */
    constructor(shape, position = [-1, 0], rotation = 0, fixed = false) {
        this.shape = shape;
        this.rotation = rotation;
        this.position = position;
        this.fixed = fixed;

        //this.slipCount = 0;
        //how many times this block has been slid after landing (in normal tetris this should never go above 2, but we can play with that)
        //TODO make this do anything
    }

    /**
     * @function translate
     * @description returns this block as a {@link ShapeLike} with rotation applied
     * @note I have no idea how this works
     * @returns {BlockLike}
     * @implements {} &nbsp;{@link ShapeLike}
     */
    translate() {
        let result = [];

        const rotation = Math.abs(this.rotation) % 4;
        if (rotation == 0) {
            result = this.shape.map((row, rowPos) =>
                row.map((cell, colPos) => [
                    this.position[0] + rowPos,
                    this.position[1] + colPos,
                    cell
                ])
            );
        } else if (rotation == 3) {
            result = new Array(this.shape[0].length)
                .fill(null)
                .map(() => new Array(this.shape.length).fill(null));
            for (let colPos = this.shape[0].length - 1; colPos >= 0; colPos--) {
                for (let rowPos = 0; rowPos < this.shape.length; rowPos++) {
                    result[colPos][rowPos] = [
                        this.position[0] + colPos,
                        this.position[1] + rowPos, [...this.shape].reverse()[rowPos][colPos]
                    ];
                }
            }
        } else if (rotation == 2) {
            result = [...this.shape]
                .reverse()
                .map((row, rowPos) => [...row]
                    .reverse()
                    .map((cell, colPos) => [
                        this.position[0] + rowPos,
                        this.position[1] + colPos,
                        cell
                    ])
                );
        } else if (rotation == 1) {
            result = new Array(this.shape[0].length)
                .fill(null)
                .map(() => new Array(this.shape.length).fill(null));
            for (let colPos = this.shape[0].length - 1; colPos >= 0; colPos--) {
                for (let rowPos = 0; rowPos < this.shape.length; rowPos++) {
                    result[colPos][rowPos] = [
                        this.position[0] + colPos,
                        this.position[1] + rowPos, [...this.shape[rowPos]].reverse()[colPos]
                    ];
                }
            }
        }

        return result;
    }

    /**
     * @function draw
     * @description converts a block into a writable string
     * @returns {String}
     * 
     * @note I'm not exactly sure why this is here, it's unused as far as I can see
     * 
     */
    draw() {
        return html `${this.translate()
      .map((row) => row.map(([y, x, cell]) => cell ?? background).join(""))
      .join(newline)}`;
    }

    /**
     * @function toJSON
     * @description converts a block to json.
     * @implements {} &nbsp;{@link ShapeLike}, {@link Vector}
     * @returns {{shape:ShapeLike, position:Vector, rotation:Number, fixed:Boolean}}
     */
    toJSON() {
        return {
            shape: this.shape,
            position: this.position,
            rotation: this.rotation,
            fixed: this.fixed
        };
    }

    /**
     * @function fromJSON
     * @description loads a block from json. this should be used instead of a constructor.
     * @param {{shape: ShapeLike, position: Vector, rotation: number, fixed: boolean}} json 
     * @returns a {@link Block}
     */
    static fromJSON(json) {
        return new Block(json.shape, json.position, json.rotation, json.fixed);
    }
}

export default Block;