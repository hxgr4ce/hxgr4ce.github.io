"use strict"; // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Strict_mode
////////////////////////////////////////////////////////////////////////////////
// Project 2:  Tessellation of Shapes
////////////////////////////////////////////////////////////////////////////////
/*global THREE, dat, window, document*/

var camera, scene, renderer;
var cameraControls, effectController;
var clock = new THREE.Clock();
var ambientLight, light;
var slice = 3;	// force initialization
var stack = 3;
var wire;
var flat;
var sphere;
var shape;

function init() {
	var canvasWidth = window.innerWidth;
	var canvasHeight = window.innerHeight;

	// CAMERA
	camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 80000 );
	camera.position.set( -300, 300, -1500 );
	camera.lookAt(0,0,0);

	// LIGHTS
	ambientLight = new THREE.AmbientLight( 0xFFFFFF );
	light = new THREE.DirectionalLight( 0xFFFFFF, 0.7 );
	light.position.set( -800, 900, 300 );

	// RENDERER
	renderer = new THREE.WebGLRenderer( { antialias: true } );
	renderer.setSize( canvasWidth, canvasHeight );
	renderer.setClearColorHex( 0xAAAAAA, 1.0 );

	var container = document.getElementById('container');
	container.appendChild( renderer.domElement );

	renderer.gammaInput = true;
	renderer.gammaOutput = true;

	// EVENTS
	window.addEventListener( 'resize', onWindowResize, false );

	// CONTROLS
	cameraControls = new THREE.OrbitAndPanControls( camera, renderer.domElement );
	cameraControls.target.set(0, 0, 0);

	scene = new THREE.Scene();
	scene.fog = new THREE.Fog( 0x808080, 2000, 4000 );

	// LIGHTS
	scene.add( ambientLight );
	scene.add( light );

	fillScene();
	// GUI
	setupGui();
}

function setupGui() {
	effectController = {
		newSlice: 6,
		newStack: 6,
		newFlat: false,
		newWire: false,
		newShape: "Cylinder"
	};
	var gui = new dat.GUI();
	gui.add(effectController, "newSlice", [2,3,4,5,6,8,10,12,16,24,32] ).name("Slices");
	gui.add(effectController, "newStack", [2,3,4,5,6,8,10,12,16,24,32] ).name("Stacks");
	gui.add( effectController, "newFlat" ).name("Flat Shading");
	gui.add( effectController, "newWire" ).name("Show wireframe only");
	gui.add( effectController, "newShape", ["Cube", "Cylinder", "Cone", "Sphere"] ).name("Shape");

}

var material1 = new THREE.MeshLambertMaterial( { color: 0x4e4eb1, shading: THREE.FlatShading } );
var ka = 0.4;
material1.ambient.setRGB( material1.color.r * ka, material1.color.g * ka, material1.color.b * ka );
var material2 = new THREE.MeshLambertMaterial( { color: 0x4e4eb1} );
material2.ambient.setRGB( material2.color.r * ka, material2.color.g * ka, material2.color.b * ka );
var material3 = new THREE.MeshLambertMaterial( { color: 0x4e4eb1, wireframe: true } );

function CylinderGeometry(n, m) {
	var geo = new THREE.Geometry();
	var normals = [];

	// generate vertices
	var ca = 0.5;
	var sa = 0.0;
	for ( var i = 1 ; i <= n; i++ )
	{
		var a = 2 * Math.PI * i / n;

		var ca1 = 0.5*Math.cos( a ); //x
		var sa1 = 0.5*Math.sin( a ); //z
		// top cap
		geo.vertices.push( new THREE.Vector3(0.0, 0.5, 0.0) ); //middle
		geo.vertices.push( new THREE.Vector3(ca1, 0.5, sa1) );
		geo.vertices.push( new THREE.Vector3(ca, 0.5, sa));
		normals.push( new THREE.Vector3(0, 1, 0) );
		normals.push( new THREE.Vector3(0, 1, 0) );
		normals.push( new THREE.Vector3(0, 1, 0) );

		// bottom cap
		geo.vertices.push( new THREE.Vector3(ca, -0.5, sa));
		geo.vertices.push( new THREE.Vector3(ca1, -0.5, sa1) );
		geo.vertices.push( new THREE.Vector3(0.0, -0.5, 0.0) );

		normals.push( new THREE.Vector3(0, -1, 0) );
		normals.push( new THREE.Vector3(0, -1, 0) );
		normals.push( new THREE.Vector3(0, -1, 0) );

		// make the barrel -- loop over m
		for ( var j = 0 ; j <= m - 1; j++ )	{
			//triangle = two horizontally aligned points, one with a different y component
			geo.vertices.push( new THREE.Vector3(ca1, .5 - (j+1)/m, sa1) ); //new y
			geo.vertices.push( new THREE.Vector3(ca, .5 - j/m, sa) );
			geo.vertices.push( new THREE.Vector3(ca1, .5 - j/m, sa1) );

			geo.vertices.push( new THREE.Vector3(ca, .5 - (j + 1)/m, sa) );
			geo.vertices.push( new THREE.Vector3(ca, .5 - j/m, sa) );
			geo.vertices.push( new THREE.Vector3(ca1, .5 - (j + 1)/m, sa1) );

			//for normalization
			var length1 = Math.sqrt(ca1**2 + sa1**2);
			var length = Math.sqrt(ca**2 + sa**2);

			normals.push( new THREE.Vector3(ca1/length1, 0, sa1/length1) );
			normals.push( new THREE.Vector3(ca/length, 0, sa/length) );
			normals.push( new THREE.Vector3(ca1/length1, 0, sa1/length1) );

			normals.push( new THREE.Vector3(ca/length, 0, sa/length) );
			normals.push( new THREE.Vector3(ca/length, 0, sa/length) );
			normals.push( new THREE.Vector3(ca1/length1, 0, sa1/length1) );

		}

		//increment according to angle
		ca = ca1;
		sa = sa1;
	}

	// Generate minimum number of faces for the polygon.
	var numFaces = 0;
	for(var i = 0; i < geo.vertices.length; i+=3) {
		geo.faces.push( new THREE.Face3(i, i+1, i+2) );
		geo.faces[numFaces].vertexNormals[0] = normals[i];
		geo.faces[numFaces].vertexNormals[1] = normals[i+1];
		geo.faces[numFaces].vertexNormals[2] = normals[i+2];
		numFaces++;
	}

	// Return the geometry object
	return geo;
}

function CubeGeometry(n, m) {
	var geo = new THREE.Geometry();
	var normals = [];

	// generate vertices
	var x = -.5 + 1/n;
	var z = -.5 + 1/n;
	for ( var i = 1 ; i <= n; i++ ) {
		for ( var j = 0 ; j < n; j++ ) {
			// y = 0.5
			geo.vertices.push( new THREE.Vector3(-.5 + j/n, 0.5, .5 - (i-1)/n) );
			geo.vertices.push( new THREE.Vector3(-.5 + (j+1)/n, 0.5, .5 - i/n) );
			geo.vertices.push( new THREE.Vector3(-.5 + j/n, 0.5, .5 - i/n));

			normals.push( new THREE.Vector3(0, 1, 0) );
			normals.push( new THREE.Vector3(0, 1, 0) );
			normals.push( new THREE.Vector3(0, 1, 0) );

			geo.vertices.push( new THREE.Vector3(-.5 + i/n, 0.5, .5 - (j+1)/n) );
			geo.vertices.push( new THREE.Vector3(-.5 + (i-1)/n, 0.5, .5 - j/n) );
			geo.vertices.push( new THREE.Vector3(-.5 + i/n, 0.5, .5 - j/n));

			normals.push( new THREE.Vector3(0, 1, 0) );
			normals.push( new THREE.Vector3(0, 1, 0) );
			normals.push( new THREE.Vector3(0, 1, 0) );

			// y = -0.5
			geo.vertices.push( new THREE.Vector3(-.5 + j/n, -0.5, .5 - i/n));
			geo.vertices.push( new THREE.Vector3(-.5 + (j+1)/n, -0.5, .5 - i/n) );
			geo.vertices.push( new THREE.Vector3(-.5 + j/n, -0.5, .5 - (i-1)/n) );

			normals.push( new THREE.Vector3(0, -1, 0) );
			normals.push( new THREE.Vector3(0, -1, 0) );
			normals.push( new THREE.Vector3(0, -1, 0) );

			geo.vertices.push( new THREE.Vector3(-.5 + i/n, -0.5, .5 - j/n));
			geo.vertices.push( new THREE.Vector3(-.5 + (i-1)/n, -0.5, .5 - j/n) );
			geo.vertices.push( new THREE.Vector3(-.5 + i/n, -0.5, .5 - (j+1)/n) );

			normals.push( new THREE.Vector3(0, -1, 0) );
			normals.push( new THREE.Vector3(0, -1, 0) );
			normals.push( new THREE.Vector3(0, -1, 0) );

			//z = -.5
			geo.vertices.push( new THREE.Vector3(-.5 + j/n, .5 - (i-1)/n, -0.5) );
			geo.vertices.push( new THREE.Vector3(-.5 + (j+1)/n, .5 - i/n, -0.5) );
			geo.vertices.push( new THREE.Vector3(-.5 + j/n, .5 - i/n, -0.5));

			normals.push( new THREE.Vector3(0, 0, -1) );
			normals.push( new THREE.Vector3(0, 0, -1) );
			normals.push( new THREE.Vector3(0, 0, -1) );

			geo.vertices.push( new THREE.Vector3(-.5 + i/n, .5 - (j+1)/n, -0.5) );
			geo.vertices.push( new THREE.Vector3(-.5 + (i-1)/n, .5 - j/n, -0.5) );
			geo.vertices.push( new THREE.Vector3(-.5 + i/n, .5 - j/n, -0.5));

			normals.push( new THREE.Vector3(0, 0, -1) );
			normals.push( new THREE.Vector3(0, 0, -1) );
			normals.push( new THREE.Vector3(0, 0, -1) );

			//z = .5
			geo.vertices.push( new THREE.Vector3(-.5 + j/n, .5 - i/n, 0.5));
			geo.vertices.push( new THREE.Vector3(-.5 + (j+1)/n, .5 - i/n, 0.5) );
			geo.vertices.push( new THREE.Vector3(-.5 + j/n, .5 - (i-1)/n, 0.5) );

			normals.push( new THREE.Vector3(0, 0, 1) );
			normals.push( new THREE.Vector3(0, 0, 1) );
			normals.push( new THREE.Vector3(0, 0, 1) );

			geo.vertices.push( new THREE.Vector3(-.5 + i/n, .5 - j/n, 0.5));
			geo.vertices.push( new THREE.Vector3(-.5 + (i-1)/n, .5 - j/n, 0.5) );
			geo.vertices.push( new THREE.Vector3(-.5 + i/n, .5 - (j+1)/n, 0.5) );

			normals.push( new THREE.Vector3(0, 0, 1) );
			normals.push( new THREE.Vector3(0, 0, 1) );
			normals.push( new THREE.Vector3(0, 0, 1) );

			//x = -.5
			geo.vertices.push( new THREE.Vector3(-0.5, .5 - i/n, -.5 + j/n));
			geo.vertices.push( new THREE.Vector3(-0.5, .5 - i/n, -.5 + (j+1)/n) );
			geo.vertices.push( new THREE.Vector3(-0.5, .5 - (i-1)/n, -.5 + j/n) );

			normals.push( new THREE.Vector3(-1, 0, 0) );
			normals.push( new THREE.Vector3(-1, 0, 0) );
			normals.push( new THREE.Vector3(-1, 0, 0) );

			geo.vertices.push( new THREE.Vector3(-0.5, .5 - j/n, -.5 + i/n));
			geo.vertices.push( new THREE.Vector3(-0.5, .5 - j/n, -.5 + (i-1)/n) );
			geo.vertices.push( new THREE.Vector3(-0.5, .5 - (j+1)/n, -.5 + i/n) );

			normals.push( new THREE.Vector3(-1, 0, 0) );
			normals.push( new THREE.Vector3(-1, 0, 0) );
			normals.push( new THREE.Vector3(-1, 0, 0) );

			//x = .5
			geo.vertices.push( new THREE.Vector3(0.5, .5 - (i-1)/n, -.5 + j/n) );
			geo.vertices.push( new THREE.Vector3(0.5, .5 - i/n, -.5 + (j+1)/n) );
			geo.vertices.push( new THREE.Vector3(0.5, .5 - i/n, -.5 + j/n));

			normals.push( new THREE.Vector3(1, 0, 0) );
			normals.push( new THREE.Vector3(1, 0, 0) );
			normals.push( new THREE.Vector3(1, 0, 0) );

			geo.vertices.push( new THREE.Vector3(0.5, .5 - (j+1)/n, -.5 + i/n) );
			geo.vertices.push( new THREE.Vector3(0.5, .5 - j/n, -.5 + (i-1)/n) );
			geo.vertices.push( new THREE.Vector3(0.5, .5 - j/n, -.5 + i/n));

			normals.push( new THREE.Vector3(1, 0, 0) );
			normals.push( new THREE.Vector3(1, 0, 0) );
			normals.push( new THREE.Vector3(1, 0, 0) );

		}
	}

	// Generate minimum number of faces for the polygon.
	var numFaces = 0;
	for(var i = 0; i < geo.vertices.length; i+=3) {
		geo.faces.push( new THREE.Face3(i, i+1, i+2) );
		geo.faces[numFaces].vertexNormals[0] = normals[i];
		geo.faces[numFaces].vertexNormals[1] = normals[i+1];
		geo.faces[numFaces].vertexNormals[2] = normals[i+2];
		numFaces++;
	}

	return geo;
}

function ConeGeometry(n, m) {
	var geo = new THREE.Geometry();
	var normals = [];

	// generate vertices
	var ca = 0.5;
	var sa = 0.0;
	for ( var i = 1 ; i <= n; i++ ) {
		var a = 2 * Math.PI * i / n;

		var ca1 = 0.5*Math.cos( a ); //x
		var sa1 = 0.5*Math.sin( a ); //z

		// bottom cap triangle
		geo.vertices.push( new THREE.Vector3(ca, -0.5, sa));
		geo.vertices.push( new THREE.Vector3(ca1, -0.5, sa1) );
		geo.vertices.push( new THREE.Vector3(0.0, -0.5, 0.0) );

		normals.push( new THREE.Vector3(0, -1, 0) );
		normals.push( new THREE.Vector3(0, -1, 0) );
		normals.push( new THREE.Vector3(0, -1, 0) );

		// make the barrel -- loop over m (top down)
		for ( var j = 0 ; j < m; j++ )	{
			//instead of ca and sa
			var x = (0.5*j/m)*Math.cos( a );
			var z = (0.5*j/m)*Math.sin( a );

			//horizontal, increment angle
			var x1 = (0.5*j/m)*Math.cos( 2 * Math.PI * (i + 1) / n );
			var z1 = (0.5*j/m)*Math.sin( 2 * Math.PI * (i + 1) / n);

			//vertical, increment radius
			var x2 = (0.5*(j + 1)/m )*Math.cos( a );
			var z2 = (0.5*(j + 1)/m)*Math.sin( a );

			geo.vertices.push( new THREE.Vector3(x1, .5 - j/m, z1) );
			geo.vertices.push( new THREE.Vector3(x2, .5 - (j + 1)/m, z2) );
			geo.vertices.push( new THREE.Vector3(x, .5 - j/m, z) );

			var length1 = Math.sqrt(x1**2 + z1**2);
			var length2 = Math.sqrt(x2**2 + z2**2);
			var length = Math.sqrt(x**2 + z**2);

			normals.push( new THREE.Vector3(x1/length1, .5, z1/length1) );
			normals.push( new THREE.Vector3(x2/length2, .5, z2/length2) );
			normals.push( new THREE.Vector3(x/length, .5, z/length) );

			//horizontal has to be different now
			var x3 = (0.5*(j + 1)/m)*Math.cos( 2 * Math.PI * (i + 1) / n );
			var z3 = (0.5*(j + 1)/m)*Math.sin( 2 * Math.PI * (i + 1) / n);

			geo.vertices.push( new THREE.Vector3(x3, .5 - (j + 1)/m, z3) );
			geo.vertices.push( new THREE.Vector3(x2, .5 - (j + 1)/m, z2) );
			geo.vertices.push( new THREE.Vector3(x1, .5 - j/m, z1) );

			var length3 = Math.sqrt(x3**2 + z3**2);

			normals.push( new THREE.Vector3(x3/length3, .5, z3/length3) );
			normals.push( new THREE.Vector3(x2/length2, .5, z2/length2) );
			normals.push( new THREE.Vector3(x1/length1, .5, z1/length1) );

		}

		ca = ca1;
		sa = sa1;
	}
	// Generate minimum number of faces for the polygon.
	var numFaces = 0;
	for(var i = 0; i < geo.vertices.length; i+=3) {
		geo.faces.push( new THREE.Face3(i, i+1, i+2) );
		geo.faces[numFaces].vertexNormals[0] = normals[i];
		geo.faces[numFaces].vertexNormals[1] = normals[i+1];
		geo.faces[numFaces].vertexNormals[2] = normals[i+2];
		numFaces++;
	}

	return geo;
}

function SphereGeometry(n, m) {
	var geo = new THREE.Geometry();
	var normals = [];

	var phi = 0;
	var theta = -Math.PI/2;

	for ( var t = 0; t <= m; t++ ) {
		var theta1 = -Math.PI/2 + Math.PI * t/m;
		for ( var p = 0 ; p < n; p++ ) {
			var phi1 = 2 * Math.PI * p / n;

			//point 1
			var x = 0.5*Math.cos(theta)*Math.cos(phi);
			var y = 0.5*Math.cos(theta)*Math.sin(phi);
			var z = 0.5*Math.sin(theta);

			//point 2
			var x1 = 0.5*Math.cos(theta1)*Math.cos(phi1);
			var y1 = 0.5*Math.cos(theta1)*Math.sin(phi1);
			var z1 = 0.5*Math.sin(theta1);

			//point 3: same theta as point 2, same phi as point 1
			var x2 = 0.5*Math.cos(theta1)*Math.cos(phi);
			var y2 = 0.5*Math.cos(theta1)*Math.sin(phi);
			var z2 = 0.5*Math.sin(theta1);

			//point 4: same theta as point 1, same phi as point 2
			var x3 = 0.5*Math.cos(theta)*Math.cos(phi1);
			var y3 = 0.5*Math.cos(theta)*Math.sin(phi1);
			var z3 = 0.5*Math.sin(theta);

			//for normalization
			var norm = Math.sqrt(x**2 + y**2 + z**2);
			var norm1 = Math.sqrt(x1**2 + y1**2 + z1**2);
			var norm2 = Math.sqrt(x2**2 + y2**2 + z2**2);
			var norm3 = Math.sqrt(x3**2 + y3**2 + z3**2);

			geo.vertices.push( new THREE.Vector3(x, y, z) );
			geo.vertices.push( new THREE.Vector3(x1, y1, z1) );
		  geo.vertices.push( new THREE.Vector3(x2, y2, z2) );

			normals.push( new THREE.Vector3(x/norm, y/norm, z/norm) );
			normals.push( new THREE.Vector3(x1/norm1, y1/norm1, z1/norm1) );
			normals.push( new THREE.Vector3(x2/norm2, y2/norm2, z2/norm2) );

			geo.vertices.push( new THREE.Vector3(x3, y3, z3) );
			geo.vertices.push( new THREE.Vector3(x1, y1, z1) );
			geo.vertices.push( new THREE.Vector3(x, y, z) );

			normals.push( new THREE.Vector3(x3/norm3, y3/norm3, z3/norm3) );
			normals.push( new THREE.Vector3(x1/norm1, y1/norm1, z1/norm1) );
			normals.push( new THREE.Vector3(x/norm, y/norm, z/norm) );

			phi = phi1;
		}
		theta = theta1;
	}

	// Generate minimum number of faces for the polygon.
	var numFaces = 0;
	for(var i = 0; i < geo.vertices.length; i+=3) {
		geo.faces.push( new THREE.Face3(i, i+1, i+2) );
		geo.faces[numFaces].vertexNormals[0] = normals[i];
		geo.faces[numFaces].vertexNormals[1] = normals[i+1];
		geo.faces[numFaces].vertexNormals[2] = normals[i+2];
		numFaces++;
	}

	return geo;
}

function fillScene() {

	var material = wire ? material3 : (flat ? material1 : material2 );

	//what is any 3d shape but a funny looking sphere
	if ( sphere !== undefined ) {

		sphere.geometry.dispose();
		scene.remove( sphere );

	}

	if ( shape == "Cylinder") {
		sphere = new THREE.Mesh(CylinderGeometry( slice, stack ), material);
		sphere.scale.x = 400;
		sphere.scale.y = 400;
		sphere.scale.z = 400;
		scene.add( sphere );
	}

	if ( shape == "Cube") {
		sphere = new THREE.Mesh(CubeGeometry( slice, stack ), material);
		sphere.scale.x = 400;
		sphere.scale.y = 400;
		sphere.scale.z = 400;
		scene.add( sphere );

	}

	if ( shape == "Cone") {
		sphere = new THREE.Mesh(ConeGeometry( slice, stack ), material);
		sphere.scale.x = 400;
		sphere.scale.y = 400;
		sphere.scale.z = 400;
		scene.add( sphere );
	}

	if ( shape == "Sphere") {
		sphere = new THREE.Mesh(SphereGeometry( slice, stack ), material);
		sphere.scale.x = 400;
		sphere.scale.y = 400;
		sphere.scale.z = 400;
		scene.add( sphere );
	}

	// Coordinates.drawGround({size:1000});
	// Coordinates.drawGrid({size:1000,scale:0.01});
	Coordinates.drawAllAxes({axisLength:500,axisRadius:1,axisTess:4});
}

// EVENT HANDLERS
function onWindowResize() {

	var canvasWidth = window.innerWidth;
	var canvasHeight = window.innerHeight;

	renderer.setSize( canvasWidth, canvasHeight );

	camera.aspect = canvasWidth / canvasHeight;
	camera.updateProjectionMatrix();
}

function animate() {
	window.requestAnimationFrame( animate );
	render();
}

function render() {
	var delta = clock.getDelta();
	cameraControls.update(delta);
	if ( effectController.newSlice !== slice || effectController.newStack !== stack || effectController.newFlat !== flat || effectController.newWire !== wire || effectController.newShape !== shape)
	{
		slice = effectController.newSlice;
		stack = effectController.newStack;
		flat = effectController.newFlat;
		wire = effectController.newWire;
		shape = effectController.newShape;

		fillScene();
	}
	renderer.render( scene, camera );
}

init();
animate();
