import * as THREE from 'three'
import { WEBGL } from './webgl'
import './modal'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';


if (WEBGL.isWebGLAvailable()) {

    const backgroundColor = 0xFAFAFA;
    var renderCalls = [];

    /* loading cubemap */
    let materialArray = [];
    let texture_ft = new THREE.TextureLoader().load( '../static/models/cubemap/posx.jpg');
    let texture_bk = new THREE.TextureLoader().load( '../static/models/cubemap/negx.jpg');
    let texture_up = new THREE.TextureLoader().load( '../static/models/cubemap/posy.jpg');
    let texture_dn = new THREE.TextureLoader().load( '../static/models/cubemap/negy.jpg');
    let texture_rt = new THREE.TextureLoader().load( '../static/models/cubemap/posz.jpg');
    let texture_lf = new THREE.TextureLoader().load( '../static/models/cubemap/negz.jpg');
        
    materialArray.push(new THREE.MeshBasicMaterial( { map: texture_ft }));
    materialArray.push(new THREE.MeshBasicMaterial( { map: texture_bk }));
    materialArray.push(new THREE.MeshBasicMaterial( { map: texture_up }));
    materialArray.push(new THREE.MeshBasicMaterial( { map: texture_dn }));
    materialArray.push(new THREE.MeshBasicMaterial( { map: texture_rt }));
    materialArray.push(new THREE.MeshBasicMaterial( { map: texture_lf }));

    // rendering cube only inside
    for (let i = 0; i < 6; i++)
        materialArray[i].side = THREE.BackSide;

    // main render function
    function render () {
        requestAnimationFrame( render );
        animate();
        renderCalls.forEach((callback)=>{ callback(); });
    }

    // scene generation
    var scene = new THREE.Scene();

    // initial camera args
    const fov = 45;
    const aspect = window.innerWidth / window.innerHeight;
    const near = 0.1;
    const far = 100;
    const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);

    // setting renderer with args
    var renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.setClearColor( backgroundColor );//0x );

    renderer.toneMapping = THREE.LinearToneMapping;
    renderer.toneMappingExposure = Math.pow( 0.94, 5.0 );
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;

    // correction of camera and rendering settings when the window size is changed
    window.addEventListener( 'resize', function () {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize( window.innerWidth, window.innerHeight );
    }, false );
    
    // add result to html
    document.body.appendChild( renderer.domElement);

    function renderScene(){ renderer.render( scene, camera ); }
    renderCalls.push(renderScene);

    /* control settings */
    var controls = new OrbitControls( camera, renderer.domElement );
    controls.target.set(0, 5, 0);
    controls.update();

    controls.rotateSpeed = 0.9;
    controls.zoomSpeed = 0.9;

    controls.minPolarAngle = 0; // radians
    controls.maxPolarAngle = Math.PI /2 + 0.5; // radians 

    controls.enableDamping = true;
    controls.dampingFactor = 0.5;

    renderCalls.push(function(){
        controls.update()
    });


    /* lights */
    var lightPoint = new THREE.PointLight( 0xffffcc, 30, 200 );
    lightPoint.position.set( 4, 30, -20 );
    scene.add( lightPoint );

    var light2 = new THREE.AmbientLight( 0x20202A, 20, 1000 );
    light2.position.set( 30, -10, 30 );
    scene.add( light2 );

    var keyLight = new THREE.DirectionalLight(new THREE.Color('hsl(30, 100%, 75%)'), 1.0);
    keyLight.position.set(-100, 0, 100);

    var fillLight = new THREE.DirectionalLight(new THREE.Color('hsl(240, 100%, 75%)'), 0.75);
    fillLight.position.set(100, 0, 100);

    var backLight = new THREE.DirectionalLight(0xffffff, 1.0);
    backLight.position.set(100, 0, -100).normalize();

    var light = new THREE.DirectionalLight(0xFFFFFF, 100);
    light.position.set(0, 10, 0);
    scene.add(light);
    
    scene.add(keyLight);
    scene.add(fillLight);
    scene.add(backLight);

    var angle = 0;

    // camera rotation
    function animate() {
        camera.translateX(0.001)
        angle += 1;

        if(angle < 180){
            camera.translateZ(0.0002)
        }
        else{
            camera.translateZ(-0.0002)
        }

        if (angle > 360) { angle = 0;};
    }

    /* camera perspective settings */
    function frameArea(sizeToFitOnScreen, boxSize, boxCenter, camera) {
        const halfSizeToFitOnScreen = sizeToFitOnScreen * 0.5;
        const halfFovY = THREE.MathUtils.degToRad(camera.fov * .5);
        const distance = halfSizeToFitOnScreen / Math.tan(halfFovY);
        
        // a unit vector calculation that indicates the direction for the camera
        const direction = (new THREE.Vector3())
            .subVectors(camera.position, boxCenter)
            .multiply(new THREE.Vector3(1, 0.6, 1))
            .normalize();
    
        // move the camera to a position distance units way from the center
        // in whatever direction the camera was from the center already
        camera.position.copy(direction.multiplyScalar(distance).add(boxCenter));
    
        // pick some near and far values for the frustum that
        // will contain the box.
        camera.near = boxSize / 100;
        camera.far = boxSize * 100;
    
        camera.updateProjectionMatrix();
    
        // point the camera to look at the center of the box
        camera.lookAt(boxCenter.x, boxCenter.y, boxCenter.z);
    }

    // add skybox
    let skyboxGeo = new THREE.BoxGeometry( 10, 10, 10);
    let skybox = new THREE.Mesh( skyboxGeo, materialArray );
    scene.add( skybox );

    // gltf object loader
    var loader = new GLTFLoader();
        loader.crossOrigin = true;
        loader.load( '../static/models/scene.gltf', function ( gltf ) {
        
        const beerScene = gltf.scene;
        scene.add(beerScene);

        const box = new THREE.Box3().setFromObject(beerScene);
        const boxSize = box.getSize(new THREE.Vector3()).length();
        const boxCenter = box.getCenter(new THREE.Vector3());

        // set camera
        frameArea(boxSize * 1.3, boxSize, boxCenter, camera);

        // update controls
        controls.maxDistance = boxSize * 10;
        controls.minDistance = boxSize * 0.25;
        controls.target.copy(boxCenter);
        controls.update();
    });

    // start rendering
    render();
} 
else {
  var warning = WEBGL.getWebGLErrorMessage()
  document.body.appendChild(warning)
}