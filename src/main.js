const projection = d3.geoAlbersUsa().scale(1280).translate([480, 300])
let us;
const yearRange = [1972, 2022];
const yearRangeSlider = document.getElementById("yearRangeSlide");
let currentYear=yearRangeSlider.value;
let plotType = document.getElementById("plotType").value

/**
 *
 *
 */
function getBaseMap() {
    return d3.json("https://cdn.jsdelivr.net/npm/us-atlas@1/us/10m.json")
        .then((data)=>{
            us = data
            const svg = d3.create("svg")
                .attr("viewBox", [0, 0, 960, 600]);

            svg.append("path")
                .datum(topojson.merge(us, us.objects.states.geometries))
                .attr("fill", "#ddd")
                .attr("d", d3.geoPath());

            svg.append("path")
                .datum(topojson.mesh(us, us.objects.states, (a, b) => a !== b))
                .attr('fill','none')
                .attr("stroke", "white")
                .attr("stroke-linejoin", "round")
                .attr("d", d3.geoPath())


            svg.append("g")
                .attr("fill", "none")
                .attr("stroke", "black");

            return svg.node();
        })
}

function changeCurrentYear(year) {
    currentYear = year
}


div1 = document.getElementById("plot1")
let baseMap
let cachedDetailData={}
getBaseMap().then((svg)=>{
    baseMap = svg;
    div1.appendChild(baseMap);
})

function getFatalityPathByYear(year) {
  console.log(`stormdata/StormEvents_fatalities-ftp_v1.0_d${year}.csv.gz`)
  return `stormdata/StormEvents_fatalities-ftp_v1.0_d${year}.csv`
}

function getDetailPathByYear(year) {
  console.log(`stormdata/StormEvents_details-ftp_v1.0_d${year}.csv.gz`)
  return `stormdata/StormEvents_details-ftp_v1.0_d${year}.csv`
}

function getLocationPathByYear(year) {
  console.log(`stormdata/StormEvents_locations-ftp_v1.0_d${year}.csv.gz`)
  return `stormdata/StormEvents_locations-ftp_v1.0_d${year}.csv`
}

/**
 * unused
 * @param year
 */
function drawStormDots(year) {
  d3.csv(getLocationPathByYear(year)).then( (data) => {
      if(baseMap===undefined) {
          console.log("drawStormDots waiting for base map")
          let clrId = setTimeout(()=>{drawStormDots(year)},1000)
          clearTimeout(clrId)
      }

      let tLocFiltered = data.map(d => d = {
          xy: projection([parseFloat(d.LONGITUDE), parseFloat(d.LATITUDE)]),
          name: d.LOCATION,
          EPISODE_ID: d.EPISODE_ID
      })
          .filter(d => d.xy != null).sort((a, b) => a.EPISODE_ID - b.EPISODE_ID)

      const svg = d3.select(baseMap)

      svg.selectAll('circle').remove();


      svg.append('g')
          .selectAll('circle')
          .data(tLocFiltered)
          .enter()
          .append("circle")
          .attr('cx',d=>d.xy[0])
          .attr('cy',d=>d.xy[1])
          .attr('r',0)
          .attr('fill','blue')
          .attr("epid",d=>d.EPISODE_ID)
          .attr("eid",d=>d.EVENT_ID)

      svg.selectAll("circle")
          .transition()
          .duration(80)
          .attr("r", 1)
          // .delay((d,i) => { return i*1})
          .delay(5)




      svg.selectAll('circle')
          .on('mouseover', function (d,i) {
              d3.select(this)
                  .attr('fill','red')
                  .attr('r',5)
              d3.select('#tooltip')
                  .style('left', (event.pageX + 10) + 'px')
                  .style('top', (event.pageY - 25) + 'px')
                  .style('display', 'inline-block')
                  .attr('text',d=>d.LOCATION)
                  .html(d=>d.LOCATION)

          })
          .on('mouseout', function () {
              d3.select(this)
                  .attr('fill','blue')
                  .attr('r',1)
              d3.select('#tooltip').style('display', 'none')
          })

      let lastEpid = 0;
      svg.selectAll("circle")
          .on("click", function(d,i) {
              d3.selectAll("circle[epid='"+lastEpid+"']")
                  .attr("fill","blue").attr("r",1)
              lastEpid = this.getAttribute("epid")
              d3.selectAll("circle[epid='"+lastEpid+"']")
                  .attr("fill","red").attr("r",3)
                  .raise()

          })



  })
}


function getData(year){
    cachedDetailData.promise = d3.csv(getDetailPathByYear(year)).then((data)=> {
        let tDetFiltered = data.map(
            d => d = {
                xy: projection(
                    [(parseFloat(d.BEGIN_LON) + parseFloat(d.END_LON)) / 2,
                        (parseFloat(d.BEGIN_LAT) + parseFloat(d.BEGIN_LAT)) / 2]),
                LOCATION: d.BEGIN_LOCATION,
                EPISODE_ID: d.EPISODE_ID,
                EVENT_ID: d.EVENT_ID,
                TYPE: d.EVENT_TYPE,
                DAMAGE_PROPERTY: parseFloat(d.DAMAGE_PROPERTY),
                DAMAGE_CROPS: parseFloat(d.DAMAGE_CROPS),
            })
            .filter(d => d.xy != null)
            .sort((a, b) => parseInt(a.EVENT_ID) - parseInt(b.EVENT_ID))

        cachedDetailData.year = year
        return tDetFiltered;
    })

    // return d
}



const stormType = [ "Flood", "Flash Flood","Marine Thunderstorm Wind",
    "Thunderstorm Wind", "Tornado", "Hail", "Heavy Rain",
    "Waterspout", "Marine High Wind", "Marine Strong Wind", "Debris Flow",
    "Marine Hail", "Lightning", "Funnel Cloud", "Dust Devil"]
const palette = ["#8a3ffc", '#8a3ffc',"#33b1ff", "#007d79",
    "#ff7eb6", "#fa4d56", "#fff1f1", "#6fdc8c",
    "#4589ff", "#d12771", "#d2a106", "#08bdba",
    "#bae6ff", "#ba4e00", "#d4bbff"]
const stormTypeColor = d3.scaleOrdinal(stormType,palette)

function drawSwathes(){
    const svg = d3.create("svg")
        .attr("viewBox", [0, 0, 960, 150]);

    svg.append("g")
        .selectAll("rect")
        .data(stormType)
        .enter()
        .append("rect")
        .attr("x", (d,i)=>i*50+100)
        .attr("y", 20)
        .attr("width", 20)
        .attr("height", 20)
        .attr("fill",d=>stormTypeColor(d))
        .attr("TYPE",d=>d)

    svg.append("g")
        .selectAll("text")
        .data(stormType)
        .enter()
        .append("text")
        .attr("x", (d,i)=>i*50+100)
        .attr("y", 65)
        .text(d=>d)
        .attr('transform', (d,i)=>
            'translate( '+((i)*5+35)+' , '+((-i)*21-45)+'),'+ 'rotate(25)')
    return svg.node()
}

function drawStormDetailDots(year) {
    if(cachedDetailData.year !== year){getData(year)}
    cachedDetailData.promise.then((data) => {
        // console.log(data)
        if (baseMap === undefined) {
            console.log("drawStormDetailDots waiting for base map")
            let clrId = setTimeout(() => {
                drawStormDetailDots(year)
            }, 1000)
            clearTimeout(clrId)
            console.log("drawStormDetailDots done waiting")
        }



        const svg = d3.select(baseMap)

        svg.selectAll('circle').remove();


        svg.append('g')
            .selectAll('circle')
            .data(data)
            .enter()
            .append("circle")
            .attr('cx',d=>d.xy[0])
            .attr('cy',d=>d.xy[1])
            .attr('r',0)
            .attr('fill',d=>stormTypeColor(d["TYPE"]))
            .attr("epid",d=>d.EPISODE_ID)
            .attr("eid",d=>d.EVENT_ID)
            .attr("type",d=>d.TYPE)

        svg.selectAll("circle")
            .transition()
            .duration(800)
            .attr("r",1)
            .delay((d,i) => { return i*1})
            // .delay((d,i) => { return 5})



        svg.selectAll('circle')
            .on('pointerover', function (d,i) {
                d3.select(this)
                    .attr('fill','red')
                    .attr('r',5)
                d3.select('#tooltip')
                    .style('left', (event.pageX + 10) + 'px')
                    .style('top', (event.pageY - 25) + 'px')
                    .style('display', 'inline-block')
                    .attr('text',d=>d.LOCATION)
                    .html(d=>d.LOCATION)

            })
            .on('pointerout', function () {
                d3.select(this)
                    .attr('fill','blue')
                    .attr('r',1)
                d3.select('#tooltip').style('display', 'none')
            })

        let lastEpid = 0;
        svg.selectAll("circle")
            .on("click", function(d,i) {
                d3.selectAll("circle[epid='"+lastEpid+"']")
                    .attr("r",1)
                    .attr("stroke","none")
                lastEpid = this.getAttribute("epid")
                d3.selectAll("circle[epid='"+lastEpid+"']")
                    .attr("r",3)
                    .attr("stroke","black")
                    .raise()

            })


        div2 = document.getElementById("swatch")
        div2.innerHTML=""
        div2.appendChild(drawSwathes())
        const swatch = d3.select("#swatch")
        swatch.selectAll("rect")
            .on("pointerover", function(event,data) {
                d3.select(this)
                    .attr("stroke","black")
                    .attr("height",25)
                    .attr("width",25)
                svg.selectAll("circle[type='"+data+"']")
                    .attr("r",3)
                    .attr("stroke","black")
                    .raise()
            })
            .on("pointerout", function(event,data) {
                d3.select(this)
                    .attr("stroke","none")
                    .attr("height",20)
                    .attr("width",20)
                svg.selectAll("circle[type='"+data+"']")
                    .attr("r",1)
                    .attr("stroke","none")
            })
    })
}

function plotStackedBarChart(year) {
    if(cachedDetailData===undefined || cachedDetailData.year!==year || baseMap===undefined) {
        let clrId = setTimeout(() => {
            plotStackedBarChart(year)
        }, 500)
        clearTimeout(clrId)
    }

    
        


}

function plotHexBinMap(year) {

    if(cachedDetailData===undefined || cachedDetailData.year!==year) {getData(year)}
    cachedDetailData.promise.then((data) => {

        const svg = d3.select(baseMap)
        svg.selectAll("circle")
            .transition()
            .duration(200)
            .remove()

        svg.selectAll("path")
            .remove()

        svg.append("path")
            .datum(topojson.merge(us, us.objects.states.geometries))
            .attr("fill", "#ddd")
            .attr("d", d3.geoPath());

        svg.append("path")
            .datum(topojson.mesh(us, us.objects.states, (a, b) => a !== b))
            .attr('fill','none')
            .attr("stroke", "white")
            .attr("stroke-linejoin", "round")
            .attr("d", d3.geoPath())

        svg.append("g")
            .attr("fill", "none")
            .attr("stroke", "black");

        const hexbin = d3.hexbin()
            .extent([0, 0], [960, 600])
            .radius(18)
            .x(d => d.xy[0])
            .y(d => d.xy[1])

        const bins = hexbin(data)
            .map(d => (d.DAMAGE_PROP = d3.sum(d,d=>d.DAMAGE_PROPERTY),d))
            .map(d => (d.DAMAGE_CROPS = d3.sum(d,d=>d.DAMAGE_CROPS),d))
        // console.log(bins.map(d=>d.DAMAGE_CROPS))

        const colorHex = d3.scaleSequentialLog([1,500], d3.interpolateBlues);
        const radius = d3.scaleSqrt([d3.min(bins,d=>d.DAMAGE_PROP), d3.max(bins, d => d.DAMAGE_PROP)], [0, hexbin.radius() * Math.SQRT2]);

        svg.append("g")
            .selectAll("path")
            .data(bins)
            .join("path")
            .attr("transform", d => `translate(${d.x},${d.y})`)
            .attr("d", d => hexbin.hexagon(radius(d.DAMAGE_PROP)))
            .attr("fill", d => colorHex(d.DAMAGE_CROPS+1))
            .attr("stroke", d => d3.lab(colorHex(d.DAMAGE_CROPS+1)).darker())
            .append("title")

        const swatch = d3.select("#swatch")
        swatch.selectAll("*")
            .remove()
        swatch.append("g")
            .attr("transform", "translate(600,20)")
            .append(() => Legend(d3.scaleSequentialLog([1, 500], d3.interpolateBlues), {
                title: "Crops Damage, K$",
                width: 260,
                tickFormat: ".0s",
                ticks: 5
            }));


    })
}

function changePlotType(type) {
    plotType = type
    plotGen()
}
function plotGen() {
    switch (plotType) {
        case "dots":
            drawStormDetailDots(currentYear)
            break;
        case "damage":
            plotHexBinMap(currentYear)
            break;
        default:
            drawStormDetailDots(currentYear)
            break;
    }
}

plotGen()

//-----------------helper------------------///
function legend({color, ...options}) {
    return Legend(color, options);
}
// Copyright 2021, Observable Inc.
// Released under the ISC license.
// https://observablehq.com/@d3/color-legend
function Legend(color, {
    title,
    tickSize = 6,
    width = 320,
    height = 44 + tickSize,
    marginTop = 18,
    marginRight = 0,
    marginBottom = 16 + tickSize,
    marginLeft = 0,
    ticks = width / 64,
    tickFormat,
    tickValues
} = {}) {

    function ramp(color, n = 256) {
        const canvas = document.createElement("canvas");
        canvas.width = n;
        canvas.height = 1;
        const context = canvas.getContext("2d");
        for (let i = 0; i < n; ++i) {
            context.fillStyle = color(i / (n - 1));
            context.fillRect(i, 0, 1, 1);
        }
        return canvas;
    }

    const svg = d3.create("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("viewBox", [0, 0, width, height])
        .style("overflow", "visible")
        .style("display", "block");

    let tickAdjust = g => g.selectAll(".tick line").attr("y1", marginTop + marginBottom - height);
    let x;

    // Continuous
    if (color.interpolate) {
        const n = Math.min(color.domain().length, color.range().length);

        x = color.copy().rangeRound(d3.quantize(d3.interpolate(marginLeft, width - marginRight), n));

        svg.append("image")
            .attr("x", marginLeft)
            .attr("y", marginTop)
            .attr("width", width - marginLeft - marginRight)
            .attr("height", height - marginTop - marginBottom)
            .attr("preserveAspectRatio", "none")
            .attr("xlink:href", ramp(color.copy().domain(d3.quantize(d3.interpolate(0, 1), n))).toDataURL());
    }

    // Sequential
    else if (color.interpolator) {
        x = Object.assign(color.copy()
                .interpolator(d3.interpolateRound(marginLeft, width - marginRight)),
            {range() { return [marginLeft, width - marginRight]; }});

        svg.append("image")
            .attr("x", marginLeft)
            .attr("y", marginTop)
            .attr("width", width - marginLeft - marginRight)
            .attr("height", height - marginTop - marginBottom)
            .attr("preserveAspectRatio", "none")
            .attr("xlink:href", ramp(color.interpolator()).toDataURL());

        // scaleSequentialQuantile doesn’t implement ticks or tickFormat.
        if (!x.ticks) {
            if (tickValues === undefined) {
                const n = Math.round(ticks + 1);
                tickValues = d3.range(n).map(i => d3.quantile(color.domain(), i / (n - 1)));
            }
            if (typeof tickFormat !== "function") {
                tickFormat = d3.format(tickFormat === undefined ? ",f" : tickFormat);
            }
        }
    }

    // Threshold
    else if (color.invertExtent) {
        const thresholds
            = color.thresholds ? color.thresholds() // scaleQuantize
            : color.quantiles ? color.quantiles() // scaleQuantile
                : color.domain(); // scaleThreshold

        const thresholdFormat
            = tickFormat === undefined ? d => d
            : typeof tickFormat === "string" ? d3.format(tickFormat)
                : tickFormat;

        x = d3.scaleLinear()
            .domain([-1, color.range().length - 1])
            .rangeRound([marginLeft, width - marginRight]);

        svg.append("g")
            .selectAll("rect")
            .data(color.range())
            .join("rect")
            .attr("x", (d, i) => x(i - 1))
            .attr("y", marginTop)
            .attr("width", (d, i) => x(i) - x(i - 1))
            .attr("height", height - marginTop - marginBottom)
            .attr("fill", d => d);

        tickValues = d3.range(thresholds.length);
        tickFormat = i => thresholdFormat(thresholds[i], i);
    }

    // Ordinal
    else {
        x = d3.scaleBand()
            .domain(color.domain())
            .rangeRound([marginLeft, width - marginRight]);

        svg.append("g")
            .selectAll("rect")
            .data(color.domain())
            .join("rect")
            .attr("x", x)
            .attr("y", marginTop)
            .attr("width", Math.max(0, x.bandwidth() - 1))
            .attr("height", height - marginTop - marginBottom)
            .attr("fill", color);

        tickAdjust = () => {};
    }

    svg.append("g")
        .attr("transform", `translate(0,${height - marginBottom})`)
        .call(d3.axisBottom(x)
            .ticks(ticks, typeof tickFormat === "string" ? tickFormat : undefined)
            .tickFormat(typeof tickFormat === "function" ? tickFormat : undefined)
            .tickSize(tickSize)
            .tickValues(tickValues))
        .call(tickAdjust)
        .call(g => g.select(".domain").remove())
        .call(g => g.append("text")
            .attr("x", marginLeft)
            .attr("y", marginTop + marginBottom - height - 6)
            .attr("fill", "currentColor")
            .attr("text-anchor", "start")
            .attr("font-weight", "bold")
            .attr("class", "title")
            .text(title));

    return svg.node();
}