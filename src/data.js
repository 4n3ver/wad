/**
 * Functions to append UI elements
 *
 * @author Felly Rusli (frusli6@gatech.edu)
 * @author Yoel Ivan (yivan3@gatech.edu)
 * @author Marvin Cangciano (mcangciano3@gatech.edu)
 * @version 0.0a
 * @flow
 */

"use strict";

import { pickBy, mapValues, get, flatten } from "lodash";
import { valuesOf, compose, mutate } from "./util";

export const processData = rawData => {
    const jsonObject = {};
    rawData.forEach(row => {
        jsonObject[row["Country Name"]] = jsonObject[row["Country Name"]] ||
            {
                countryName: row["Country Name"],
                population : {},
                disaster   : {}
            };
        jsonObject[row["Country Name"]].disaster[row.Year]
            = jsonObject[row["Country Name"]].disaster[row.Year] || {};
        jsonObject[row["Country Name"]].disaster[row.Year][row["Disaster Type"]]
            = {};
        Object.keys(row).forEach(key => {
            if (`${parseInt(key)  }` !== "NaN") {
                jsonObject[row["Country Name"]].population[key] = parseInt(
                    row[key]);
            } else {
                if (`${parseInt(row["Country Name"][key])  }` !== "NaN") {
                    jsonObject[row["Country Name"]].disaster[row.Year][row["Disaster Type"]][key]
                        = parseInt(row[key]);
                } else {
                    jsonObject[row["Country Name"]].disaster[row.Year][row["Disaster Type"]][key]
                        = row[key];
                }
            }
        });
    });
    return jsonObject;
};

/**
 * Generate a function to filter data to only include data from given range of
 * year.
 * The returned function is immutable (does not modify the original object).
 *
 * @param {number!} start   the start range (inclusive)
 * @param {number!} end     the end range (inclusive)
 * @returns {Function}  function that will filter data to only include data
 *                      from `start` to `end` inclusive
 */
export const filterByTime = (start, end) => data =>
    mapValues(data, countryData => mapValues(countryData, (propData, prop) =>
        prop === "disaster" || prop === "population"
            ? pickBy(propData, (v, year) => year >= start && year <= end)
            : propData));

/**
 * Generate a function to filter data to only include data with specified
 * disaster types.
 * The returned function is immutable (does not modify the original object).
 *
 * @param {string!} types   disaster types to be included
 * @returns {Function}  function that will filter data to only include data
 *                      with specified disaster types
 */
export const filterByDisasterType = (...types) => data =>
    types.length === 0 || types.some(c => c === null || c === void 0)
        ? data
        : mapValues(data,
                    countryData => mapValues(countryData, (propData, prop) => {
                        if (prop === "disaster") {
                            // remove all that do not match
                            propData = mapValues(
                                propData,
                                disasterData =>
                                    pickBy(disasterData,
                                           (stats, disasterType) =>
                                               types.some(type => disasterType
                                               === type))
                            );

                            // remove all year that has no disaster
                            return pickBy(
                                propData,
                                disasterData => Object.keys(
                                    disasterData).length > 0
                            );
                        } else {
                            return propData;
                        }
                    }));

/**
 * Generate a function to filter data to only include data with specified
 * countries
 * The returned function is immutable (does not modify the original object).
 *
 * @param {string!} countries   countries to be included
 * @returns {Function}  function that will filter data to only include data
 *                      with specified countries
 */
export const filterByCountries = (...countries) => data =>
    countries.length === 0 || countries.some(c => c === null || c === void 0)
        ? data
        : pickBy(data, (countryData, countryName) =>
        countries.some(c => c === countryName));

/**
 * Generate a function to filter data to only include data with specified
 * countries and disaster types and year within `startYear` and `endYear`.
 * The returned function immutable (does not modify the original object).
 *
 * @param {Object!} pristineData   data to be filtered
 * @returns {Function}  function that will filter data to only include data
 *                      with specified countries and disaster types and
 *                      year within `startYear` and `endYear`.
 */
export const filter = pristineData =>
    (startYear, endYear, disasterType, country) =>
        compose(
            disasterType ? filterByDisasterType(disasterType) : x => x,
            filterByTime(startYear, endYear),
            country ? filterByCountries(country) : x => x
        )(pristineData);

/**
 * Calculate the ratio of total death and population per year to determine the
 * hue of the map.
 *
 * @param {Object!} countryData     data of a country to be calculated
 * @returns {Object} ratio of the total death and population per year
 * @private
 */
const _computeRatioByYear = countryData => {
    Object.keys(countryData.disaster).forEach(disasterYear => {
        countryData.ratio = countryData.ratio || {};
        const totalDeathPerYear = valuesOf(countryData.disaster[disasterYear])
            .reduce((accumulator, disasterDataPerYear) => {
                let toAdd;
                if (`${parseInt(disasterDataPerYear["Total deaths"])}`
                    !== "NaN") {
                    toAdd = parseInt(disasterDataPerYear["Total deaths"]);
                } else {
                    toAdd = 0;
                }
                return accumulator + toAdd;
            }, 0);
        countryData.ratio[disasterYear] = totalDeathPerYear
            / countryData.population[disasterYear];
    });
};

/**
 * Calculate the average ratio per country
 *
 * @param {Object!} start       start year of the data that will be calculated
 * @param {Object!} end         end year of the data that will be calculated
 * @returns {Function} the average of ratio per country
 * @private
 */
const _computeRatioByCountry = (start, end) => countryData => {
    countryData.averageRatio = 0;
    if (countryData.ratio) {
        Object.keys(countryData.ratio).forEach(ratioYear =>
                                                   countryData.averageRatio
                                                       += countryData.ratio[ratioYear]);
        countryData.averageRatio = countryData.averageRatio / (end - start);
    }
};

export const computeRatio = (startYear, endYear) =>
    mutate(_computeRatioByYear, _computeRatioByCountry(startYear, endYear));

/**
 * Find the maximum ratio for all country
 *
 * @param {object!} data        data to be calculated
 * @returns {number!} the maximum ratio for all country
 */
export const maxRatio = data => {
    let max = 0;
    valuesOf(data).forEach(country => {
        max = Math.max(max, country.averageRatio);
    });
    return max;
};

export const toBarData = data => {
    const set = {};
    [
        "Flood", "Drought", "Landslide", "Earthquake", "Extreme temperature",
        "Insect infestation", "Mass movement (dry)", "Storm", "Epidemic",
        "Wildfire", "Volcanic activity", "Animal accident", "Impact"
    ].forEach(type => set[type] = {
        affected: 0,
        damage  : 0,
        death   : 0,
        type
    });

    return valuesOf(
        flatten(
            flatten(
                valuesOf(data).map(d => valuesOf(d.disaster))
            ).map(d => valuesOf(d))
        ).reduce((set, data) => {
            const type = data["Disaster Type"];
            set[type].affected += data["Total affected"] !== "null"
                ? parseInt(data["Total affected"])
                : 0;
            set[type].damage += data["Total damage"] !== "null"
                ? parseInt(data["Total damage"])
                : 0;
            set[type].death += data["Total deaths"] !== "null"
                ? parseInt(data["Total deaths"])
                : 0;
            return set;
        }, set)
    );
};

export const toLineData = (data, start = 1960, end = 2015) => {
    const obj = flatten(
        flatten(
            valuesOf(data).map(d => valuesOf(d.disaster))
        ).map(d => valuesOf(d))
    ).reduce((set, data) => {
        if (!set[data.Year]) {
            set[data.Year] = 0;
        }
        set[data.Year]++;
        return set;
    }, {});
    const result = [];
    for (let year = start; year <= end; year++) {
        result.push(obj[year] || 0);
    }
    return result;
};

/**
 * Calculate total data for a category for a country.
 * This function is immutable (does not modify the original object).
 *
 * @param {Object!} data        data to be calculated
 * @param {string!} countryName name of the country
 * @param {string!} category    one of three categories: total deaths, total
 *                              damage, number of affected
 * @returns {number!} total data for a category for a country.
 */
export const getTotal = (data, countryName, category) => {
    const years = Object.keys(data[countryName].disaster);
    let total = 0;
    years.forEach(e => {
        const disasters = Object.keys(data[countryName].disaster[e]);
        disasters.forEach(f => {
            const value = parseInt(data[countryName].disaster[e][f][category]);
            if (!isNaN(value)) {
                total += value;
            }
        });
    });
    return total;
};
