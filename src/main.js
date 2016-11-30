/* @flow */
"use strict";

// tell webpack to copy static html and css to build folder
require.context("../public/", true,
                /^\.\/.*\.(html|css|csv|json|tsv|png|jpeg|jpg)/);

import * as d3 from "d3";
import { pickBy, mapValues } from "lodash";
import WorldMap from "./map";

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

          const map = new WorldMap(worldVector);

          function getTotalDeaths(d, z) {
              var years = Object.keys(parsedData[d].disaster);
              console.log(years)
              var total = 0;
              years.forEach(e => {
                  var disasters = Object.keys(parsedData[d].disaster[e]);
                  disasters.forEach(f => {
                      var value = parseInt(parsedData[d].disaster[e][f][z]);
                      if (!isNaN(value)) {
                          total += value;
                      }
                  })
              })
              return total;
          }

          map.on("mousemove", function (d) {
              var html = "";
              html += "<div class=\"tooltip_key\">";
              html += d.properties.name;
              html += "</div>";
              html += "<span class=\"tooltip_key\">";
              html += "Total Deaths: ";
              html += "<span class=\"tooltip_value\">";
              html += (parsedData[d.properties.name] != null ? getTotalDeaths(
                  d.properties.name, "Total deaths") : 0);
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
