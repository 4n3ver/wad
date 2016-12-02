/**
 * @author Yoel Ivan (yivan3@gatech.edu)
 * @version 0.0a
 * @flow
 */

"use strict";

import * as d3 from "d3";
import * as topojson from "topojson";
import { merge } from "lodash";

/**
 * This callback type is called `eachDataCallBack` and will be called for
 * each bar
 *
 * @callback eachDataCallBack
 * @param {{
 *  id: number,
 *  properties: {
 *      name    : string,
 *      color   : string
 *  }
 * }} data  data bound to a country
 * @param {string} event    name of the event
 * @param {object} these    selector to all countries
 */

const defaultOptions = {
    target: d3.select("body"),
    width : 1000,
    height: 1000,
    margin: {
        top   : 10,
        right : 30,
        bottom: 10,
        left  : 10
    }
};

class WorldMap {
    /**
     * Draw a world map.
     * opts.target should be CSS selector
     * any number is in px
     *
     * @param {any!} worldVector data describing the map to be drawn
     * @param {{
     *  target: string
     *  width : number,
     *  height: number,
     *  margin: {
     *      top   : number,
     *      right : number,
     *      bottom: number,
     *      left  : number
     *  }
     * }=} opts user specified options
     * @constructor
     */
    constructor(worldVector, opts) {
        this._setOptions(opts);

        const projection = d3.geoMercator()
                             .scale((this.width + 1) / 2 / Math.PI)
                             .translate([this.width / 2, this.height / 2])
                             .precision(.1);

        const path = d3.geoPath().projection(projection);

        const graticule = d3.geoGraticule();

        const svg = this.target.append("div")
                        .style("padding", "0")
                        .style("margin",
                               `${this.margin.top}px ${this.margin.right}px ${this.margin.bottom}px ${this.margin.left}px`)
                        .style("display", "inline-block")
                        .append("svg")
                        .attr("width", this.width)
                        .attr("height", this.height * 2.2 / 3);

        svg.append("path").datum(graticule)
           .attr("class", "graticule")
           .attr("d", path);

        svg.append("path").datum(graticule)
           .attr("class", "choropleth")
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

        const countriesFeature = topojson.feature(
            worldVector,
            worldVector.objects.countries
        ).features;

        this._countries = g.selectAll(".countries").data(countriesFeature)
                           .enter().insert("path");

        this._countries.attr("class", "countries")
            .attr("d", path)
            .attr("id", d => d.id)
            .attr("title", d => d.properties.name);

        Object.freeze(this);    // prevent this object to be modified
    }

    /**
     * Helper function to merge default options and user specified options
     *
     * @param {{
     *  target: string
     *  width : number,
     *  height: number,
     *  margin: {
     *      top   : number,
     *      right : number,
     *      bottom: number,
     *      left  : number
     *  }
     * }=} opts user specified options
     * @private
     */
    _setOptions(opts) {
        if (opts.target) {
            opts.target = d3.select(opts.target);
        }
        merge(this, defaultOptions, opts);
        this.height -= this.margin.top + this.margin.bottom;
        this.width -= this.margin.left + this.margin.right;
    }

    /**
     * Set an event listener for each country on the map for the specified type
     * of event.
     *
     * @param {string} event
     * @param {eachDataCallBack} cb
     */
    on(event, cb) {
        const these = this._countries;
        this._countries.on(event, function (data) {
            cb.call(d3.select(this), data, d3.event, these);
        });
    }

    /**
     * Change the style of each country into the return value of the specified
     * callback.
     *
     * @param {string} key name of the style to modify
     * @param {eachDataCallBack} cb new value for the specified style
     */
    style(key, cb) {
        this._countries.style(key, cb);
    }

    /**
     * Update the hue of the map with the given color generating function
     *
     * @param fn
     */
    update(fn) {
        // prevent transition to be interrupted half-way through
        const uniqueID = `${Math.random()}`;
        this._countries.transition(uniqueID)
            .delay((d, i) => i * 8).duration(300)
            .style("fill", fn);
    }
}

export default WorldMap;
