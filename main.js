var container;

var keyboard = new THREEx.KeyboardState();
var camera, scene, renderer;
var imagedata;
var geometry;

var clock = new THREE.Clock();
var N = 350;

var T = 10.0;
var t = 0.0;
var followP = false;
var followP2 = false;

var Player;
var axisY = new THREE.Vector3(0,1,0);
var axisX = new THREE.Vector3(1,0,0);
var axisZ = new THREE.Vector3(0,0,1);

var parrotPath;

var mixer, morphs = [];

var path;


init();
animate();

function init()
{
    container = document.getElementById( 'container' );
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 4000 );

    camera.position.set(N/2, N*2, N);

    camera.lookAt(new THREE.Vector3(  N/2, 0.0, N/2));

    renderer = new THREE.WebGLRenderer( { antialias: false } );
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.setClearColor( 0x3f3f3f, 1);

    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    
    container.appendChild( renderer.domElement );
    window.addEventListener( 'resize', onWindowResize, false );

    // создание направленногоисточникаосвещения
    var light = new THREE.DirectionalLight(0xffff00);
    // позицияисточникаосвещения
    light.position.set( N*2, N, N/2);
    // направлениеосвещения
    light.target=new THREE.Object3D();
    light.target.position.set( N/2, 0, N/2);
    scene.add(light.target);
    // включениерасчётатеней
    light.castShadow = true;

    // параметрыобластирасчётатеней
    light.shadow = new THREE.LightShadow( new THREE.PerspectiveCamera( 60, 1, 10, 1000) );
    light.shadow.bias= 0.0001;
    // размеркартытеней
    light.shadow.mapSize.width = 4096;
    light.shadow.mapSize.height = 4096;
    scene.add( light);

    var helper = new THREE.CameraHelper(light.shadow.camera);
    scene.add( helper);

    mixer = new THREE.AnimationMixer(scene);

    var canvas = document.createElement('canvas');
    var context = canvas.getContext('2d');
    var img = new Image(); 
    img.onload = function(){
        canvas.width = img.width;
        canvas.height = img.height;
        context.drawImage(img, 0, 0 );
        imagedata = context.getImageData(0, 0, img.width, img.height); 
        CreateTerrain();

        loadModel('models/', 'Tree.obj', 'Tree.mtl');

        loadAnimatedModel('models/Parrot.glb', false);

        Player = loadAnimatedModel('models/Parrot.glb', true);
        
        parrotPath = AddPath();

    } 
    img.src = 'pics/lake.jpg';  

    sky();

            
}


function CreateTerrain()
{
    geometry = new THREE.Geometry();


    for (var i = 0; i < N; i++)
    for (var j = 0; j < N; j++) {

        var h = getPixel(imagedata, i,j);

        geometry.vertices.push(new THREE.Vector3(i, h/10.0, j));
    }


    for (var i = 0; i < (N-1); i++)
        for (var j = 0; j < (N-1); j++) 
    {
        var i1 = i + j*N;
        var i2 = (i+1) + j*N;
        var i3 = (i+1) + (j+1)*N;
        var i4 = i + (j+1)*N;

        geometry.faces.push(new THREE.Face3(i1, i2, i3));
        geometry.faces.push(new THREE.Face3(i1, i3, i4));


        geometry.faceVertexUvs[0].push([new THREE.Vector2(i/(N-1), j/(N-1)),
            new THREE.Vector2((i+1)/(N-1), (j)/(N-1)),
            new THREE.Vector2((i+1)/(N-1), (j+1)/(N-1))]); 

        geometry.faceVertexUvs[0].push([new THREE.Vector2((i)/(N-1), j/(N-1)),            
            new THREE.Vector2((i+1)/(N-1), (j+1)/(N-1)),
            new THREE.Vector2((i)/(N-1), (j+1)/(N-1))
        ]);
    }

    geometry.computeFaceNormals(); 
    geometry.computeVertexNormals(); 

    var loader = new THREE.TextureLoader();
    var tex = loader.load( 'pics/grasstile.jpg' );  
    
    // Режим повторения текстуры 
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;  
    // Повторить текстуру 10х10 раз 
    tex.repeat.set( 2, 2 ); 


    var mat = new THREE.MeshLambertMaterial({
        map:tex,
        wireframe: false,     
        side:THREE.DoubleSide 
    });  


    var mesh = new THREE.Mesh(geometry, mat); 
    mesh.position.set(0.0, 0.0, 0.0);
    mesh.receiveShadow = true;    
    scene.add(mesh);

}

function sky()
{
    var loader = new THREE.TextureLoader();
    var geometry = new THREE.SphereGeometry(1500, 64, 64);    
    var maxAnisotropy = renderer.getMaxAnisotropy();

    var tex = loader.load( 'pics/sky3.jpg' );
    tex.anisotropy = maxAnisotropy;
    tex.minFilter = THREE.NearestFilter; 

    var material = new THREE.MeshBasicMaterial({
            map: tex,
            side: THREE.DoubleSide
        });

    var sphere = new THREE.Mesh(geometry, material)
    sphere.position.copy(new THREE.Vector3(N/2,0,N/2));

    scene.add(sphere);

}


function onWindowResize()
{
    
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    
    renderer.setSize( window.innerWidth, window.innerHeight );
}



// В этой функции можно изменять параметры объектов и обрабатывать действия пользователя
function animate()
{

    if (keyboard.pressed("1")) 
    { 
        followP = false;
        followP2 = false;
        camera.position.set(N/2, N*2, N);
        camera.lookAt(new THREE.Vector3(  N/2, 0.0, N/2));
        

    }    
    if (keyboard.pressed("2")) 
    { 
        followP = true;
        followP2 = false;
    }
    if (keyboard.pressed("3")) 
    { 
        followP = false;
        followP2 = true;
    }

    var delta = clock.getDelta();
    t+=delta;    
    mixer.update( delta );
    for( var i = 0; i < morphs.length; i ++ ) 
    {
        var morph = morphs[ i ];   
        var pos = new THREE.Vector3();
        if (t>= T) t=0;
        pos.copy(parrotPath.getPointAt(t/T));
        morph.position.copy(pos);


        if((t+0.001) >= T) t=0.0;
        var nextPoint = new THREE.Vector3();
        nextPoint.copy(parrotPath.getPointAt((t+0.001)/T));
        morph.lookAt(nextPoint);

        if(followP == true)
        {
        // установка смещения камеры относительно объекта
        var relativeCameraOffset = new THREE.Vector3(0,50,-150);
        var m1 = new THREE.Matrix4();
        var m2 = new THREE.Matrix4();

        // получение поворота объекта
        m1.extractRotation(morph.matrixWorld);
        // получение позиции объекта
        m2.copyPosition(morph.matrixWorld);
        m1.multiplyMatrices(m2, m1);    
            
        // получение смещения позиции камеры относительно объекта
        var cameraOffset = relativeCameraOffset.applyMatrix4(m1);
        // установка позиции и направления взгляда камеры
        camera.position.copy(cameraOffset);
        camera.lookAt(morph.position );
        }

        if(Player != null)
        if(followP2 == true)
        {
        // установка смещения камеры относительно объекта
        var relativeCameraOffset = new THREE.Vector3(0,50,-150);
        var m1 = new THREE.Matrix4();
        var m2 = new THREE.Matrix4();

        // получение поворота объекта
        m1.extractRotation(Player.matrixWorld);
        // получение позиции объекта
        m2.copyPosition(Player.matrixWorld);
        m1.multiplyMatrices(m2, m1);    
            
        // получение смещения позиции камеры относительно объекта
        var cameraOffset = relativeCameraOffset.applyMatrix4(m1);
        // установка позиции и направления взгляда камеры
        camera.position.copy(cameraOffset);
        camera.lookAt(Player.position );
        
        Player.translateZ(20 * delta);

        if (keyboard.pressed("a"))
        {
            //Player.rotateOnAxis(axisZ,Math.PI/30);
            Player.rotateOnAxis(axisY,Math.PI/30);

        }
        if (keyboard.pressed("d"))
        {
            Player.rotateOnAxis(axisY,-Math.PI/30);
        }
        if (keyboard.pressed("w"))
        {
            Player.rotateOnAxis(axisX,Math.PI/180);
        }
        if (keyboard.pressed("s"))
        {
            Player.rotateOnAxis(axisX,-Math.PI/180);
        }


        }
    }
    requestAnimationFrame( animate );
    render();

}


function render()
{
     
    // Рисованиекадра
    renderer.render( scene, camera );
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
        // функция загрузки модели
        objLoader.load( oname, function ( object )
        {
            object.castShadow = true;

            object.traverse( function ( child )
            {
             if ( child instanceof THREE.Mesh )
             {
                child.castShadow = true;
             }
            } );
            
            
            for (var i = 0; i<30; i++)
            {
                var x = Math.random() * N;
                var z = Math.random() * N;

                var y = geometry.vertices[ Math.round(z) + Math.round(x) * N].y;

                object.position.x = x;
                object.position.y = y;
                object.position.z = z;

                var s = (Math.random()*100) +30;
                s /= 400.0;
                object.scale.set(s,s,s);
                scene.add(object.clone());
                
            }            
        }, onProgress, onError );
    });
}


function loadAnimatedModel(path, controlled) //где path – путь и название модели
{
    var loader = new THREE.GLTFLoader();
    loader.load( path, function ( gltf ) {
        var mesh = gltf.scene.children[ 0 ];
        var clip = gltf.animations[ 0 ];
        //установка параметров анимации (скорость воспроизведения и стартовый фрейм)
        mixer.clipAction( clip, mesh ).setDuration( 1 ).startAt( 0 ).play();
        mesh.position.set( N/2, N/5, N/2 );
        mesh.rotation.y = Math.PI / 8;
        mesh.scale.set( 0.2, 0.2, 0.2 );

        mesh.castShadow = true;

        scene.add( mesh );
        if (controlled == false)
                morphs.push( mesh );
        else
        Player = mesh;

 } );
}

function AddPath()
{
    var curve = new THREE.CubicBezierCurve3(
       new THREE.Vector3(300, 40, 120), //P0
        new THREE.Vector3(300, 40, 25), //P1
        new THREE.Vector3(50, 40, 25), //P2
        new THREE.Vector3(50, 40, 120) //P3
       );
  var curve1 = new THREE.CubicBezierCurve3(
    new THREE.Vector3(300, 40, 120), //P0
    new THREE.Vector3(245, 40, 3), //P1
    new THREE.Vector3(200, 80, 200), //P2
    new THREE.Vector3(50, 40, 120) //P3
   );
   var curve2 = new THREE.CubicBezierCurve3(
    new THREE.Vector3(50, 40, 170), //P0
    new THREE.Vector3(50, 120, 325), //P1
    new THREE.Vector3(300, 120, 325), //P2
    new THREE.Vector3(300, 40, 120) //P3
   );
   var curvest = new THREE.CubicBezierCurve3(
    new THREE.Vector3(60, 50, 170), //P0
    new THREE.Vector3(75, 50, 3), //P1
    new THREE.Vector3(225, 50, 50), //P2
    new THREE.Vector3(240, 50, 170) //P3
   );
   var curvest2 = new THREE.CubicBezierCurve3(
    new THREE.Vector3(240, 50, 180), //P0
    new THREE.Vector3(225, 50, 300), //P1
    new THREE.Vector3(75, 50, 300), //P2
    new THREE.Vector3(60, 40, 180) //P3
   );

    var vertices = [];
       // получение 20-ти точек на заданной кривой
    vertices = curve1.getPoints( 200 );
    vertices = vertices.concat(curve2.getPoints( 200 ));
    // создание кривой по списку точек
    path = new THREE.CatmullRomCurve3(vertices);
    // является ли кривая замкнутой (зацикленной)
    
    path.closed = true;
    vertices = path.getPoints(500);


    var geometry = new THREE.Geometry();
    geometry.vertices = vertices;
    var material = new THREE.LineBasicMaterial( { color : 0xff0000 } );
    var curveObject = new THREE.Line( geometry, material );
    //scene.add(curveObject);
    return path;
}

function getPixel( imagedata, x, y )
{
    var position = ( x + imagedata.width * y ) * 4, data = imagedata.data;
    return data[ position ];; 
}
