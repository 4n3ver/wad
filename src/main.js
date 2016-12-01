/* @flow */
"use strict";

// tell webpack to copy static html and css to build folder
require.context("../public/", true,
                /^\.\/.*\.(html|css|csv|json|tsv|png|jpeg|jpg)/);

import * as d3 from "d3";
import { pickBy, mapValues } from "lodash";
import WorldMap from "./map";
import BarChart from "./bar";
import { valueFormatShort } from "./util";
import {
    processData,
    maxRatio,
    filter,
    computeRatio,
    toBarData
} from "./data";
import { initDropDown, initSlider } from "./extras";

const computeChoroplethHue = (filteredData, max) =>
    function (d) {
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

function main(worldVector, parsedData) {
    const filterParsedData = filter(parsedData);

    let filteredData = parsedData;
    let barData = toBarData(filteredData);
    let max = maxRatio(filteredData);

    const map = new WorldMap(worldVector);
    const bar = new BarChart(barData, {
        x: d => d.damage,
        y: d => d.type
    });
    const dropdown = initDropDown();
    const slider = initSlider();

    slider.noUiSlider.on("update", function ([start, end]) {
        filteredData = filterParsedData(start, end);
        computeRatio(start, end)(filteredData);
        max = maxRatio(filteredData);
        barData = toBarData(filteredData);
        bar.updateGraph(barData);
        map.style("fill", computeChoroplethHue(filteredData, max));
        dropdown.on("input", function () {
            filteredData = filterParsedData(start, end);
            computeRatio(start, end)(filteredData);
            max = maxRatio(filteredData);
            barData = toBarData(filteredData);
            bar.updateGraph(barData);
            map.style("fill", computeChoroplethHue(filteredData, max));
            const barVar = this.value;
            bar.updateGraph(barData, {
                x: d => d[barVar],
                y: d => d.type
            });
        });
        bar.on("click", function (data, event, these) {
            these.style("stroke", "none");
            this.style("stroke", "#424242")
                .style("stroke-width", "2px");
            filteredData = filterParsedData(start, end, data.type);
            computeRatio(start, end)(filteredData);
            max = maxRatio(filteredData);
            barData = toBarData(filteredData);
            map.style("fill", computeChoroplethHue(filteredData, max));
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

    map.style("fill", computeChoroplethHue(filteredData, max));
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


