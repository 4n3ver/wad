/**
 * @author Yoel Ivan (yivan3@gatech.edu)
 * @version 0.0a
 * @flow
 */

export const compose = (...rest) =>
    value => rest.reverse().reduce(
        (acc, currFunc) => currFunc(acc),
        value
    );

export const valuesOf = obj => Object.keys(obj).map(k => obj[k]);

export const mutate = (...mutator) => data => valuesOf(data)
    .forEach(data => mutator.forEach(fn => fn(data)));

// compose functions in data flow order
export const pipeline = (...funcs) =>
    value => funcs.reduce((acc, currFunc) => currFunc(acc), value);

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
