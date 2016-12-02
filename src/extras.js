/* @flow */
"use strict";

import { select } from "d3";
import Chart from "chart.js";

/**
 * Initialize time slider.
 *
 * @returns {object!} time slider
 */
export const initSlider = (target = "body") => {
    select(target).append("div").attr("id", "slider")
                  .style("margin", "10px 100px 30px");
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
        .append("div").attr("class", "ui right floated input")
        .append("select")
        .attr("class", "ui compact selection dropdown");

    dropdown.append("option").attr("value", "affected")
            .text("Number of People Affected");
    dropdown.append("option").attr("value", "damage")
            .text("Total Damage ($)");
    dropdown.append("option").attr("value", "death")
            .text("Total Death");
    return dropdown;
};

export const drawLineGraph = (lineData, startYear = 1960,
                              target = "body") => {
    select(target).append("canvas")
                  .attr("width", 1635)
                  .attr("height", 200)
                  .style("margin", "0 100px 0 auto")
                  .attr("id", "line-chart");
    const line = new Chart(
        document.getElementById("line-chart"),
        {
            type   : "line",
            data   : {
                labels  : lineData.map((c, i) => startYear + i),
                datasets: [
                    {
                        fill                     : false,
                        lineTension              : 0.1,
                        backgroundColor          : "rgba(216, 60, 97,0.4)",
                        borderColor              : "rgba(216, 60, 97,1)",
                        borderCapStyle           : "butt",
                        borderDash               : [],
                        borderDashOffset         : 0.0,
                        borderJoinStyle          : "miter",
                        pointBorderColor         : "rgba(216, 60, 97,1)",
                        pointBackgroundColor     : "#fff",
                        pointBorderWidth         : 1,
                        pointHoverRadius         : 5,
                        pointHoverBackgroundColor: "rgba(216, 60, 97,1)",
                        pointHoverBorderColor    : "rgba(220,220,220,1)",
                        pointHoverBorderWidth    : 2,
                        pointRadius              : 1,
                        pointHitRadius           : 10,
                        data                     : lineData,
                        spanGaps                 : false
                    }
                ]
            },
            options: {
                maintainAspectRatio: false,
                responsive         : false,
                scales             : {
                    yAxes: [
                        {
                            gridLines : {display: false},
                            scaleLabel: {
                                display    : true,
                                labelString: "frequency",
                                fontSize   : 3,
                                fontFamily : "Droid Sans"
                            },
                            ticks     : {
                                autoSkip     : true,
                                maxTicksLimit: 5,
                                maxRotation  : 0,
                                padding: 1,
                                fontColor: "#B0BEC5"
                            }
                        }
                    ],
                    xAxes: [
                        {
                            gridLines : {display: false},
                            scaleLabel: {
                                fontSize   : 3,
                                fontFamily : "Droid Sans"
                            },
                            ticks     : {
                                autoSkip     : true,
                                maxTicksLimit: 12,
                                maxRotation  : 0,
                                padding: 1,
                                fontColor: "#B0BEC5"
                            }
                        }
                    ]
                },
                title              : {display: false},
                legend             : {display: false}
            }
        }
    );
    line.updateGraph = function (lineData, startYear) {
        line.data.datasets[0].data = lineData;
        line.data.labels = lineData.map((c, i) => startYear + i);
        line.update(1000);
    };
    return line;
};
