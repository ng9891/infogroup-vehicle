'use strict';
(async () => {
  window.chart = {
    size: 0,
    marker: dc_leaflet.markerChart('#map'),
    pie: dc.pieChart('#pie'),
    quarterChart: dc.pieChart('#quarter-chart'),
    dayOfTheWeekChart: dc.rowChart('#day-of-week-chart'),
    dataTable: dc.dataTable('#datatable'),
    monthBarChart: dc.barChart('#monthly-chart'),
    barYearChart: dc.rowChart('#barYearChart'),
  };

  let data = await d3.csv('../dataset/data-1576381744223.csv');
  for (let est of data) {
    est.geopoint = JSON.parse(est.geopoint);
    est.twoDigit = parseInt(`${est.NAICSCD}`.slice(0, 2) || 'NULL');
    est.id = +est.id;
    est.datetime = new Date(est.date);
    est.month = est.datetime.getMonth();
    est.year = est.datetime.getFullYear();
    est.geo = [est.geopoint.coordinates[1], est.geopoint.coordinates[0]];
  }
  window.xf = crossfilter(data);
  window.all = xf.groupAll();
  loadEstablishments(xf);

  function loadEstablishments(xf) {
    let idDim = xf.dimension(function(d) {
      return d.id;
    });
    let idGroup = idDim.group().reduce(
      function(p, v) {
        // add
        p.id = v.id;
        p.twoDigit = v.twoDigit;
        p.CONAME = v.CONAME;
        p.geo = v.geo;
        p.COUNTY = v.COUNTY;
        p.PRMSTATE = v.PRMSTATE;
        p.ALEMPSZ = v.ALEMPSZ;
        p.NAICSCD = v.NAICSCD;
        p.NAICSDS = v.NAICSDS;
        p.date = v.date;
        p.value += 1;
        return p;
      },
      function(p, v) {
        // remove
        p.value -= 1;
        return p;
      },
      function() {
        // init
        return {value: 0};
      }
    );
    let twoDigitDim = xf.dimension((d) => {
      return d.twoDigit;
    });
    let twoDigitGroup = twoDigitDim.group().reduceCount();

    let dateDim = xf.dimension((d) => {
      return d.datetime;
    });
    // Summarize volume by quarter
    let quarterDim = xf.dimension((d) => {
      let month = d.datetime.getMonth();
      if (month <= 2) {
        return 'Q1';
      } else if (month > 2 && month <= 5) {
        return 'Q2';
      } else if (month > 5 && month <= 8) {
        return 'Q3';
      } else {
        return 'Q4';
      }
    });
    let quarterGroup = quarterDim.group().reduceCount((d) => {
      return d.id;
    });

    // Counts per weekday
    let dayOfWeek = xf.dimension((d) => {
      let day = d.datetime.getDay();
      let name = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      return day + '.' + name[day];
    });
    var dayOfWeekGroup = dayOfWeek.group();

    var monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    let monthDim = xf.dimension((d) => {
      let month = d.datetime.getMonth();
      return monthNames[month];
      // return d.month;
    });
    let monthGroup = monthDim.group();

    let yearDim = xf.dimension((d) => {
      return d.year;
    });
    let yearGroup = yearDim.group();
    

    loadMap(idDim, idGroup);
    loadPieNAICS(twoDigitDim, twoDigitGroup);
    loadPieQuarter(quarterDim, quarterGroup);
    loadBarDayWeek(dayOfWeek, dayOfWeekGroup);
    loadDatatable(dateDim);
    loadMonthlyChart(monthDim, monthGroup);
    loadBarYear(yearDim,yearGroup)
    dc.renderAll();
  }

  function loadMap(est, estGroup) {
    // let estGroup = est.group();
    chart.marker
      .dimension(est)
      .group(estGroup)
      .controlsUseVisibility(true)
      .valueAccessor((d) => {
        return d.value.value;
      })
      .locationAccessor((d) => {
        return d.value.geo;
      })
      .center([40.755, -74.0])
      .zoom(10)
      .clusterOptions({spiderfyOnMaxZoom: true, disableClusteringAtZoom: 19})
      .cluster(true)
      .icon((d, map) => {
        let employmentScale = d3.scaleLinear().domain([1, 999]).range([7, 15]);
        let circleRadius = d.value.ALEMPSZ ? employmentScale(+d.value.ALEMPSZ) : 7;
        circleRadius = circleRadius.toFixed(2);
        let color = naicsKeys[d.value.twoDigit] ? naicsKeys[d.value.twoDigit].color : 'black';
        return L.divIcon({
          className: 'current-location-icon',
          html: `
        <div id="${encodeURIComponent(d.value.CONAME)}" 
          class = "NAICS" 
              style="
                width:${circleRadius}px;
                height:${circleRadius}px;
                background-color:${color};
                border-radius:500px;"
            ></div>`,
          iconAnchor: [0, 0],
          iconSize: null,
          popupAnchor: [0, 0],
          id: encodeURIComponent(d.value.CONAME),
        });
      })
      .popup((d, map) => {
        let html = `
          <b>Company : ${d.value.CONAME}</b><br>
          County : ${d.value.COUNTY}, ${d.value.PRMSTATE}<br>
          Actual_Emp_Size : ${d.value.ALEMPSZ ? d.value.ALEMPSZ.toLocaleString() : ''}<br>
          NAICS_Code :  ${d.value.NAICSCD}<br>
          NAICS_Desc : ${d.value.NAICSDS}<br>
          COUNT : ${d.value.value}, NAICS:${d.value.twoDigit}, DATE:${d.value.date}
        `;
        return html;
      })
      .renderPopup(true);
  }

  function loadPieNAICS(twoDigitDim, twoDigitGroup) {
    chart.pie
      .dimension(twoDigitDim)
      .group(twoDigitGroup)
      .controlsUseVisibility(true)
      .valueAccessor((d) => {
        return d.value;
      })
      .colorCalculator((d) => {
        return naicsKeys[d.key] ? naicsKeys[d.key].color : 'black';
      })
      .renderLabel(true)
      .label(function(d) {
        if (chart.pie.hasFilter() && !chart.pie.hasFilter(d.key)) {
          return d.key + '(0%)';
        }
        let label = d.key;
        if (all.value()) {
          label += ' (' + Math.floor(d.value / all.value() * 100) + '%)';
        }
        return label;
      })
      .ordering((d) => {
        return -d.value;
      });
  }

  function loadPieQuarter(quarter, quarterGroup) {
    chart.quarterChart.dimension(quarter).group(quarterGroup).controlsUseVisibility(true);
  }

  function loadBarDayWeek(dayOfWeek, dayOfWeekGroup) {
    chart.dayOfTheWeekChart
      .group(dayOfWeekGroup)
      .dimension(dayOfWeek)
      .controlsUseVisibility(true)
      // Assign colors to each value in the x scale domain
      .ordinalColors(['#3182bd', '#6baed6', '#9ecae1', '#c6dbef', '#dadaeb'])
      .label((d)=> {
        return d.key.split('.')[1];
      })
      // Title sets the row text
      .title(function(d) {
        return d.value;
      })
      .elasticX(true)
      .xAxis()
      .ticks(4);
  }

  function loadDatatable(dateDim) {
    let columns = [
      {
        label: 'ID',
        format: function(d) {
          return d.id;
        },
      },
      {
        label: 'Name',
        format: function(d) {
          return d.CONAME;
        },
      },
      {
        label: 'Date',
        format: function(d) {
          return d.date;
        },
      },
      {
        label: 'County',
        format: function(d) {
          return d.COUNTY;
        },
      },
      {
        label: 'NAICSCD',
        format: function(d) {
          return d.NAICSCD;
        },
      },
      {
        label: 'NAICSDS',
        format: function(d) {
          return d.NAICSDS;
        },
      },
    ];
    chart.dataTable
      .dimension(dateDim)
      .section((d) => {
        let format = d3.format('02d');
        return d.datetime.getFullYear() + '/' + format(d.datetime.getMonth() + 1);
      })
      .size(Infinity)
      .showSections(true)
      .columns(columns)
      .sortBy((d) => {
        return d.datetime;
      })
      .on('renderlet', function(table) {
        table.selectAll('.dc-table-group').classed('info', true);
      })
      .on('preRender', updateResult)
      .on('preRedraw', updateResult)
      .on('pretransition', displayResult);
  }

  function loadMonthlyChart(monthDim, monthGroup) {
    // console.log(monthDim.filter(2));
    console.log(all.value());
    console.log(monthGroup.all());
    var monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    chart.monthBarChart
      .dimension(monthDim)
      .group(monthGroup)
      .controlsUseVisibility(true)
      .margins({
        top:    Math.round(chart.monthBarChart.height() * 0.02, 1),
        right:  Math.round(chart.monthBarChart.width() * 0.04, 1),
        bottom: Math.round(chart.monthBarChart.height() * 0.10, 1),
        left:   Math.round(chart.monthBarChart.width() * 0.06, 1)
      })
      .barPadding(0.04)
      .title((d) => { return d.key +': '+ d.value.toLocaleString(); })
      .x(d3.scaleOrdinal().domain(monthNames))
      .xUnits(dc.units.ordinal)
      .elasticY(true);
  }

  function loadBarYear(yearDim, yearGroup) {
    chart.barYearChart
      .group(yearGroup)
      .dimension(yearDim)
      .controlsUseVisibility(true)
      .label((d)=> {
        return d.key
      })
      // Title sets the row text
      .title(function(d) {
        return d.value;
      })
      .elasticX(true)
      .xAxis()
      .ticks(4);
  }
})();
