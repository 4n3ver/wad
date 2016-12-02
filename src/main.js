/* @flow */
"use strict";

// tell webpack to copy static html and css to build folder
require.context("../public/", true,
                /^\.\/.*\.(html|css|csv|json|tsv|png|jpeg|jpg)/);

import * as d3 from "d3";
import { pickBy, mapValues } from "lodash";
import Chart from "chart.js";
import WorldMap from "./map";
import BarChart from "./bar";
import { valueFormatShort } from "./util";
import {
    processData,
    maxRatio,
    filter,
    computeRatio,
    toBarData,
    toLineData
} from "./data";
import { initDropDown, initSlider } from "./extras";

const computeChoroplethHue = filteredData => {
    const max = maxRatio(filteredData);
    return function (d) {
        if (filteredData[d.properties.name]) {
            return `rgb(180, ${
            180 - selectRed(0, max,
                            filteredData[d.properties.name].averageRatio)
                }, ${
            180 - selectRed(0, max,
                            filteredData[d.properties.name].averageRatio)
                })`;
        } else {
            return "#000";
        }
    };
};

function lineChart(lineData, startYear = 1960, target = "#main") {
    d3.select(target).append("canvas")
      .attr("width", 1500)
      .attr("height", 300)
      .attr("id", "line-chart");
    const line = new Chart(
        document.getElementById("line-chart"),
        {
            type   : "line",
            data   : {
                labels  : lineData.map((c, i, a) => startYear + i),
                datasets: [
                    {
                        fill                     : false,
                        lineTension              : 0.1,
                        backgroundColor          : "rgba(75,192,192,0.4)",
                        borderColor              : "rgba(75,192,192,1)",
                        borderCapStyle           : "butt",
                        borderDash               : [],
                        borderDashOffset         : 0.0,
                        borderJoinStyle          : "miter",
                        pointBorderColor         : "rgba(75,192,192,1)",
                        pointBackgroundColor     : "#fff",
                        pointBorderWidth         : 1,
                        pointHoverRadius         : 5,
                        pointHoverBackgroundColor: "rgba(75,192,192,1)",
                        pointHoverBorderColor    : "rgba(220,220,220,1)",
                        pointHoverBorderWidth    : 2,
                        pointRadius              : 1,
                        pointHitRadius           : 10,
                        data                     : lineData,
                        spanGaps                 : false
                    }
                ]
            },
            options: {
                maintainAspectRatio: true,
                responsive         : false,
                scales             : {
                    yAxes: [
                        {
                            scaleLabel: {
                                display    : true,
                                labelString: "Disaster Frequency",
                                fontSize   : 8
                            }
                        }
                    ],
                    xAxes: [
                        {
                            scaleLabel: {
                                display    : true,
                                labelString: "Year",
                                fontSize   : 8
                            },
                            ticks     : {
                                autoSkip     : true,
                                maxTicksLimit: 20
                            }
                        }
                    ]
                },
                title              : {display: false}
            }
        }
    );
    line.updateGraph = function (lineData, startYear) {
        line.data.datasets[0].data = lineData;
        line.data.labels = lineData.map((c, i, a) => startYear + i);
        line.update(2000);
    };
    return line;
}

function main(worldVector, parsedData) {
    const filterParsedData = filter(parsedData);

    let filteredData = parsedData;

    const map = new WorldMap(worldVector);
    const bar = new BarChart(toBarData(filteredData), {
        x: d => d.damage,
        y: d => d.type
    });
    const dropdown = initDropDown();
    const slider = initSlider();
    const line = lineChart(toLineData(filteredData));
    console.log(line);

    slider.noUiSlider.on("update", function ([start, end]) {
        start = parseInt(Math.abs(Math.min(start, end)));
        end = parseInt(Math.abs(Math.max(start, end)));

        filteredData = filterParsedData(start, end);
        computeRatio(start, end)(filteredData);
        bar.updateGraph(toBarData(filteredData));
        line.updateGraph(toLineData(filteredData, start, end), start);
        map.style("fill", computeChoroplethHue(filteredData));
        dropdown.on("input", function () {
            filteredData = filterParsedData(start, end);
            computeRatio(start, end)(filteredData);
            map.style("fill", computeChoroplethHue(filteredData));
            bar.updateGraph(toBarData(filteredData), {
                x: d => d[this.value],
                y: d => d.type
            });
        });
        bar.on("click", function (data, event, these) {
            these.style("stroke", "none");
            this.style("stroke", "#424242")
                .style("stroke-width", "2px");
            filteredData = filterParsedData(start, end, data.type);
            computeRatio(start, end)(filteredData);
            line.updateGraph(toLineData(filteredData, start, end), start);
            map.style("fill", computeChoroplethHue(filteredData));
        });
    });

    bar.on("mouseenter", function (data, event, these) {
        this.style("opacity", .5);
    });
    bar.on("mouseleave", function (data, event, these) {
        this.style("opacity", 1);
    });

    map.on("mousemove", function (d) {
        let html = "";
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
        html += (filteredData[d.properties.name] != null ? `$${
            valueFormatShort(get(filteredData,
                                 d.properties.name, "Total damage"))}`
            : 0);
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
          .style("top", `${d3.event.y + 15  }px`)
          .style("left", `${d3.event.x + 15  }px`)
          .style("display", "block");

        const coord = d3.mouse(this);
    });
    map.on("mouseout", function (d) {
        d3.select(this).attr("fill-opacity", 1);
        d3.select("#tooltip-container").style("display", "none");
    });

    map.style("fill", computeChoroplethHue(filteredData));
}

d3.json("/data/world-topo-min.json", (err, worldVector) =>
    d3.csv("data/disaster_data.csv")
      .get(parsedData => err
          ? console.error(err)
          : main(worldVector, Object.freeze(processData(parsedData)))));

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
}

function selectRed(min, max, value) {
    return Math.ceil(Math.sqrt(value / max) * 280);
}


