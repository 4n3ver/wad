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
    toBarData,
    toLineData,
    getTotal as get
} from "./data";
import { initDropDown, initSlider, drawLineGraph } from "./extras";

const selectRed = (max, value) => Math.ceil(Math.sqrt(value / max) * 280);

const computeChoroplethHue = filteredData => {
    const max = maxRatio(filteredData);
    return function (d) {
        if (filteredData[d.properties.name]) {
            const ratio = filteredData[d.properties.name].averageRatio;
            return `rgb(180, ${180 - selectRed(max, ratio)
                }, ${180 - selectRed(max, ratio)})`;
        } else {
            return "#000";
        }
    };
};

const filterAndComputeRatio = filterFn => (start, end, disasterType,
                                           country) => {
    const res = filterFn(start, end, disasterType, country);
    computeRatio(start, end)(res);
    return res;
};

function main(worldVector, parsedData) {
    const filterParsedData = filterAndComputeRatio(filter(parsedData));
    let filteredData = parsedData;
    let startYear = 1960;
    let endYear = 2015;
    let country = null;
    let disasterType = null;

    const dropDown = initDropDown("#bar-container");
    const slider = initSlider("#slider-container");
    const map = new WorldMap(worldVector, {target: "#map-container"});
    const bar = new BarChart(toBarData(filteredData), {
        x: d => d.affected,
        y: d => d.type
    }, {target: "#bar-container"});
    const line = drawLineGraph(toLineData(filteredData), 1960,
                               "#line-container");

    bar.style("cursor", "pointer");
    map.style("cursor", "pointer");

    dropDown.on("input", function () {
        bar.style("fill", "rgba(0,0,0,0)");
        disasterType = null;
        map.style("stroke", () => "none");
        country = null;
        filteredData = filterParsedData(startYear, endYear, disasterType,
                                        country);
        line.updateGraph(toLineData(filteredData, startYear, endYear),
                         startYear);
        map.update(computeChoroplethHue(filteredData));
        bar.updateGraph(toBarData(filteredData), {
            x: d => d[this.value],
            y: d => d.type
        });
        console.log(startYear, endYear, disasterType, country);
    });

    slider.noUiSlider.on("update", function ([start, end]) {
        startYear = parseInt(Math.abs(Math.min(start, end)));
        endYear = parseInt(Math.abs(Math.max(start, end)));
        filteredData = filterParsedData(startYear, endYear, disasterType,
                                        country);
        line.updateGraph(toLineData(filteredData, startYear, endYear),
                         startYear);
        map.update(computeChoroplethHue(filteredData));
        bar.updateGraph(
            toBarData(filterParsedData(startYear, endYear, null, country)));
        console.log(startYear, endYear, disasterType, country);
    });

    bar.on("click", function (data, event, these) {
        disasterType = data.type;
        these.style("fill", "rgba(0,0,0,0)");
        this.style("fill", "rgba(207,216,220,.3)");
        map.style("stroke", "none");
        country = null;
        filteredData = filterParsedData(startYear, endYear, disasterType);
        line.updateGraph(toLineData(filteredData, startYear, endYear),
                         startYear);
        map.update(computeChoroplethHue(filteredData));
        bar.updateGraph(
            toBarData(filterParsedData(startYear, endYear, null, country)));
        console.log(startYear, endYear, disasterType, country);
    });
    bar.on("mouseenter", function (data, event, these) {
        this.style("stroke", "#424242");
    });
    bar.on("mouseleave", function (data, event, these) {
        this.style("stroke", "none");
    });

    map.on("click", function (data, event, these) {
        country = data.properties.name;
        these.style("stroke", "none");
        this.style("stroke", "#424242")
            .style("stroke-width", "2px");
        disasterType = null;
        bar.style("fill", "rgba(0,0,0,0)");
        filteredData = filterParsedData(startYear, endYear, disasterType,
                                        country);
        bar.updateGraph(toBarData(filteredData));
        line.updateGraph(toLineData(filteredData, startYear, endYear),
                         startYear);
        map.update(computeChoroplethHue(
            filterParsedData(startYear, endYear, disasterType)));
        console.log(startYear, endYear, disasterType, country);
    });
    map.on("mousemove", function (d) {
        if (!filteredData[d.properties.name]) {
            return;
        }
        let html = "";
        // Country name
        html += "<div class=\"tooltip_key\">";
        html += d.properties.name;
        html += "</div>";
        html += "<span class=\"tooltip_key\">";
        html += "Total Deaths: ";
        // Total deaths
        html += "<span class=\"tooltip_value\">";
        html += (filteredData[d.properties.name] !== null
            ? get(filteredData, d.properties.name, "Total deaths")
            : 0);
        html += "</span><br>";
        // Total damage
        html += "<span class=\"tooltip_key\">";
        html += "Total Damage: ";
        html += "<span class=\"tooltip_value\">";
        html += (filteredData[d.properties.name] !== null
            ? `$${valueFormatShort(get(filteredData,
                                       d.properties.name, "Total damage"))}`
            : 0);
        html += "</span><br>";
        // Total affected
        html += "<span class=\"tooltip_key\">";
        html += "Total Affected: ";
        html += "<span class=\"tooltip_value\">";
        html += (filteredData[d.properties.name] !== null
            ? get(filteredData, d.properties.name, "Total affected")
            : 0);
        html += "</span>";
        html += "</div>";

        d3.select("#tooltip-container").html(html).style("opacity", 1);
        this.attr("fill-opacity", 0.75);

        d3.select("#tooltip-container")
          .style("top", `${d3.event.y + 15  }px`)
          .style("left", `${d3.event.x + 15  }px`)
          .style("display", "block");
    });
    map.on("mouseout", function (d) {
        this.attr("fill-opacity", 1);
        d3.select("#tooltip-container").style("display", "none");
    });
}

d3.json("/data/world-topo-min.json", (err, worldVector) =>
    d3.csv("data/disaster_data.csv")
      .get(parsedData => err
          ? console.error(err)
          : main(worldVector, Object.freeze(processData(parsedData)))));
