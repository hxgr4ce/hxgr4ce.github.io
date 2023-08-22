////////////////////////////////////////////////////////////////////////////////
// Project 1:  Airbrush                                                       //
// Your task is to complete the program as specified in the project           //
// description on Canvas (brush.pdf).                                         //
//                                                                            //
// This starter code was adapted from Chapter 19 of Eloquent JavaScript       //
// by Marijn Haverbeke.                                                       //
////////////////////////////////////////////////////////////////////////////////

// holds functions that initialize the various controls below the image
var controls = Object.create(null);
// associates the names of the tools with the function that should be called
// when they are selected and the canvas is clicked
var tools = Object.create(null);
var paintFlowRate = 0.5; // stores the paint flow rate

// creates an element with the given name and attributes and appends all
// further arguments it gets as child nodes
function elt(name, attributes) {
  var node = document.createElement(name);
  if (attributes) {
    for (var attr in attributes)
      if (attributes.hasOwnProperty(attr))
        node.setAttribute(attr, attributes[attr]);
  }
  for (var i = 2; i < arguments.length; i++) {
    var child = arguments[i];
    if (typeof child == "string") child = document.createTextNode(child);
    node.appendChild(child);
  }
  return node;
}

// appends the paint interface to the DOM element it is given as an argument
function createPaint(parent) {
  var canvas = elt("canvas", { width: 640, height: 480 });
  var cx = canvas.getContext("2d");
  cx.fillStyle = "white";
  cx.fillRect(0, 0, canvas.width, canvas.height);
  var toolbar = elt("div", { class: "toolbar" });
  for (var name in controls) toolbar.appendChild(controls[name](cx));

  var panel = elt("div", { class: "picturepanel" }, canvas);
  cx.fillStyle = "black";
  parent.appendChild(elt("div", null, panel, toolbar));
}

// populates the tool field with <option> elements for all tools that have been
// defined, and a "mousedown" handler takes care of calling the function for
// the current tool
controls.tool = function (cx) {
  var select = elt("select");
  for (var name in tools) select.appendChild(elt("option", null, name));

  cx.canvas.addEventListener("mousedown", function (event) {
    if (event.which == 1) {
      tools[select.value](event, cx);
      event.preventDefault();
    }
  });

  return elt("span", null, "Tool: ", select);
};

// finds the canvas-relative coordinates
function relativePos(event, element) {
  var rect = element.getBoundingClientRect();
  return {
    x: Math.floor(event.clientX - rect.left),
    y: Math.floor(event.clientY - rect.top),
  };
}

// registers and unregisters events for drawing tools
function trackDrag(onMove, onEnd) {
  function end(event) {
    removeEventListener("mousemove", onMove);
    removeEventListener("mouseup", end);
    if (onEnd) onEnd(event);
  }
  addEventListener("mousemove", onMove);
  addEventListener("mouseup", end);
}

// color picker -- updates fillStyle and strokeStyle with the selected color
controls.color = function (cx) {
  var input = elt("input", { type: "color" });
  input.addEventListener("change", function () {
    cx.fillStyle = input.value;
    cx.strokeStyle = input.value;
  });
  return elt("span", null, "Color: ", input);
};

// brush size selector -- updates lineWidth with the selected size
controls.brushSize = function (cx) {
  var select = elt("select");
  var sizes = [1, 2, 3, 5, 8, 12, 25, 35, 50, 75, 100];
  sizes.forEach(function (size) {
    select.appendChild(elt("option", { value: size }, size + " pixels"));
  });
  select.selectedIndex = 3;
  cx.lineWidth = 5;
  select.addEventListener("change", function () {
    cx.lineWidth = select.value;
  });
  return elt("span", null, "Brush size: ", select);
};

// paint flow rate selector
controls.paintFlow = function (cx) {
  var select = elt("select");
  var sizes = [0.0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0];
  sizes.forEach(function (size) {
    select.appendChild(elt("option", { value: size }, size + ""));
  });
  select.selectedIndex = 5;
  select.addEventListener("change", function () {
    paintFlowRate = select.value;
  });
  return elt("span", null, "Paint flow: ", select);
};

// save link -- generates a data url
controls.save = function (cx) {
  var link = elt("a", { href: "/" }, "Save");
  function update() {
    try {
      link.href = cx.canvas.toDataURL();
    } catch (e) {
      if (e instanceof SecurityError)
        link.href =
          "javascript:alert(" +
          JSON.stringify("Can't save: " + e.toString()) +
          ")";
      else throw e;
    }
  }
  link.addEventListener("mouseover", update);
  link.addEventListener("focus", update);
  return link;
};

// tries to load an image file from a URL
function loadImageURL(cx, url) {
  var image = document.createElement("img");
  image.addEventListener("load", function () {
    var color = cx.fillStyle,
      size = cx.lineWidth;
    cx.canvas.width = image.width;
    cx.canvas.height = image.height;
    cx.drawImage(image, 0, 0);
    cx.fillStyle = color;
    cx.strokeStyle = color;
    cx.lineWidth = size;
  });
  image.src = url;
}

// file chooser to load a local file
controls.openFile = function (cx) {
  var input = elt("input", { type: "file" });
  input.addEventListener("change", function () {
    if (input.files.length == 0) return;
    var reader = new FileReader();
    reader.addEventListener("load", function () {
      loadImageURL(cx, reader.result);
    });
    reader.readAsDataURL(input.files[0]);
  });
  return elt("div", null, "Open file: ", input);
};

// text field form for loading a file from a URL
controls.openURL = function (cx) {
  var input = elt("input", { type: "text" });
  var form = elt(
    "form",
    null,
    "Open URL: ",
    input,
    elt("button", { type: "submit" }, "load")
  );
  form.addEventListener("submit", function (event) {
    event.preventDefault();
    loadImageURL(cx, input.value);
  });
  return form;
};

tools.Constant = function (event, cx) {
  var radius = cx.lineWidth / 2;
  var r = parseInt(cx.fillStyle.substring(1, 3), 16);
  var g = parseInt(cx.fillStyle.substring(3, 5), 16);
  var b = parseInt(cx.fillStyle.substring(5), 16);

  //making mask for constant brush
  var size = 2 * radius;
  var mask = new Array(size ** 2);
  var i = 0;
  for (var y = 0; y < size; y++) {
    for (var x = 0; x < size; x++) {
      dx = x - radius;
      dy = y - radius;
      d = Math.sqrt(dx ** 2 + dy ** 2);
      if (d > radius) {
        d = 0;
      } else {
        d = 1;
      }
      mask[i] = d;
      i++;
    }
  }

  trackDrag(function (event) {
    var currentPos = relativePos(event, cx.canvas);
    const imageData = cx.getImageData(
      currentPos.x - radius,
      currentPos.y - radius,
      2 * radius,
      2 * radius
    );
    const data = imageData.data;
    for (var i = 0; i < data.length; i += 4) {
      data[i] = r * mask[i / 4] + (1 - mask[i / 4]) * data[i];
      data[i + 1] = g * mask[i / 4] + (1 - mask[i / 4]) * data[i + 1];
      data[i + 2] = b * mask[i / 4] + (1 - mask[i / 4]) * data[i + 2];
      data[i + 3] = 255;
    }
    cx.putImageData(imageData, currentPos.x - radius, currentPos.y - radius);
  });
};

tools.Linear = function (event, cx) {
  var radius = cx.lineWidth / 2;
  var r = parseInt(cx.fillStyle.substring(1, 3), 16);
  var g = parseInt(cx.fillStyle.substring(3, 5), 16);
  var b = parseInt(cx.fillStyle.substring(5), 16);

  //making mask for linear brush
  var size = 2 * radius;
  var mask = new Array(size ** 2);
  var i = 0;
  for (var y = 0; y < size; y++) {
    for (var x = 0; x < size; x++) {
      dx = x - radius;
      dy = y - radius;
      d = Math.sqrt(dx ** 2 + dy ** 2);
      if (d > radius) d = radius;
      mask[i] = 1 - d / radius;
      i++;
    }
  }

  trackDrag(function (event) {
    var currentPos = relativePos(event, cx.canvas);
    const imageData = cx.getImageData(
      currentPos.x - radius,
      currentPos.y - radius,
      2 * radius,
      2 * radius
    );
    const data = imageData.data;
    for (var i = 0; i < data.length; i += 4) {
      data[i] =
        r * mask[i / 4] * paintFlowRate +
        (1 - mask[i / 4] * paintFlowRate) * data[i];
      data[i + 1] =
        g * mask[i / 4] * paintFlowRate +
        (1 - mask[i / 4] * paintFlowRate) * data[i + 1];
      data[i + 2] =
        b * mask[i / 4] * paintFlowRate +
        (1 - mask[i / 4] * paintFlowRate) * data[i + 2];
      data[i + 3] = 255;
    }
    cx.putImageData(imageData, currentPos.x - radius, currentPos.y - radius);
  });
};

tools.Quadratic = function (event, cx) {
  var radius = cx.lineWidth / 2;
  var r = parseInt(cx.fillStyle.substring(1, 3), 16);
  var g = parseInt(cx.fillStyle.substring(3, 5), 16);
  var b = parseInt(cx.fillStyle.substring(5), 16);
  //making mask for quadratic brush
  var size = 2 * radius;
  var mask = new Array(size ** 2);
  var i = 0;
  for (var y = 0; y < size; y++) {
    for (var x = 0; x < size; x++) {
      dx = x - radius;
      dy = y - radius;
      d = Math.sqrt(dx ** 2 + dy ** 2);
      if (d > radius) d = radius;
      mask[i] = 1 - (d / radius) ** 2;
      i++;
    }
  }
  trackDrag(function (event) {
    var currentPos = relativePos(event, cx.canvas);
    const imageData = cx.getImageData(
      currentPos.x - radius,
      currentPos.y - radius,
      2 * radius,
      2 * radius
    );
    const data = imageData.data;
    for (var i = 0; i < data.length; i += 4) {
      data[i] =
        r * mask[i / 4] * paintFlowRate +
        (1 - mask[i / 4] * paintFlowRate) * data[i];
      data[i + 1] =
        g * mask[i / 4] * paintFlowRate +
        (1 - mask[i / 4] * paintFlowRate) * data[i + 1];
      data[i + 2] =
        b * mask[i / 4] * paintFlowRate +
        (1 - mask[i / 4] * paintFlowRate) * data[i + 2];
      data[i + 3] = 255;
    }
    cx.putImageData(imageData, currentPos.x - radius, currentPos.y - radius);
  });
};

// tools.Nyan = function(event, cx) { //breaks everything else, use at your own risk
//   var img = new Image();
//   img.src = 'http://t15.deviantart.net/8W6U0Rm7zbMkiKnnruTQe0K_xgI=/300x200/filters:fixed_height(100,100):origin()/pre10/8e89/th/pre/f/2011/174/d/d/nyan_cat_by_dittoxslash-d3js5uz.png';
//   //'https://i.redd.it/grm3lxii6ce41.jpg'; :)
//   trackDrag(function(event) {
//     var currentPos = relativePos(event, cx.canvas);
//     cx.drawImage(img, currentPos.x - 100, currentPos.y - 100);
//   });
// };

tools.Gaussian = function (event, cx) {
  var radius = cx.lineWidth / 2;
  var r = parseInt(cx.fillStyle.substring(1, 3), 16);
  var g = parseInt(cx.fillStyle.substring(3, 5), 16);
  var b = parseInt(cx.fillStyle.substring(5), 16);
  //making mask for gaussian brush
  var size = 2 * radius;
  var mask = new Array(size ** 2);
  var i = 0;
  for (var y = 0; y < size; y++) {
    for (var x = 0; x < size; x++) {
      dx = x - radius;
      dy = y - radius;
      d = Math.sqrt(dx ** 2 + dy ** 2);
      if (d > radius) d = radius;
      var sigma = 10;
      mask[i] =
        Math.exp(-0.5 * (d / sigma) ** 2) / (sigma * Math.sqrt(2 * Math.PI));
      i++;
    }
  }
  trackDrag(function (event) {
    var currentPos = relativePos(event, cx.canvas);
    const imageData = cx.getImageData(
      currentPos.x - radius,
      currentPos.y - radius,
      2 * radius,
      2 * radius
    );
    const data = imageData.data;
    for (var i = 0; i < data.length; i += 4) {
      data[i] =
        r * mask[i / 4] * paintFlowRate +
        (1 - mask[i / 4] * paintFlowRate) * data[i];
      data[i + 1] =
        g * mask[i / 4] * paintFlowRate +
        (1 - mask[i / 4] * paintFlowRate) * data[i + 1];
      data[i + 2] =
        b * mask[i / 4] * paintFlowRate +
        (1 - mask[i / 4] * paintFlowRate) * data[i + 2];
      data[i + 3] = 255;
    }
    cx.putImageData(imageData, currentPos.x - radius, currentPos.y - radius);
  });
};

tools.Noisy = function (event, cx) {
  var radius = cx.lineWidth / 2;
  var r = parseInt(cx.fillStyle.substring(1, 3), 16);
  var g = parseInt(cx.fillStyle.substring(3, 5), 16);
  var b = parseInt(cx.fillStyle.substring(5), 16);
  //making mask for noisy quadratic brush
  var size = 2 * radius;
  var mask = new Array(size ** 2);
  var i = 0;
  for (var y = 0; y < size; y++) {
    for (var x = 0; x < size; x++) {
      dx = x - radius;
      dy = y - radius;
      d = Math.sqrt(dx ** 2 + dy ** 2);
      if (d > radius) d = radius;
      mask[i] = (1 - (d / radius) ** 2) * 2 * Math.random();
      i++;
    }
  }
  trackDrag(function (event) {
    var currentPos = relativePos(event, cx.canvas);
    const imageData = cx.getImageData(
      currentPos.x - radius,
      currentPos.y - radius,
      2 * radius,
      2 * radius
    );
    const data = imageData.data;
    for (var i = 0; i < data.length; i += 4) {
      data[i] =
        r * mask[i / 4] * paintFlowRate +
        (1 - mask[i / 4] * paintFlowRate) * data[i];
      data[i + 1] =
        g * mask[i / 4] * paintFlowRate +
        (1 - mask[i / 4] * paintFlowRate) * data[i + 1];
      data[i + 2] =
        b * mask[i / 4] * paintFlowRate +
        (1 - mask[i / 4] * paintFlowRate) * data[i + 2];
      data[i + 3] = 255;
    }
    cx.putImageData(imageData, currentPos.x - radius, currentPos.y - radius);
  });
}; //fuzzy

tools.Blur = function (event, cx) {
  //making gaussian filter
  var size = 5;
  var sigma = 3;
  var filter = new Array(size ** 2);
  var i = 0;
  for (var y = 0; y < size; y++) {
    for (var x = 0; x < size; x++) {
      var dx = x - 10;
      var dy = y - 10;
      var d = Math.sqrt(dx ** 2 + dy ** 2);
      filter[i] =
        Math.exp(-(d ** 2) / (2 * sigma ** 2)) /
        Math.sqrt(2 * Math.PI * sigma ** 2);
      i++;
    }
  }
  //get sum
  var sum = 0;
  for (var i = 0; i < filter.length; i++) {
    sum += filter[i];
  }
  //normalize
  for (var i = 0; i < filter.length; i++) {
    filter[i] /= sum;
  }
  console.log(filter);

  //make temp canvas
  var temp = elt("canvas", { width: 640, height: 480 });
  var tcx = temp.getContext("2d");

  //clicky
  var clickPos = relativePos(event, cx.canvas);
  p1x = clickPos.x;
  p1y = clickPos.y;

  trackDrag(
    function (event) {
      var dragPos = relativePos(event, cx.canvas); //don't do anything while cursor is being dragged
    },
    function (event) {
      var releasePos = relativePos(event, cx.canvas);
      p2x = releasePos.x;
      p2y = releasePos.y;

      cx.fillRect(xStart, yStart, xEnd - xStart, yEnd - yStart);

      var xStart = Math.min(p1x, p2x);
      var yStart = Math.min(p1y, p2y);
      var xEnd = Math.max(p1x, p2x);
      var yEnd = Math.max(p1y, p2y);

      for (var x = xStart; x <= xEnd; x++) {
        for (var y = yStart; y <= yEnd; y++) {
          var filterInd = 0;
          const colSum = new Uint8ClampedArray([0, 0, 0, 255]); //r, g, b, a
          maskX = x - size / 2; //start on left side of mask area
          if (maskX < 0) {
            maskX = 0;
          } //bounds checking
          if (maskX >= cx.canvas.width) {
            maskX = cx.canvas.width - 1;
          }

          maskY = y + size / 2; //start on top row of mask area
          if (maskY < 0) {
            maskY = 0;
          } //bounds checking
          if (maskY >= cx.canvas.height) {
            maskY = cx.canvas.height - 1;
          }

          //get image data for area under mask
          const imageData = cx.getImageData(maskX, maskY, size, size); //TODO not necessarily 3? I guess it could be idk
          const data = imageData.data;

          //loop thru data and add to each channel
          for (var i = 0; i < data.length; i += 4) {
            //data length should be 3*3*4
            colSum[0] += filter[filterInd] * data[i];
            colSum[1] += filter[filterInd] * data[i + 1];
            colSum[2] += filter[filterInd] * data[i + 2];
            filterInd++;
          }
          console.log(colSum);
          //data for pixel of interest as an imageData object with width = 1
          let pixData = new ImageData(colSum, 1, 1);
          tcx.putImageData(pixData, x, y); //output pix on a different canvas
        }
      }
      //write data from temp canvas onto
      const tempData = tcx.getImageData(
        xStart,
        yStart,
        xEnd - xStart,
        yEnd - yStart
      );
      cx.putImageData(tempData, xStart, yStart); //temp -> canvas
    }
  );
};
