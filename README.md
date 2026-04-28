# RadarSim - WebGL Visualization 

### Purpose/Goal: 

Radar style defense game prototype using WebGL2. Includes a rotating sweep beam that detects incoming object,
automatically fires projectiles ar it, and triggers a game over state if obejct reaches center or if there is collision.

Project demonstrates rendering, vector math, detection logic, and UI overlays.

### Features: 

* Radar Visualization: sweeping beams, range rings
* Object Tracking: moving target , auto movement toward center, override movement with arrow keys
* Projectile/Response: auto fire, object destruction logic, firing stops when object reaches center
* Game over: game over overlya, restart button, collision detection


### How to run: 

* Open “circle.html” with live server
* Use arrow keys to move object
* Press R to restart 


### Completed: 

- WebGl rendering
- Radar sweep animation 
- Moving target objects
- Radar detection 
- Ammo firing 
- Auto fire
- Object destruction 
- Game over logic

### Deferred: 

Adjustable Radar settings
- Beam width 
- Sweep speed
- Noise
- Brilliance
- Etc 
UI/HUD for object
- Speed
- Pathing
- Changing/moving camera orientation 
- Model objects


### Future: 

Signal strength simulation 
- Rather than detected vs not detected, do distance attenuation (farther = weaker signal)
Multiple objects with different radar cross sections 
- Large
- Small 
- Stealth 
- Weather clutter 
Realistic Object Motion
- Velocity 
- Acceleration 
- Turning
