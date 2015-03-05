angular.module("myapp",[])

.controller("MapController",["$scope","MapService","CarService", function ($scope,MapService,CarService) {
    var point = new google.maps.LatLng(32.700542, 128.831537);
    var zoom = 15;
    var scope = $scope;

    $scope.wayId = "Not selected"
    $scope.wayWidth = 5
    $scope.carWidth = 1.7
    $scope.cars = [
    	{name: "TOYOTA COROLLA", width: 1.7},
    	{name: "SUZUKI WagonR", width: 1.48},
    	{name: "Lamborghini Aventador", width: 2.030},
    	{name: "Trailer", width: 3.2}
    ];
    $scope.levels = [
    	{level: 1, label: "初級"},
    	{level: 2, label: "中級"},
    	{level: 3, label: "上級"}
    ];
    $scope.userLevel = 1;

    MapService.initMap(point,zoom);
    MapService.showWayWidth($scope.carWidth,$scope.userLevel);

    $scope.onSubmit = function () {
    	MapService.reviseWayWidth($scope.wayId,$scope.wayWidth,$scope.wayWidth);
    }

    $scope.onChange = function () {
    	MapService.refleshWayWidth($scope.carWidth,$scope.userLevel);
    }

    $scope.searchRoute = function () {
    	MapService.searchRoute();
    }

    MapService.setLineOnClick($scope,function (wayId) {
    	$scope.wayId = wayId
    })

}])

.factory("MapService", ["$http","$q","RouteSearch", function ($http,$q,RouteSearch) {

    var nodesUrl = "http://localinnovation.net/game_hackathon/getdata_nodes.php"
    var waysUrl = "http://localinnovation.net/game_hackathon/getdata_ways.php"
    var writeUrl = "http://localinnovation.net/game_hackathon/getdata_ways.php"

	var map;
	var nodes;
	var nodesIdToIndex;
	var ways;
	var waysIdToIndex;

	var lines = [];
	var carWidth;
	var userLevel;
	var LineOnClick;

	function initMap(point,zoom) {
		map = new google.maps.Map(document.getElementById("map"), {
			mapTypeId: google.maps.MapTypeId.ROADMAP,
			center: point,
			zoom: zoom
		});

		infowindow = new google.maps.InfoWindow();
		service = new google.maps.places.PlacesService(map);
	}

	function showWayWidth(_carWidth,_userLevel) {
		carWidth = _carWidth
		userLevel = _userLevel
		getData(function () {
			drawLines();
		})
	}

	function refleshWayWidth(_carWidth,_userLevel) {
		clearData();

		carWidth = _carWidth
		userLevel = _userLevel
		getData(function () {
			clearLines();
			drawLines();
		})
	}

	function getData(callback) {
		var nodes_promise = $http({
			method: 'GET',
			url: nodesUrl,
			timeout: 100000
		}).success(function (data) {
			// for (var i=0; i<data.length; i++) {
			// 	nodes[data[i].id] = {
			// 		lat: data[i].lat,
			// 		lon: data[i].lon
			// 	}
			// }
			nodes = data
			nodesIdToIndex = [];
			for (var i=0; i<data.length; i++) {
				nodesIdToIndex[data[i].id] = i;
			}
		});

		var ways_promise = $http({
			method: 'GET',
			url: waysUrl,
			timeout: 100000
		}).success(function (data) {
			ways = data
			waysIdToIndex = [];
			for (var i=0; i<data.length; i++) {
				waysIdToIndex[data[i].id] = i;
			}
		});

		$q.all([nodes_promise,ways_promise]).then(function () {
			callback();
		});
	}
	function clearData() {
		nodes = null;
		ways = null;
		nodesIdToIndex = null;
		waysIdToIndex = null;
	}

	function drawLines() {
		var lineColor;
		for (var i=0; i<ways.length; i++) {
			line_coords = [];

			if ((0<Number(ways[i]["maxW"])) && (Number(ways[i]["maxW"]) < carWidth*2*Math.pow(2,-userLevel+2)) ) {
				if (Number(ways[i]["maxW"]) < carWidth*Math.pow(2,-userLevel+2)) {
					lineColor = "#ff0000"
				} else {
					lineColor = "#ffff00"
				}

				for (var j=0; j<ways[i]["nodes"].length; j++) {

					var k = nodesIdToIndex[ways[i]["nodes"][j]];

					// 存在しない場合を除外
					if (k) {
						line_coords.push(new google.maps.LatLng(nodes[k].lat, nodes[k].lon))
					}
				}

				lines[i] = new google.maps.Polyline({
					path: line_coords,
					strokeColor: lineColor,
					strokeOpacity: 1.0,
					strokeWeight: 2
				});

 				lines[i].setMap(map);

 				// wayId毎のクロージャーを作成し、それをgoogle mapのイベントリスナーに引き渡す
				var _LineOnClick = (function (_wayId) {
					var wayId = _wayId
					return function () {
						if (LineOnClick) {
							LineOnClick(wayId);
						}
					}
				})(ways[i].id);

				google.maps.event.addListener(lines[i], 'click', _LineOnClick);

			}
		}
	}

	function clearLines() {
		var cnt = 0
		for (var i=0; i<ways.length; i++) {
			if (lines[i]) {
				cnt++;
				lines[i].setMap(null)
			}
		}
	}

	function setLineOnClick(_scope,_func) {
		var func = _func;
		var $scope = _scope;
		// onClick時の関数のひな形(？)を定義(入力のコールバック関数→ビューの更新)
		LineOnClick = function (wayId) {
			func(wayId);
			$scope.$apply();
		}
	}

	function reviseWayWidth(wayId,minW,maxW) {
		// alert("本当に変更しますか?\n\nwayid: " + wayId +"\nminWidth: "+ minW + "\nmaxWidth: " + maxW)
		if (isFinite(minW)){
			$http({
				method: 'GET',
				url: writeUrl + "?id=" + wayId + "&min=" + minW + "&max=" + maxW,
			}).success(function (data) {
				if (data) {
					clearData();
					getData(function (){
						clearLines();
						drawLines();
					})
					alert("変更されました")
				} else {
					alert("変更に失敗しました")
				}
			});

		} else {
			alert("入力が不適切です");
		}
	}

	function searchRoute() {
		RouteSearch.dykstra(nodes,ways,1288730925,1288694288);
	}

	return {
		initMap: initMap,
		showWayWidth: showWayWidth,
		refleshWayWidth: refleshWayWidth,
		setLineOnClick: setLineOnClick,
		reviseWayWidth: reviseWayWidth,
		searchRoute: searchRoute
	}
}])

.factory("CarService", ["$http", function ($http) {
	function getCars() {
	}
	return {
		getCars: getCars
	}
}])

.factory("RouteSearch", function () {
	var connectedNodes = [];
	var nodes;
	var ways;
	var nodesIdToIndex = [];
	var waysIdToIndex = [];
	var fromId;
	var toId;

	function dykstra(_nodes,_ways,_fromId,_toId) {
		nodes = _nodes;
		ways = _ways;
		fromId = _fromId;
		toId = _toId;

		var cars = [];
		var n_cars;

		nodes.forEach(function (node,i,arr) {
			nodesIdToIndex[node.id] = i;
		});
		ways.forEach(function (way,i,arr) {
			waysIdToIndex[way.id] = i;
		});

		// Init connectedNodes[]
		nodes.forEach(function (node,i,arr) {
			connectedNodes[node.id] = {
				neighbors: [],
				alive: true
			}
		});

		// Add data to connectedNodes[]
		ways.forEach(function (_way,i,arr) {
			var way = _way

			way.nodes.forEach(function (nodeId,i,wayNodeIds) {
				if (nodesIdToIndex[nodeId]) {
					if (i<0) {
						connectedNodes[nodeId].neighbors.push({
							id: wayNodeIds[i-1],
							distance: calcDistance(nodeId,wayNodeIds[i-1])
						})
					}
					if (i<wayNodeIds.length-1) {
						connectedNodes[nodeId].neighbors.push({
							id: wayNodeIds[i+1],
							distance: calcDistance(nodeId,wayNodeIds[i+1])
						})
					}
				}
			});

		});

		n_cars = 1;
		cars.push(new car(fromId,null,0,[]));
		minMileage = 10000;
		minMileageId;

		for (var step=0; step<1000000000; step++) {

			cars.forEach(function (car,i,arr) {
				if ((car.Mileage < minMileage) && car.alive) {
					minMileage = car.Mileage;
					minMileageId = i;
					if (!connectedNodes[car.now].alive) {
						car.alive = false
					}
				}
			})

			connectedNodes[cars[minMileageId].now].neighbors.forEach(function (neighborId,i,arr) {
				if (i==0) {
					cars[minMileageId].pre = cars[minMileageId].now;
					cars[minMileageId].now = neighborId;
				} else {
					cars.push(new car(cars[minMileageId].now,neighborId,cars[minMileageId].mileage,cars[minMileageId].routeLog))
				}
			});
		}


		function car(pre,now,mileage,routeLog) {
			this.now = pre;
			this.pre = now;
			this.mileage = mileage;

			this.routeLog = [];
			this.routeLog.concat(routeLog);
			this.alive = true;
		}

		function calcDistance(fromId,toId) {
			if (nodesIdToIndex[toId] && nodes[nodesIdToIndex[fromId]]) {
				dx = nodes[nodesIdToIndex[toId]].lon - nodes[nodesIdToIndex[fromId]].lon
				dy = nodes[nodesIdToIndex[toId]].lat - nodes[nodesIdToIndex[fromId]].lat
				return Math.sqrt(Math.pow(dx,2)+Math.pow(dy,2))
			} else {
				return 0
			}
		}

	}

	return {
		dykstra: dykstra
	}
});
