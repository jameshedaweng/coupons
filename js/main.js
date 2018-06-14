var squareChartSize = {
  width: 300,
  height: 300
};

var colorTheme = ["#EF5350", "#AB47BC", "#7E57C2", "#7986CB", "#64B5F6", "#4DD0E1", "#81C784", "#DCE775"];

d3.json('../data/coupons.json', function (error, data) {
  function displayTypePieChart(data){
    var couponsByType = _.map(_.mapValues(_.groupBy(data, 'promotion_type'), function(v) { return v.length; }), (value, type) => ({type, value}));
    drawPieChart(couponsByType, "#pie-chart-type-container");
  }

  function displayShopPieChart(data){
    var couponsByShop = _.map(_.mapValues(_.groupBy(data, 'webshop_id'), function(v) { return v.length; }), (value, type) => ({type, value}));
    drawPieChart(couponsByShop, "#pie-chart-shop-container");
  }

  function displayStackChart(sortedDataByDate, stackKey, element){
    var countedCouponsByDate = new Array();
    _.forOwn(_.groupBy(sortedDataByDate, 'date'), function(value, key){
      var currentDateCounted = _.mapValues(_.groupBy(value, stackKey), function(v) { return v.length; });
      currentDateCounted.date = key;
      countedCouponsByDate.push(currentDateCounted);
    })
    drawStackChart(countedCouponsByDate, element);
  }

  function drawPieChart(sortedData, element){
    var text = "";
    var width = squareChartSize.width;
    var height = squareChartSize.height;
    var ringWidth = 45;
    var radius = squareChartSize.width / 2;

    var color = d3.scaleOrdinal(colorTheme);

    var svg = d3.select(element)
      .append('svg')
      .attr('class', 'pie')
      .attr('width', width)
      .attr('height', height);

    var g = svg.append('g')
      .attr('transform', 'translate(' + (width/2) + ',' + (height/2) + ')');

    var arc = d3.arc()
      .innerRadius(radius - ringWidth)
      .outerRadius(radius);

    var pie = d3.pie()
      .value(function(d) { return d.value; })
      .sort(null);

    var path = g.selectAll('path')
      .data(pie(sortedData))
      .enter()
      .append("g")
      .on("mouseover", function(d) {
          let g = d3.select(this)
            .style("cursor", "pointer")
            .style("fill", "white")
            .append("g")
            .attr("class", "text-group");     
          g.append("text")
            .attr("class", "name-text")
            .text(formatText(d.data.type))
            .attr('text-anchor', 'middle')
            .attr('dy', '-1.2em')
            .style('font-size', '14px')
            .style('font-weight', '600')
            .style('text-transform', 'uppercase');      
          g.append("text")
            .attr("class", "value-text")
            .text(`${d.data.value}`)
            .attr('text-anchor', 'middle')
            .attr('dy', '.6em')
            .style('font-size', '36px')
            .style('font-weight', '700');
      })
      .on("mouseout", function(d) {
          d3.select(this)
            .style("cursor", "none")  
            .style("fill", color(this._current))
            .select(".text-group").remove();
      })
      .append('path')
      .attr('d', arc)
      .attr('fill', (d,i) => color(i))
      .on("mouseover", function(d) {
          d3.select(this)     
            .style("cursor", "pointer")
            .style("fill", "white");
        })
      .on("mouseout", function(d) {
          d3.select(this)
            .style("cursor", "none")  
            .style("fill", color(this._current));
        })
      .each(function(d, i) { this._current = i; });

    g.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '.35em')
      .text(text);
  }

  function drawStackChart(data, element){
    var svg = d3.select(element)
      .append("svg")
      .attr("width", 800)
      .attr("height", 300),
      margin = {
        top: 20,
        right: 20,
        bottom: 30,
        left: 30
      },
      width = 800,
      height = 300,
      g = svg.append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
      var x = d3.scaleBand()
        .rangeRound([0, width])
        .paddingInner(0.05)
        .align(0.1);

      var y = d3.scaleLinear()
        .rangeRound([height, 0]);

      var z = d3.scaleOrdinal()
        .range(colorTheme);

      var keys = [];
      for (key in data[0]){
        if (key != "date")
          keys.push(key);
      }
      data.forEach(function(d){
        d.total = 0;
        keys.forEach(function(k){
          d.total += d[k];
        })
      });

      data.sort(function(a, b) {
        return b.total - a.total;
      });

      x.domain(data.map(function(d) {
        return d.date;
      }));

      y.domain([0, d3.max(data, function(d) {
        return d.total;
      })]).nice();

      z.domain(keys);

      g.append("g")
        .selectAll("g")
        .data(d3.stack().keys(keys)(data))
        .enter().append("g")
        .attr("fill", function(d) {
          return z(d.key);
        })
        .selectAll("rect")
        .data(function(d) {
          return d;
        })
        .enter().append("rect")
        .attr("x", function(d) {
          return x(d.data.date);
        })
        .attr("y", function(d) {
          return y(d[1]);
        })
        .attr("height", function(d) {
          return y(d[0]) - y(d[1]);
        })
        .attr("width", x.bandwidth());

      g.append("g")
        .attr("class", "axis")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x));

      g.append("g")
        .attr("class", "axis")
        .call(d3.axisLeft(y).ticks(null, "s"));

      var legend = g.append("g")
        .attr("font-family", "sans-serif")
        .attr("font-size", 10)
        .attr("text-anchor", "end")
        .selectAll("g")
        .data(keys.slice())
        .enter().append("g")
        .attr("transform", function(d, i) {
          return "translate(0," + i * 20 + ")";
        });

      legend.append("rect")
        .attr("x", width - 150)
        .attr("width", 19)
        .attr("height", 19)
        .attr("fill", z);

      legend.append("text")
        .attr("x", width - 200)
        .attr("y", 9.5)
        .attr("dy", "0.32em")
        .text(function(d) {
          return d;
        });
  }

  function drawTable(data) {
    let sortAscending = true;
    let table = d3.select('#table-container').append('table');
    let titles = d3.keys(data[0]);
    let headers = table.append('thead').append('tr')
      .selectAll('th')
      .data(titles).enter()
      .append('th')
      .text(function (d) {
        return d;
      })
      .on('click', function (d) {
        headers.attr('class', 'header');
        if (sortAscending) {
          rows.sort(function(a, b) { return b[d] < a[d]; });
          sortAscending = false;
          this.className = 'aes';
        } else {
          rows.sort(function(a, b) { return b[d] > a[d]; });
          sortAscending = true;
          this.className = 'des';
        }
      });
    let rows = table.append('tbody').selectAll('tr')
      .data(data).enter()
      .append('tr');
    rows.selectAll('td')
      .data(function (d) {
        return titles.map(function (k) {
          return { 'value': d[k], 'name': k};
        });
      }).enter()
      .append('td')
      .text(function (d) {
        return d.value;
      });
  }

  function formatText(text) {
    if (text == "null"){
      return "other";
    } else {
      return text.split('-').join(' ');
    }
  }

  function getDateRange(start, end) {
    var dateArray = new Array();
    var currentDate = new Date(start);
    while (currentDate <= end) {
      dateArray.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    return dateArray;
  }

  function sortCouponsByDate(data) {
    var sortedData = data.map(function(item){
      item.dateRange = getDateRange(new Date(item.first_seen), new Date(item.last_seen));
      return item;
    })
    var sortedDataByDate = new Array();
    sortedData.forEach(function(item){
      item.dateRange.forEach(function(date){
        var couponByDate = {
          coupon_id: item.coupon_id,
          webshop_id: item.webshop_id,
          promotion_type: item.promotion_type,
          date: date
        }
        sortedDataByDate.push(couponByDate);
      })
    });

    displayStackChart(sortedDataByDate, 'webshop_id', '#stack-chart-shop-container');
    displayStackChart(sortedDataByDate, 'promotion_type', '#stack-chart-type-container');
  }
  displayTypePieChart(data.coupons);
  displayShopPieChart(data.coupons);
  drawTable(data.coupons);
  sortCouponsByDate(data.coupons);
});