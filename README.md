# Assignment 4: Making Beat Saber in Babylon

**Due: Monday, October 12, 10:00pm CDT**

[Beat Saber](https://beatsaber.com/) is widely considered to be one of the best and most successful virtual reality games.  There is a free demo available for the Oculus Quest, which you can find in the official store app.  Before beginning this assignment, I suggest that you download this demo to familiarize yourself with the gameplay. 

In this assignment, you will be implementing Beat Saber's core mechanics.  The template code includes a very simple scene with a single cube that flies towards the user.  You do not 

## Submission Information

You should fill out this information before submitting your assignment.  Make sure to document the name and source of any third party assets such as 3D models, textures, or any other content used that was not solely written by you.  Include sufficient detail for the instructor or TA to easily find them, such as asset store or download links.

Name: 

UMN Email:

Build URL:

Third Party Assets:

## Rubric

Graded out of 20 points.  

1. Add a saber sticking out of the top of the controller.
2. Cube object disappears on contact with saber.  Use dispose.
3. Sound effect and when the cube disappears.
4. Random cube spawning every few seconds.  Try to time it to the beat.
5. When you get more than 8 cubes in a scene, dispose of the oldest one.  No infinite cubes!
6. Randomly spawn spheres.  If the user's head touches a sphere, the objects stop moving.
7. If the user selects the sphere with the laser pointer, it will explode.  Particle effect.
8. Change the cubes so that instead of disappearing, they will bounce away using physics.  Make sure they don't fall through the floor.

**Bonus Challenge:** Directionality to swing. (2)

Make sure to document all third party assets. ***Be aware that points will be deducted for using third party assets that are not properly documented.***

## Submission

You will need to check out and submit the project through GitHub classroom.  The project folder should contain just the additions to the sample project that are needed to implement the project.  Do not add extra files, and do not remove the `.gitignore` file (we do not want the "node_modules" directory in your repository.)

**Do not change the names** of the existing files.  The TA needs to be able to test your program as follows:

1. cd into the directory and run ```npm install```
2. start a local web server and compile by running ```npm run start``` and pointing the browser at your ```index.html```

Please test that your submission meets these requirements.  For example, after you check in your final version of the assignment to GitHub, check it out again to a new directory and make sure everything builds and runs correctly.

## Local Development 

After checking out the project, you need to initialize by pulling the dependencies with:

```
npm install
```

After that, you can compile and run a server with:

```
npm run start
```

Under the hood, we are using the `npx` command to both build the project (with webpack) and run a local http webserver on your machine.  The included ```package.json``` file is set up to do this automatically.  You do not have to run ```tsc``` to compile the .js files from the .ts files;  ```npx``` builds them on the fly as part of running webpack.

You can run the program by pointing your web browser at ```https://your-local-ip-address:8080```.  

## Build and Deployment

After you have finished the assignment, you can build a distribution version of your program with:

```
npm run build
```

Make sure to include your assets in the `dist` directory.  The debug layer should be disabled in your final build.  Upload it to your public `.www` directory, and make sure to set the permissions so that it loads correctly in a web browser.  You should include this URL in submission information section of your `README.md` file. 

This project also includes a `deploy.sh` script that can automate the process of copying your assets to the `dist` directory, deploying your build to the web server, and setting public permissions.  To use the script, you will need to use a Unix shell and have`rsync` installed.  If you are running Windows 10, then you can use the [Windows Subsystem for Linux](https://docs.microsoft.com/en-us/windows/wsl/install-win10).  Note that you will need to fill in the missing values in the script before it will work.

## License

Material for [CSCI 5619 Fall 2020](https://canvas.umn.edu/courses/194179) by [Evan Suma Rosenberg](https://illusioneering.umn.edu/) is licensed under a [Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License](http://creativecommons.org/licenses/by-nc-sa/4.0/).

The intent of choosing CC BY-NC-SA 4.0 is to allow individuals and instructors at non-profit entities to use this content.  This includes not-for-profit schools (K-12 and post-secondary). For-profit entities (or people creating courses for those sites) may not use this content without permission (this includes, but is not limited to, for-profit schools and universities and commercial education sites such as Coursera, Udacity, LinkedIn Learning, and other similar sites).   

## Acknowledgments

This assignment was partially based upon content from the [3D User Interfaces Fall 2020](https://github.blairmacintyre.me/3dui-class-f20) course by Blair MacIntyre and was inspired by the [Making Beat Saber in 10 Minutes](https://www.youtube.com/watch?v=gh4k0Q1Pl7E) video on YouTube.

The included example music is "Hyperspace - Lightyears Away" from the [Star Control 2 Music Remix Project](http://www.medievalfuture.com/precursors/music.php).

