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

var parseDate = d3.time.format("%Y").parse;


var y = d3.scale.linear().range([height, 0]),
    x = d3.time.scale().range([0, width]),
    yAxis = d3.svg.axis().scale(y).orient("left"),
    xAxis = d3.svg.axis().scale(x).orient("bottom").tickFormat(d3.time.format("%Y"));

var valueline = d3.svg.line()
    .x(function(d) {
        return x(d.year2);
    })
    .y(function(d) {
        return y(d.occurence);
    });



var maxY;

d3.csv("disaster_data.csv", function(error, data) {
    data.forEach(function(d) {
        d.country = d["Country Name"]
        d.year = parseDate(d.year)
        d.disaster_type = d["Disaster Type"]
        d.occurence = +d["Occurrence"]
        d.deaths = +d["Total deaths"]
        d.injured = +d["Injured"]
        d.affected = +d["Affected"]
        d.homeless = +d["Homeless"]
        d.total_affected = +d["Total affected"]
        console.log(d.year)
    });



    // function addOccurences()


    x.domain(d3.extent(data, function (d) { return d.year; }));
    y.domain([0, d3.max(data, function (d) { return d.occurence; })]);

    var path = svg.append("path")
        .attr("class", "line")
        .attr("d", valueline(data));

        var totalLength = path.node().getTotalLength();

        path
          .attr("stroke-dasharray", totalLength + " " + totalLength)
          .attr("stroke-dashoffset", totalLength)
          .transition()
            .duration(500)
            .ease("linear")
            .attr("stroke-dashoffset", 0);
            //
            svg.selectAll("dot")
                .data(data)
              .enter().append("circle")
                .attr("r", 3.5)
                .attr("stroke", "#0d73a3")
                .attr("fill", "#0d73a3")
                .attr("opacity", 1)
                .attr("cx", function(d) { return x(d.year2); })
                .attr("cy", function(d) { return y(d.totaloccur); });

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
        .text("Frequency (# of Occurences)")
        .style("font-size", '14px');

})

// The x-axis of the graph will show the time and the y-axis will indicate the number
// of occurrences of natural disasters.
