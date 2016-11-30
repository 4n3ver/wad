/**
 * @author Yoel Ivan (yivan3@gatech.edu)
 * @version 0.0a
 * @flow
 */

"use strict";

import * as d3 from "d3";
import { merge } from "lodash";

const defaultOptions = {
    target: d3.select("body"),
    width : 480,
    height: 500,
    margin: {
        top   : 30,
        right : 30,
        bottom: 80,
        left  : 50
    }
};

class BarChart {
    constructor(barData, label, opts) {
        this._setOptions(opts);

        this.colorScale = d3.scaleOrdinal(d3.schemeCategory10);
        this.xScale = d3.scaleBand()
                         .range([0, this.width])
                         .padding(.2);
        this.yScale = d3.scaleLinear()
                         .range([this.height, 0]);

        const svg = this.target.append("svg")
                        .attr("width", this.width + this.margin.left
                              + this.margin.right)
                        .attr("height", this.height + this.margin.top
                              + this.margin.bottom);
        this.xAxis = svg.append("g")
                         .attr("transform",
                               `translate(${this.margin.left}, ${this.height
                               + this.margin.top})`);
        this.yAxis = svg.append("g")
                         .attr("transform",
                               `translate(${this.margin.left}, ${this.margin.top})`);
        this.barGraph = svg.append("g")
                            .attr("class", "barGraph")
                            .attr("transform",
                                  `translate(${this.margin.left}, ${this.margin.top})`);
        this._label = Object.assign({}, label);
        Object.freeze(this);    // prevent this object to be modified

        this.updateGraph(barData);
    }

    _setOptions(opts) {
        merge(this, defaultOptions, opts);
        this.height -= this.margin.top + this.margin.bottom;
        this.width -= this.margin.left + this.margin.right;
    }

    updateGraph(bardata) {
        // prevent transition to be interrupted half-way through
        const uniqueID = `${Math.random()}`;

        this.xScale.domain(bardata.map(this._label.x));
        this.yScale.domain([0, d3.max(bardata, this._label.y)]);
        const joinedBarGraph = this.barGraph.selectAll(".bar")
                                       .data(bardata, this._label.x);
        const oldRects = joinedBarGraph.selectAll("g.bar rect");
        joinedBarGraph.exit()
                      .transition(uniqueID)
                      .duration(300)
                      .attr("y", this.yScale(0))
                      .attr("height", this.height - this.yScale(0))
                      .style("fill-opacity", 1e-6)
                      .remove();
        const bars = joinedBarGraph.enter()
                                   .append("g")
                                   .attr("class", "bar");
        const newRects = bars.append("rect")
                             .style("fill", d => this.colorScale(this._label.y(d)))
                             .attr("height", () => 0)
                             .attr("y", this.height)
                             .attr("width", this.xScale.bandwidth())
                             .attr("x", d => this.xScale(this._label.x(d)));
        newRects.transition(uniqueID)
                .delay((d, i) => i * 20)
                .duration(2000)
                .attr("height", d => this.height - this.yScale(this._label.y(d)))
                .attr("y", d => this.yScale(this._label.y(d)))
                .ease(d3.easeElastic);
        oldRects.transition(uniqueID)
                .delay((d, i) => i * 20)
                .duration(1000)
                .attr("height", d => this.height - this.yScale(this._label.y(d)))
                .attr("y", d => this.yScale(this._label.y(d)))
                .attr("width", this.xScale.bandwidth())
                .attr("x", d => this.xScale(this._label.x(d)));
        this.xAxis.transition(uniqueID)
             .duration(300)
             .call(d3.axisBottom(this.xScale))
             .selectAll("g g.tick > text")
             .attr("text-anchor", "end")
             .attr("transform", "rotate(-20) translate(0, 0)");
        this.yAxis.transition(uniqueID)
             .duration(300)
             .call(d3.axisLeft(this.yScale));
    }
}

export default BarChart;

//const highlightRect = criteria => {
//    // prevent transition to be interrupted half-way through
//    const uniqueID = `${Math.random()}`;
//
//    const rects = svg.selectAll("rect");
//    rects.filter(d => !criteria(d))
//         .transition(uniqueID)
//         .duration(2000)
//         .style("fill", d => colorScale(_label.y(d)));
//    rects.filter(d => criteria(d))
//         .transition(uniqueID)
//         .duration(2000)
//         .style("fill", "#000");
//};

