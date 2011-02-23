var host = 'developer.echonest.com';
var std_params = "?api_key=OAU01RUHOEYHA2QIQ" +
        "&format=jsonp" +
        "&callback=?" ;
var std_sim_params = std_params + "&bucket=id:7digital&limit=true";

var labelType, useGradients, nativeTextSupport, animate;
var audio = null;
var artists = {};
var st = null;
var startID = 'AR633SY1187B9AC3B9';




(function() {
  var ua = navigator.userAgent,
      iStuff = ua.match(/iPhone/i) || ua.match(/iPad/i),
      typeOfCanvas = typeof HTMLCanvasElement,
      nativeCanvasSupport = (typeOfCanvas == 'object' || typeOfCanvas == 'function'),
      textSupport = nativeCanvasSupport
        && (typeof document.createElement('canvas').getContext('2d').fillText == 'function');
  //I'm setting this based on the fact that ExCanvas provides text support for IE
  //and that as of today iPhone/iPad current text support is lame
  labelType = (!nativeCanvasSupport || (textSupport && !iStuff))? 'Native' : 'HTML';
  nativeTextSupport = labelType == 'Native';
  useGradients = nativeCanvasSupport;
  animate = !(iStuff || !nativeCanvasSupport);
})();

var Log = {
  elem: false,
  write: function(text){
    if (!this.elem)
      this.elem = document.getElementById('log');
    this.elem.innerHTML = text;
    this.elem.style.left = (500 - this.elem.offsetWidth / 2) + 'px';
  }
};

function error(msg) {
    Log.write(msg);
}

function info(msg) {
    Log.write(msg);
}

function warn(msg) {
    Log.write(msg);
}

function log(msg) {
}

function ga_track(action, artist) {
    _gaq.push(['_trackEvent', 'maze', action, artist]);
}

function play(mp3) {
    log("mp3 is " + mp3);
    if (mp3 != null) {
        audioCleanup();               // stop the previous play
        log("Playing " + mp3);
        audio = soundManager.createSound({
            id: 'sound',
            url: mp3,
            //onfinish: nextSong
        });
        audio.play();
    }
}

function audioCleanup() {
    if (audio) {
        audio.pause();
        audio.destruct();
        audio = null;
    }
}

function randomArtist() {
    var json = {
        id: 'ARX6TAQ11C8A415850',
        name: 'Lady Gaga',
        data: {},
        children : []
    };
    newTree(json);
}

function newTree(artist) {
    st.loadJSON(artist);
    st.compute();
    st.onClick(st.root);
}


function newArtist() {
    var artist_name = $("#artist_name").val();
    fetchArtistByName(artist_name);
    ga_track('search', artist_name);
}


function fetchArtistByName(name) {
    Log.write('Searching for ' + name);
    var url ="http://" + host + "/api/v4/artist/search" + std_sim_params;

    $.getJSON(url, { name: name, results: 1 }, function(data) {
        if (checkResponse(data)) {
            var artists = data.response.artists;
            if (artists.length > 0) {
                var artist = artists[0];
                Log.write('Graphing' + artist.name);
                var json = {
                    id: artist.id,
                    name: artist.name,
                    data:{},
                    children:[]
                };
                newTree(artist);
            } else {
                Log.write("Couldn't find " + name);
            }
        }
    });
}


function getHotttnesss() {
    var val  = $("#hotttnesss").val();
    return val;
}


// Performs basic error checking on the return response from the JSONP call
function checkResponse(data) {
    if (data.response) {
        if (data.response.status.code != 0) {
            error("Whoops... Unexpected error from server. " + data.response.status.message);
            log(JSON.stringify(data.response));
        } else {
            return true;
        }
    } else {
        error("Unexpected response from server");
    }
    return false;
}


function init(){
    //init data
    //end

    var json = {
        id: startID,
        name: 'Weezer',
        data: {},
        children : []
    };


    var count = 0;

    function updateArtistInfo(artist_info) {
        $("#artist-name").empty();
        $("#artist-name").append(artist_info.name);

        //info("updating artist info " + artist_info.title);
        var song = artist_info.songs[artist_info.curSong++];

        $("#album-art").empty();
        $("#song-title").empty();

        if (song) {
            var cover_art = song.image.replace('350', '200');
            $("#album-art").append("<a href='" + artist_info.landing_page
                +"'><img src='"+cover_art+"'/></a>");
            $("#song-title").append(song.title);
            play(song.mp3);
            if (artist_info.curSong >= artist_info.songs.length) {
                artist_info.curSong = 0;
            }
        }
    }

    function normalizeName(name) {
        var n = name.toLowerCase();
        n = n.replace(/ & /g, ' and ');
        n = n.replace(/'/g, '');
        n = n.replace(/\W/g, ' ');
        n = n.trim();
        n = n.replace(/\s+/g, '-');
        return n
    }
    function getArtistLandingPage(name) {
        return 'http://www.7digital.com/artists/' + normalizeName(name);
    }

    function fetchArtistInfo(artistNode) {
        var artist_id = artistNode.id;
        if (artist_id in artists) {
            updateArtistInfo(artists[artist_id]);
        } else {
            var url = "http://" + host + "/api/v4/song/search" + std_params +
                "&bucket=id:7digital&bucket=tracks&limit=true&sort=song_hotttnesss-desc";

            $.getJSON(url, { artist_id: artist_id, results:3 }, function(data) {
                if (checkResponse(data)) {
                    artist_info = {};
                    artist_info.name = artistNode.name;
                    artist_info.landing_page = getArtistLandingPage(artistNode.name);
                    artist_info.songs = [];
                    artist_info.curSong = 0;

                    var songs = data.response.songs;
                    for (var i in data.response.songs) {
                        s = {}
                        var song = songs[i];
                        if (song.tracks.length > 0) {
                            var track = song.tracks[0];
                            if (track.release_image === undefined) {
                                s.image = "";
                            } else {
                                s.image = track.release_image;
                            }
                            s.mp3 = track.preview_url;
                            s.title = song.title;
                            artist_info.songs.push(s);
                        }
                    }
                    artists[artist_id] = artist_info;
                    updateArtistInfo(artist_info);
                }
            });
        }
    }

    function expandTree(nodeId, level, onComplete) {
        var max = 6;
        var url ="http://" + host + "/api/v4/artist/similar" + std_sim_params;

        var cur = st.graph.getNode(nodeId);
        var neighbors = cur.getSubnodes();

        ga_track('expand', cur.name);

        $.getJSON(url, { id: nodeId, min_hotttnesss: getHotttnesss() }, function(data) {
            if (checkResponse(data)) {
                var artists = data.response.artists;
                var children = [];
                for (var i in artists) {
                    var artist = artists[i];

                    if (! st.graph.hasNode(artist.id)) {
                        var next = {
                            id: artist.id,
                            name: artist.name,
                            data: {},
                            children: []
                        };
                        children.push(next);
                        if (children.length >= max) {
                            break;
                            }
                        }
                    }
                    expansion = {
                        id:nodeId,
                        children: children
                    }
                    onComplete.onComplete(nodeId, expansion);
                }
            });
        }

        function expandTreeSim(nodeId, level, onComplete) {
            Log.write(' get tree ' + nodeId + ' lvl ' + level);
            count += 1
            children = [ { id: count++, name:count },  {id : count++, name:count}
                       ]
            expansion = {
                    id: nodeId,
                    name : nodeId,
                    children : children
                    }
            onComplete.onComplete(nodeId, expansion);
        }


        //Implement a node rendering function called 'nodeline' that plots a straight line
        //when contracting or expanding a subtree.
        $jit.ST.Plot.NodeTypes.implement({
            'nodeline': {
              'render': function(node, canvas, animating) {
                    if(animating === 'expand' || animating === 'contract') {
                      var pos = node.pos.getc(true), nconfig = this.node, data = node.data;
                      var width  = nconfig.width, height = nconfig.height;
                      var algnPos = this.getAlignedPos(pos, width, height);
                      var ctx = canvas.getCtx(), ort = this.config.orientation;
                      ctx.beginPath();
                      if(ort == 'left' || ort == 'right') {
                          ctx.moveTo(algnPos.x, algnPos.y + height / 2);
                          ctx.lineTo(algnPos.x + width, algnPos.y + height / 2);
                      } else {
                          ctx.moveTo(algnPos.x + width / 2, algnPos.y);
                          ctx.lineTo(algnPos.x + width / 2, algnPos.y + height);
                      }
                      ctx.stroke();
                  }
              }
            }

    });

    //init Spacetree
    //Create a new ST instance
    st = new $jit.ST({
        'injectInto': 'infovis',
        //set duration for the animation
        duration: 800,
        //set animation transition type
        transition: $jit.Trans.Quart.easeInOut,
        //set distance between node and its children
        levelDistance: 50,
        //set max levels to show. Useful when used with
        //the request method for requesting trees of specific depth
        levelsToShow: 2,
        //set node and edge styles
        //set overridable=true for styling individual
        //nodes or edges
        Node: {
            height: 40,
            width: 140,
            //use a custom
            //node rendering function
            type: 'nodeline',
            color:'#fffba6',
            lineWidth: 2,
            align:"center",
            overridable: true
        },

        Navigation: {
          enable: false,
          panning: false,
          zooming: 10
        },

        Edge: {
            type: 'bezier',
            lineWidth: 2,
            color:'#fffba6',
            overridable: true
        },

        //Add a request method for requesting on-demand json trees.
        //This method gets called when a node
        //is clicked and its subtree has a smaller depth
        //than the one specified by the levelsToShow parameter.
        //In that case a subtree is requested and is added to the dataset.
        //This method is asynchronous, so you can make an Ajax request for that
        //subtree and then handle it to the onComplete callback.
        //Here we just use a client-side tree generator (the getTree function).
        request: function(nodeId, level, onComplete) {
              expandTree(nodeId, level, onComplete);
        },

        onBeforeCompute: function(node){
            Log.write("loading " + node.name);
            fetchArtistInfo(node);
        },

        onAfterCompute: function(){
            Log.write("");
        },

        //This method is called on DOM label creation.
        //Use this method to add event handlers and styles to
        //your node.
        onCreateLabel: function(label, node){
            label.id = node.id;
            label.innerHTML = node.name;
            label.onclick = function(){
                st.onClick(node.id);
            };
            //set label styles
            var style = label.style;
            style.width = 140 + 'px';
            style.height = 17 + 'px';
            style.cursor = 'pointer';
            style.color = '#fffba6';
            //style.backgroundColor = '#1a1a1a';
            style.fontSize = '0.8em';
            style.textAlign= 'center';
            //style.textDecoration = 'underline';
            style.paddingTop = '3px';
        },

        //This method is called right before plotting
        //a node. It's useful for changing an individual node
        //style properties before plotting it.
        //The data properties prefixed with a dollar
        //sign will override the global node style properties.
        onBeforePlotNode: function(node) {
            //add some color to the nodes in the path between the
            //root node and the selected node.
            if (node.selected) {
                node.data.$color = "#0f0";
            } else {
                delete node.data.$color;
            }
        },

        onPlaceLabel: function(domElement, node){
          var style = domElement.style;
          style.display = '';
          style.cursor = 'pointer';
          if (node.selected) {
              style.fontSize = "1.0em";
              style.color = "#afa";
          } else {
              style.fontSize = "0.8em";
              style.color = "#fffba6";
          }
        },

        //This method is called right before plotting
        //an edge. It's useful for changing an individual edge
        //style properties before plotting it.
        //Edge data proprties prefixed with a dollar sign will
        //override the Edge global style properties.
        onBeforePlotLine: function(adj){
            if (adj.nodeFrom.selected && adj.nodeTo.selected) {
                adj.data.$color = "#afa";
                adj.data.$lineWidth = 3;
            }
            else {
                delete adj.data.$color;
                delete adj.data.$lineWidth;
            }
        }
    });

    newTree(json);

   function get(id) {
      return document.getElementById(id);
    };
    //end

}

$(document).ready(function() {
    soundManager.url = 'javascripts/';
    soundManager.flashVersion = 9;
    soundManager.debugMode=true;

    soundManager.onload = function() {
         //info("sound manager ready");
    };

    soundManager.onerror = function() {
        error("sound manager broken");
    }

    // this setting affects how array params are sent via getJSON calls
    jQuery.ajaxSettings.traditional = true;
    init();
});