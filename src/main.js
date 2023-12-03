const projection = d3.geoAlbersUsa().scale(1280).translate([480, 300])
let us;
let currentYear = 2022;
const yearRange = [1972, 2022];
const yearRangeSlider = document.getElementById("yearRangeSlider");


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


            const g = svg.append("g")
                .attr("fill", "none")
                .attr("stroke", "black");

            return svg.node();
        })
}

function changeCurrentYear(year) {
    currentYear = year
}


div1 = document.getElementById("plot1")
let baseMap;
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

function drawStormDots(year) {
  d3.csv(getLocationPathByYear(year)).then( (data) => {
      if(baseMap===undefined) {
          console.log("drawStormDots waiting for base map")
          let clrId = setTimeout(()=>{drawStormDots(year)},1000)
          clearTimeout(clrId)
      }

      let dots = [...data.map(d => projection([parseFloat(d.LONGITUDE), parseFloat(d.LATITUDE)]))].filter(d => d != null)
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
          .attr("r", d => 1)
          // .delay((d,i) => { return i*1})
          .delay((d,i) => { return 5})



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


function drawFatalityDots(year) {
    d3.csv(getFatalityPathByYear(year)).then((data) => {
        if(baseMap===undefined) {
            console.log("drawFatalityDots waiting for base map")
            let clrId = setTimeout(()=>{drawFatalityDots(year)},1000)
            clearTimeout(clrId)
            console.log("drawFatalityDots done waiting")
        }

        const svg = d3.select(baseMap)


        console.log(data)
        svg.exit()
        svg.selectAll('circle')
            .data(data)
            .enter()
            .select(d=>"circle[epid='"+d.EVENT_ID+"']")
            // .select(d=>"circle[epid='"+d.EVENT_ID+"']")
            .attr(d=>'fill','red')
            .attr('r',3)






    })
}

let curData; //for browser debugging
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

div2 = document.getElementById("swatch")
div2.appendChild(drawSwathes())
function drawStormDetailDots(year) {
    d3.csv(getDetailPathByYear(year)).then((data) => {
        if (baseMap === undefined) {
            console.log("drawStormDetailDots waiting for base map")
            let clrId = setTimeout(() => {
                drawStormDetailDots(year)
            }, 1000)
            clearTimeout(clrId)
            console.log("drawStormDetailDots done waiting")
        }

        let tDetFiltered = data.map(
            d => d = {
                xy: projection(
                    [(parseFloat(d.BEGIN_LON) + parseFloat(d.END_LON)) / 2,
                        (parseFloat(d.BEGIN_LAT) + parseFloat(d.BEGIN_LAT)) / 2]),
                LOCATION: d.BEGIN_LOCATION,
                EPISODE_ID: d.EPISODE_ID,
                EVENT_ID: d.EVENT_ID,
                TYPE: d.EVENT_TYPE,
            })
            .filter(d => d.xy != null)
            .sort((a, b) => parseInt(a.EVENT_ID) - parseInt(b.EVENT_ID))

        curData= tDetFiltered;



        const svg = d3.select(baseMap)

        svg.selectAll('circle').remove();


        svg.append('g')
            .selectAll('circle')
            .data(tDetFiltered)
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
            .attr("r", d => 1)
            // .delay((d,i) => { return i*1})
            .delay((d,i) => { return 5})



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
                    .attr("r",1)
                    .attr("stroke","none")
                lastEpid = this.getAttribute("epid")
                d3.selectAll("circle[epid='"+lastEpid+"']")
                    .attr("r",3)
                    .attr("stroke","black")
                    .raise()

            })

        const swatch = d3.select("#swatch")
        swatch.selectAll("rect")
            .on("mouseover", function(event,data) {
                d3.select(this)
                    .attr("stroke","black")
                    .attr("height",25)
                    .attr("width",25)
                svg.selectAll("circle[type='"+data+"']")
                    .attr("r",3)
                    .attr("stroke","black")
                    .raise()
            })
            .on("mouseout", function(event,data) {
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


drawStormDetailDots(2022)
