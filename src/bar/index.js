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
 * each bar
 *
 * @callback eachDataCallBack
 * @param {any}             data bound to a bar
 * @param {string} event    name of the event
 * @param {object} these    selector to all bars
 */

const defaultOptions = {
    target: d3.select("body"),
    width : 600,
    height: 600,
    margin: {
        top   : 5,
        right : 125,
        bottom: 30,
        left  : 135
    }
};

class BarChart {
    /**
     * Draw a bar chart
     * opts.target should be CSS selector
     * any number is in px
     *
     * @param {any!}    barData array of data to be plotted
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

        this.colorScale = () => "#d83c61";
        const _svg = this.target.append("svg")
                         .attr("width", this.width + this.margin.left
                               + this.margin.right)
                         .attr("height", this.height + this.margin.top
                               + this.margin.bottom);
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
                         .padding(.5);
        this._label = Object.assign({}, label || {
                                        x: d => d,
                                        y: d => d
                                    });
        this._observer = {};
        Object.freeze(this);    // prevent this object to be modified

        this._yScale.domain(barData.map(this._label.y));
        this.update(barData);
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
     * Update the barchart with the a new data set.
     *
     * @param bardata   new data set
     * @param label
     */
    update(bardata, label) {
        // prevent transition to be interrupted half-way through
        const uniqueID = `${Math.random()}`;

        // join old data with updated data
        const joinedBars = this._barGraph.selectAll("rect.bar")
                               .data(bardata);
        const joinedText = this._barGraph.selectAll("text.bar-value")
                               .data(bardata);
        const joinedHighlight = this._barGraph.selectAll("rect.bar-highlight")
                                    .data(bardata);

        // Remove non-existing data
        joinedBars.exit().transition(uniqueID)
                  .duration(300)
                  .attr("width", this._xScale(0))
                  .style("fill-opacity", 1e-6)
                  .remove();
        joinedText.exit().transition(uniqueID)
                  .duration(300)
                  .style("opacity", 1e-6)
                  .remove();
        joinedHighlight.exit().remove();

        if (label) {
            this._label.x = label.x;
            this._label.y = label.y;
        }

        // update axis scale
        this._xScale.domain([0, d3.max(bardata, this._label.x)]);

        // create new element for new data
        joinedHighlight.enter()
                       .append("rect")
                       .attr("class", "bar-highlight")
                       .style("fill", "rgba(0,0,0,0)")
                       .style("stroke-width", ".1px")
                       .attr("width",
                             this.width + this.margin.left + this.margin.right)
                       .attr("y", d => this._yScale(this._label.y(d))
                       - this._yScale.bandwidth() / 2)
                       .attr("height", this._yScale.bandwidth() * 2)
                       .attr("x", -this.margin.left);
        const newBars = joinedBars.enter()
                                  .append("rect")
                                  .attr("id", d => this._label.y(d))
                                  .attr("class", "bar")
                                  .style("fill",
                                         d => this.colorScale(
                                             this._label.y(d)))
                                  .attr("width", this._xScale(0))
                                  .attr("y",
                                        d => this._yScale(this._label.y(d)))
                                  .attr("height", this._yScale.bandwidth())
                                  .attr("x", this._xScale(0));
        const newText = joinedText.enter()
                                  .append("text")
                                  .attr("class", "bar-value")
                                  .style("opacity", 0)
                                  .attr("alignment-baseline", "central")
                                  .attr("x", this._xScale(0))
                                  .attr("y",
                                        d => this._yScale(this._label.y(d))
                                        + this._yScale.bandwidth() / 2)
                                  .text(
                                      d => valueFormatShort(this._label.x(d)));

        // set listener to each newBar
        Object.keys(this._observer)
              .forEach(event => {
                  const callback = this._observer[event];
                  newBars.on(event, function (data) {
                      callback.call(d3.select(this), data, d3.event, newBars);
                  });
              });

        // animate new elements
        newBars.transition(uniqueID)
               .delay((d, i) => i * 20)
               .duration(2000)
               .attr("width", d => this._xScale(this._label.x(d)))
               .ease(d3.easeElastic);
        newText.transition(uniqueID)
               .delay((d, i) => i * 20)
               .duration(2000)
               .attr("x", d => this._xScale(this._label.x(d)) + 5)
               .style("opacity", 1);

        // resize the old element with existing data
        joinedBars.transition(uniqueID)
                  .delay((d, i) => i * 20)
                  .duration(1000)
                  .attr("width", d => this._xScale(this._label.x(d)))
                  .attr("height", this._yScale.bandwidth())
                  .attr("y", d => this._yScale(this._label.y(d)));
        joinedText.transition(uniqueID)
                  .delay((d, i) => i * 20)
                  .duration(1000)
                  .attr("x", d => this._xScale(this._label.x(d)) + 5)
                  .attr("y", d => this._yScale(this._label.y(d))
                  + this._yScale.bandwidth() / 2)
                  .text(d => valueFormatShort(this._label.x(d)));
        joinedHighlight.attr("height", this._yScale.bandwidth() * 2)
                       .attr("y", d => this._yScale(this._label.y(d))
                       - this._yScale.bandwidth() / 2);
        this._yAxis.transition(uniqueID)
            .duration(2000)
            .call(d3.axisLeft(this._yScale)
                    .tickSize(0));

        joinedHighlight.each(function () {
            return this.parentNode.appendChild(this);
        });
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
        const allRects = this._barGraph.selectAll("rect.bar-highlight");
        allRects.on(event, function (data) {
            cb.call(d3.select(this), data, d3.event, allRects);
        });
    }

    /**
     * Change the style of each bar into the return value of the specified
     * callback.
     *
     * @param {string} key name of the style to modify
     * @param {eachDataCallBack} cb new value for the specified style
     */
    style(key, cb) {
        this._barGraph.selectAll("rect.bar-highlight").style(key, cb);
    }
}

export default BarChart;
