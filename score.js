const VF = Vex.Flow;
let scoreNotes = [];
let voice;
let renderer;
let context;
let stave;
let markerIndex = 0;
let markerInterval;


function drawScore(notes) {
  const div = document.getElementById("score");
  div.innerHTML = "";
  renderer = new VF.Renderer(div, VF.Renderer.Backends.SVG);

  renderer.resize(1200, 300);
  context = renderer.getContext();

  stave = new VF.Stave(10, 40, 1150);
  stave.addClef("treble").addTimeSignature("4/4");
  stave.setContext(context).draw();

  scoreNotes = notes.map(n => 
    new VF.StaveNote({ clef: "treble", keys: [n.key], duration: n.duration })
  );

  voice = new VF.Voice({ num_beats: notes.length, beat_value: 4 });
  voice.addTickables(scoreNotes);

  const formatter = new VF.Formatter().joinVoices([voice]).format([voice], 1100);
  voice.draw(context, stave);

  markerIndex = 0;
  updateMarker();
}


function updateMarker() {
  const marker = document.getElementById("marker");
  if (!scoreNotes.length) return;

  const svgNote = document.querySelector('svg');
  const noteElem = svgNote.querySelectorAll('.vf-note')[markerIndex];
  if (!noteElem) return;

  const bbox = noteElem.getBBox();
  marker.style.left = (bbox.x + bbox.width / 2 + 10) + "px";
  marker.style.top = (bbox.y - 10) + "px";
  marker.style.height = bbox.height + "px";
}


function nextNote() {
  if (markerIndex < scoreNotes.length - 1) {
    markerIndex++;
    updateMarker();
  } else {
    clearInterval(markerInterval);
  }
}


function startConductor() {
  if (!scoreNotes.length) {
    alert("Najprej naloži skladbo in izberi glasbilo!");
    return;
  }
  clearInterval(markerInterval);
  markerInterval = setInterval(nextNote, 1000); // 1 sekunda na noto (simulacija)
}


document.getElementById('fileInput').addEventListener('change', function(e){
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e){
    const text = e.target.result;
    parseMusicXML(text);
  }
  reader.readAsText(file);
});

function parseMusicXML(xmlText) {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlText, "application/xml");

  const selectedInstrument = document.getElementById("instrumentSelect").value;
  if (!selectedInstrument) {
    alert("Izberi glasbilo!");
    return;
  }

  
  const parts = Array.from(xmlDoc.getElementsByTagName("part"));
  const userPart = parts.find(p => {
    const partName = p.getElementsByTagName("part-name")[0]?.textContent;
    return partName === selectedInstrument;
  });

  if (!userPart) {
    alert("Izbrano glasbilo ni najdeno v datoteki!");
    return;
  }

  const measures = Array.from(userPart.getElementsByTagName("measure"));
  const notes = [];
  measures.forEach(measure => {
    const xmlNotes = Array.from(measure.getElementsByTagName("note"));
    xmlNotes.forEach(n => {
      if (n.getElementsByTagName("rest").length) return;
      const step = n.getElementsByTagName("step")[0].textContent;
      const octave = n.getElementsByTagName("octave")[0].textContent;
      notes.push({ key: step.toLowerCase() + "/" + octave, duration: "q" });
    });
  });

  drawScore(notes);
}