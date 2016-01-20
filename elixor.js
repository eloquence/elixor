var multiverse = []; // made globally visible so we can poke at it
var ECA = {};

(function() {
  'use strict';
  var index = 0; // keeps track of all universes ever made
  var fps = 30;
  var paused = false;
  var godmode = false;
  var defaultSize = 249; // if no query is specified
  var showECA = false; // whether to show an elementary CA for comparison
  var settings = getInitialSettings();

  makeUniverseGrid();
  setupEvents();
  $('#current').val(settings.size);
  $('#fps').val(fps);
  updateLink();
  updateMultiverse();
  if (showECA)
    updateECA();

  function makeUniverseGrid() {
    if (settings.size === undefined && Array.isArray(settings.data))
      settings.size = settings.data.length;

    var uc = 0;

    ['1l', '1r', '2l', '2r'].forEach(function(variant) {

      // Set checkboxes
      $('#' + variant).prop('checked', settings[variant]);

      // Create the universe(s)
      if (settings[variant]) {
        var universe = {};
        universe.size = settings.size;
        universe.data = settings.data;
        uc++;
        setVariant(universe, variant);
        if (!godmode)
          universe.linebreak = uc === 3 ? true : false;
        makeUniverse(universe);
      }
    });

    if(!godmode && showECA) {
      ECA.size = settings.size;
      ECA.data = new Array(settings.size);
      ECA.data[0]=1;
      $('#universes').append('<div class="container"><canvas id="ECA" width="' + settings.size + '" height="' + settings.size + '"></canvas><br></div>');
    }
  }

  function setVariant(universe, type) {
    switch (type) {
      case '1l':
        universe.moveLeft = false;
        universe.compareRight = false;
        break;
      case '1r':
        universe.moveLeft = true;
        universe.compareRight = true;
        break;
      case '2l':
        universe.moveLeft = true;
        universe.compareRight = false;
        break;
      case '2r':
        universe.moveLeft = false;
        universe.compareRight = true;
        break;
    }
  }

  function updateLink() {
    if ($('#universeLink').length)
      $('#universeLabel').unwrap();
    var uri = new Uri(window.location.href);
    uri.setQuery('');
    ['1l', '1r', '2l', '2r'].forEach(function(variant) {
      if (settings[variant])
        uri.addQueryParam(variant, null);
    });
    uri.addQueryParam('size', settings.size);
    $('#universeLabel').wrap('<a href="' + uri.toString() + '" id="universeLink">');
  }

  function setupEvents() {
    $('#prev').click(function() {
      var val = Number($('#current').val());
      val--;
      if (val > 0) {
        $('#current').val(val);
        $('#current').blur();
      }
    });
    $('#next').click(function() {
      var val = Number($('#current').val());
      val++;
      $('#current').val(val);
      $('#current').blur();
    });

    $('#current').blur(function() {
      settings.size = Number($(this).val());
      settings.data = undefined;
      if (!godmode) {
        cleanUp();
        updateLink();
      }
      makeUniverseGrid();
    });

    $('#current').keyup(function(e) {
      if (e.which == 13) {
        $('#current').blur();
      }
    });

    $('#fps').keyup(function(e) {
      if (e.which == 13) {
        $('#fps').blur();
      }
    });

    $('#fps').blur(function() {
      fps = Number($(this).val());
    });

    $('#slower').click(function() {
      var val = Number($('#fps').val());
      var stepsize = Math.ceil(val / 3);
      if (fps > 1)
        val = val - stepsize;
      $('#fps').val(val);
      $('#fps').blur();
    });
    $('#faster').click(function() {
      var val = Number($('#fps').val());
      var stepsize = Math.ceil(val / 3);
      val = val + stepsize;
      if (val > 60)
        val = 60;
      $('#fps').val(val);
      $('#fps').blur();
    });
    $('#pause').click(function() {
      paused = !paused;
    });

    $('#randomize').click(function() {
      multiverse.forEach(function(universe) {
        universe.data.forEach(function(ele, ind, arr) {
          arr[ind] = Math.round(Math.random());
        });

      });
      if (showECA && ECA.data.length) {
        ECA.data.forEach(function(ele, ind, arr) {
          arr[ind] = Math.round(Math.random());
        });
      }
    });

    $('#reboot').click(function() {
      multiverse.forEach(function(universe) {
        universe.data.fill(1);
      });
    });

    $('#godmode').click(function() {
      godmode = $(this).is(':checked');
      cleanUp();
      if (godmode)
        $('#universeLabel').unwrap();
      $('#current').blur();
    });

    $('#1l,#1r,#2l,#2r').click(function() {
      settings[$(this).attr('id')] = $(this).is(':checked');
    });

  }

  function getInitialSettings() {
    var rv = {};
    var uri = new Uri(window.location.search);


    var queryData = uri.getQueryParamValue('data');
    var querySize = Number(uri.getQueryParamValue('size'));
    if (queryData !== undefined && queryData.match(/[^0-1]/g) === null) {
      rv.size = queryData.length;
      rv.data = queryData.split('');
    } else if (querySize > 0) {
      rv.size = querySize;
    } else {
      rv.size = defaultSize;
    }

    var queryECA = uri.getQueryParamValue('ECA');
    if (Number(queryECA) >= 0 && Number(queryECA) <= 255) {
      showECA = true;
      ECA.size = rv.size;
      var rule = Number(queryECA).toString(2).split('').map(function(ele) { return Number(ele); } );
      while (rule.length < 8)
        rule.unshift(0);
      ECA.rule = rule;
    }

    // Which universes to show, query string has format 1l&2l, etc., without
    // assignment
    var vq = [uri.getQueryParamValue('1l') === null, uri.getQueryParamValue('1r') === null,
      uri.getQueryParamValue('2l') === null, uri.getQueryParamValue('2r') === null
    ];

    // By default we sow all of them
    if (vq.indexOf(true) === -1)
      vq = [true, true, true, true];

    rv['1l'] = vq[0];
    rv['1r'] = vq[1];
    rv['2l'] = vq[2];
    rv['2r'] = vq[3];
    return rv;
  }


  function makeUniverse(universe) {
    index++;
    universe.index = index;
    var size = universe.size;
    var linebreak = universe.linebreak ? ' linebreak' : '';
    var title = '';
    if (godmode) {
      var type = '';
      if (!universe.moveLeft && !universe.compareRight)
        type = '1L';
      else if (universe.moveLeft && universe.compareRight)
        type = '1R';
      else if (universe.moveLeft && !universe.compareRight)
        type = '2L';
      else if (!universe.moveLeft && universe.compareRight)
        type = '2R';
      title = 'title=" Size: ' + size + ' Type: ' + type + '"';
    }

    $('#universes').append('<div class="container' + linebreak + '" id="container' + index + '"' + title + '><canvas id="universe' + index + '" width="' + size + '" height="' + size + '"></canvas><br></div>');
    if (universe.data === undefined) {
      universe.data = [];
    }
    multiverse.push(universe);
  }

  function cleanUp() {
    multiverse = [];
    $('.container').remove();
  }

  function updateECA() {
    setTimeout(function() {
      requestAnimationFrame(updateECA);
    }, 1000 / fps);
    if (paused) return;
    var ctx = $('#ECA')[0].getContext('2d');
    ctx.clearRect(0, 0, ECA.size, ECA.size);
    var y = 0;
    for (var a = 0; a < ECA.size; a++) {
      ECA.prevData = ECA.data.slice(0);

      for (var i = 0; i < ECA.size; i++) {
        var leftNeighbor = i - 1 < 0 ? ECA.prevData[ECA.size - 1] : ECA.prevData[i - 1];
        var center = ECA.prevData[i];
        var rightNeighbor = i + 1 >= ECA.size ? ECA.prevData[0] : ECA.prevData[i + 1];
        if (leftNeighbor === undefined)
          leftNeighbor = 0;
        if (center === undefined)
          center = 0;
        if (rightNeighbor === undefined)
          rightNeighbor = 0;
        if (leftNeighbor === 1 && center === 1 && rightNeighbor === 1)
          ECA.data[i] = ECA.rule[0];
        else if (leftNeighbor === 1 && center === 1 && rightNeighbor === 0)
          ECA.data[i] = ECA.rule[1];
        else if (leftNeighbor === 1 && center === 0 && rightNeighbor === 1)
          ECA.data[i] = ECA.rule[2];
        else if (leftNeighbor === 1 && center === 0 && rightNeighbor === 0)
          ECA.data[i] = ECA.rule[3];
        else if (leftNeighbor === 0 && center === 1 && rightNeighbor === 1)
          ECA.data[i] = ECA.rule[4];
        else if (leftNeighbor === 0 && center === 1 && rightNeighbor === 0)
          ECA.data[i] = ECA.rule[5];
        else if (leftNeighbor === 0 && center === 0 && rightNeighbor === 1)
          ECA.data[i] = ECA.rule[6];
        else if (leftNeighbor === 0 && center === 0 && rightNeighbor === 0)
          ECA.data[i] = ECA.rule[7];

        if (ECA.data[i])
          ctx.fillRect(i, y, 1, 1);
      }
      y++;
    }
  }

  function updateMultiverse() {
    setTimeout(function() {
      requestAnimationFrame(updateMultiverse);
    }, 1000 / fps);

    if (paused)
      return;

    multiverse.forEach(function(universe, index) {

      var ctx = $('#universe' + universe.index)[0].getContext('2d');
      ctx.clearRect(0, 0, universe.size, universe.size);
      var y = 0;

      for (var i = 0; i < universe.size; i++) {
        var j = universe.moveLeft ? universe.size : 0;
        var breakCondition = universe.moveLeft ? -1 : universe.size;
        while (1) {
          var val;
          var leftNeighbor, rightNeighbor, chosenNeighbor;
          leftNeighbor = j === 0 ? universe.size - 1 : j - 1;
          rightNeighbor = j === universe.size - 1 ? 0 : j + 1;
          chosenNeighbor = universe.compareRight ? rightNeighbor : leftNeighbor;

          if (universe.data[j] === undefined)
            val = 1;
          else
            val = universe.data[j] ^ universe.data[chosenNeighbor];

          universe.data[j] = val;

          if (universe.data[j])
            ctx.fillRect(j, y, 1, 1);

          j = universe.moveLeft ? j - 1 : j + 1;
          if (j === breakCondition)
            break;
        }

        y++;
      }
    });
  }

}());
