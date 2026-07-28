// track.js — Simpele Schimmel Paniek Baan

const TRACK = {
  name: "Schimmel Paniek Baan",
  music: "Audio/SchimmelPaniekBaan.mp3",
  laps: 3,
  trackWidth: 12
};

let trackCurve = null;
let trackMesh = null;
let trackAudio = null;

let checkpointMeshes = [];
let checkpointState = {
  reached: [false,false,false,false],
  lap:0
};


// ─────────────────────────
// Baan vorm
// ─────────────────────────

function buildTrackPoints(){

  return [

    new THREE.Vector3(0,0,80),
    new THREE.Vector3(35,0,70),
    new THREE.Vector3(60,0,30),
    new THREE.Vector3(60,0,-20),

    new THREE.Vector3(30,0,-70),
    new THREE.Vector3(0,0,-80),
    new THREE.Vector3(-40,0,-60),
    new THREE.Vector3(-60,0,-20),

    new THREE.Vector3(-55,0,40),
    new THREE.Vector3(-20,0,70),

    new THREE.Vector3(0,0,80)

  ];

}



// ─────────────────────────
// Baan bouwen
// ─────────────────────────

function buildTrack(scene){

  trackCurve =
    new THREE.CatmullRomCurve3(
      buildTrackPoints(),
      true
    );


  const segments=200;

  const width=TRACK.trackWidth;


  const positions=[];
  const indices=[];


  for(let i=0;i<=segments;i++){

    let t=i/segments;

    let p=
      trackCurve.getPointAt(t);

    let tangent=
      trackCurve.getTangentAt(t)
      .normalize();


    let side=
      new THREE.Vector3()
      .crossVectors(
        tangent,
        new THREE.Vector3(0,1,0)
      )
      .normalize();



    let left=
      p.clone()
      .addScaledVector(
        side,
        -width/2
      );


    let right=
      p.clone()
      .addScaledVector(
        side,
        width/2
      );



    positions.push(
      left.x,left.y,left.z,
      right.x,right.y,right.z
    );


    if(i<segments){

      let a=i*2;

      indices.push(
        a,a+1,a+2,
        a+1,a+3,a+2
      );

    }

  }



  let geo=
    new THREE.BufferGeometry();


  geo.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(
      positions,
      3
    )
  );


  geo.setIndex(indices);

  geo.computeVertexNormals();



  trackMesh=
    new THREE.Mesh(
      geo,
      new THREE.MeshLambertMaterial({
        color:0x333333
      })
    );


  scene.add(trackMesh);



  // gras

  let ground=
    new THREE.Mesh(
      new THREE.PlaneGeometry(
        300,
        300
      ),
      new THREE.MeshLambertMaterial({
        color:0x3c8c35
      })
    );


  ground.rotation.x=-Math.PI/2;

  ground.position.y=-0.1;

  scene.add(ground);



  createCheckpoints(scene);

  createDecor(scene);

  startTrackMusic();


  return trackCurve;

}



// ─────────────────────────
// Checkpoints 1-4
// ─────────────────────────


function createCheckpoints(scene){

  checkpointMeshes=[];


  let points=[
    0.25,
    0.5,
    0.75,
    0.95
  ];



  points.forEach((t,i)=>{


    let pos=
      trackCurve.getPointAt(t);



    let gate=
      new THREE.Mesh(

        new THREE.BoxGeometry(
          TRACK.trackWidth,
          2,
          0.5
        ),

        new THREE.MeshLambertMaterial({

          color:[
            0xff0000,
            0xff9900,
            0x00ffff,
            0xffff00
          ][i]

        })

      );



    gate.position.copy(pos);

    gate.position.y=1;


    scene.add(gate);



    checkpointMeshes.push({
      pos:pos,
      index:i
    });


  });

}




function updateCheckpoints(pos){


  let next=
    checkpointState.reached
    .indexOf(false);



  if(next!==-1){

    let cp=
      checkpointMeshes[next];


    let distance=
      pos.distanceTo(cp.pos);



    if(distance<8){

      checkpointState.reached[next]=true;

    }


  }


}




function resetCheckpoints(){

 checkpointState={
  reached:[
   false,
   false,
   false,
   false
  ],
  lap:0
 };

}



// ─────────────────────────
// Decoratie
// ─────────────────────────


function createDecor(scene){

 for(let i=0;i<40;i++){


  let angle=
    Math.random()*Math.PI*2;


  let radius=
    70+
    Math.random()*40;



  let tree=
    new THREE.Mesh(

      new THREE.ConeGeometry(
        1,
        5,
        8
      ),

      new THREE.MeshLambertMaterial({
        color:0x287a28
      })

    );


  tree.position.set(

    Math.cos(angle)*radius,

    2.5,

    Math.sin(angle)*radius

  );


  scene.add(tree);


 }


}



// ─────────────────────────
// Audio
// ─────────────────────────


function startTrackMusic(){

 if(trackAudio)
  trackAudio.pause();


 trackAudio=
  new Audio(
   TRACK.music
  );


 trackAudio.loop=true;
 trackAudio.volume=0.5;


 trackAudio.play()
 .catch(()=>{});

}



function stopTrackMusic(){

 if(trackAudio){

  trackAudio.pause();
  trackAudio.currentTime=0;

 }

}




function getTrackCurve(){
 return trackCurve;
}


function getTrackWidth(){
 return TRACK.trackWidth;
}
