const canvas = document.getElementById("canvas");
// initialize 3d rendering context
const gl = canvas.getContext(`webgl2`);

const { mat4, vec3, quat } = glMatrix;

canvas.width = 1200; 
canvas.height = 1200; 
gl.viewport(0, 0, canvas.width, canvas.height);


const overlay = document.getElementById("overlay"); //.getContext("2d"); 
const ctx = overlay.getContext("2d")
let ammoSpeed = 0.15; 
let gameOver = false; 

const keys = {}; 

window.addEventListener("keydown", e => {
    keys[e.key] = true;

    if (["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].includes(e.key)) {
        movingObject.manual = true;
    }
});
window.addEventListener("keyup", e => {
    keys[e.key] = false;

    if (!keys["ArrowUp"] && !keys["ArrowDown"] &&
        !keys["ArrowLeft"] && !keys["ArrowRight"]) {
        movingObject.manual = false;
    }
});

window.addEventListener("keydown", e => {
    if (e.key === "r" || e.key === "R"){
        location.reload();
    }
});


const movingObject = {
    position: vec3.fromValues(10,0,10), //start position
    speed: 0.01, //units per frame
    target:vec3.fromValues(0,0,0), //cub at center
    detected: false
};

const ammo = [];

    //STEP1: make fragment shader and vertex shader
    //add shader that supports matrices

    const vertexShaderSource = `#version 300 es
        precision mediump float;
        in vec3 vertexPosition;
        in vec2 vertexUV;

        out vec2 vUV;

        uniform mat4 uModel; 
        uniform mat4 uView; 
        uniform mat4 uProjection; 

        void main(){
            vUV = vertexUV;
            vec4 pos = vec4(vertexPosition, 1.0);
            // gl_Position = vec4(vertexPosition, 0.0, 1.0);
            gl_Position = uProjection* uView * uModel *pos;
        }`;

    const vertexShader = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(vertexShader, vertexShaderSource);
        gl.compileShader(vertexShader);

    //build perspective projection matrix
    const projection = mat4.perspective([], Math.PI/4, canvas.width/canvas.height, 0.1, 100);
    //create camera (looking at ground)
    const view = mat4.lookAt([], [0,20,20], [0,0,0], [0,1,0]);
    //place radar on ground
    const model = mat4.fromRotation([], -Math.PI/2, [1,0,0] );///lay flat



    const fragmentShaderSource = `#version 300 es
        precision mediump float; 
        uniform sampler2D uTexture;
        uniform float uAlpha;
        // uniform vec3 uColor;
        in vec2 vUV;
        out vec4 outputColor; 


        void main(){
            vec4 tex = texture(uTexture, vUV);
            outputColor = vec4(tex.rgb, uAlpha);
        }`;

    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER); 
        gl.shaderSource(fragmentShader, fragmentShaderSource); 
        gl.compileShader(fragmentShader);


    // STEP 2: attach and link shader

    const circleShaderProgram = gl.createProgram();
        gl.attachShader(circleShaderProgram, vertexShader);
        gl.attachShader(circleShaderProgram, fragmentShader);
        gl.linkProgram(circleShaderProgram);
        gl.useProgram(circleShaderProgram);


    const vertexPositionAttribLocation = gl.getAttribLocation(circleShaderProgram, 'vertexPosition');

    //enable blending
    gl.enable(gl.BLEND); 
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    const uAlphaLoc = gl.getUniformLocation(circleShaderProgram, "uAlpha");
    const uColorLoc = gl.getUniformLocation(circleShaderProgram, "uColor");
    const uTextureLoc = gl.getUniformLocation(circleShaderProgram, "uTexture");
    gl.uniform1i(uTextureLoc, 0);


    //link program 
    gl.useProgram(circleShaderProgram);
    gl.enable(gl.DEPTH_TEST);


    const uModelLoc = gl.getUniformLocation(circleShaderProgram, "uModel");
    const uViewLoc = gl.getUniformLocation(circleShaderProgram, "uView");
    const uProjectionLoc = gl.getUniformLocation(circleShaderProgram, "uProjection");

    //send matrices to the shader
    gl.uniformMatrix4fv(uModelLoc, false, model); 
    gl.uniformMatrix4fv(uViewLoc, false, view); 
    gl.uniformMatrix4fv(uProjectionLoc, false, projection);


    gl.clearColor(0.0, 0.0, 0.08, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);


function circleTriangle(centerx, centery, radius){


    //STEP 3: Triangle/circle vertices

    const circleVertices = []; 

    //const centerx = 0; 
    //const centery = 0; 
    //const radius = 0.5; 
    const segments = 64; 

    // circleVertices. push(centerx, centery) //becomes center point

    for (let i = 0; i <= segments; i++){
        const angle = (2* Math.PI * i)/segments; 
        const x = centerx + radius * Math.cos(angle); 
        const y = centery + radius * Math.sin(angle); 
        circleVertices.push(x,y, 0.0);
    }

    //STEP 3: create buffer

    //vertex array 
    const vertexArray = gl.createVertexArray(); 
    gl.bindVertexArray(vertexArray);

    const circleGeoCpuBuffer = new Float32Array(circleVertices);

    const circleBuffer = gl.createBuffer(); 
    gl.bindBuffer(gl.ARRAY_BUFFER, circleBuffer); 
    gl.bufferData(gl.ARRAY_BUFFER, circleGeoCpuBuffer, gl.STATIC_DRAW);


    //STEP 4: attrib

    gl.enableVertexAttribArray(vertexPositionAttribLocation);
    gl.vertexAttribPointer(vertexPositionAttribLocation, 
            3, 
            gl.FLOAT, 
            false, 
            3 * Float32Array.BYTES_PER_ELEMENT,
            0
    );

    // STEP 5 : draw

    // gl.drawArrays(gl.TRIANGLE_FAN, 0, circleVertices.length/2);
    gl.uniform1f(uAlphaLoc, 1.0);
    gl.uniform3f(uColorLoc, 0.0, 1.0, 0.0);
    gl.drawArrays(gl.LINE_LOOP, 1, segments);

    
}

const terrainTexture = gl.createTexture(); 
const terrainImage = new Image(); 
terrainImage.src = "terrain.jpeg"; 

terrainImage.onload = () => { 
    gl.bindTexture(gl.TEXTURE_2D, terrainTexture); 
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE,terrainImage); 
    gl.generateMipmap(gl.TEXTURE_2D);
};

function drawTerrain(){
    const size = 50; 

    const vertices = new Float32Array([
        -size, 0, -size, 0, 0, 
        size, 0, -size, 1, 0, 
        size, 0, size, 1, 1,
        -size, 0, size, 0, 1
    ]);

    const indices = new Uint16Array([
        0,1,2,
        2,3,0
    ]);

    const vao = gl.createVertexArray(); 
    gl.bindVertexArray(vao); 

    const vbo = gl.createBuffer(); 
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo); 
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW); 

    gl.enableVertexAttribArray(vertexPositionAttribLocation);
    gl.vertexAttribPointer(
        vertexPositionAttribLocation,
        3,
        gl.FLOAT,
        false,
        5 * 4,
        0
    );


    // UVs
    const uvLoc = gl.getAttribLocation(circleShaderProgram, "vertexUV");
    gl.enableVertexAttribArray(uvLoc);
    gl.vertexAttribPointer(uvLoc, 2, gl.FLOAT, false, 5 * 4, 3 * 4);


    const ebo = gl.createBuffer()
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ebo); 
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices,gl.STATIC_DRAW );

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, terrainTexture);

    const terrainModel = mat4.create(); 
    gl.uniformMatrix4fv(uModelLoc, false, terrainModel);

    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);

}

// const scale = 500/800;
function drawCube(size = 0.2){
    const s = size/2; 

    const vertices = new Float32Array([
        //front face
        -s, -s, s, 
        s, -s, s, 
        s, s, s, 
        -s, s, s,
        //back face
        -s, -s, s, 
        s, -s, -s, 
        s, s, -s, 
        -s, -s, -s
    ]);

    const indices = new Uint16Array([
        //front
        0,1,2, 2,3,0, 
        //back 
        4,5,6, 6,7,4,
        //left
        4,0,3, 3,7,4,
        //right
        1,5,6, 6,2,1, 
        //top
        3,2,6, 6,7,3,
        //bottom
        4,5,1, 1,0,4
    ]);

    const vao = gl.createVertexArray(); 
    gl.bindVertexArray(vao); 

    const vbo = gl.createBuffer(); 
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo); 
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW); 

    gl.enableVertexAttribArray(vertexPositionAttribLocation);
    gl.vertexAttribPointer(vertexPositionAttribLocation, 3, gl.FLOAT, false, 0,0);

    const ebo = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ebo);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

    gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);
}


function drawSweep(radius = 8, width = 0.2){
    const angle1 = 0; 
    const angle2 = width;

    const vertices = new Float32Array([
        0,0,0,
        radius * Math.cos(angle1), 0, radius * Math.sin(angle1), 
        radius * Math.cos(angle2), 0, radius * Math.sin(angle2)
    ]);

    const vao = gl.createVertexArray(); 
    gl.bindVertexArray(vao); 

    const vbo = gl.createBuffer(); 
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo); 
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW); 

    gl.enableVertexAttribArray(vertexPositionAttribLocation); 
    gl.vertexAttribPointer(vertexPositionAttribLocation, 
        3,
        gl.FLOAT, 
        false, 
        0,
        0
    ); 

    gl.drawArrays(gl.TRIANGLES, 0, 3);

}

function drawSweepTrail(angle, radius = 8, width = 0.2, steps =20 ){
    for(let i = 0; i < steps;i++){
        const frac = i/steps; 
        const a = angle - frac * 0.4;
        const alpha = (1.0 - frac) * 0.25; 

        //trasnperency
        gl.uniform1f(uAlphaLoc, alpha);

        const sweepModel = mat4.create(); 
        mat4.copy(sweepModel, model);
        mat4.rotateZ(sweepModel, sweepModel, a);

        gl.uniformMatrix4fv(uModelLoc, false, sweepModel);

        drawSweep(radius, width);
    }
}

function updateObject(obj){

    if (obj.manual) {
        const speed = obj.speed * 2; // manual movement can be faster if you want

        if (keys["ArrowUp"])    obj.position[2] -= speed;
        if (keys["ArrowDown"])  obj.position[2] += speed;
        if (keys["ArrowLeft"])  obj.position[0] -= speed;
        if (keys["ArrowRight"]) obj.position[0] += speed;

        return; // skip auto‑tracking
    }
    const dir = vec3.create(); 
    vec3.subtract(dir, obj.target, obj.position); 
    const dist = vec3.length(dir); 

    if (dist > 0.01){
        vec3.normalize(dir, dir); 
        vec3.scaleAndAdd(obj.position, obj.position, dir, obj.speed);
    }
}

function drawObject(obj){
    const modelObj = mat4.create(); 
    mat4.copy(modelObj, model); 
    mat4.translate(modelObj, modelObj, obj.position); 
    gl.uniformMatrix4fv(uModelLoc, false, modelObj);
    gl.uniform3f(uColorLoc, 1.0, 1.0, 0.0);
    drawCube(0.2);
}
function getObjectLoc(obj){
    const x = obj.position[0]; 
    const y = obj.position[1];

    const angle = Math.atan2(y,x); 
    const dist = Math.sqrt(x*x + y*y); 

    return {angle, dist};
}

function detectObject(obj, sweepAngle, sweepWidth, sweepRadius){
    const {angle, dist} = getObjectLoc(obj); 

    let a = angle; 
    let s = sweepAngle % (Math.PI *2); 
    if (a < 0){
        a += Math.PI *2;
    }
    if (s<0){
        s+= Math.PI *2;
    }

    //check if overlap
    const diff = Math.abs(a-s); 
    const angleHit = diff < sweepWidth;

    //check distance
    const distance = dist <= sweepRadius;

    return angleHit && distance;
}

let ammoCoolDown = 0; 
const ammoFireRate = 40;

function spawnAmmo(targetPosition){
    const dir = vec3.create(); 
    vec3.subtract(dir, targetPosition, [0,0,0]); 
    vec3.normalize(dir, dir);

    ammo.push({
        position: vec3.fromValues(0,0,0), 
        direction: dir, 
        speed: ammoSpeed * 0.15, 
        alive: true
    });
}

// function updateAmmo(){
//     for (const a of ammo){
//         if (!a.alive){ 
//             continue;
//         }
//         vec3.scaleAndAdd(a.position, a.position, a.direction,a.speed);
//         if (vec3.length(a.position) > 20){
//             a.alive = false;
//         }
//     }
// }

function updateAmmo(){
    for (const a of ammo){
        if (!a.alive) continue;

        vec3.scaleAndAdd(a.position, a.position, a.direction, a.speed);

        // collision check against moving object
        const dist = vec3.distance(a.position, movingObject.position);
        if (dist < 0.4){  // tweak threshold to feel right
            a.alive = false;
            movingObject.alive = false;
            gameOver = true;
        }

        if (vec3.length(a.position) > 20){
            a.alive = false;
        }
    }
}

function drawAmmo(){
    for (const a of ammo){
        if (!a.alive){
            continue;
        }
    const modelAmmo = mat4.create(); 
    mat4.copy(modelAmmo, model); 
    mat4.translate(modelAmmo, modelAmmo, a.position); 
    gl.uniformMatrix4fv(uModelLoc, false, modelAmmo);

    gl.uniform3f(uColorLoc, 1.0, 0.0, 0.0);
    gl.uniform1f(uAlphaLoc, 1.0);
    drawCube(0.2);
    }

}

// function objectReachedCenter(obj){ 
//     return vec3.length(obj.position) <0.3;
// }
function showGameOver(){
    ctx.clearRect(0, 0, overlay.width, overlay.height);
    ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
    ctx.fillRect(0, 0, overlay.width, overlay.height);

    ctx.fillStyle = "rgba(255, 0, 0, 1.0)";
    ctx.font = "bold 72px monospace";
    ctx.textAlign = "center";
    ctx.fillText("GAME OVER", overlay.width / 2, overlay.height / 2);

    ctx.fillStyle = "rgba(0, 255, 0, 0.8)";
    ctx.font = "24px monospace";
    ctx.fillText("Press R to restart", overlay.width / 2, overlay.height / 2 + 50);
}




let sweepAngle =0; 
function animate(){

    if (gameOver){
        showGameOver();
        return;  // stops requestAnimationFrame
    }


    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    updateObject(movingObject);
    // AUTO FIRE LOOP
    if (movingObject.detected && movingObject.alive !== false) {
        if (ammoCoolDown <= 0) {
            spawnAmmo(movingObject.position);
            ammoCoolDown = ammoFireRate;
        } else {
            ammoCoolDown--;
        }
    }

    if (movingObject.alive && objectReachedCenter(movingObject)){
        movingObject.alive = false; 
        movingObject.detected = false;
    }




    drawTerrain();

    //radar rings
    gl.uniformMatrix4fv(uModelLoc, false, model);
    circleTriangle(0.0,0.0,2.0);
    circleTriangle(0.0,0.0,4.0);
    circleTriangle(0.0,0.0,6.0);
    circleTriangle(0.0,0.0,8.0);

    //cube
    gl.uniformMatrix4fv(uModelLoc, false, model);
    gl.uniform3f(uColorLoc, 1.0, 1.0, 1.0);
    drawCube(0.3);

    // updateObject(movingObject);

    const hit = detectObject(movingObject, sweepAngle, 0.05, 8);
    if (hit && !movingObject.detected){
        movingObject.detected = true;
        spawnAmmo(movingObject.position);
    }
    drawObject(movingObject);
    updateAmmo();
    drawAmmo();


    //rotate around y axis
    drawSweepTrail(sweepAngle, 8, 0.15, 25);
    gl.uniform1f(uAlphaLoc, 0.6);
    const sweepModel = mat4.create(); 

    mat4.copy(sweepModel, model);
    //tilt
    mat4.rotateZ(sweepModel, sweepModel, sweepAngle);
    //send to shader
    gl.uniformMatrix4fv(uModelLoc, false, sweepModel);
    //draw sweep 
    gl.uniform3f(uColorLoc, 0.0, 1.0, 0.0);
    drawSweep(8, 0.05);
    sweepAngle += 0.09;


    requestAnimationFrame(animate);
}
animate();




