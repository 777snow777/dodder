let dodder_web =[]
let dodder_audio=[]
let audio_index = 0
let chunks = [];
let audioOn = false
let text = false

window.onload=()=>{  
  
   console.log(navigator.mediaDevices)
  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    setupMedia()
  } else {
    console.log("getUserMedia not supported on your browser!");
  }
  let archive_player =document.getElementById("dodder-sound")
  let begin = document.getElementById("open-archive")
  begin.addEventListener("click", ()=>{
    begin.style.visibility="hidden"
    archive_player.play()
  }) 
  archive_player.addEventListener("ended", ()=>{
    audio_index += 1
    updateArchivePlayer() 
  })

  if (text){
    //include text interface
    initializeText()
  }else{
    fetch('/get-recordings')
    .then(response => response.json())
    .then(data => {
      dodder_audio = data.audioFiles
      if (dodder_audio.length > 0){
        archive_player.src = dodder_audio[0]
        begin.disabled = false
      }
    }).catch(error => console.error('Error occurred:', error));
  }
}

function updateArchivePlayer(){
   let archive_player =document.getElementById("dodder-sound")
   updateRecordingsList()
   archive_player.src = dodder_audio[audio_index%dodder_audio.length]
   console.log(dodder_audio)
   archive_player.play()
}


function initializeText(){
  var web = document.getElementById("dodder-web");
  let dodderForm = document.getElementById("grow_dodder")
  dodderForm.addEventListener("submit", sendSignal)
  fetch('/init-dodder-web')
  .then(response => response.json())
  .then(data => {
    // let audioContainer = document.getElementById("dodder-audio")
    let dodder = data.dodder
    dodder_audio = data.audioFiles
    dodder.forEach((dodder_entry)=> {dodder_web.push(dodder_entry)})
  }).catch(error => console.error('Error occurred:', error));
  web.ontouchmove=(ev)=>{
    growWeb(ev)
 }
  web.onmousemove=(ev)=>{
    growWeb(ev)
  }
}


function growWeb(ev) {
  if (ev.target.className != "protected" && dodder_web.length > 0){
    let selectedIndex = Math.floor(dodder_web.length*Math.random())
    let msg = dodder_web[selectedIndex] 
    if (msg.message_type == "text"){
      let txt = document.createElement("div")
      txt.innerHTML = msg.message
      txt.classList.add("dodder-signal")
      let width = 20+0.5*msg.message.length*Math.random() + 10*Math.random()
      if (width > 30){
        txt.style.width=20+60*Math.random()+"%"
        txt.classList.add("horizontal")
        txt.style.marginRight =50+20*Math.random()+"px"
      }else{
        txt.style.width=20+0.15*width+"%"
      }
      txt.style.marginLeft =20+20*Math.random()+"px"

      txt.style.fontSize=0.5+0.55*Math.random()+"rem"
      ev.target.appendChild(txt)
    }else if (msg.message_type = "audio"){
      let audio = document.createElement("audio")
      audio.src =msg.message
      audio.controls=true
      console.log(msg.message)
      audio.playsinline = true;
      // audio.loop = true
      audio.volume = 0.35*Math.random()
      audio.style.display ="none"
      ev.target.appendChild(audio)
      if (audioOn == true){
      	audio.play()
      }
    }
  }
}

function setupMedia(){
  const record = document.querySelector("#record-audio");
  const cancel = document.querySelector("#cancel-audio")
  let archive_player =document.getElementById("dodder-sound")

  //let send_audio = document.getElementById("send-audio")
 // send_audio.addEventListener("click", sendAudio)
  console.log("getUserMedia supported.");
  navigator.mediaDevices
    .getUserMedia(
      // constraints - only audio needed for this app
      {
        audio: true,
      },
    ).then((stream) => {
      const mediaRecorder = new MediaRecorder(stream);
      record.onclick = () => {
        if (mediaRecorder.state == 'recording'){
          //button trigger = finish recording
          mediaRecorder.stop();
          record.className = "idle"        
          console.log(chunks);
          sendAudio()
          record.innerHTML="record"
	  if (document.getElementById("open-archive").style.visibility=="hidden"){
	      updateArchivePlayer()
          }
          cancel.style.visibility="hidden"
        }else{
          record.className = "recording"        
          //button trigger = start recording
          archive_player.pause()
          mediaRecorder.start(10);
          console.log(mediaRecorder.state);
          record.innerHTML = "finish"
          cancel.style.visibility="visible"
        }


      };
      mediaRecorder.ondataavailable = (e) => {
        chunks.push(e.data);
      };

      // send_audio.onclick = () =>{
      //   if (mediaRecorder.state == 'recording'){
      //       mediaRecorder.stop()
      //       send_audio.innerHTML = "record"
      //       record.style.background = ''
      //       record.style.color = ''
      //       sendAudio()
      //   }else{
      //     send_audio.innerHTML = "finish"
      //   }

     // }
      cancel.onclick = () => {
        chunks = []
        record.className = "idle"    
        record.innerHTML="record"    
      }
    
    })
    .catch((err) => {
      console.error(`getUserMedia error occurred: ${err}`);
    });
}

async function updateRecordingsList(){
  fetch("/get-recordings"
  ).then(response => response.json())
  .then((data)=>{
    dodder_audio = data.audioFiles
  }).catch(error => {
    console.error('Error:', error); 
  });
}

async function sendAudio(){
  const blob = new Blob(chunks, { type: "audio/mp3; codecs=opus" });
  console.log(blob)
  // const arrayBuffer = await blob.arrayBuffer(chunks)
  // let buffer = Buffer.from(arrayBuffer);
  var formData = new FormData();
  formData.append("recording", blob, "recording.mp3");

  fetch("/dodder-web-save-audio",{
    method: "POST", 
    body:  formData}
  ).then(response => response.json())
  .then((data)=>{
    dodder_audio.push(data.filename)
    chunks = [];
  }).catch(error => {
    console.error('Error:', error); 
  });
}

function sendSignal(event){
  event.preventDefault(); 
  const formData = new FormData(this); 
  const data = Object.fromEntries(formData.entries());
  let body = JSON.stringify(data)
  // body["message_type"] = type
  console.log(this.action)
  console.log(this.method)
  console.log(body)
  fetch(this.action,{
    method: this.method, 
    headers: {
      'Content-Type': 'application/json' 
    },
    body: body
  }).then(response => response.json())
  .then((data)=>{ 
    let dodderEntry = {message: data.textMessage, message_type: 'text'}
    dodder_web.push(dodderEntry)
    this.reset()
  }).catch(error => {
    console.error('Error:', error); 
  });
}

  

