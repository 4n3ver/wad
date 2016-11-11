/* @flow */
"use strict";

// tell webpack to copy static html and css to build folder
require.context("../public/", true,
                /^\.\/.*\.(html|css|csv|json|tsv|png|jpeg|jpg)/);

import * as d3 from "d3";
import WorldMap from "./map";

d3.select("#main").text("Hello, World!");
d3.json("/data/world-topo-min.json", (err, worldVector) => {
    d3.csv("data/disaster_data.csv")
      .get(parsedData => {
          parsedData = processData(parsedData);
          // console.log(parsedData);
          const map = new WorldMap(worldVector);
          map.on("mousemove", function(d) {
            var html = "";

            html += "<div class=\"tooltip_kv\">";
            html += "<span class=\"tooltip_key\">";
            html += d.properties.name;
            html += "</span>";
            html += "<span class=\"tooltip_value\">";
            //html += (valueHash[d.properties.name] ? valueFormat(valueHash[d.properties.name]) : "");
            html += "";
            html += "</span>";
            html += "</div>";

            d3.select("#tooltip-container").html(html).style("opacity",1);
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
            //   var tooltip_width = d3.select("#tooltip-container").width();
            //   d3.select("#tooltip-container")
            //     .style("top", (d3.event.layerY + 15) + "px")
            //     .style("left", (d3.event.layerX - tooltip_width - 30) + "px");
            // }
          });
          map.on("mouseout", function(d) {
            d3.select(this).attr("fill-opacity", 1);
            d3.select("#tooltip-container").style("display", "none");
          });
          map.style("fill", d => "#000");
      });
});

function processData(rawData) {
  var jsonObject = {};
  rawData.forEach(row => {
    jsonObject[row["Country Name"]] = jsonObject[row["Country Name"]] || {countryName: row["Country Name"], population: {}, disaster: {}};
    jsonObject[row["Country Name"]].disaster[row["Year"]] = jsonObject[row["Country Name"]].disaster[row["Year"]] || {};
    jsonObject[row["Country Name"]].disaster[row["Year"]][row["Disaster Type"]] = {};
    Object.keys(row).forEach(key => {
      if (parseInt(key) + "" != "NaN") {
        jsonObject[row["Country Name"]].population[key] = parseInt(row[key]);
      } else {
        if (parseInt(row["Country Name"][key]) + "" != "NaN") {
          jsonObject[row["Country Name"]].disaster[row["Year"]][row["Disaster Type"]][key] = parseInt(row[key]);
        } else {
          jsonObject[row["Country Name"]].disaster[row["Year"]][row["Disaster Type"]][key] = row[key];
        }
      }
    });
  });
  //console.log(JSON.stringify(jsonObject));
  return jsonObject;
}
