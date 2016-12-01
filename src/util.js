/**
 * @author Yoel Ivan (yivan3@gatech.edu)
 * @version 0.0a
 * @flow
 */

export const compose = (...rest) =>
    value =>
        rest.reverse().reduce(
            (acc, currFunc) => currFunc(acc),
            value
        );

export const valuesOf = obj => Object.keys(obj).map(k => obj[k]);

export default {
    compose,
    valuesOf
};
