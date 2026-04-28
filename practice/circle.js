const canvas = document.getElementById("canvas");
// initialize 3d rendering context
const gl = canvas.getContext(`webgl2`);


function circleTriangle(){
    //STEP1: make fragment shader and vertex shader

    const vertexShaderSource = `#version 300 es
        precision mediump float;
        in vec2 vertexPosition;

        void main(){
            gl_Position = vec4(vertexPosition, 0.0, 1.0);
        }`;

    const vertexShader = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(vertexShader, vertexShaderSource);
        gl.compileShader(vertexShader);

    const fragmentShaderSource = `#version 300 es
        precision mediump float; 
        out vec4 outputColor; 

        void main(){
        outputColor = vec4(0.294, 0.0, 0.51, 1.0);
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

    //STEP 3: Triangle/circle vertices

    const circleVertices = []; 

    const centerx = 0; 
    const centery = 0; 
    const radius = 0.5; 
    const segments = 64; 

    circleVertices. push(centerx, centery) //becomes center point

    for (let i = 0; i <= segments; i++){
        const angle = (2* Math.PI * i)/segments; 
        const x = centerx + radius * Math.cos(angle); 
        const y = centery + radius * Math.sin(angle); 
        circleVertices.push(x,y);
    }

    //STEP 3: create buffer

    const circleGeoCpuBuffer = new Float32Array(circleVertices);


    const circleBuffer = gl.createBuffer(); 
    gl.bindBuffer(gl.ARRAY_BUFFER, circleBuffer); 
    gl.bufferData(gl.ARRAY_BUFFER, circleGeoCpuBuffer, gl.STATIC_DRAW);


    //STEP 4: attrib

    const vertexPositionAttribLocation = gl.getAttribLocation(circleShaderProgram, 'vertexPosition');
    gl.enableVertexAttribArray(vertexPositionAttribLocation);
    gl.vertexAttribPointer(vertexPositionAttribLocation, 
            2, 
            gl.FLOAT, 
            false, 
            2 * Float32Array.BYTES_PER_ELEMENT,
            0
    );

    // STEP 5 : draw

    gl.clearColor(0.08, 0.08, 0.08, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT |gl.DEPTH_BUFFER_BIT);
    // gl.drawArrays(gl.TRIANGLE_FAN, 0, circleVertices.length/2);
    gl.drawArrays(gl.LINE_LOOP, 1, segments);
}

circleTriangle(); 
