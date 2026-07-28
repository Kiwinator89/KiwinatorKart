// track.js — Schimmel Paniek Baan (10x kleiner gemaakt)

const TRACK_SCALE = 0.1;

const TRACK = {
  name: 'Schimmel Paniek Baan',
  music: 'Audio/SchimmelPaniekBaan.mp3',
  laps: 3,
  trackWidth: 36,
  decorModels: {
    tree: 'Models/Tree.glb',
    rock: 'Models/Rock.glb',
  }
};

let trackMesh = null;
let trackCurve = null;
let trackAudio = null;
let decorObjects = [];

function buildTrackPoints() {
  const s = TRACK_SCALE;

  return [
    new THREE.Vector3(0,0,1800*s),
    new THREE.Vector3(900*s,0,1650*s),
    new THREE.Vector3(1650*s,0,1200*s),
    new THREE.Vector3(1800*s,0,450*s),

    new THREE.Vector3(1650*s,0,-300*s),
    new THREE.Vector3(1200*s,0,-900*s),

    new THREE.Vector3(600*s,0,-600*s),
    new THREE.Vector3(0,0,-900*s),
    new THREE.Vector3(-450*s,0,-600*s),

    new THREE.Vector3(-300*s,0,300*s),
    new THREE.Vector3(150*s,0,600*s),
    new THREE.Vector3(300*s,0,1050*s),

    new THREE.Vector3(0,0,1350*s),
    new THREE.Vector3(-450*s,0,1500*s),
    new THREE.Vector3(-900*s,0,1350*s),

    new THREE.Vector3(-1050*s,0,900*s),
    new THREE.Vector3(-1650*s,0,600*s),
    new THREE.Vector3(-1950*s,0,0),

    new THREE.Vector3(-1650*s,0,-600*s),
    new THREE.Vector3(-900*s,0,-900*s),
    new THREE.Vector3(-300*s,0,-450*s),

    new THREE.Vector3(-150*s,0,900*s),
    new THREE.Vector3(0,0,1800*s)
  ];
}


function buildTrack(scene) {

  const points = buildTrackPoints();

  trackCurve = new THREE.CatmullRomCurve3(points,true);


  const tubeSegments = 300;
  const w = TRACK.trackWidth;


  const positions=[];
  const uvs=[];
  const indices=[];


  for(let i=0;i<=tubeSegments;i++){

    const t=i/tubeSegments;

    const pt=trackCurve.getPointAt(t);
    const tan=trackCurve.getTangentAt(t).normalize();

    const right=new THREE.Vector3()
      .crossVectors(tan,new THREE.Vector3(0,1,0))
      .normalize();


    const left=pt.clone()
      .addScaledVector(right,-w/2);

    const rightSide=pt.clone()
      .addScaledVector(right,w/2);


    positions.push(
      left.x,left.y,left.z,
      rightSide.x,rightSide.y,rightSide.z
    );


    uvs.push(
      0,t*20,
      1,t*20
    );


    if(i<tubeSegments){

      let a=i*2;
      let b=a+1;
      let c=a+2;
      let d=a+3;

      indices.push(
        a,b,c,
        b,d,c
      );
    }
  }


  const geo=new THREE.BufferGeometry();

  geo.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(positions,3)
  );

  geo.setAttribute(
    'uv',
    new THREE.Float32BufferAttribute(uvs,2)
  );

  geo.setIndex(indices);

  geo.computeVertexNormals();



  const canvas=document.createElement('canvas');
  canvas.width=128;
  canvas.height=128;

  const ctx=canvas.getContext('2d');

  ctx.fillStyle='#2a2a2a';
  ctx.fillRect(0,0,128,128);

  ctx.strokeStyle='#ffffff44';
  ctx.lineWidth=4;
  ctx.setLineDash([20,20]);

  ctx.beginPath();
  ctx.moveTo(64,0);
  ctx.lineTo(64,128);
  ctx.stroke();


  const tex=new THREE.CanvasTexture(canvas);

  tex.wrapS=THREE.RepeatWrapping;
  tex.wrapT=THREE.RepeatWrapping;


  trackMesh=new THREE.Mesh(
    geo,
    new THREE.MeshLambertMaterial({
      map:tex,
      side:THREE.DoubleSide
    })
  );


  scene.add(trackMesh);



  // gras
  const ground=new THREE.Mesh(
    new THREE.PlaneGeometry(900,900),
    new THREE.MeshLambertMaterial({
      color:0x3a7d2c
    })
  );


  ground.rotation.x=-Math.PI/2;
  ground.position.y=-0.05;

  scene.add(ground);



  buildStartLine(scene);
  buildCheckpoints(scene);
  loadDecor(scene);

  startTrackMusic();


  return trackCurve;
}



function buildStartLine(scene){

  const canvas=document.createElement('canvas');

  canvas.width=128;
  canvas.height=128;

  const ctx=canvas.getContext('2d');

  const size=16;


  for(let x=0;x<8;x++){
    for(let y=0;y<8;y++){

      ctx.fillStyle=(x+y)%2===0?'#fff':'#000';

      ctx.fillRect(
        x*size,
        y*size,
        size,
        size
      );
    }
  }


  const tex=new THREE.CanvasTexture(canvas);


  const mesh=new THREE.Mesh(

    new THREE.PlaneGeometry(
      TRACK.trackWidth,
      12
    ),

    new THREE.MeshLambertMaterial({
      map:tex
    })

  );


  mesh.rotation.x=-Math.PI/2;

  mesh.position.set(
    0,
    0.01,
    1800*TRACK_SCALE
  );


  scene.add(mesh);
}



const CHECKPOINT_T=[
  0.25,
  0.50,
  0.75
];


const checkpointMeshes=[];


let checkpointState={
  reached:[
    false,
    false,
    false
  ],
  lap:0
};



function buildCheckpoints(scene){

  checkpointMeshes.length=0;


  CHECKPOINT_T.forEach((t,i)=>{


    const pt=trackCurve.getPointAt(t);

    const tan=trackCurve
      .getTangentAt(t)
      .normalize();


    const right=new THREE.Vector3()
      .crossVectors(
        tan,
        new THREE.Vector3(0,1,0)
      )
      .normalize();



    const pillarGeo=
      new THREE.BoxGeometry(
        0.8,
        6,
        0.8
      );


    const pillarMat=
      new THREE.MeshLambertMaterial({
        color:[
          0xff4444,
          0xffaa00,
          0x44aaff
        ][i]
      });



    [-1,1].forEach(side=>{


      const pillar=
        new THREE.Mesh(
          pillarGeo,
          pillarMat
        );


      const edge=
        pt.clone()
        .addScaledVector(
          right,
          side*(TRACK.trackWidth/2+1)
        );


      pillar.position.set(
        edge.x,
        3,
        edge.z
      );


      scene.add(pillar);

    });



    checkpointMeshes.push({
      pos:pt.clone(),
      tan:tan.clone(),
      index:i
    });

  });

}
function updateCheckpoints(kartPos, kartHeading){

  const state=checkpointState;


  const result={
    lapComplete:false,
    lap:state.lap,
    checkpoints:[...state.reached]
  };


  const nextIndex=
    state.reached.indexOf(false);



  if(nextIndex!==-1){

    const cp=checkpointMeshes[nextIndex];


    const dist=
      new THREE.Vector2(
        kartPos.x-cp.pos.x,
        kartPos.z-cp.pos.z
      ).length();



    if(dist < TRACK.trackWidth*0.8){

      state.reached[nextIndex]=true;

      result.checkpoints=[
        ...state.reached
      ];

    }

  }

  else{


    const finishPos=
      trackCurve.getPointAt(0);


    const distFinish=
      new THREE.Vector2(
        kartPos.x-finishPos.x,
        kartPos.z-finishPos.z
      ).length();



    const finishTan=
      trackCurve.getTangentAt(0);



    const heading2D=
      new THREE.Vector2(
        Math.sin(kartHeading),
        Math.cos(kartHeading)
      );


    const finishDir=
      new THREE.Vector2(
        finishTan.x,
        finishTan.z
      );



    const movingCorrectWay=
      heading2D.dot(finishDir)>0;



    if(
      distFinish < TRACK.trackWidth*0.8 &&
      movingCorrectWay
    ){

      state.lap++;

      state.reached=[
        false,
        false,
        false
      ];


      result.lap=
        state.lap;


      result.lapComplete=true;


      result.checkpoints=[
        false,
        false,
        false
      ];

    }

  }


  return result;

}



function resetCheckpoints(){

  checkpointState={
    reached:[
      false,
      false,
      false
    ],
    lap:0
  };

}




// ─────────────────────────────
// Decor
// ─────────────────────────────


function loadDecor(scene){


  const loader=
    new THREE.GLTFLoader();


  if(!loader){

    console.warn(
      "GLTFLoader ontbreekt"
    );

    return;
  }



  const decorData=
    generateDecorPositions();



  decorData.forEach(
    ({model,pos,scale,rot})=>{


      loader.load(

        TRACK.decorModels[model],

        (gltf)=>{


          const obj=
            gltf.scene;


          obj.position.set(
            pos.x,
            0,
            pos.z
          );


          obj.scale.setScalar(
            scale
          );


          obj.rotation.y=
            rot;


          scene.add(obj);

          decorObjects.push(obj);

        },


        undefined,


        ()=>{


          const fallback=
            new THREE.Mesh(

              model==="tree"

              ?

              new THREE.ConeGeometry(
                0.1,
                0.3,
                6
              )

              :

              new THREE.DodecahedronGeometry(
                0.08
              ),


              new THREE.MeshLambertMaterial({

                color:
                model==="tree"

                ?

                0x2d6e2d

                :

                0x888888

              })

            );



          fallback.position.set(
            pos.x,
            0.05,
            pos.z
          );


          scene.add(fallback);

          decorObjects.push(fallback);


        }

      );

    }

  );

}





function generateDecorPositions(){

  const decor=[];

  const segments=80;

  const w=
    TRACK.trackWidth;



  for(let i=0;i<segments;i++){


    const t=
      i/segments;


    const pt=
      trackCurve.getPointAt(t);


    const tan=
      trackCurve
      .getTangentAt(t)
      .normalize();



    const right=
      new THREE.Vector3()
      .crossVectors(
        tan,
        new THREE.Vector3(0,1,0)
      )
      .normalize();



    const model=
      i%3===0
      ?
      "rock"
      :
      "tree";



    const offset=
      w/2 + 9 + Math.random()*12;



    const side=
      Math.random()>0.5
      ?
      1
      :
      -1;



    decor.push({

      model,


      pos:{

        x:
          pt.x+
          right.x*
          offset*
          side,


        z:
          pt.z+
          right.z*
          offset*
          side

      },


      // bomen/stenen passen nu bij kleine baan
      scale:
        (0.8+
        Math.random()*0.8)
        /
        10,


      rot:
        Math.random()*Math.PI*2

    });


  }


  return decor;

}




// ─────────────────────────────
// Muziek
// ─────────────────────────────


function startTrackMusic(){


  if(trackAudio){

    trackAudio.pause();

    trackAudio=null;

  }



  trackAudio=
    new Audio(
      TRACK.music
    );


  trackAudio.loop=true;

  trackAudio.volume=0.5;



  trackAudio.play()
  .catch(()=>{


    document.addEventListener(
      "keydown",

      ()=>trackAudio.play(),

      {
        once:true
      }

    );


  });


}




function stopTrackMusic(){


  if(trackAudio){

    trackAudio.pause();

    trackAudio.currentTime=0;

  }

}




// ─────────────────────────────
// Exports
// ─────────────────────────────


function getTrackCurve(){

  return trackCurve;

}



function getTrackWidth(){

  return TRACK.trackWidth;

}
