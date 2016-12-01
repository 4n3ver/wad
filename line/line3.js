d3.json("disaster_data.json", function(error, data){
    const valuesOf = obj => Object.keys(obj).map(k => obj[k])
    const countries = valuesOf(data)
    var labels = [];
    for (year in countries[0].population) {
        labels.push(year)
    }

    /**
     * Calculates total occurences for every year for a country
     * This function is immutable (does not modify the original object).
     *
     * @param {string!} countryName name of the country
     * @returns {array!} array of occurences 
     */

    function getOccurences(countryName) {

        const years = Object.keys(data[countryName].disaster);
        var yearOccur = [];
        var total = years.length * 2;

        var values = [];
        years.forEach(e => {
            const disasters = Object.keys(data[countryName].disaster[e]);

            disasters.forEach(f => {
                const value = parseInt(data[countryName].disaster[e][f]["Occurrence"]);
                values.push(value);

            })
        })
        for (i = 0; i < total; i++) {
            if (i % 2 == 0) {
                yearOccur[i] = years[i/2];
            } else if (i%2 != 0) {
                yearOccur[i] = values[(i-1)/2];
            }
        }
        var data3 = [];

        var pushed = false;
        for (i = 0; i < labels.length; i++) {
            for (j  = 0; j < yearOccur.length; j+=2) {
                if (labels[i] == yearOccur[j]) {
                    data3.push(parseInt(yearOccur[j+1]));
                    pushed = true;
                }
            }
            if (pushed == false) {
                data3.push(0);
            }
            pushed = false;

        }
        return data3;
    }

    var data4 = getOccurences("Bermuda");

    const CHART = document.getElementById("lineChart");
    console.log(CHART);

    let lineChart = new Chart(CHART, {
        type: 'line',
        data: {
        labels: labels,
        datasets: [
            {
                label: "Occurence",
                fill: false,
                lineTension: 0.1,
                backgroundColor: "rgba(75,192,192,0.4)",
                borderColor: "rgba(75,192,192,1)",
                borderCapStyle: 'butt',
                borderDash: [],
                borderDashOffset: 0.0,
                borderJoinStyle: 'miter',
                pointBorderColor: "rgba(75,192,192,1)",
                pointBackgroundColor: "#fff",
                pointBorderWidth: 1,
                pointHoverRadius: 5,
                pointHoverBackgroundColor: "rgba(75,192,192,1)",
                pointHoverBorderColor: "rgba(220,220,220,1)",
                pointHoverBorderWidth: 2,
                pointRadius: 1,
                pointHitRadius: 10,
                // data: data,
                data: data4,
                spanGaps: false,
            }
        ]
    },
    options: {
        maintainAspectRatio: true,
        responsive:false,
        scales: {
            yAxes: [{
                scaleLabel: {
                    display: true,
                    labelString: 'Frequency',
                    fontSize: 14
                }
            }],
            xAxes: [{
                scaleLabel: {
                    display: true,
                    labelString: 'Year',
                    fontSize: 14,
                },
                ticks: {
                    autoSkip: true,
                    maxTicksLimit: 11
                }
            }]
        },
        title: {
            display:true,
            text: 'Occurences',
            fontSize: 20
        }
    }
    })
})
