/*global graphData */
var width = 720, height = 720;
var minSize = 10;
var maxSize = 50;
var minDistance = 100;
var maxDistance = 900;
// we'll binary search for the correct max distance later
var lowerMaxDistance = 300;
var upperMaxDistance = 1500;
var margin = maxSize;
var rightSidebar = d3.select("#graph")
                   .append("div")
                   .attr("id", "rightSidebar");
var svg = d3.select("#graph")
          .append("svg")
          .attr("width", width)
          .attr("height", height);
var drag = d3.behavior.drag()
           .origin(function(d) { return nodeAttr[d.symbol]; })
           .on("dragstart", dragstarted)
           .on("drag", dragged)
           .on("dragend", dragended);
var layoutSelector = rightSidebar.append("div")
                     .attr("id", "layout-selector");
layoutSelector.append("h2").text("Layouts");
layoutSelector.append("button")
.text("Spring Embed")
.attr('disabled', true)
.attr('class', 'layout spring-embed')
.on("click", function() {
  window.location.hash = 'spring-embed';
  springEmbedLayout({ offset: true }); draw(1000);
});
layoutSelector.append("br");
layoutSelector.append("button")
.text("Random")
.on("click", function() {
  window.location.hash = 'random';
  randomLayout(); draw(1000);
});
layoutSelector.append("br");
layoutSelector.append("button")
.text("Reset")
.on("click", function() {
  window.history.pushState("", document.title, window.location.pathname);
  circularLayout(); draw(1000);
});
var timeSelector = rightSidebar.append("div")
                   .attr("id","time-selector");
timeSelector.append("h2").text("Time");
var timeSelectorForm = timeSelector.append("form")
                       .on("change", timeChange);
var info = rightSidebar.append("div")
           .attr("id", "info");
info.append("h2").text("Information");
info.append("p")
.text('This visualization shows the relationship between nodes. Nodes are considered to be related if they are frequently mentioned together on television. Mouseover nodes and links to see more information about the nodes and how they are related. Nodes can be dragged. ');
info.append("p")
.html('Using <span style="color:#e41a1c">Spring Embed</span> may help you see the relationship more clearly. The algorithm tries to place nodes that are frequently mentioned together close together. The algorithm works by placing a short spring between closely related nodes and a long spring between unrelated nodes. Then, the total potential energy is minimized by applying a steepest gradient descent method iteratively. One may need to click <span style="color:#e41a1c">Random</span> and <span style="color:#e41a1c">Spring Embed</span> a few times before a desirable layout is found. <span style="color:#e41a1c">Reset</span> puts everything back in a circle.');
info.append("p")
.html('By selecting a different time period, one can see how the relationships between nodes change over time.');
info.append("h2").text("Upload File");
var fileUploader = info.append("form").attr("method", "POST")
                   .attr("id", "upload-form")
                   .attr("action",'cgi-bin/process_file')
                   .attr("enctype",'multipart/form-data');
var titleFieldSet = fileUploader.append('fieldset');
titleFieldSet.append("label").text("Title:").attr("for", "graph_title");
titleFieldSet.append("input")
.attr("type", "text")
.attr("name", "graph_title")
.attr("id", "graph_title")
.attr("placeholder", "Graph title")
var maxtrixFileFieldSet = fileUploader.append('fieldset');
maxtrixFileFieldSet.append("label").text("Matrix:").attr("for", "matrix_file");
maxtrixFileFieldSet.append("input")
.attr("type", "file")
.attr("name", "matrix_file")
.attr("id", "matrix_file")
.attr("accept", "text/csv, text/plain");
fileUploader.append("button")
.attr("type", "submit")
.text("Submit");

var nodeTip = d3.tip()
              .attr('class', 'tip')
              .direction('e')
              .html(function (d) {
                var formatter = d3.format("0.3f");
                var size = d.size;
                size = formatter(size);
                var tip = d.name + '<br>' + '<strong>Size:</strong> <span style="color:#e41a1c">' + size + '</span>';
                if (d.data) {
                  Object.keys(d.data).forEach(function(key) {
                    tip += '<br><strong>' + key + ':</strong> <span style="color:#e41a1c">' + d.data[key] + '</span>';
                  });
                }
                return tip;
              });
var linkTip = d3.tip()
              .attr('class', 'tip')
              .offset(function() {
                return [this.getBBox().height/2, 120];
              })
              .html(function (d) {
                var formatter = d3.format("0.3f");
                var tip = '<span style="color:#e41a1c">' + nodeAttr[d.source].name + '</span><br>'
                        + '<span style="color:#e41a1c">' + nodeAttr[d.target].name + '</span><br>'
                        + '<strong>Distance:</strong> <span style="color:#e41a1c">' + formatter(d.distance) + '</span>';
                if (d.data) {
                  Object.keys(d.data).forEach(function(key) {
                    tip += '<br><strong>' + key + ':</strong> <span style="color:#e41a1c">' + d.data[key] + '</span>';
                  });
                }
                return tip;                
              });

svg.call(nodeTip);
svg.call(linkTip);

var allGraphData, selectedGraphData;
var nodeAttr = {};
var maxLinkDistance, minLinkDistance;
var link = svg.append('g').selectAll(".link.data");
var node = svg.append('g').selectAll(".node.data");
var nodeLabel = svg.append('g').selectAll(".node-label.data");
var urlQuery = parseQueryString(window.location.search.slice(1));
var fileName = urlQuery['filename'] || 'multiple_time_varied.json';
var title = urlQuery['title'] || undefined;
if (title !== undefined) {
  document.getElementById('graph-title').innerHTML = title;
} else {
  var graphTitleElement = document.getElementById('graph-title');
  graphTitleElement.parentNode.removeChild(graphTitleElement);
}
d3.json(fileName, function(err, graph) {
  allGraphData = graph;
  setSpringConstant(allGraphData);
  // add times
  if (Array.isArray(allGraphData.nodes) && Array.isArray(allGraphData.links)) {
    // single time
    selectedGraphData = allGraphData;
    timeSelector.style('display', 'none');
  } else {
    // multiple times
    var times = Object.keys(allGraphData);
    times.sort();
    times.forEach(function(time, idx) {
      var timeSelectorRadio = timeSelectorForm.append("input")
                              .attr("type", "radio")
                              .attr("name", "time")
                              .attr("value", time);
      timeSelectorForm.append("span").attr("class", "time-label").text(time);
      if (idx === times.length - 1) {
        timeSelectorRadio.attr("checked", true);
        selectedGraphData = allGraphData[time];
      }
      if (idx !== times.length - 1) timeSelectorForm.append("br");
    });
  }  
  initializeGraph(selectedGraphData, {create: true});
});

// draw graph
function draw(duration) {
  duration = typeof duration !== 'undefined' ? duration : 0;
  link.transition().duration(duration)
  .attr("x1", function(d) { return nodeAttr[d.source].x; })
  .attr("y1", function(d) { return nodeAttr[d.source].y; })
  .attr("x2", function(d) { return nodeAttr[d.target].x; })
  .attr("y2", function(d) { return nodeAttr[d.target].y; })
  .style('opacity', 1);
  node.transition().duration(duration)
  .attr("cx", function(d) { return nodeAttr[d.symbol].x; })
  .attr("cy", function(d) { return nodeAttr[d.symbol].y; })
  .attr("r", function(d) { return nodeAttr[d.symbol].r; })
  .style('opacity', 1);
  nodeLabel.transition().duration(duration)
  .attr("x", function(d) { return nodeAttr[d.symbol].x; })
  .attr("y", function(d) { return nodeAttr[d.symbol].y; })
  .style('opacity', 1);
}


// various layouts
function springEmbedLayout(options) {
  options = options || {};
  var nodes = selectedGraphData.nodes.map(function(d) {
                return {x: nodeAttr[d.symbol].x, y: nodeAttr[d.symbol].y, r: nodeAttr[d.symbol].r};
              });
  var links = selectedGraphData.links;
  var n = nodes.length;
  function distance(a, b) {
    return Math.sqrt((a.x - b.x)*(a.x - b.x) + (a.y - b.y)*(a.y - b.y));
  }
  function energy(nodes) {
    var E = 0;
    for (var i = 0; i < n - 1; ++i) {
      for (var j = i+1; j < n; ++j) {
        var diff = distance(nodes[i], nodes[j]) - links[i][j].l;
        E += 0.5*links[i][j].k*diff*diff;
      }
    }
    return E;
  }
  function dEd(idx, f) {
    var res = 0;
    for (var i = 0; i < n; ++i) {
      if (i === idx) continue;
      res += links[idx][i].k*((f(nodes[idx]) - f(nodes[i])) - links[idx][i].l*(f(nodes[idx]) - f(nodes[i]))/distance(nodes[idx], nodes[i]));            
    }

    return res;
  }
  function dEdx(idx) {
    return dEd(idx, function(d) { return d.x; });
  }
  function dEdy(idx) {
    return dEd(idx, function(d) { return d.y; });
  }  
  function gradient() {
    var grad = [];
    for (var i = 0; i < n; ++i) {
      grad.push({x: dEdx(i), y: dEdy(i)});
    }
    return grad;
  }
  function norm(v) {
    var n = 0;
    v.forEach(function(d) {
      n += d.x*d.x + d.y*d.y;
    });
    return Math.sqrt(n);
  }  
  function addVector(v, w, alpha) {
    var u = [];
    for (var i  = 0; i < n; ++i) {
      u.push({x: v[i].x + w[i].x*alpha, y: v[i].y + w[i].y*alpha});
    }
    return u;
  }
  function divideVector(v, alpha) {
    for (var i  = 0; i < n; ++i) {
      v[i].x /= alpha; v[i].y /= alpha;
    }
    return v;
  }
  function setVector(v, w) {
    for (var i = 0; i < n; ++i) {
      v[i].x = w[i].x; v[i].y = w[i].y;
    }
    return v;
  }
  var TOL = 0.001;
  var E = energy(nodes);
  var grad = gradient();
  var gradNorm = norm(grad);
  var done = gradNorm < TOL;
  var iterations = 0;
  while (!done) {
    divideVector(grad, gradNorm); // make a unit vector
    var alpha1 = 0;
    var alpha3 = 1;
    var E3 = energy(addVector(nodes, grad, -alpha3));
    while (E3 >= E) {
      alpha3 /= 2;
      E3 = energy(addVector(nodes, grad, -alpha3));
    }
    var alpha2 = alpha3/2;
    var E2 = energy(addVector(nodes, grad, -alpha2));
    var h1 = (E2 - E)/alpha2;
    var h2 = (E3 - E2)/(alpha3-alpha2);
    var h3 = (h2-h1)/alpha3;
    var alpha0 = (alpha2 - h1/h3)/2;
    var E0 = energy(addVector(nodes, grad, -alpha0));
    var newE, alpha;
    if (E0 < E3) {
      newE = E0; alpha = alpha0;
    } else {
      newE = E3; alpha = alpha3;
    }        
    // reset state
    if (E - newE < TOL) done = true;
    setVector(nodes, addVector(nodes, grad, -alpha));
    E = newE;
    grad = gradient();
    gradNorm = norm(grad);
    if (gradNorm < TOL) done = true;
    iterations += 1;
  }
  // recenter
  var cX = 0; 
  var cY = 0;
  for (var i = 0; i < n; ++i) {
    cX += nodes[i].x;
    cY += nodes[i].y;
  }
  cX /= n; 
  cY /= n;
  var leftOverflow = 0, topOverflow = 0, rightOverflow = 0, bottomOverflow = 0;
  nodes.forEach(function(d) {
    d.x += width/2 - cX;
    d.y += height/2 - cY;
    if (d.x - d.r < 0 && d.r - d.x > leftOverflow) leftOverflow = d.r - d.x;
    if (d.y - d.r < 0 && d.r - d.y > topOverflow) topOverflow = d.r - d.y;
    if (d.x + d.r > width && d.x + d.r - width > rightOverflow) rightOverflow = d.x + d.r - width;
    if (d.y + d.r > height && d.y + d.r - height > bottomOverflow) bottomOverflow = d.y + d.r - height;
  });
  if (options.offset) {
    var leftOffset = rightOverflow === 0 && leftOverflow;
    var topOffset = bottomOverflow === 0 && topOverflow;
    var rightOffset = leftOverflow === 0 && rightOverflow;
    var bottomOffset = topOverflow === 0 && bottomOverflow;
    nodes.forEach(function(d) {
      d.x += leftOffset - rightOffset;
      d.y += topOffset - bottomOffset;
    });
  }
  
  selectedGraphData.nodes.forEach(function(d, idx) {
    var pos = nodeAttr[d.symbol];
    pos.x = nodes[idx].x;
    pos.y = nodes[idx].y;
  });  
  return E;
}

function randomLayout() {
  node.each(function(d) {
    if (!nodeAttr[d.symbol]) nodeAttr[d.symbol] = {};
    var pos = nodeAttr[d.symbol];
    pos.x = margin + Math.random()*(width - 2*margin);
    pos.y = margin + Math.random()*(height - 2*margin);
  });
}

function circularLayout() {
  node.each(function(d, i) {
    if (!nodeAttr[d.symbol]) nodeAttr[d.symbol] = {};
    var pos = nodeAttr[d.symbol];
    pos.x = margin + (width-2*margin)/2*Math.cos(2*Math.PI*i/node[0].length) + (width-2*margin)/2;
    pos.y = margin + (width-2*margin)/2*Math.sin(2*Math.PI*i/node[0].length) + (width-2*margin)/2;
  });
}


// drag handlers
function dragstarted(d) {
  d3.event.sourceEvent.stopPropagation();
  var target = node.filter(function(dd) { return dd.symbol === d.symbol; });
  nodeTip.hide(d, target.node());
}
function dragged(d) {
  var target = node.filter(function(dd) { return dd.symbol === d.symbol; });
  nodeTip.hide(d, target.node());
  var pos = nodeAttr[d.symbol];
  pos.x = d3.event.x;
  pos.y = d3.event.y;
  draw();
}
function dragended(d) {
  var target = node.filter(function(dd) { return dd.symbol === d.symbol; });
  nodeTip.show(d, target.node());
}

function getTimeKey() {
  return timeSelectorForm.selectAll("input")
         .filter(function() { return this.checked === true; })
         .node().value;
}


function timeChange() {
  selectedGraphData = allGraphData[getTimeKey()];
  window.location.hash
  // window.history.pushState("", document.title, window.location.pathname);
  initializeGraph(selectedGraphData, {update: true});
  draw(1000);
}

function chooseMaxDistance() {
  // save old layout
  var oldLayout = {};
  node.each(function(d) {
    var pos = nodeAttr[d.symbol];
    oldLayout[d.symbol] = {};
    oldLayout[d.symbol].x = pos.x;
    oldLayout[d.symbol].y = pos.y;
  });  
  var lowerBound = lowerMaxDistance;
  var upperBound = upperMaxDistance;
  var distance = lowerBound + Math.floor((upperBound - lowerBound)/2);
  setIdealDistance(distance);
  // binary search to find the first distance that's invalid  
  while (lowerBound < upperBound) {
    if (!isInside()) {
      upperBound = distance;
    } else {
      lowerBound = distance + 1;
    }
    var oldDistance = distance;
    distance = lowerBound + Math.floor((upperBound - lowerBound)/2);
    setIdealDistance(distance);
  } 
  setIdealDistance(distance - 1);
  maxDistance = distance - 1;
  // restore old layout
  node.each(function(d) {
    var pos = nodeAttr[d.symbol];
    pos.x = oldLayout[d.symbol].x;
    pos.y = oldLayout[d.symbol].y;
  });  
  return distance;
  
  function isInside() {
    circularLayout();
    springEmbedLayout();
    return isInsideArea();
  }  
}

function isInsideArea() {
  return selectedGraphData.nodes.every(function(d) {
           var attr = nodeAttr[d.symbol];
           return attr.x >= attr.r && attr.x <= width - attr.r && attr.y >= attr.r && attr.y <= height - attr.r;
         });
}

function setSpringConstant(data) {
  function setSpringConstantHelper(data) {
    data.links.forEach(function(links, i) {
      links.forEach(function(link, j) {
        link.k = link.distance !== 0 ? 1/link.distance : 100;
      });
    });
  }
  if (Array.isArray(data.nodes) && Array.isArray(data.links)) {
    // single time
    setSpringConstantHelper(data);
  } else {
    // multiple times
    Object.keys(data).forEach(function(key) {
      setSpringConstantHelper(data[key]);
    });
  }
}

function setIdealDistance(maxDistance) {
  selectedGraphData.links.forEach(function(d) {
    d.forEach(function(dd) {
      if (maxLinkDistance !== minLinkDistance) {        
        dd.l = minDistance + (maxDistance - minDistance)*(dd.distance-minLinkDistance)/(maxLinkDistance-minLinkDistance);
      } else {
        dd.l = maxDistance;
      }
    });
  }); 
}


function initializeGraph(graph, options) {    
  options = options || {};
  // build link data
  var links = [];
  minLinkDistance = Infinity;
  maxLinkDistance = -1;
  for (var i = 0; i < graph.nodes.length - 1; ++i) {
    for (var j = i + 1; j < graph.nodes.length; ++j) {
      if (options.create || options.update) {
        links.push({source: graph.nodes[i].symbol, target: graph.nodes[j].symbol, distance: graph.links[i][j].distance, 
                    data: graph.links[i][j].data});
      }
      if (graph.links[i][j].distance > maxLinkDistance) maxLinkDistance = graph.links[i][j].distance;
      if (graph.links[i][j].distance < minLinkDistance) minLinkDistance = graph.links[i][j].distance;
    }
  }  
  var minNodeSize = d3.min(graph.nodes, function(d) { return d.size; })
  var maxNodeSize = d3.max(graph.nodes, function(d) { return d.size; })
  graph.nodes.forEach(function(d) {
    if (!nodeAttr[d.symbol]) nodeAttr[d.symbol] = {};
    nodeAttr[d.symbol].name = d.name;
    if (maxNodeSize !== minNodeSize) {
      nodeAttr[d.symbol].r = minSize + (maxSize-minSize)*Math.sqrt((d.size - minNodeSize)/(maxNodeSize-minNodeSize));
    } else {
      nodeAttr[d.symbol].r = maxSize;
    }
  });

  if (options.create || options.update) {
    // don't bother drawing those with max distance, which is 10?
    links = links.filter(function(d) { return d.distance < maxLinkDistance; })
    link = link.data(links, function(d) { return d.source < d.target ? d.source + '-' + d.target : d.target + '-' + d.source; });
    var newLink = link.enter().append("line")
                  .attr("class", function(d, i) {           
                    return "link data " + d.source + " " + d.target;
                  })
                  .on('mouseover', linkTip.show)
                  .on('mouseout', linkTip.hide);
    node = node.data(selectedGraphData.nodes, function(d) { return d.symbol; });
    if (options.update) node.classed('created', false);
    var newNode = node.enter().append("circle")
                  .attr("class", "node data")
                  .on('mouseover', function(d) { 
                    var target = node.filter(function(dd) { return dd.symbol === d.symbol; });
                    nodeTip.show(d, target.node());
                    this.classList.add('hover');
                  })
                  .on('mouseout',  function(d) { 
                    var target = node.filter(function(dd) { return dd.symbol === d.symbol; });
                    nodeTip.hide(d, target.node());
                    this.classList.remove('hover');
                  });
    newNode.call(drag);
    nodeLabel = nodeLabel.data(selectedGraphData.nodes, function(d) { return d.symbol; });
    var newNodeLabel = nodeLabel.enter().append("text")
                       .attr("class", "node-label data")
                       .attr("text-anchor", "middle")
                       .attr("dy", "5px")
                       .text(function(d) { return d.symbol; })
                       .on('mouseover', function(d) {
                         var target = node.filter(function(dd) { return dd.symbol === d.symbol; });
                         target.node().classList.add('hover');
                         nodeTip.show(d, target.node());
                       })
                       .on("mouseout", function(d) {
                         var target = node.filter(function(dd) { return dd.symbol === d.symbol; });
                         target.node().classList.remove('hover');
                         nodeTip.hide(d, target.node());
                       })
                       .call(drag);
    if (options.update) {
      newNode.classed('created', true);
      newLink.style('opacity', 0);
      newNode.style('opacity', 0);
      newNode.each(function(d) {
        var pos = nodeAttr[d.symbol];
        if (!pos.x) pos.x = margin + Math.random()*(width - 2*margin);
        if (!pos.y) pos.y = margin + Math.random()*(height - 2*margin);
      });
      newNodeLabel.style('opacity', 0);
    }    
    link.exit().transition().duration(1000).style('opacity', 0).remove();
    node.exit().transition().duration(1000).style('opacity', 0).remove();
    nodeLabel.exit().transition().duration(1000).style('opacity', 0).remove();    
  }
  if (options.create) { circularLayout(); draw(); } // initial layout
  // normalize length
  d3.select('button.layout.spring-embed')
  .attr('disabled', true);
  var timeout = options.update ? 1000 : 0;
  setTimeout(function() {
    var distance = chooseMaxDistance();
    d3.select('button.layout.spring-embed')
    .attr('disabled', null);
    if (options.create) {      
      switch(window.location.hash) {
        case '#spring-embed':
        springEmbedLayout({ offset: true }); draw(1000);
        break;
        case '#random':
        randomLayout(); draw(1000);
        break;
        default:
        // do nothing
      }
    }
  }, timeout);
}

function parseQueryString(qs) {
  var urlQuery = {};
  qs.split('&').forEach(function(keyValues) {
    var kvSplit = keyValues.split('=');  
    var key, value;
    try {      
      key = decodeURIComponent(kvSplit[0]);
      value = decodeURIComponent(kvSplit[1]);
    } catch(err) {
      console.error(err);
    }
    urlQuery[key] = value;    
  });
  return urlQuery;
}