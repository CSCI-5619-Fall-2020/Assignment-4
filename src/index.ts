/* CSCI 5619 Assignment 4, Fall 2020
 * Author: Evan Suma Rosenberg
 * License: Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International
 */ 

import { Engine } from "@babylonjs/core/Engines/engine";
import { Scene } from "@babylonjs/core/scene";
import { Vector3, Color3 } from "@babylonjs/core/Maths/math";
import { UniversalCamera } from "@babylonjs/core/Cameras/universalCamera";
import { WebXRInputSource } from "@babylonjs/core/XR/webXRInputSource";
import { WebXRCamera } from "@babylonjs/core/XR/webXRCamera";
import { PointLight } from "@babylonjs/core/Lights/pointLight";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { Sound } from "@babylonjs/core/Audio/sound"
import { Logger } from "@babylonjs/core";

// MeshBuilder
import {MeshBuilder} from  "@babylonjs/core/Meshes/meshBuilder";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";

// Side effects
import "@babylonjs/loaders/glTF/2.0/glTFLoader";
import "@babylonjs/core/Helpers/sceneHelpers";

// Import debug layer
import "@babylonjs/inspector";

// Note: The structure has changed since previous assignments because we need to handle the 
// async methods used for setting up XR. In particular, "createDefaultXRExperienceAsync" 
// needs to load models and create various things.  So, the function returns a promise, 
// which allows you to do other things while it runs.  Because we don't want to continue
// executing until it finishes, we use "await" to wait for the promise to finish. However,
// await can only run inside async functions. https://javascript.info/async-await
class Game 
{ 
    private canvas: HTMLCanvasElement;
    private engine: Engine;
    private scene: Scene;

    private xrCamera: WebXRCamera | null; 
    private leftController: WebXRInputSource | null;
    private rightController: WebXRInputSource | null;

    private targetRoot: TransformNode | null;

    constructor()
    {
        // Get the canvas element 
        this.canvas = document.getElementById("renderCanvas") as HTMLCanvasElement;

        // Generate the BABYLON 3D engine
        this.engine = new Engine(this.canvas, true); 

        // Creates a basic Babylon Scene object
        this.scene = new Scene(this.engine);   

        this.xrCamera = null;
        this.leftController = null;
        this.rightController = null;

        this.targetRoot = null;
    }

    start() : void 
    {
        // Create the scene and then execute this function afterwards
        this.createScene().then(() => {

            // Register a render loop to repeatedly render the scene
            this.engine.runRenderLoop(() => { 
                this.update();
                this.scene.render();
            });

            // Watch for browser/canvas resize events
            window.addEventListener("resize", () => { 
                this.engine.resize();
            });
        });
    }

    private async createScene() 
    {
        // This creates and positions a first-person camera (non-mesh)
        var camera = new UniversalCamera("camera1", new Vector3(0, 1.6, 0), this.scene);
        camera.fov = 90 * Math.PI / 180;
        camera.minZ = .1;
        camera.maxZ = 100;

        // This attaches the camera to the canvas
        camera.attachControl(this.canvas, true);

        // Create a point light
        var pointLight = new PointLight("pointLight", new Vector3(0, 2.5, 0), this.scene);
        pointLight.intensity = 1.0;
        pointLight.diffuse = new Color3(.25, .25, .25);

        // Creates a default skybox
        const environment = this.scene.createDefaultEnvironment({
            createGround: true,
            groundSize: 50,
            skyboxSize: 50,
            skyboxColor: new Color3(0, 0, 0)
        });

        // Creates the XR experience helper
        const xrHelper = await this.scene.createDefaultXRExperienceAsync({});

        // Assigns the web XR camera and controllers to member variables
        this.xrCamera = xrHelper.baseExperience.camera;
        xrHelper.input.onControllerAddedObservable.add((inputSource) =>
        {
            if(inputSource.uniqueId.endsWith("left")) 
            {
                this.leftController = inputSource;
            }
            else 
            {
                this.rightController = inputSource;
            }  
        });

        // The target root will be used to move the objects all at once
        this.targetRoot = new TransformNode("targetRoot", this.scene);

        // Create an example cube
        var exampleCube = MeshBuilder.CreateBox("exampleCube", {size: .1}, this.scene);
        exampleCube.position = new Vector3(.5, 1.5, 10);
        exampleCube.parent = this.targetRoot;
        
        // Create a simple blue emissive material
        var blueMaterial = new StandardMaterial("blueMaterial", this.scene);
        blueMaterial.diffuseColor = new Color3(.284, .73, .831);
        blueMaterial.specularColor = Color3.Black();
        blueMaterial.emissiveColor = new Color3(.284, .73, .831);
        exampleCube.material = blueMaterial;

        // Set autoplay to true for a fun soundtrack
        var music = new Sound("music", "assets/music/hyperspace.mp3", this.scene, null, {
            loop: false,
            autoplay: false
        });

        this.scene.debugLayer.show();
    }

    // The main update loop will be executed once per frame before the scene is rendered
    private update() : void
    {
        // The distance is the target speed multiplied by the
        // time elapsed since the last frame update in seconds 
        var targetMoveDistance = 2 * (this.engine.getDeltaTime() / 1000);

        // Translate the target root by the calculated distance
        this.targetRoot?.translate(Vector3.Backward(), targetMoveDistance);
    }
}
/******* End of the Game class ******/   

// start the game
var game = new Game();
game.start();