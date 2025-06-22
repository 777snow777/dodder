let dodder_web =[]
let chunks = [];

window.onload=()=>{  
  
   console.log(navigator.mediaDevices)
  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    setupMedia()
  } else {
    document.getElementById("audio-record").display = "none"
    console.log("getUserMedia not supported on your browser!");
  }

  
  var web = document.getElementById("dodder-web");
  let dodderForm = document.getElementById("grow_dodder")
  dodderForm.addEventListener("submit", sendSignal)
 
  fetch('/init-dodder-web')
  .then(response => response.json())
  .then(data => {
    // let audioContainer = document.getElementById("dodder-audio")
    let dodder = data.dodder
    dodder.forEach((dodder_entry)=> {dodder_web.push(dodder_entry)})
  }).catch(error => console.error('Error occurred:', error));
  web.ontouchmove=(ev)=>{
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
          // audio.loop = true
          audio.volume = 0.5*Math.random()
          audio.style.display ="none"
          ev.target.appendChild(audio)
          audio.play()
        }
       
    }
 }
}

function setupMedia(){
  const record = document.querySelector(".record");
  const stop = document.querySelector(".stop");
  let send_audio = document.getElementById("send-audio")
  send_audio.addEventListener("click", sendAudio)
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
        mediaRecorder.start(10);
        console.log(mediaRecorder.state);
        record.style.background = "red";
        record.style.color = "black";
      };
      mediaRecorder.ondataavailable = (e) => {
        chunks.push(e.data);
      };
      stop.onclick = () => {
        mediaRecorder.stop();
        console.log(chunks);
        record.style.background = "";
        record.style.color = "";
      };
    
    })
    .catch((err) => {
      console.error(`getUserMedia error occurred: ${err}`);
    });
}


async function sendAudio(){
  const blob = new Blob(chunks, { type: "audio/mp3; codecs=opus" });
  console.log(blob)
  // const arrayBuffer = await blob.arrayBuffer(chunks)
  // let buffer = Buffer.from(arrayBuffer);
  // console.log(arrayBuffer)
  var formData = new FormData();
  formData.append("recording", blob, "recording.mp3");

  fetch("/dodder-web-save-audio",{
    method: "POST", 
    body:  formData}
  ).then(()=>{
    // chunks = [];
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
  }).then(()=>{ 
    this.reset()
  }).catch(error => {
    console.error('Error:', error); 
  });
}

  

