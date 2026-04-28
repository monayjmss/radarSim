// display error in text area
function showError(errorText){
    const errorBoxDiv = document.getElementById('error-box');
    const errorTextElement = document.createElement('p'); 
    errorTextElement.innerText = errorText; 
    errorBoxDiv.appendChild(errorTextElement);
    console.log(errorText);
}

showError("this is an error!");


function helloTriangle() {
    const canvas = document.getElementById('demo-canvas'); 
    if (!canvas){
        showError(`Could not get demo-canvas element`); 
        return;
    }
    const gl = canvas.getContext(`webgl2`); 
    if (!gl){
        //showError(`Browser does not supper WebGl2`); 
        const isWebGl1Supported = !!canvas.getContext('webgl'); 
        if (isWebGl1Supported){
            showError(`this broswer support wbgl 1 not 2`);
        }
        else{
            showError(`this broswer does not supprt WebGL`);
        }
        return;
    }

    //rgb opacity
    // gl.clearColor(0.08, 0.08, 0.08, 1.0);
    // gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    // gl.clear(gl.DEPTH_BUFFER_BIT);

    //vertices == current
    //js array of x,y position of triangle corners
    //x = 0 is y= -1 = bottom y = 1 = top
    const triangleVertices = [
        //top middle
        // x = 0
        0.0,0.5,
        //bottom left
        -0.5, -0.5,
        //bottom right 
        0.5, -0.5
    ];
    //GPUS like 32 bit floats, put it into palatable format
    const triangleGeoCpuBufer = new Float32Array(triangleVertices);

    //creates webgl buffer type
    const triangleGeoBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, triangleGeoBuffer);
    //static_draw = hint to gl what we are doing with variable 
    gl.bufferData(gl.ARRAY_BUFFER, triangleGeoCpuBufer, gl.STATIC_DRAW);

    //tells opengl which version of shading lang we want to use
    const vertexShaderSourceCode = `#version 300 es 
    //medium precision
    precision mediump float; 
    
    //vec2 = 2 floating pt numbers, and var name 
    in vec2 vertexPosition;


    //entry point
    void main(){
        //x,y,z (in case of overlap), w
        gl_Position = vec4(vertexPosition, 0.0, 1.0); 
    
    }`;

    const vertexShader = gl.createShader(gl.VERTEX_SHADER); 
    gl.shaderSource(vertexShader, vertexShaderSourceCode); 
    gl.compileShader(vertexShader);

    if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)){
        const compileError = gl.getShaderInfoLog(vertexShader); 
        showError(`failed to comile vertex shader ${compileError}`);
        return;

    }

    const fragmentShaderSourceCode = `#version 300 es
    
    precision mediump float; 

    out vec4 outputColor;

    void main(){
        outputColor = vec4(0.294, 0.0, 0.51, 1.0); 

    }`;

    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER); 
    gl.shaderSource(fragmentShader, fragmentShaderSourceCode); 
    gl.compileShader(fragmentShader);
    
    if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)){
        const compileError = gl.getShaderInfoLog(fragmentShader); 
        showError(`failed to comile fragment shader ${compileError}`);
        return;
    }

    const triangleShaderProgram = gl.createProgram(); 
    gl.attachShader(triangleShaderProgram, vertexShader); 
    gl.attachShader(triangleShaderProgram, fragmentShader); 
    gl.linkProgram(triangleShaderProgram);
    if (!gl.getProgramParameter(triangleShaderProgram, gl.LINK_STATUS)){
        const linkError = gl.getProgramInfoLog(triangleShaderProgram);
        showError(`faile to LINK shaders ${linkError}`); 
        return;
    }

    const vertexPositionAttribLocation = gl.getAttribLocation(triangleShaderProgram, 'vertexPosition');
    if (vertexPositionAttribLocation <0){
        showError('Failed to get attriv location for vertexPosition');
        return;
    }

    //output merger - how to merge the shaded pixel fragment with the exisiting output
    canvas.width = canvas.clientWidth; 
    canvas.height = canvas.clientHeight;
    gl.clearColor(0.08, 0.08, 0.08, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    //rasterizer - which pixels are part of the triangle
    gl.viewport(0,0,canvas.width, canvas.height);

    //set GPU Program - vertex+fragment shader pair
    gl.useProgram(triangleShaderProgram);
    gl.enableVertexAttribArray(vertexPositionAttribLocation);

    //input assembler = how to read vertices from GPU triangle buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, triangleGeoBuffer);
    gl.vertexAttribPointer(
        /*index: which attrib to use */
        vertexPositionAttribLocation,
        /*size: how many componets in that attrib*/
        2, 
        /*type: what is the data type stored in the GPU uffer for this attibtute */
        gl.FLOAT, 
        /*normalized: determines how to convert ints to floats */
        false, 
        /*stride */
        2 * Float32Array.BYTES_PER_ELEMENT,
        /*offset */
        0
    );
    //draw call
    gl.drawArrays(gl.TRIANGLES, 0, 3)

}

try{
    helloTriangle();
} catch(e){
    showError(`Uncaught JavaScript exception: ${e}`)
}