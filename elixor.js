var multiverse = []; // made globally visible so we can poke at it

(function() {
  'use strict';
  var index = 0; // keeps track of all universes ever made
  var fps = 30;
  var initialUniverse = 249;
  var paused = false;
  var godmode = false;

  setupEvents();
  $('#current').val(initialUniverse);
  $('#current').blur();
  $('#fps').val(fps);
  updateMultiverse();

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
      if (!godmode)
        cleanUp();
      makeUniverseGrid(Number($(this).val()));
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
      if(fps > 1)
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
    });

    $('#reboot').click(function() {
      multiverse.forEach(function(universe) {
        universe.data.fill(1);
      });
    });

    $('#godmode').click(function() {
        godmode = $(this).is(':checked');
        cleanUp();
        $('#current').blur();
    });

  }


  function makeUniverseGrid(size) {
    if($('#u1').is(':checked')) {
      makeUniverse({
        size: size,
        moveLeft: false,
        compareRight: false
      });
    }
    if($('#u2').is(':checked')) {
      makeUniverse({
        size: size,
        moveLeft: true,
        compareRight: true
      });
    }
    var linebreak = !$('#godmode').is(':checked');
    if($('#u3').is(':checked')) {
      makeUniverse({
        size: size,
        moveLeft: true,
        compareRight: false,
        linebreak: linebreak
      });
    }
    if($('#u4').is(':checked')) {
      makeUniverse({
        size: size,
        moveLeft: false,
        compareRight: true
      });
    }
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
      title = 'title=" Size: '+size+' Type: '+type+'"';
    }

    $('#universes').append('<div class="container' + linebreak + '" id="container' + index + '"' + title + '><canvas id="universe' + index + '" width="' + size + '" height="' + size + '"></canvas><br></div>');
    universe.data = [];
    multiverse.push(universe);
  }

  function cleanUp() {
    multiverse = [];
    $('.container').remove();
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
