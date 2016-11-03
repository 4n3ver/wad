/* @flow */
"use strict";

import * as d3 from "d3";
import * as topojson from "topojson";
import { merge } from "lodash";

const defaultOptions = {
    width : 960,
    height: 540,
    margin: {
        top   : 30,
        right : 30,
        bottom: 80,
        left  : 50
    }
};

class WorldMap {
    constructor(opts) {
        this.__setOptions(opts);
        const projection = d3.geoMercator()
                             .scale((this.width + 1) / 2 / Math.PI)
                             .translate([this.width / 2, this.height / 2])
                             .precision(.1);
        const path = d3.geoPath().projection(projection);
        const graticule = d3.geoGraticule();
        const svg = d3.select("body").append("svg")
                      .attr("width", this.width + this.margin.left
                            + this.margin.right)
                      .attr("height", this.height + this.margin.top
                            + this.margin.bottom);
        svg.append("path").datum(graticule).attr("class", "graticule")
           .attr("d", path);
        svg.append("path").datum(graticule).attr("class", "choropleth")
           .attr("d", path);
        const g = svg.append("g");
        g.append("path")
         .datum(
             {
                 type       : "LineString",
                 coordinates: [
                     [-180, 0], [-90, 0], [0, 0],
                     [90, 0], [180, 0]
                 ]
             }
         )
         .attr("class", "equator")
         .attr("d", path);
        d3.json("/data/world-topo-min.json", (err, world) => {
            const countries = topojson.feature(
                world,
                world.objects.countries
            ).features;
            const country = g.selectAll(".country").data(countries);
            country.enter().insert("path")
                   .attr("class", "country")
                   .attr("d", path)
                   .attr("id", (d, i) => d.id)
                   .attr("title", d => d.properties.name);
        });
    }

    __setOptions(opts) {
        merge(this, defaultOptions, opts);
        this.height -= this.margin.top + this.margin.bottom;
        this.width -= this.margin.left + this.margin.right;
    }
}

export default WorldMap;
