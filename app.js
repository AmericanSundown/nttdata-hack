angular.module("myapp",[])
	.controller("MapController",["$scope","MapService",function ($scope,MapService) {
	    var point = new google.maps.LatLng(32.700542, 128.831537);
	    var zoom = 15;

	    MapService.initMap(point,zoom);

	    MapService.showWayWidth({
	    	nodes: "http://localinnovation.net/game_hackathon/getdata_nodes.php",
	    	ways: "http://localinnovation.net/game_hackathon/getdata_ways.php"
	    });

	}])

	.factory("MapService", ["$http","$q", function ($http,$q) {
		var map;
		var nodes = [];
		var ways;
		var lines = [];

		function initMap(point,zoom) {
			map = new google.maps.Map(document.getElementById("map"), {
				mapTypeId: google.maps.MapTypeId.ROADMAP,
				center: point,
				zoom: zoom
			});

			infowindow = new google.maps.InfoWindow();
			service = new google.maps.places.PlacesService(map);
		}

		function showWayWidth(url) {
			getData(url, function () {
				drawLines();
			})

		}

		function getData(url,callback) {
			var nodes_promise = $http({
				method: 'GET',
				url: url.nodes,
				timeout: 100000
			}).success(function (data) {
				// ways.concat(data);
				for (var i=0; i<data.length; i++) {
					nodes[data[i].id] = {
						lat: data[i].lat,
						lon: data[i].lon
					}
				}
			});

			var ways_promise = $http({
				method: 'GET',
				url: url.ways,
				timeout: 100000
			}).success(function (data) {
				// nodes.concat(data);
				ways = data
			});

			// var nodes_promise = $http.jsonp(url.nodes);
			// var ways_promise = $http.jsonp(url.ways);

			$q.all([nodes_promise,ways_promise]).then(function () {

				// ways.push(
				// 	{
				// 		id: 1,
				// 		nodes: [0,1,2,3],
				// 		minW: 1.5,
				// 		maxW: 3
				// 	},
				// 	{
				// 		id: 1,
				// 		nodes: [4,5,6,7],
				// 		minW: 1.5,
				// 		maxW: 3
				// 	}
				// );
				// nodes = [
				// 	{ id: 0, lat: 37.772323, lon: -122.214897},
				// 	{ id: 1, lat: 21.291982, lon: -157.821856},
				// 	{ id: 2, lat: -18.142599, lon: 178.431},
				// 	{ id: 3, lat: -27.46758, lon: 153.027892},
				// 	{ id: 4, lat: -37.772323, lon: -122.214897},
				// 	{ id: 5, lat: -21.291982, lon: -157.821856},
				// 	{ id: 6, lat: 18.142599, lon: 178.431},
				// 	{ id: 7, lat: 27.46758, lon: 153.027892}
				// ];
				callback();
			});
		}
		function clearData() {
			nodes = null;
			ways = null;
		}

		function drawLines() {
			var cnt = 0
			for (var i=0; i<ways.length; i++) {
				line_coords = [];
				for (var j=0; j<ways[i]["nodes"].length; j++) {
					var k = ways[i]["nodes"][j];
					if (nodes[k]) {
						line_coords.push(new google.maps.LatLng(nodes[k].lat, nodes[k].lon))
					} else {
						cnt++;
					}


					lines[i] = new google.maps.Polyline({
						path: line_coords,
						strokeColor: "#FF0000",
						strokeOpacity: 1.0,
						strokeWeight: 2
					});
 	 				lines[i].setMap(map);
				}
			}
			alert(cnt);
		}

		return {
			initMap: initMap,
			showWayWidth: showWayWidth
		}
	}]);