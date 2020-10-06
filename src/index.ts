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
import { AssetsManager } from "@babylonjs/core/Misc/assetsManager"
import { Logger } from "@babylonjs/core/Misc/logger";

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

    private silence : Sound | null;
    private music : Sound | null;

    private gameStarted: boolean;
    private sceneRoot: TransformNode | null;
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

        this.silence = null;
        this.music = null;

        this.gameStarted = false;
        this.sceneRoot = null;
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

        // Creates the XR experience helper and disable teleportation
        const xrHelper = await this.scene.createDefaultXRExperienceAsync({});
        xrHelper.teleportation.dispose();

        // Assign the xrCamera to a member variable
        this.xrCamera = xrHelper.baseExperience.camera;

        // Make sure the origin is set correctly
        xrHelper.baseExperience.onInitialXRPoseSetObservable.add((camera) => {
             this.sceneRoot!.position.x = camera.position.x;
             this.sceneRoot!.position.z = camera.position.z;
        });

        // This executes when the user enters or exits immersive mode
        xrHelper.enterExitUI.activeButtonChangedObservable.add((enterExit) => {
            if(enterExit)
            {
                // Start the game only in immersive mode
                this.gameStarted = true;

                // Need to set both play and autoplay depending on
                // whether the music has finished loading or not
                if(this.music)
                {
                    this.music.autoplay = true;
                    this.music.play();
                }            
            }
            else
            {
                // Pause the game and music upon exit
                this.gameStarted = false;
                this.music?.pause();
            }
        });

        // Assigns the controllers
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

        this.sceneRoot = new TransformNode("sceneRoot", this.scene);

        // The target root will be used to move the objects all at once
        this.targetRoot = new TransformNode("targetRoot", this.scene);
        this.targetRoot.parent = this.sceneRoot;

        // Create an example cube
        var exampleCube = MeshBuilder.CreateBox("exampleCube", {size: .1}, this.scene);
        exampleCube.position = new Vector3(.5, 1.6, 10);
        exampleCube.parent = this.targetRoot;
        
        // Create a simple blue emissive material
        var blueMaterial = new StandardMaterial("blueMaterial", this.scene);
        blueMaterial.diffuseColor = new Color3(.284, .73, .831);
        blueMaterial.specularColor = Color3.Black();
        blueMaterial.emissiveColor = new Color3(.284, .73, .831);
        exampleCube.material = blueMaterial;

        // The assets manager can be used to load multiple assets
        var assetsManager = new AssetsManager(this.scene);

        // Load a silent audio track
        // This is necessary to get the unmute icon to appear at the beginning
        var silenceTask = assetsManager.addBinaryFileTask("silence task", "assets/audio/silence.wav");
        silenceTask.onSuccess = (task) => {
            this.silence = new Sound("silence", task.data, this.scene, null, {
                loop: true,
                autoplay: true
            });
        }

        // Feel free to add your own custom music track
        var musicTask = assetsManager.addBinaryFileTask("music task", "assets/audio/hyperspace.mp3");
        musicTask.onSuccess = (task) => {
            // If the game has already started, then autoplay the music
            this.music = new Sound("music", task.data, this.scene, null, {
                loop: false,
                autoplay: this.gameStarted
            });
        }
        
        // This loads all the assets and displays a loading screen
        assetsManager.load();

        // This will execute when all assets are loaded
        assetsManager.onFinish = (tasks) => {

            // Show the debug layer
            this.scene.debugLayer.show();
        };  
    }

    // The main update loop will be executed once per frame before the scene is rendered
    private update() : void
    {
        // Make sure the game has started and music is playing
        if(this.gameStarted && this.music?.isPlaying)
        {
            // The distance is the target speed multiplied by the
            // time elapsed since the last frame update in seconds 
            var targetMoveDistance = 2 * (this.engine.getDeltaTime() / 1000);

            // Translate the target root by the calculated distance
            this.targetRoot?.translate(Vector3.Backward(), targetMoveDistance);
        }
    }

}
/******* End of the Game class ******/   

// start the game
var game = new Game();
game.start();