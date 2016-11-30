/* @flow */
"use strict";

// tell webpack to copy static html and css to build folder
require.context("../public/", true,
                /^\.\/.*\.(html|css|csv|json|tsv|png|jpeg|jpg)/);

import * as d3 from "d3";
import { pickBy, mapValues } from "lodash";
import WorldMap from "./map";
import BarChart from "./bar";

d3.json("/data/world-topo-min.json", (err, worldVector) => {
    d3.csv("data/disaster_data.csv")
      .get(parsedData => {
          parsedData = processData(parsedData);
          let filteredData = parsedData;
          const slider = initSlider();
          slider.noUiSlider.on('update', function (values, handle) {
            console.log(values, filteredData);
            filteredData = filterByTime(parsedData, parseInt(values[0]), parseInt(values[1]));
          })

          var test = colorRatio(filteredData);
          console.log(test);

          const map = new WorldMap(worldVector);
          const bar = new BarChart([1,2,3], {x: d=>d, y: d=>d});

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
              html += (parsedData[d.properties.name] != null ? get(filteredData,
                  d.properties.name, "Total deaths") : 0);
              html += "</span><br>";
              // Total damage
              html += "<span class=\"tooltip_key\">";
              html += "Total Damage: ";
              html += "<span class=\"tooltip_value\">";
              html += (parsedData[d.properties.name] != null ? "$" + valueFormat(get(filteredData,
                  d.properties.name, "Total damage")) : 0);
              html += "</span><br>";
              // Total affected
              html += "<span class=\"tooltip_key\">";
              html += "Total Affected: ";
              html += "<span class=\"tooltip_value\">";
              html += (parsedData[d.properties.name] != null ? get(filteredData,
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
          map.style("fill", d => "#000");
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
  d3.select("#main").append("div").attr("id", "slider").style("margin", "20px 100px");
  var slider = document.getElementById('slider');

  noUiSlider.create(slider, {
    start: [1960, 2015],
    step: 1,
    connect: true,
    range: {
      'min': 1960,
      'max': 2015
    },
    pips: {
      mode: 'count',
      density: 2,
      values: 11,
      stepped: true
    }
  });
  return slider;
}

/**
 * Filter data to only include data from given range of year.
 * This function is immutable (does not modify the original object).
 *
 * @param {object!} data    data to be filtered
 * @param {number!} start   the start range (inclusive)
 * @param {number!} end     the end range (inclusive)
 * @returns {object!} new data with population and disaster filtered by year
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
 * @param {string!} category    one of three categories: total deaths, total damage, number of affected
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

function colorRatio(data) {
  return mapValues (data, value => {
    Object.keys(value.disaster).forEach(disasterYear => {
      value.ratio = value.ratio || {};
      var totalDeathPerYear = valuesOf(value.disaster[disasterYear])
        .reduce((accumulator, disasterDataPerYear) => {
            var toAdd;
            if (parseInt(disasterDataPerYear["Total deaths"]) + "" != "NaN") {
              toAdd = parseInt(disasterDataPerYear["Total deaths"]);
            } else {
              toAdd = 0;
            }
             return accumulator + toAdd;
          }, 0);
      value.ratio[disasterYear] = totalDeathPerYear / value.population[disasterYear];
    });
    return value;
  });
}

function valuesOf(obj) {
  return Object.keys(obj).map(k => obj[k]);
}