/**
 * @author Yoel Ivan (yivan3@gatech.edu)
 * @version 0.0a
 * @flow
 */

"use strict";

import * as d3 from "d3";
import { merge } from "lodash";
import { valueFormatShort } from "../util";

/**
 * This callback type is called `eachDataCallBack` and will be called for
 * each country
 *
 * @callback eachDataCallBack
 * @param {{
 *  id: number,
 *  properties: {
 *      name    : string,
 *      color   : string
 *  }
 * }} data                  data bound to a bar
 * @param {string} event    name of the event
 * @param {object} these    selector to all bars
 */

const defaultOptions = {
    target: d3.select("body"),
    width : 500,
    height: 600,
    margin: {
        top   : 30,
        right : 30,
        bottom: 30,
        left  : 150
    }
};

class BarChart {
    /**
     * Draw a bar chart
     * opts.target should be CSS selector
     * any number is in px
     *
     * @param {any!}    barData data describing the map to be drawn
     * @param {{
     *      x: Function,
     *      y: Function
     * }!} label        accessor function for x-axis and y-axis data
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
     * }=} opts         user specified
     * @constructor
     */
    constructor(barData, label, opts) {
        this._setOptions(opts);

        this.colorScale = d3.scaleOrdinal(d3.schemeCategory10);
        const _svg = this.target.append("svg")
                         .attr("width", this.width + this.margin.left
                               + this.margin.right)
                         .attr("height", this.height + this.margin.top
                               + this.margin.bottom);
        this._xAxis = _svg.append("g")
                          .attr("transform",
                                `translate(${this.margin.left}, ${this.height
                                + this.margin.top})`);
        this._yAxis = _svg.append("g")
                          .attr("transform",
                                `translate(${this.margin.left}, ${this.margin.top})`);
        this._barGraph = _svg.append("g")
                             .attr("class", "barGraph")
                             .attr("transform",
                                   `translate(${this.margin.left}, ${this.margin.top})`);
        this._xScale = d3.scaleLinear()
                         .range([0, this.width]);
        this._yScale = d3.scaleBand()
                         .range([0, this.height])
                         .padding(.15);
        this._label = Object.assign({}, label || {
                                        x: d => d,
                                        y: d => d
                                    });
        this._observer = {};
        Object.freeze(this);    // prevent this object to be modified

        this.updateGraph(barData);
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
        merge(this, defaultOptions, opts);
        this.height -= this.margin.top + this.margin.bottom;
        this.width -= this.margin.left + this.margin.right;
    }

    /**
     * Update the barchart with the a new data set.
     *
     * @param bardata   new data set
     * @param label
     */
    updateGraph(bardata, label) {
        // prevent transition to be interrupted half-way through
        const uniqueID = () => `${Math.random()}`;


        if (label) {
            this._label.x = label.x;
            this._label.y = label.y;
        }
        bardata.sort((a, b) => this._label.x(b) - this._label.x(a));
        console.log(bardata.map(this._label.x));
        this._yScale.domain(bardata.map(this._label.y));
        this._xScale.domain([0, d3.max(bardata, this._label.x)]);
        const joinedBarGraph = this._barGraph.selectAll(".bar")
                                   .data(bardata);
        const oldRects = joinedBarGraph.selectAll("g.bar rect");
        joinedBarGraph.exit()
                      .transition(uniqueID())
                      .duration(300)
                      .attr("width", this._xScale(0))
                      .style("fill-opacity", 1e-6)
                      .remove();
        const bars = joinedBarGraph.enter()
                                   .append("g")
                                   .attr("class", "bar");
        const newRects = bars.append("rect")
                             .style("fill",
                                    d => this.colorScale(this._label.y(d)))
                             .attr("width", this._xScale(0))
                             .attr("y", d => this._yScale(this._label.y(d)))
                             .attr("height", this._yScale.bandwidth())
                             .attr("x", this._xScale(0));
        Object.keys(this._observer)
              .forEach(event => {
                  const callback = this._observer[event];
                  newRects.on(event, function (data) {
                      callback.call(d3.select(this), data, d3.event, newRects);
                  });
              });
        newRects.transition(uniqueID())
                .delay((d, i) => i * 20)
                .duration(2000)
                .attr("width", d => this._xScale(this._label.x(d)))
                .ease(d3.easeElastic);
        oldRects.transition(uniqueID())
                .delay((d, i) => i * 20)
                .duration(1000)
                .attr("width", d => this._xScale(this._label.x(d)))
                .attr("height", this._yScale.bandwidth())
                .attr("y", d => this._yScale(this._label.y(d)));
        this._xAxis.transition(uniqueID())
            .duration(2000)
            //.ease(d3.easeBackOut)
            .call(d3.axisBottom(this._xScale)
                    .tickFormat(valueFormatShort));
        this._yAxis.transition(uniqueID())
            .duration(2000)
            //.ease(d3.easeBackOut)
            .call(d3.axisLeft(this._yScale)
                    .tickSize(0));
    }

    /**
     * Set an event listener for each bar on the chart for the specified type
     * of event.
     *
     * @param {string} event
     * @param {eachDataCallBack} cb
     */
    on(event, cb) {
        this._observer[event] = cb;
        const allRects = this._barGraph.selectAll("g.bar rect");
        allRects.on(event, function (data) {
            cb.call(d3.select(this), data, d3.event, allRects);
        });
    }
}

export default BarChart;
