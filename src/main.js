/* @flow */
"use strict";

// tell webpack to copy static html and css to build folder
require.context("../public/", true,
                /^\.\/.*\.(html|css|csv|json|tsv|png|jpeg|jpg)/);

import * as d3 from "d3";
import { pickBy, mapValues } from "lodash";
import WorldMap from "./map";
import BarChart from "./bar";
import {compose, valuesOf} from "./util";

d3.json("/data/world-topo-min.json", (err, worldVector) => {
    d3.csv("data/disaster_data.csv")
      .get(parsedData => {
          initDropDown();

          parsedData = processData(parsedData);
          let filteredData = parsedData;
          const slider = initSlider();
          slider.noUiSlider.on("update", function (values, handle) {
              filteredData = filterByTime(parsedData, parseInt(values[0]),
                                          parseInt(values[1]));
              filteredData = averageRatioPerCountry(colorRatio(filteredData));
          });

          var test = colorRatio(filteredData);
          console.log(test);
          var testtest = averageRatioPerCountry(test, 1960, 2015);
          console.log(testtest);
          var maxxxx = maxRatio(testtest);
          console.log(maxxxx);

          const map = new WorldMap(worldVector);
          const bar = new BarChart([1, 2, 3]);
          bar.on("click", function (data, event, these) {
              these.style("stroke", "none");
              this.style("stroke", "#424242")
                  .style("stroke-width", "3px");
          });
          bar.on("mouseenter", function (data, event, these) {
              these.style("opacity", 1);
              this.style("opacity", .85);
          });
          bar.updateGraph([1, 2]);

          map.on("mousemove", function (d) {
              var html = "";
              // Country name
              html += "<div class=\"tooltip_key\">";
              html += d.properties.name;
              html += "</div>";
              html += "<span class=\"tooltip_key\">";
              html += "Total Deaths: ";
              // Total deaths
              html += "<span class=\"tooltip_value\">";
              html += (filteredData[d.properties.name] != null ? get(
                  filteredData,
                  d.properties.name, "Total deaths") : 0);
              html += "</span><br>";
              // Total damage
              html += "<span class=\"tooltip_key\">";
              html += "Total Damage: ";
              html += "<span class=\"tooltip_value\">";
              html += (filteredData[d.properties.name] != null ? "$"
              + valueFormat(get(filteredData,
                                d.properties.name, "Total damage")) : 0);
              html += "</span><br>";
              // Total affected
              html += "<span class=\"tooltip_key\">";
              html += "Total Affected: ";
              html += "<span class=\"tooltip_value\">";
              html += (filteredData[d.properties.name] != null ? get(
                  filteredData,
                  d.properties.name, "Total affected") : 0);
              html += "</span>";
              html += "</div>";

              d3.select("#tooltip-container").html(html).style("opacity", 1);
              d3.select(this).attr("fill-opacity", 0.75);

              d3.select("#tooltip-container")
                .style("top", (d3.event.y + 15) + "px")
                .style("left", (d3.event.x + 15) + "px")
                .style("display", "block");

              var coord = d3.mouse(this);
              // if (d3.event.pageX < map_width / 2) {
              //   d3.select("#tooltip-container")
              //     .style("top", (d3.event.layerY + 15) + "px")
              //     .style("left", (d3.event.layerX + 15) + "px");
              // } else {
              //   var tooltip_width =
              // d3.select("#tooltip-container").width();
              //   d3.select("#tooltip-container")
              //     .style("top", (d3.event.layerY + 15) + "px")
              //     .style("left", (d3.event.layerX - tooltip_width - 30) +
              // "px"); }
          });
          map.on("mouseout", function (d) {
              d3.select(this).attr("fill-opacity", 1);
              d3.select("#tooltip-container").style("display", "none");
          });
          var max = maxRatio(filteredData);
          map.style("fill", d => {
            if (filteredData[d.properties.name]) {
                return "rgb(180," + (180 - selectRed(0, max, filteredData[d.properties.name].averageRatio)) + ", " + (180 - selectRed(0, max, filteredData[d.properties.name].averageRatio)) + ")";
            } else {
                return "#000";
            }
            });
      });
});

function processData(rawData) {
    var jsonObject = {};
    rawData.forEach(row => {
        jsonObject[row["Country Name"]] = jsonObject[row["Country Name"]] || {
                countryName: row["Country Name"],
                population : {},
                disaster   : {}
            };
        jsonObject[row["Country Name"]].disaster[row["Year"]]
            = jsonObject[row["Country Name"]].disaster[row["Year"]] || {};
        jsonObject[row["Country Name"]].disaster[row["Year"]][row["Disaster Type"]]
            = {};
        Object.keys(row).forEach(key => {
            if (parseInt(key) + "" != "NaN") {
                jsonObject[row["Country Name"]].population[key] = parseInt(
                    row[key]);
            } else {
                if (parseInt(row["Country Name"][key]) + "" != "NaN") {
                    jsonObject[row["Country Name"]].disaster[row["Year"]][row["Disaster Type"]][key]
                        = parseInt(row[key]);
                } else {
                    jsonObject[row["Country Name"]].disaster[row["Year"]][row["Disaster Type"]][key]
                        = row[key];
                }
            }
        });
    });
    // console.log(JSON.stringify(jsonObject));
    return jsonObject;
}

/**
 * Initialize time slider.
 *
 * @returns {object!} time slider
 */
function initSlider() {
    d3.select("#main").append("div").attr("id", "slider")
      .style("margin", "20px 100px");
    var slider = document.getElementById('slider');

    noUiSlider.create(slider, {
        start  : [1960, 2015],
        step   : 1,
        connect: true,
        range  : {
            'min': 1960,
            'max': 2015
        },
        pips   : {
            mode   : 'count',
            density: 2,
            values : 11,
            stepped: true
        }
    });
    return slider;
}

function initDropDown() {
    var dropdown = d3.select("#main")
                     .append("div").attr("class", "ui fluid input")
                     .append("select")
                     .attr("class", "ui compact selection dropdown");

    dropdown.append("option").attr("value", "Total damage")
            .text("Total Damage ($)");
    dropdown.append("option").attr("value", "Total deaths")
            .text("Total Death");
    dropdown.append("option").attr("value", "Total affected")
            .text("Number of People Affected")
}

/**
 * Filter data to only include data from given range of year.
 * This function is immutable (does not modify the original object).
 *
 * @param {Object!} data    data to be filtered
 * @param {number!} start   the start range (inclusive)
 * @param {number!} end     the end range (inclusive)
 * @returns {Object!} new data with population and disaster filtered by year
 */
function filterByTime(data, start, end) {
    console.log(start, end);
    return mapValues(
        data, v =>
            mapValues(v, (v, k) => {
                if (k === "disaster" || k === "population") {
                    return pickBy(v, (v, k) =>
                    parseInt(k) >= start && parseInt(k) <= end);
                } else {
                    return v;
                }
            })
    );
}

/**
 * Calculate total data for a category for a country.
 * This function is immutable (does not modify the original object).
 *
 * @param {object!} data        data to be calculated
 * @param {string!} countryName name of the country
 * @param {string!} category    one of three categories: total deaths, total
 *     damage, number of affected
 * @returns {number!} total data for a category for a country.
 */
function get(data, countryName, category) {
    var years = Object.keys(data[countryName].disaster);
    console.log(years)
    var total = 0;
    years.forEach(e => {
        var disasters = Object.keys(data[countryName].disaster[e]);
        disasters.forEach(f => {
            var value = parseInt(data[countryName].disaster[e][f][category]);
            if (!isNaN(value)) {
                total += value;
            }
        })
    })
    return total;
}

function valueFormat(d) {
    if (d > 1000000000) {
        return Math.round(d / 1000000000 * 10) / 10 + "B";
    } else if (d > 1000000) {
        return Math.round(d / 1000000 * 10) / 10 + "M";
    } else if (d > 1000) {
        return Math.round(d / 1000 * 10) / 10 + "K";
    } else {
        return d;
    }
}

/**
 * Calculate the ratio of total death and population per year to determine the
 * hue of the map.
 *
 * @param {object!} data        data to be calculated
 * @returns {object!} ratio of the total death and population per year
 */
function colorRatio(data) {
    return mapValues(data, value => {
        Object.keys(value.disaster).forEach(disasterYear => {
            value.ratio = value.ratio || {};
            var totalDeathPerYear = valuesOf(value.disaster[disasterYear])
                .reduce((accumulator, disasterDataPerYear) => {
                    var toAdd;
                    if (parseInt(disasterDataPerYear["Total deaths"]) + ""
                        != "NaN") {
                        toAdd = parseInt(disasterDataPerYear["Total deaths"]);
                    } else {
                        toAdd = 0;
                    }
                    return accumulator + toAdd;
                }, 0);
            value.ratio[disasterYear] = totalDeathPerYear
                / value.population[disasterYear];
        });
        return value;
    });
}


///////////////////////////////////////////////
function selectRed(min, max, value) {
    return Math.ceil( Math.sqrt(value/max) * 280 );
}
/**
 * Calculate the average ratio per country
 *
 * @param {object!} data        data to be calculated
 * @param {object!} start       start year of the data that will be calculated
 * @param {object!} end         end year of the data that will be calculated
 * @returns {object!} the average of ratio per country
 */
function averageRatioPerCountry(data, start, end) {
    return mapValues(data, value => {
        value.averageRatio = 0;
        if (value.ratio) {
            Object.keys(value.ratio).forEach(ratioYear => {
                value.averageRatio += value.ratio[ratioYear]
            });
            value.averageRatio = value.averageRatio / (end - start);
        }
        return value;
    });
}

/**
 * Find the maximum ratio for all country
 *
 * @param {object!} data        data to be calculated
 * @returns {number!} the maximum ratio for all country
 */
function maxRatio(data) {
    var max = 0;
    valuesOf(data).forEach(country => {
        max = Math.max(max, country.averageRatio);
    });
    return max;
}
