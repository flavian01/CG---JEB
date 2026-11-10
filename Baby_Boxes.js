// Jack E. Boeckle - Computer Graphics Project 5

var canvas = document.getElementById("renderCanvas");

var startRenderLoop = function (engine, canvas) {
    engine.runRenderLoop(function () {
        if (sceneToRender && sceneToRender.activeCamera) {
            sceneToRender.render();
        }
    });
}

var engine = null;
var scene = null;
var sceneToRender = null;
var createDefaultEngine = function() { return new BABYLON.Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true,  disableWebGL2Support: false}); };
        
var camera;

var createScene = async function () {
   /* --------------------------------------------------
      1. BASIC SCENE SETUP - Green Hill inspired level
      Jack E. Boeckle - Project 5
   -------------------------------------------------- */
   const scene = new BABYLON.Scene(engine);
   scene.clearColor = new BABYLON.Color4(0.49, 0.78, 0.98, 1);
   scene.createDefaultEnvironment({createGround:false, createSkybox:false, environmentIntensity:1.0});
   const light = new BABYLON.HemisphericLight("sun", new BABYLON.Vector3(0,1,0), scene);
   light.intensity = 0.95;
   const sun = new BABYLON.DirectionalLight("directionalSun", new BABYLON.Vector3(-1,-2,-1), scene);
   sun.intensity = 0.55;
   camera = new BABYLON.ArcRotateCamera("Camera", -Math.PI/2.7, 1.12, 49,
       new BABYLON.Vector3(0, 4, 0), scene);
   camera.lowerRadiusLimit = 15;
   camera.upperRadiusLimit = 100;
   camera.attachControl(canvas, true);

   const ground = BABYLON.MeshBuilder.CreateGround("ground", {width:120, height:90}, scene);
   const grass = new BABYLON.StandardMaterial("grass", scene);
   grass.diffuseColor = new BABYLON.Color3(0.23, 0.66, 0.20);
   ground.material = grass;
   ground.checkCollisions = true;

   /* --------------------------------------------------
      2. STACKED CHECKERBOARD BOXES AND OTHER SHAPES
   -------------------------------------------------- */
   const checker = new BABYLON.StandardMaterial("SonicCheckerTexture", scene);
   checker.diffuseTexture = new BABYLON.Texture("./woodenCrate_JEB.png", scene);
   const grassTop = new BABYLON.StandardMaterial("grassTop", scene);
   grassTop.diffuseColor = new BABYLON.Color3(0.18, 0.83, 0.15);
   const gold = new BABYLON.StandardMaterial("goldRings", scene);
   gold.diffuseColor = new BABYLON.Color3(1, 0.75, 0.04);
   gold.specularColor = new BABYLON.Color3(1, 0.9, 0.5);
   const blue = new BABYLON.StandardMaterial("sonicBlue", scene);
   blue.diffuseColor = new BABYLON.Color3(0.04, 0.23, 0.94);
   const white = new BABYLON.StandardMaterial("white", scene);
   white.diffuseColor = new BABYLON.Color3(1, 1, 1);
   const red = new BABYLON.StandardMaterial("red", scene);
   red.diffuseColor = new BABYLON.Color3(0.95, 0.08, 0.07);

   function platform(name, x, z, width, height, depth) {
       const block = BABYLON.MeshBuilder.CreateBox(name, {width, height, depth}, scene);
       block.position.set(x, height / 2, z);
       block.material = checker;
       block.isPickable = true;
       const turf = BABYLON.MeshBuilder.CreateBox(name + "GrassTop",
           {width:width+0.12, height:0.3, depth:depth+0.12}, scene);
       turf.position.set(x, height + 0.15, z);
       turf.material = grassTop;
       return block;
   }
   // Different sizes and heights demonstrate stacking.
   platform("largeBase", -12, 0, 11, 3, 10);
   platform("middleStack", -12, 0, 7, 6, 7);
   platform("topStack", -12, 0, 4, 9, 4);
   platform("centerPlatform", 0, 0, 11, 4, 10);
   platform("rightPlatform", 13, 0, 10, 6, 10);
   platform("smallRaisedBlock", 13, 0, 5, 9, 5);
   platform("backPlatform", 0, 14, 8, 2, 7);

   // Sonic-inspired blue ball and two eyes.
   const sonicBall = BABYLON.MeshBuilder.CreateSphere("blueSonicBall", {diameter:3.5}, scene);
   sonicBall.position.set(0, 6.15, 0);
   sonicBall.material = blue;
   const eyeL = BABYLON.MeshBuilder.CreateSphere("eyeLeft", {diameter:0.65}, scene);
   eyeL.position.set(-0.6, 6.65, -1.56); eyeL.material = white;
   const eyeR = BABYLON.MeshBuilder.CreateSphere("eyeRight", {diameter:0.65}, scene);
   eyeR.position.set(0.6, 6.65, -1.56); eyeR.material = white;

   // Torus rings stand vertically, with gentle spinning animation.
   const rings = [];
   [[-5,4.5,-3],[0,8,-3],[5,4.5,-3],[9,7.5,-3],[13,11,-3]].forEach((p,i) => {
       const ring = BABYLON.MeshBuilder.CreateTorus("goldRing"+i,
           {diameter:2.4, thickness:0.32, tessellation:36}, scene);
       ring.position.set(p[0],p[1],p[2]);
       ring.rotation.x = Math.PI/2;
       ring.material = gold;
       rings.push(ring);
   });
   scene.onBeforeRenderObservable.add(() => {
       rings.forEach((ring,i) => { ring.rotation.y += 0.008 + i*0.001; });
   });

   // Additional shape: cylinder tree trunk and sphere canopy.
   const brown = new BABYLON.StandardMaterial("treeBrown", scene);
   brown.diffuseColor = new BABYLON.Color3(0.47,0.23,0.08);
   const leaf = new BABYLON.StandardMaterial("leafGreen", scene);
   leaf.diffuseColor = new BABYLON.Color3(0.07,0.48,0.11);
   [[-26, -12],[25, 11]].forEach((p,i) => {
       const trunk = BABYLON.MeshBuilder.CreateCylinder("treeTrunk"+i,
           {height:7,diameter:1.6},scene);
       trunk.position.set(p[0],3.5,p[1]); trunk.material = brown;
       const canopy = BABYLON.MeshBuilder.CreateSphere("treeCanopy"+i,
           {diameter:6},scene);
       canopy.position.set(p[0],8,p[1]); canopy.material = leaf;
   });

   /* --------------------------------------------------
      3. IMPORT ORIGINAL HEART GLB MODEL
   -------------------------------------------------- */
   BABYLON.SceneLoader.ImportMesh("", "./", "HeartFinalized.glb", scene,
       function(meshes) {
           // Use a parent node to move the complete imported model together.
           const heartRoot = new BABYLON.TransformNode("heartRoot",scene);
           meshes.forEach(m => { if (!m.parent) m.parent = heartRoot; });
           heartRoot.position.set(13, 11, 0);
           heartRoot.scaling.setAll(3);
           console.log("Heart model loaded!");
       }, null, function(scene, message) {
           console.warn("Heart model could not be loaded:", message);
       });

   /* ———————————————————
   4.  WEB‑XR SETUP (unchanged)
    ———————————————————— */
    
    try {
    const xrHelper = await scene.createDefaultXRExperienceAsync({
       floorMeshes: [ground]
    });

    let grabbedMesh = null;
    xrHelper.input.onControllerAddedObservable.add((controller) => {
    controller.onMotionControllerInitObservable.add((mc) => {
    if (mc.handness === "left") {
        const trigger = mc.getComponent(mc.getComponentIds()[0]); // xr-standard-trigger
        trigger.onButtonStateChangedObservable.add(() => {
        if (trigger.changes.pressed) {
            if (trigger.pressed) {
              grabbedMesh = xrHelper.pointerSelection.getMeshUnderPointer(controller.uniqueId);
              if (grabbedMesh && grabbedMesh !== ground) {
                grabbedMesh.setParent(mc.rootMesh); // grab
              }
              } else {
                 grabbedMesh && grabbedMesh.setParent(null); // release
              }
        }
        });
                                }
    });
    });

    } catch (error) { console.warn("WebXR unavailable:", error); }
    return scene;
    };


    window.initFunction = async function() {
                                
    var asyncEngineCreation = async function() {
        try {
            return createDefaultEngine();
        } catch(e) {
            console.log("the available createEngine function failed. Creating the default engine instead");
            return createDefaultEngine();
                        }
        }

        window.engine = await asyncEngineCreation();
                    
        const engineOptions = window.engine.getCreationOptions?.();
        if (!engineOptions || engineOptions.audioEngine !== false) {
                        
        }
        if (!engine) throw 'engine should not be null.';
        startRenderLoop(engine, canvas);
        window.scene = createScene();};
        initFunction().then(() => {scene.then(returnedScene => { sceneToRender = returnedScene; });
        
        });

        // Resize
        window.addEventListener("resize", function () {
           engine.resize();
        });
  