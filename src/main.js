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
          map.on("mousemove", d => console.log(d.properties.name));
          map.style("fill", d => "#ccc");
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
  console.log(JSON.stringify(jsonObject));
  return jsonObject;
}