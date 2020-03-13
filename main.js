var container;
var camera, scene, renderer;
var imagedata;
var sphere;
var model;

var mixer, morphs = [];

var clock = new THREE.Clock();

var geometry = new THREE.Geometry();

var N = 350;

var spotlight = new THREE.PointLight(0xffffff);

init();
animate();

function init()
{

    container = document.getElementById( 'container' );
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(
    45, window.innerWidth / window.innerHeight, 1, 4000 );

    camera.position.set(N, N, N);

    camera.lookAt(new THREE.Vector3(  0, 0.0, 0));


    renderer = new THREE.WebGLRenderer( { antialias: false } );
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.setClearColor( 0x0000FF, 1);
    container.appendChild( renderer.domElement );
    window.addEventListener( 'resize', onWindowResize, false );
    var canvas = document.createElement('canvas');
    var context = canvas.getContext('2d');


    var img = new Image(); 
    img.onload = function(){
        canvas.width = img.width;
        canvas.height = img.height;
        context.drawImage(img, 0, 0 );
        imagedata = context.getImageData(0, 0, img.width, img.height); 
        CreateTerrain();
    } 
    img.src = 'pics/lake.jpg';  
    
    spotlight.position.set(100, 100, N/2); 
    scene.add(spotlight);

    var geometry = new THREE.SphereGeometry( 5, 32, 32 );
    var material = new THREE.MeshBasicMaterial( {color: 0xffff00} );
    sphere = new THREE.Mesh( geometry, material );
    scene.add( sphere );
    sky();
    loadModel('models/', 'Tree.obj', 'Tree.mtl');
    mixer = new THREE.AnimationMixer( scene );
    loadAnimatedModel('models/Parrot.glb');
        
}



function onWindowResize()
{
    
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    
    renderer.setSize( window.innerWidth, window.innerHeight );
}

var a = 0.0;
// В этой функции можно изменять параметры объектов и обрабатывать действия пользователя
function animate()
{
    a += 0.01;
    // Добавление функции на вызов, при перерисовки браузером страницы
    requestAnimationFrame( animate );
    render();

    spotlight.position.x = N/2+N*Math.cos(a);
    spotlight.position.y = N*Math.sin(a);

    sphere.position.copy(spotlight.position);


    var x = N/2+2*N*Math.cos(a);
    var z = N/2+2*N*Math.sin(a);

    // Установка позиции камеры

    // Установка точки, на которую камера будет смотреть
   // camera.lookAt(new THREE.Vector3(  N/2, 0.0, N/2));

    var delta = clock.getDelta();
    mixer.update( delta );
    for ( var i = 0; i < morphs.length; i ++ )
    {
        var morph = morphs[ i ];
    }

}


function render()
{
     
    // Рисованиекадра
    renderer.render( scene, camera );

    



}

function CreateTerrain()
{
    for (var j = 0; j < N; j++)
    for (var i = 0; i < N; i++) {
        var y = getPixel(imagedata, i,j)/5.0;

        geometry.vertices.push(new THREE.Vector3(  i, y, j));
    }


    for (var j = 0; j < N-1; j++)
    for (var i = 0; i < N-1; i++)
    {
        var i1 = i + j*N;
        var i2 = (i+1) + j*N;
        var i3 = i + (j+1)*N;
        var i4 = (i+1) + (j+1)*N;

        geometry.faces.push(new THREE.Face3(i1, i2, i3));
        geometry.faces.push(new THREE.Face3(i2, i4, i3));


        geometry.faceVertexUvs[0].push([new THREE.Vector2(i/(N-1), j/(N-1)),
            new THREE.Vector2((i+1)/(N-1), j/(N-1)),
            new THREE.Vector2((i)/(N-1), (j+1)/(N-1))]); 

        geometry.faceVertexUvs[0].push([new THREE.Vector2((i+1)/(N-1), j/(N-1)),
            
            new THREE.Vector2((i+1)/(N-1), (j+1)/(N-1)),
            new THREE.Vector2((i)/(N-1), (j+1)/(N-1))
        ]);
    }

    geometry.computeFaceNormals(); 
    geometry.computeVertexNormals(); 

    var loader = new THREE.TextureLoader(); 
    //var tex = loader.load( 'pics/ori.jpg' );
    var tex = loader.load( 'pics/grasstile.jpg' );  

    var mat = new THREE.MeshLambertMaterial({
        map:tex,
        wireframe: false,     
        side:THREE.DoubleSide 
    });  


    // Режим повторения текстуры 
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;  
    // Повторить текстуру 10х10 раз 
    tex.repeat.set( 3, 3 ); 

    var triangleMesh = new THREE.Mesh(geometry, mat);
    triangleMesh.position.set(0.0, 0.0, 0.0);

    scene.add(triangleMesh);
    console.log(triangleMesh);

}

function getPixel( imagedata, x, y )
{
    var position = ( x + imagedata.width * y ) * 4, 
    data = imagedata.data;
    return data[ position ];; 
}

function sky()
{
    var loader = new THREE.TextureLoader();
    var geometry = new THREE.SphereGeometry(1500, 64, 64);
    
    var tex = loader.load( 'pics/sky.jpg' );
    tex.minFilter = THREE.NearestFilter; 

    var material = new THREE.MeshBasicMaterial({
            map: tex,
            side: THREE.DoubleSide
        });

    var sphere = new THREE.Mesh(geometry, material)
    sphere.position.copy(new THREE.Vector3(0,0,0));
    scene.add(sphere);

}

function loadModel(path, oname, mname)
{
 // функция, выполняемая в процессе загрузки модели (выводит процент загрузки)
 var onProgress = function ( xhr ) {
 if ( xhr.lengthComputable ) {
 var percentComplete = xhr.loaded / xhr.total * 100;
 console.log( Math.round(percentComplete, 2) + '% downloaded' );
 }
 };
 // функция, выполняющая обработку ошибок, возникших в процессе загрузки
 var onError = function ( xhr ) { };
 // функция, выполняющая обработку ошибок, возникших в процессе загрузки
 var mtlLoader = new THREE.MTLLoader();
 mtlLoader.setPath( path );
 // функция загрузки материала
 mtlLoader.load( mname, function( materials )
 {
 materials.preload();
 var objLoader = new THREE.OBJLoader();
 objLoader.setMaterials( materials );
 objLoader.setPath( path );
2
 // функция загрузки модели
 objLoader.load( oname, function ( object )
 {
 object.position.x = N/2;
 object.position.y = 0;
 object.position.z = N/2;
 object.scale.set(0.2, 0.2, 0.2);
 scene.add(object);
 }, onProgress, onError );
 });
}

function loadAnimatedModel(path) //где path – путь и название модели
{
 var loader = new THREE.GLTFLoader();
3
 loader.load( path, function ( gltf ) {
 var mesh = gltf.scene.children[ 0 ];
 var clip = gltf.animations[ 0 ];
 //установка параметров анимации (скорость воспроизведения и стартовый фрейм)
 mixer.clipAction( clip, mesh ).setDuration( 1 ).startAt( 0 ).play();
 mesh.position.set( 20, 20, -5 );
 mesh.rotation.y = Math.PI / 8;
 mesh.scale.set( 10, 10, 10 );

 mesh.castShadow = true;
 mesh.receiveShadow = true;

 scene.add( mesh );
 morphs.push( mesh );

 } );
}
