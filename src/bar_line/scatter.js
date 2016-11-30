var margin = {top: 30, right: 20, bottom: 30, left: 50},
    width = 800 - margin.left - margin.right,
    height = 400 - margin.top - margin.bottom;

var svg = d3.select("body")
    .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
    .append("g")
        .attr("transform",
              "translate(" + margin.left + "," + margin.top + ")");

var parseTime = d3.time.format("%d-%b-%y").parse;


var y = d3.scale.linear().range([height, 0]),
    x = d3.time.scale().range([0, width]),
    yAxis = d3.svg.axis().scale(y).orient("left"),
    xAxis = d3.svg.axis().scale(x).orient("bottom")

var valueline = d3.svg.line()
    .x(function(d) {
        return x(d.date);
    })
    .y(function(d) {
        return y(d.humidity);
    });



var maxY;

d3.csv("data.csv", function(error, data) {
    data.forEach(function(d) {
        d.date = parseTime(d.date)
        d.humidity = +d.humidity
        d.temperature = +d.temperature
        d.pressure = +d.pressure
        d.gas = +d.gas
        console.log(d.date);
    });

    function sortByDateAscending(a, b) {
        // Dates will be cast to numbers automagically:
        return a.date - b.date;
    }

    data = data.sort(sortByDateAscending);

y.domain([0, d3.max(data, function(d) { return d.humidity; })]);
x.domain(d3.extent(data, function(d) { return d.date; }));


// Add the valueline path.
var path = svg.append("path")
    .attr("class", "line")
    .attr("d", valueline(data));
//
var totalLength = path.node().getTotalLength();

path
  .attr("stroke-dasharray", totalLength + " " + totalLength)
  .attr("stroke-dashoffset", totalLength)
  .transition()
    .duration(500)
    .ease("linear")
    .attr("stroke-dashoffset", 0);

    svg.selectAll("dot")
        .data(data)
      .enter().append("circle")
        .attr("r", 3.5)
        .attr("stroke", "#0d73a3")
        .attr("fill", "#0d73a3")
        .attr("opacity", 1)
        .attr("cx", function(d) { return x(d.date); })
        .attr("cy", function(d) { return y(d.humidity); });
//
//
// Add the X Axis
svg.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + height + ")")
    .call(xAxis);


// Add the Y Axis
svg.append("g")
    .attr("class", "y axis")
    .call(yAxis);

    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - margin.left)
        .attr("x",0 - (height / 2))
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .text("Humidity(%)")
        .style("font-size", '14px');
//
//
//
// var prevMeasure = "humidity"
//
// d3.select("#update_pack")
//   .append("button")
//   .attr("class", "ml2")
//   .on("click", function() {
//       var measure = document.getElementById('type_filter').value;
//       console.log(measure)
//
//       if (measure != prevMeasure) {
//           d3.csv("data.csv", function(error, data) {
//               data.forEach(function(d) {
//                   d.date = parseTime(d.date)
//                   d.humidity = +d.humidity
//                   d.temperature = +d.temperature
//                   d.pressure = +d.pressure
//                   d.gas = +d.gas
//                   console.log(d.date);
//               })});
//
//               function sortByDateAscending(a, b) {
//                   // Dates will be cast to numbers automagically:
//                   return a.date - b.date;
//               }
//
//               data = data.sort(sortByDateAscending);
//               x.domain(d3.extent(data, function(d) { return d.date; }));
//
//
//
//           path
//             .transition()
//             .duration(400)
//             .ease("linear")
//             .attr("stroke-dashoffset", totalLength);
//         svg.selectAll("circle").remove();
//
//             if (measure == "temperature") {
//
//                 y.domain([0, d3.max(data, function(d) {
//                     return d.temperature;
//                 })]);
//
//                 svg.select("g.y.axis")
//                     .append("text")
//                         .text("Temperature")
//
//
//
//
//
//                 //  svg.append("text")
//                 //      .attr("transform", "rotate(-90)")
//                 //      .attr("y", 0 - margin.left)
//                 //      .attr("x",0 - (height / 2))
//                 //      .attr("dy", "1em")
//                 //      .style("text-anchor", "middle")
//                 //      .text("Temperature(C)");
//
//                  svg.selectAll("dot")
//                      .data(data)
//                    .enter().append("circle")
//                      .attr("r", 3.5)
//                      .attr("stroke", "#0d73a3")
//                      .attr("fill", "#0d73a3")
//                      .attr("cx", function(d) { return x(d.date); })
//                      .attr("cy", function(d) { return y(d.temperature); });
//                      valueline = d3.svg.line()
//                          .x(function(d) {
//                              return x(d.date);
//                          })
//                          .y(function(d) {
//                              return y(d.temperature);
//                          });
//
//
//               path = svg.append("path")
//                   .attr("class", "line")
//                   .attr("stroke", "red")
//                   .attr("d", valueline(data));
//
//               totalLength = path.node().getTotalLength();
//
//               path
//                 .attr("stroke-dasharray", totalLength + " " + totalLength)
//                 .attr("stroke-dashoffset", totalLength)
//                 .transition()
//                   .duration(500)
//                   .ease("linear")
//                   .attr("stroke-dashoffset", 0);
//
//
//             } else if (measure == "humidity") {
//                 y.domain([0, d3.max(data, function(d) {
//                     return d.humidity;
//                 })]);
//                 svg.selectAll("g.y.axis")
//                  .call(yAxis)
//
//                  svg.selectAll("dot")
//                      .data(data)
//                    .enter().append("circle")
//                      .attr("r", 3.5)
//                      .attr("stroke", "#0d73a3")
//                      .attr("fill", "#0d73a3")
//                      .attr("cx", function(d) { return x(d.date); })
//                      .attr("cy", function(d) { return y(d.humidity); });
//
//
//                   valueline = d3.svg.line()
//                       .x(function(d) {
//                           return x(d.date);
//                       })
//                       .y(function(d) {
//                           return y(d.humidity);
//                       });
//
//
//               path = svg.append("path")
//                   .attr("class", "line")
//                   // .attr("stroke", "red")
//                   .attr("d", valueline(data));
//
//               totalLength = path.node().getTotalLength();
//
//               path
//                 .attr("stroke", "red")
//                 .attr("stroke-dasharray", totalLength + " " + totalLength)
//                 .attr("stroke-dashoffset", totalLength)
//                 .transition()
//                   .duration(500)
//                   .ease("linear")
//                   .attr("stroke-dashoffset", 0);
//             } else if (measure == "pressure") {
//                 y.domain([0, d3.max(data, function(d) {
//                     return d.pressure;
//                 })]);
//                 svg.selectAll("g.y.axis")
//                  .call(yAxis)
//
//                  svg.selectAll("dot")
//                      .data(data)
//                    .enter().append("circle")
//                      .attr("r", 3.5)
//                      .attr("stroke", "#0d73a3")
//                      .attr("fill", "#0d73a3")
//                      .attr("cx", function(d) { return x(d.date); })
//                      .attr("cy", function(d) { return y(d.pressure); });
//
//                      valueline = d3.svg.line()
//                          .x(function(d) {
//                              return x(d.date);
//                          })
//                          .y(function(d) {
//                              return y(d.pressure);
//                          });
//
//
//               path = svg.append("path")
//                   .attr("class", "line")
//                   .attr("d", valueline(data));
//
//               totalLength = path.node().getTotalLength();
//
//               path
//                 .attr("stroke-dasharray", totalLength + " " + totalLength)
//                 .attr("stroke-dashoffset", totalLength)
//                 .transition()
//                   .duration(500)
//                   .ease("linear")
//                   .attr("stroke-dashoffset", 0);
//             } else if (measure == "gas") {
//                 y.domain([0, d3.max(data, function(d) {
//                     return d.gas;
//                 })]);
//                 svg.selectAll("g .y.axis")
//                  .call(yAxis)
//
//                  svg.selectAll("dot")
//                      .data(data)
//                    .enter().append("circle")
//                      .attr("r", 3.5)
//                      .attr("stroke", "#0d73a3")
//                      .attr("fill", "#0d73a3")
//                      .attr("cx", function(d) { return x(d.date); })
//                      .attr("cy", function(d) { return y(d.gas); });
//
//                      valueline = d3.svg.line()
//                          .x(function(d) {
//                              return x(d.date);
//                          })
//                          .y(function(d) {
//                              return y(d.gas);
//                          });
//
//
//               path = svg.append("path")
//                   .attr("class", "line")
//                   .attr("d", valueline(data));
//
//               totalLength = path.node().getTotalLength();
//
//               path
//                 .attr("stroke-dasharray", totalLength + " " + totalLength)
//                 .attr("stroke-dashoffset", totalLength)
//                 .transition()
//                   .duration(500)
//                   .ease("linear")
//                   .attr("stroke-dashoffset", 0);
//             }
//       }
//
//
//
//       prevMeasure = measure;
//   })
//   .text("Filter")
});

// function filter_selection() {
//
//
//     //update axis
//     if (measure == "temperature") {
//         var path = svg.append("path")
//             .attr("class", "line")
//             .attr("d", valueline(data));
//
//         var totalLength = path.node().getTotalLength();
//
//         path
//         .transition()
//         .duration(2000)
//         .ease("linear")
//         .attr("stroke-dashoffset", totalLength);
//     }
//     //update values
//
// }
