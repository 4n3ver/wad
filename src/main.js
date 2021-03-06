/**
 * Place where everything is put together...
 *
 * @author Marvin Cangciano (mcangciano3@gatech.edu)
 * @author Marissa D'Souza (mdsouza8@gatech.edu)
 * @author Yoel Ivan (yivan3@gatech.edu)
 * @author Felly Rusli (frusli6@gatech.edu)
 * @version 0.0a
 * @flow
 */

"use strict";

// tell webpack to copy static html and css to build folder
require.context("../public/", true,
                /^\.\/.*\.(html|css|csv|js|json|tsv|png|jpeg|jpg)/);

import { json, csv, select } from "d3";
import { pickBy, mapValues } from "lodash";
import WorldMap from "./map";
import BarChart from "./bar";
import { valueFormatShort, valuesOf } from "./util";
import {
    processData,
    maxRatio,
    computeRatio,
    toBarData,
    toLineData,
    getTotal as get,
    filterByDisasterType,
    filterByTime,
    filterByCountries
} from "./data";
import {
    drawDisasterTypeDropdown,
    drawTimeSlider,
    drawLineGraph,
    drawChoroplethLegend
} from "./extras";

const selectRed = (max, value) => Math.ceil(Math.sqrt(value / max) * 225);

const computeChoroplethHue = filteredData => {
    const max = maxRatio(filteredData);
    return function (d) {
        if (filteredData[d.properties.name]) {
            const ratio = filteredData[d.properties.name].averageRatio;
            return `rgb(255, ${225 - selectRed(max, ratio)
                }, ${225 - selectRed(max, ratio)})`;
        } else {
            return "#9E9E9E";
        }
    };
};

function main(worldVector, parsedData) {
    let startYear = 1960;
    let endYear = 2015;
    let country = null;
    let disasterType = null;
    let barVariable = "affected";
    let filteredDataBy_Time = parsedData;
    let filteredDataBy_TimeType = parsedData;

    drawChoroplethLegend();
    const dropDown = drawDisasterTypeDropdown("#bar-container");
    const slider = drawTimeSlider("#slider-container");
    const map = new WorldMap(worldVector, {target: "#map-container"});
    const bar = new BarChart(toBarData(filteredDataBy_Time), {
        x: d => d[barVariable],
        y: d => d.type
    }, {target: "#bar-container"});
    const line = drawLineGraph(toLineData(filteredDataBy_Time), startYear,
                               "#line-container");

    document.getElementById("reset").onclick = function () {
        disasterType = null;
        bar.style("fill", "rgba(0,0,0,0)");

        country = null;
        map.style("stroke", () => "none");

        slider.noUiSlider.set([1960, 2015]);
    };

    const updateAllGraph = () => {
        filteredDataBy_TimeType = filterByDisasterType(disasterType)(
            filteredDataBy_Time);
        valuesOf(filteredDataBy_TimeType).forEach(d => delete d.ratio);
        computeRatio(startYear, endYear)(filteredDataBy_TimeType);
        map.update(computeChoroplethHue(filteredDataBy_TimeType));

        const filteredDataBy_TimeCountries = filterByCountries(country)(
            filteredDataBy_Time);
        bar.update(toBarData(filteredDataBy_TimeCountries), {
            x: d => d[barVariable],
            y: d => d.type
        });

        const filteredDataBy_TimeCountriesType = filterByCountries(country)(
            filteredDataBy_TimeType);
        line.update(
            toLineData(filteredDataBy_TimeCountriesType, startYear, endYear),
            startYear);
    };

    bar.style("cursor", "pointer");
    map.style("cursor", "pointer");
    map.style("fill", "rgb(255,225,225)");

    dropDown.on("input", function () {
        barVariable = this.value;

        updateAllGraph();
    });

    slider.noUiSlider.on("update", function ([start, end]) {
        startYear = parseInt(Math.abs(Math.min(start, end)));
        endYear = parseInt(Math.abs(Math.max(start, end)));
        filteredDataBy_Time = filterByTime(startYear, endYear)(parsedData);
        updateAllGraph();
    });

    bar.on("click", function (data, event, these) {
        disasterType = data.type;
        these.style("fill", "rgba(0,0,0,0)");
        this.style("fill", "rgba(207,216,220,.3)");

        updateAllGraph();
    });
    bar.on("mouseenter", function () {
        this.style("stroke", "#424242");
    });
    bar.on("mouseleave", function () {
        this.style("stroke", "none");
    });

    map.on("click", function (data, event, these) {
        country = data.properties.name;
        these.style("stroke", "none");
        this.style("stroke", "#424242")
            .style("stroke-width", "1px");

        updateAllGraph();
    });
    map.on("mousemove", function (d, event) {
        let html = "";
        // Country name
        html += "<div class=\"tooltip_key\">";
        html += d.properties.name;
        html += "</div>";

        if (!filteredDataBy_TimeType[d.properties.name]) { // grey countries
            html += "<span class=\"tooltip_key\">No Data Available</span>";
        } else {
            html += "<span class=\"tooltip_key\">";
            html += "Total Deaths: ";
            // Total deaths
            html += "<span class=\"tooltip_value\">";
            html += (filteredDataBy_TimeType[d.properties.name] !== null
                ? get(filteredDataBy_TimeType, d.properties.name, "Total deaths").toLocaleString()
                : 0);
            html += "</span><br>";
            // Total damage
            html += "<span class=\"tooltip_key\">";
            html += "Total Damage: ";
            html += "<span class=\"tooltip_value\">";
            html += (filteredDataBy_TimeType[d.properties.name] !== null
                ? `$${valueFormatShort(get(filteredDataBy_TimeType,
                                           d.properties.name, "Total damage"))}`
                : 0);
            html += "</span><br>";
            // Total affected
            html += "<span class=\"tooltip_key\">";
            html += "Total Affected: ";
            html += "<span class=\"tooltip_value\">";
            html += (filteredDataBy_TimeType[d.properties.name] !== null
                ? get(filteredDataBy_TimeType, d.properties.name, "Total affected").toLocaleString()
                : 0);
            html += "</span>";
            html += "</div>";
        }

        select("#tooltip-container").html(html).style("opacity", 0.8);
        this.attr("fill-opacity", 0.8);

        select("#tooltip-container")
            .style("top", `${event.y + 15  }px`)
            .style("left", `${event.x + 15  }px`)
            .style("display", "block");
    });
    map.on("mouseout", function () {
        this.attr("fill-opacity", 1);
        select("#tooltip-container").style("display", "none");
    });
}

// read data files
json("/data/world-topo-min.json", (err, worldVector) =>
    json("data/disaster_data.json")
        .get(parsedData => err
            ? console.error(err)
            : main(worldVector, Object.freeze(parsedData))));
