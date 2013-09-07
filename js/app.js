var FEATURES = [
  {
    name: 'number',
    enter: function(shapeContainer, featureIndex) {
      while(featureIndex-- >= 0) {
        var shape = shapeContainer.append('div').classed('shape', true);
        shape.append('div').classed('shape-color', true);
        shape.append('div').classed('shape-image', true);
      }
    }
  },
  {
    name: 'color'
  },
  {
    name: 'shape'
  },
  {
    name: 'fill',
  }
];

var NUM_VALUES_PER_FEATURE = 3,
    DECK_SIZE_MULTIPLE = Math.pow(NUM_VALUES_PER_FEATURE, FEATURES.length),
    NUM_DECKS = 1,
    STARTING_CODE = Array(FEATURES.length + 1).join("0"),
    CARD_WIDTH = 300,
    CARD_HEIGHT = 460,
    CARD_MARGIN = 50;

var deck = [];
for (var i = 0; i < DECK_SIZE_MULTIPLE; ++i) {
  var cardCode = (STARTING_CODE + parseInt(i.toString(NUM_VALUES_PER_FEATURE))).slice(-FEATURES.length)
  for(var d = NUM_DECKS; d; --d) {
    // A card code is a 0-padded ternary number in string form.
    deck.push(cardCode);
  }
}
d3.shuffle(deck);


var body = d3.select("body");

var container = body.append("div").attr("id", "cards-container");

var button = body.append("button").text("Deal More").attr('id', 'deal-button').on('click', function(d, i) { deal(3); });

var dealtCards = [],
    selectedCards = [],
    discardedCards = [];

function flushInitialTransform() {
  var prefixed = Modernizr.prefixed('transform');
  prefixed = prefixed.charAt(0).toUpperCase() + prefixed.slice(1);
  debugger;
  getComputedStyle(this)[prefixed];
}

function getTransform(i, scale, entering, numColumns) {
  // Calculate row / col.
  var row = i % numColumns, col = Math.floor(i / numColumns),
      x = scale(col * (CARD_WIDTH + CARD_MARGIN) + CARD_MARGIN),
      y = scale(row * (CARD_HEIGHT + CARD_MARGIN) + CARD_MARGIN);

  var rotate = entering ? 'rotateY(90deg)' : 'rotateY(0deg)';
  return Modernizr.cssprefixed('transform') + ': translate3d(' + x + 'px, ' + y + 'px, 0) scale(' + scale(1) + ')  ' + rotate;
}

function render() {
  var cards = container.selectAll('div.card').data(dealtCards, function(d) { return d; });

  var numColumns = 3, yScale;
  while (true) {
    // We want yScale to be the most restricting
    yScale = d3.scale.linear().domain([0, numColumns * (CARD_HEIGHT + CARD_MARGIN) + CARD_MARGIN]).range([0, window.innerHeight]);

    var colsPerRow = Math.ceil(dealtCards.length / numColumns);
    var xScale = d3.scale.linear().domain([0, colsPerRow * (CARD_WIDTH + CARD_MARGIN) + CARD_MARGIN]).range([0, window.innerWidth - 120]);

    if (yScale(1) < xScale(1)) { break }

    numColumns++;
  }

  cards.enter()
       .append('div')
       .classed('card', true)
       .attr('style', function(_, i) {
         return getTransform(i, yScale, true, numColumns);
       })
       .each(flushInitialTransform)
       .call(function(cards) {
         cards.append('div')
              .classed('shape-container', true)
              .each(function(card) {
                var shapeContainer = d3.select(this);
                for (var f = 0, len = FEATURES.length; f < len; ++f) {
                  var feature = FEATURES[f];

                  if (feature.enter) {
                    feature.enter(shapeContainer, parseInt(card[f]));
                  } else {
                    shapeContainer.classed(feature.name + '-' + card[f], true);
                  }
                }
              });
       })
       .on('click', selectCard);

  cards.exit().remove();

  cards.attr('style', function(_ ,i) {
    return getTransform(i, yScale, false, numColumns);
  });
}

function selectCard(cardCode) {
  var card = d3.select(this);
  var i = selectedCards.indexOf(this);
  if (i === -1) {
    // Select card
    selectedCards.push(this);
    if (selectedCards.length === 3) {
      if (checkForSet(selectedCards)) {
        selectedCards.forEach(function(el) {
          var code = d3.select(el).datum();
          var i = dealtCards.indexOf(code);
          if (i !== -1) { dealtCards.splice(i, 1) }
        });
        render();
      }
      deselectAll();
    } else {
      card.classed('selected', true);
    }
  } else {
    // Deselect
    selectedCards.splice(i, 1);
    card.classed('selected', false);
  }
}

function deselectAll() {
  selectedCards.forEach(function(c) { d3.select(c).classed('selected', false); });
  selectedCards = [];
}

function checkForSet(cards) {
  var codes = cards.map(function(c) { return d3.select(c).datum(); });
  var abIntersection = intersect(codes[0], codes[1]),
      acIntersection = intersect(codes[0], codes[2]);

  var isSet = true;
  abIntersection.forEach(function(val, i) {
    if (val !== acIntersection[i]) {
      isSet = false;
    }
  });
  return isSet;
}

function intersect(a, b) {
  return a.split('').map(function(num, index) {
    num = parseInt(num);
    var bNum = parseInt(b[index]);
    return num === bNum;
  });
}

function deal(n) {
  dealtCards.push.apply(dealtCards, deck.splice(0, n));
  render();
}

var renderTimeoutId = null;
window.onresize = function() {
  if (renderTimeoutId) { clearTimeout(renderTimeoutId); }
  renderTimeoutId = setTimeout(render, 150);
};

deal(9);

