"use strict";
/**
 * @version 0.0a
 * @flow
 */
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
                if (`${parseInt(row["Country Name"][key])  }` != "NaN") {
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
 * Filter data to only include data from given range of year.
 * This function is immutable (does not modify the original object).
 *
 * @param {Object!} data    data to be filtered
 * @param {number!} start   the start range (inclusive)
 * @param {number!} end     the end range (inclusive)
 * @returns {Object} new data with population and disaster filtered by year
 */
export const filterByTime = (start, end) => data =>
    mapValues(data, countryData => mapValues(countryData, (propData, prop) =>
        prop === "disaster" || prop === "population"
            ? pickBy(propData, (v, year) => year >= start && year <= end)
            : propData));

/**
 *
 * @param types
 */
export const filterByDisasterType = (...types) => data =>
    mapValues(data, types && types.length > 0
        ? countryData => mapValues(countryData, (propData, prop) => {
        if (prop === "disaster") {
            // remove all that do not match
            propData = mapValues(
                propData,
                disasterData =>
                    pickBy(disasterData, (stats, disasterType) =>
                        types.some(type => disasterType === type))
            );

            // remove all year that has no disaster
            return pickBy(
                propData,
                disasterData => Object.keys(disasterData).length > 0
            );
        } else {
            return propData;
        }
    })
        : null);

/**
 *
 * @param countries
 */
export const filterByCountries = (...countries) => data =>
    pickBy(data, countries && countries.length > 0
        ? (console.log(countries), (countryData,
                                    countryName) => countries.some(
        c => c === countryName))
        : null);

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

export const toBarData = data => valuesOf(
    flatten(
        flatten(
            valuesOf(data).map(d => valuesOf(d.disaster))
        ).map(d => valuesOf(d))
    ).reduce((set, data) => {
        const type = data["Disaster Type"];
        if (!set[type]) {
            set[type] = {
                affected: 0,
                damage  : 0,
                death   : 0,
                type
            };
        }
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
    }, {})
);

export const toLineData = data => {

};
