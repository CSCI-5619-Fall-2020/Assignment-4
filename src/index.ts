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
import { Sound } from "@babylonjs/core/Audio/sound"
import { AssetsManager } from "@babylonjs/core/Misc/assetsManager"
import { Logger } from "@babylonjs/core/Misc/logger";

// Physics
import * as Cannon from "cannon"
import { CannonJSPlugin } from "@babylonjs/core/Physics/Plugins/cannonJSPlugin";
import { PhysicsImpostor } from "@babylonjs/core/Physics/physicsImpostor";
import "@babylonjs/core/Physics/physicsEngineComponent";

// MeshBuilder
import {MeshBuilder} from  "@babylonjs/core/Meshes/meshBuilder";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";

// Side effects
import "@babylonjs/loaders/glTF/2.0/glTFLoader";
import "@babylonjs/core/Helpers/sceneHelpers";

// Import debug layer
import "@babylonjs/inspector";
import { Mesh } from "@babylonjs/core/Meshes/mesh";

/******* Start of the Game class ******/ 
class Game 
{ 
    private canvas: HTMLCanvasElement;
    private engine: Engine;
    private scene: Scene;

    private xrCamera: WebXRCamera | null; 
    private leftController: WebXRInputSource | null;
    private rightController: WebXRInputSource | null;

    private music : Sound | null;

    private exampleCube: Mesh | null;

    private gameStarted: boolean;
    private gamePaused: boolean;

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

        this.music = null;

        this.gameStarted = false;
        this.gamePaused = true;

        this.exampleCube = null;
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

        // Disable teleportation and the laser pointer
        xrHelper.teleportation.dispose();
        xrHelper.pointerSelection.dispose();

        // Assign the xrCamera to a member variable
        this.xrCamera = xrHelper.baseExperience.camera;

        // This executes when the user enters or exits immersive mode
        xrHelper.enterExitUI.activeButtonChangedObservable.add((enterExit) => {
            // If we are entering immersive mode
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
            // This boolean flag is necessary to prevent the pause function
            // from being executed twice (this may be a bug in the xrHelper)
            else if(!this.gamePaused)
            {
                // Pause the game and music upon exit
                this.gameStarted = false;
                this.pause();  
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

        // Enable physics engine with no gravity
        this.scene.enablePhysics(new Vector3(0, 0, 0), new CannonJSPlugin(undefined, undefined, Cannon));

        // Create an example cube that flies towards the user
        this.exampleCube = MeshBuilder.CreateBox("exampleCube", {size: .1}, this.scene);
        this.exampleCube.position = new Vector3(.5, 1.6, 10);
        this.exampleCube.physicsImpostor = new PhysicsImpostor(this.exampleCube, PhysicsImpostor.BoxImpostor, {mass: 1}, this.scene);
        this.exampleCube.physicsImpostor.sleep();
        
        // Create a simple blue emissive material
        var blueMaterial = new StandardMaterial("blueMaterial", this.scene);
        blueMaterial.diffuseColor = new Color3(.284, .73, .831);
        blueMaterial.specularColor = Color3.Black();
        blueMaterial.emissiveColor = new Color3(.284, .73, .831);
        this.exampleCube.material = blueMaterial;

        // The assets manager can be used to load multiple assets
        var assetsManager = new AssetsManager(this.scene);

        // Load a silent audio track
        // This is necessary to get the unmute icon to appear at the beginning
        var silenceTask = assetsManager.addBinaryFileTask("silence task", "assets/audio/silence.wav");
        silenceTask.onSuccess = (task) => {
            new Sound("silence", task.data, this.scene, null, {
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
        // Make sure the game has started and music is playing to unpause
        if(this.gamePaused && this.gameStarted && this.music?.isPlaying)
        {
            this.resume();
        }
    }

    private resume() : void
    {
        this.gamePaused = false;
        this.exampleCube?.physicsImpostor?.wakeUp();
        this.exampleCube?.physicsImpostor?.setLinearVelocity(new Vector3(0, 0, -2));
    }

    private pause() : void
    {
        this.gamePaused = true;
        this.music?.pause();
        this.exampleCube?.physicsImpostor?.sleep();
    }

}
/******* End of the Game class ******/   

// start the game
var game = new Game();
game.start();