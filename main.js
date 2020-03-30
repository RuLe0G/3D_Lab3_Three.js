var container;
var camera, scene, renderer;
var imagedata;
var geometry;

var N = 350;

var mixer, morphs = [];

var clock = new THREE.Clock();


init();
animate();

function init()
{
    geometry = new THREE.Geometry();
    container = document.getElementById( 'container' );
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(
    45, window.innerWidth / window.innerHeight, 1, 4000 );

    camera.position.set(N, N, N);

    camera.lookAt(new THREE.Vector3(  N/2, 0.0, N/2));


    renderer = new THREE.WebGLRenderer( { antialias: false } );
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.setClearColor( 0x3f3f3f, 1);
    container.appendChild( renderer.domElement );
    window.addEventListener( 'resize', onWindowResize, false );

    var light = new THREE.PointLight(0xffff00)
    light.position.set(N,N*2,N/2);

    var targetObject = new THREE.Object3D();
    targetObject.position.set(N, 0, N);
    scene.add(targetObject);

    light.target = targetObject;

    light.castShadow = true;

    light.shadow.camera.near = 500;
    light.shadow.camera.far = 4000;
    light.shadow.camera.fov = 45;

    light.shadow.mapSize.width = 2048;
    light.shadow.mapSize.height = 2048;
    scene.add(light);

    var helper = new THREE.CameraHelper(light.shadow.camera);
    scene.add(helper);

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

        loadAnimatedModel('models/Parrot.glb');

    } 
    img.src = 'pics/lake.jpg';  
            
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
    var delta = clock.getDelta();
    mixer.update( delta );
    //for( var i = 0; i < morphs.length; i ++ ) 
   // {
  //      var morph = morphs[ i ];   
  //  }
    // Добавление функции на вызов, при перерисовки браузером страницы
    requestAnimationFrame( animate );
    render();

}


function render()
{
     
    // Рисованиекадра
    renderer.render( scene, camera );
}

function CreateTerrain()
{
    for (var i = 0; i < N; i++)
    for (var j = 0; j < N; j++) {

        var h = getPixel(imagedata, i,j)/10.0;

        geometry.vertices.push(new THREE.Vector3(i, h, j));
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
    //var tex = loader.load( 'pics/ori.jpg' );
    var tex = loader.load( 'pics/grasstile.jpg' );  
    
    // Режим повторения текстуры 
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;  
    // Повторить текстуру 10х10 раз 
    tex.repeat.set( 3, 3 ); 


    var mat = new THREE.MeshLambertMaterial({
        map:tex,
        wireframe: true,     
        side:THREE.DoubleSide 
    });  


    var mesh = new THREE.Mesh(geometry, mat);
    mesh.position.set(0.0, 0.0, 0.0);

    mesh.receiveShadow = true;

    scene.add(mesh);

}

function getPixel( imagedata, x, y )
{
    var position = ( x + imagedata.width * y ) * 4, data = imagedata.data;
    return data[ position ];; 
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
            object.castShadow = true;

            object.traverse( function( child)
            {
                if(child instanceof THREE.Mesh)
                {
                    child.castShadow = true;
                }
            });
            for (var i = 0; i<N/3; i++)
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

function loadAnimatedModel(path) //где path – путь и название модели
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
        mesh.receiveShadow = true;

        scene.add( mesh );
        morphs.push( mesh );

 } );
}
