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
      .row(rawData => {

      })
      .get(parsedData => {
          console.log(parsedData);
          const map = new WorldMap(worldVector);
          map.on("mousemove", d => console.log(d.properties.name));
          map.style("fill", d => "#ccc");
      });
});
