// kart.js — Arcade Kart Physics (nieuwe versie)

const KART_CONFIG = {
  maxSpeed: 0.8,
  reverseSpeed: 0.18,

  acceleration: 0.01,
  brakeForce: 0.045,

  friction: 0.94,

  // makkelijk sturen
  steerMax: 0.4,
  steerSpeed: 0.015,
  steerReturn: 0.02,

  // grip
  gripBase: 1,
  gripMin: 0.65,

  // bochten
  turnStrength: 0.25,

  driftThreshold: 0.40,
};


const CAM_CONFIG = {
  height: 6,
  distance: 14,
  lookAhead: 8,
  lerpPos: 0.12,
  lerpLook: 0.15
};


// STATE

let kartMesh = null;
let kartSprite = null;

let charConfig = null;
let drivingAudio = null;
let kartLoaded = false;


let kartBody = {

  pos: new THREE.Vector3(0,0.6,1800),

  speed:0,

  heading:0,

  steerAngle:0,

  drifting:false

};


const keys = {
  w:false,
  a:false,
  s:false,
  d:false
};


const camPos = new THREE.Vector3();
const camTarget = new THREE.Vector3();



// INPUT

function initInput(){

const map={
 w:"w",
 a:"a",
 s:"s",
 d:"d",

 ArrowUp:"w",
 ArrowLeft:"a",
 ArrowDown:"s",
 ArrowRight:"d"
};


document.addEventListener("keydown",e=>{

let k=map[e.key];

if(k){
 keys[k]=true;
 e.preventDefault();
}

});


document.addEventListener("keyup",e=>{

let k=map[e.key];

if(k)
 keys[k]=false;

});

}



// INIT

function initKart(scene,character,camera){

charConfig=character;


drivingAudio=new Audio("Audio/Driving.mp3");
drivingAudio.loop=true;
drivingAudio.volume=0;


const loader=new THREE.GLTFLoader();


loader.load(

"Models/Kart.glb",

gltf=>{


kartMesh=gltf.scene;


// schaal

kartMesh.scale.setScalar(0.12);


// model vooruit richting

kartMesh.rotation.y=Math.PI/2;


kartMesh.position.copy(kartBody.pos);


scene.add(kartMesh);


buildCharSprite(scene,character);


camPos.copy(
 new THREE.Vector3(
  0,
  8,
  1814
 )
);


camTarget.copy(kartBody.pos);


kartLoaded=true;


},


undefined,


()=>{


// fallback

kartMesh=new THREE.Mesh(

new THREE.BoxGeometry(2,0.7,3),

new THREE.MeshLambertMaterial({
color:0xff6600
})

);


kartMesh.position.copy(kartBody.pos);

scene.add(kartMesh);


buildCharSprite(scene,character);


kartLoaded=true;


});


initInput();

}




// SPRITE

function buildCharSprite(scene,character){

const tex=new THREE.TextureLoader()
.load(
`${character.folder}/${character.sprites.voor}`
);


const mat=new THREE.SpriteMaterial({
map:tex,
transparent:true
});


kartSprite=new THREE.Sprite(mat);

kartSprite.scale.set(2.8,2.8,1);

kartSprite.position.y=2.5;


if(kartMesh)
 kartMesh.add(kartSprite);

}




// UPDATE

function updateKart(delta){

if(!kartLoaded)
 return;


const dt=Math.min(delta,0.05);

const b=kartBody;


// ----------------
// STUREN
// ----------------


let input=0;


if(keys.a)
 input=-1;

if(keys.d)
 input=1;



if(input!==0){

b.steerAngle +=
 input *
 KART_CONFIG.steerSpeed;


}else{

b.steerAngle *=
 1-KART_CONFIG.steerReturn;

}



b.steerAngle=
THREE.MathUtils.clamp(

b.steerAngle,

-KART_CONFIG.steerMax,

KART_CONFIG.steerMax

);



// ----------------
// GAS
// ----------------


let maxSpeed=
KART_CONFIG.maxSpeed *
(charConfig?.speed/8 || 1);



if(keys.w){

b.speed+=
KART_CONFIG.acceleration;


}


else if(keys.s){


if(b.speed>0)

b.speed-=KART_CONFIG.brakeForce;


else

b.speed-=0.01;


}



else{


b.speed*=KART_CONFIG.friction;


}



b.speed=
THREE.MathUtils.clamp(

b.speed,

-KART_CONFIG.reverseSpeed,

maxSpeed

);





// ----------------
// STUREN MOTOR
// ----------------


// auto draait sterker bij snelheid

let speedFactor=
Math.min(Math.abs(b.speed)/maxSpeed,1);


let turn=

b.steerAngle *
speedFactor *
KART_CONFIG.turnStrength;



// draaien

b.heading += turn;



// ----------------
// DRIFT
// ----------------


b.drifting =
Math.abs(b.steerAngle) > 0.08 &&
Math.abs(b.speed)>maxSpeed*0.6;



if(b.drifting){

b.speed*=0.985;

}




// ----------------
// POSITIE
// ----------------


b.pos.x +=
Math.sin(b.heading) *
b.speed *
dt *
60;


b.pos.z +=
Math.cos(b.heading) *
b.speed *
dt *
60;



b.pos.y=0.6;




// ----------------
// MODEL ROTATIE FIX
// ----------------


if(kartMesh){


kartMesh.position.copy(b.pos);


// alleen horizontaal draaien

kartMesh.rotation.y=
b.heading+Math.PI/2;



// voorkomt omhoog/omlaag bug

kartMesh.rotation.x=0;



// lichte body lean

kartMesh.rotation.z=
THREE.MathUtils.lerp(

kartMesh.rotation.z,

-b.steerAngle*0.35,

0.15

);


}



updateEngineAudio();


return{

speed:b.speed,

maxSpeed,

drifting:b.drifting

};


}



// CAMERA

function updateCamera(camera){

if(!kartLoaded)
return;


const b=kartBody;


let target=new THREE.Vector3(

b.pos.x-
Math.sin(b.heading)*CAM_CONFIG.distance,


b.pos.y+
CAM_CONFIG.height,


b.pos.z-
Math.cos(b.heading)*CAM_CONFIG.distance

);



camPos.lerp(
target,
CAM_CONFIG.lerpPos
);


camera.position.copy(camPos);



let look=new THREE.Vector3(

b.pos.x+
Math.sin(b.heading)*CAM_CONFIG.lookAhead,


b.pos.y+1.5,


b.pos.z+
Math.cos(b.heading)*CAM_CONFIG.lookAhead

);


camTarget.lerp(
look,
CAM_CONFIG.lerpLook
);


camera.lookAt(camTarget);


}




// AUDIO

function updateEngineAudio(){

if(!drivingAudio)
return;


let speed=Math.abs(kartBody.speed);


drivingAudio.volume=
THREE.MathUtils.lerp(
0,
0.8,
speed/KART_CONFIG.maxSpeed
);


drivingAudio.playbackRate=
THREE.MathUtils.lerp(
0.8,
1.5,
speed/KART_CONFIG.maxSpeed
);


}




// GETTERS

function getKartPosition(){
return kartBody.pos.clone();
}


function getKartSpeed(){
return kartBody.speed;
}


function getKartHeading(){
return kartBody.heading;
}


function isKartDrifting(){
return kartBody.drifting;
}


function getKartMaxSpeed(){

return KART_CONFIG.maxSpeed *
(charConfig?.speed/8 || 1);

}
