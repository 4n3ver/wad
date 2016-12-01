/* @flow */
"use strict";

import {select} from "d3";

/**
 * Initialize time slider.
 *
 * @returns {object!} time slider
 */
export const initSlider = (target = "#main") => {
    select(target).append("div").attr("id", "slider")
      .style("margin", "20px 100px");
    const slider = document.getElementById("slider");

    noUiSlider.create(slider, {
        start  : [1960, 2015],
        step   : 1,
        connect: true,
        range  : {
            "min": 1960,
            "max": 2015
        },
        pips   : {
            mode   : "count",
            density: 2,
            values : 11,
            stepped: true
        }
    });
    return slider;
};

export const initDropDown = (target = "#main") => {
    const dropdown = select(target)
                       .append("div").attr("class", "ui fluid input")
                       .append("select")
                       .attr("class", "ui compact selection dropdown");

    dropdown.append("option").attr("value", "damage")
            .text("Total Damage ($)");
    dropdown.append("option").attr("value", "death")
            .text("Total Death");
    dropdown.append("option").attr("value", "affected")
            .text("Number of People Affected");
    return dropdown;
};
