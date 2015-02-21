angular.module("myapp",[])
	.controller("MapController",["$scope","MapService",function ($scope,MapService) {
	    var point = new google.maps.LatLng(35.658892, 139.755286);
	    var zoom = 15;

	    MapService.initMap(point,zoom);

	    MapService.showWayWidth({
	    	nodes: "data/metro_routeDict.json",
	    	ways: "data/metro_stationDict.json"
	    });

	}])

	.factory("MapService", ["$http","$q", function ($http,$q) {
		var map;
		var nodes = [];
		var ways = [];

		function initMap(point,zoom) {
			var map = new google.maps.Map(document.getElementById("map"), {
				mapTypeId: google.maps.MapTypeId.ROADMAP,
				center: point,
				zoom: zoom
			});

			infowindow = new google.maps.InfoWindow();
			service = new google.maps.places.PlacesService(map);
		}

		function showWayWidth(url) {
			getData(url, function () {
				alert("ok!")
			})

		}

		function getData(url,callback) {
			var nodes_promise = $http({
				method: 'GET',
				url: url.nodes,
				timeout: 100000
			}).success(function (data) {
				nodes = data;
			});


			var ways_promise = $http({
				method: 'GET',
				url: url.ways,
				timeout: 100000
			}).success(function (data) {
				ways = data
			});

			$q.all([nodes_promise,ways_promise]).then(function (data) {
				// nodes.push(data[0]);
				// ways.push(data[1]);
				callback();
			});
		}

		return {
			initMap: initMap,
			showWayWidth: showWayWidth
		}
	}]);