/**
 * @function uniq
 * @description makes an array of each unique value.
 * @example uniq([0, 0, 0, 1, 1, 2, 2, 2, 2, 2]) === [0, 1, 2];//true
 * @param {Array<*>} values 
 * @returns 
 */
const uniq = (values) => [...new Set(values)];

export { uniq };