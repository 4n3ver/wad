/**
 * Loads of utilities functions
 *
 * @author Yoel Ivan (yivan3@gatech.edu)
 * @author Marvin Cangciano (mcangciano3@gatech.edu)
 * @version 0.0a
 * @flow
 */

"use strict";

/**
 * Compose function from right to left.
 *
 * @param rest  functions to be composed
 */
export const compose = (...rest) =>
    value => rest.reverse().reduce(
        (acc, currFunc) => currFunc(acc),
        value
    );

/**
 * Return of every values of an object as an array
 *
 * @param obj   object which values to be made array
 */
export const valuesOf = obj => Object.keys(obj).map(k => obj[k]);

/**
 * Basically the forEach version for object.
 *
 * @param mutator   functions to be applied to each values of an object
 */
export const mutate = (...mutator) => data => valuesOf(data)
    .forEach(data => mutator.forEach(fn => fn(data)));

/**
 * Compose function in data flow order (left to right)
 *
 * @param funcs functions to be pipelined
 */
export const pipeline = (...funcs) =>
    value => funcs.reduce((acc, currFunc) => currFunc(acc), value);

/**
 * Return short hand version of a number
 *
 * @param {number} d    number to be formatted
 * @returns {string|number}    formatted number
 */
export const valueFormatShort = d => {
    if (d > 1000000000) {
        return `${Math.round(d / 1000000000 * 10) / 10  }B`;
    } else if (d > 1000000) {
        return `${Math.round(d / 1000000 * 10) / 10  }M`;
    } else if (d > 1000) {
        return `${Math.round(d / 1000 * 10) / 10  }K`;
    } else {
        return d === void 0 || d === null || isNaN(d) ? 0 : d;
    }
};

export default {
    compose,
    valuesOf,
    pipeline,
    mutate
};
