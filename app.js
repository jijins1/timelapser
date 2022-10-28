const {spawn} = require('node:child_process');
const fs = require('fs/promises');

let state = {
    currentIndex: 0,
    uri: process.env.URI || '',
    intervalleImage: process.env.INTERVAL || 10000,
    recordTime: process.env.RECORD_TIME || 3600000,
    videoName: process.env.VIDEO_NAME || 'defaultName'
}

const path = state.videoName + '/state.json';

console.log(`Enregistrement d'un timelapse de ${state.recordTime} tout les ${state.intervalleImage}`)

function registerImage() {
    const ffmpeg = spawn('ffmpeg', ['-i', state.uri, '-ss', '00:00:01', '-f', 'image2', '-vframes', '1',
        `${state.videoName}/image-${state.currentIndex}.jpg`, '-v', 'error'])
    ffmpeg.on('close', (code) => {
        console.log(`Image ${state.currentIndex} created with code : ${code}`);
        if (code === 0) {
            state.currentIndex++
            fs.writeFile(path, JSON.stringify(state))
        }
    })
    ffmpeg.stderr.on('data', (data) => {
        console.error(`stderr: ${data}`);
    });
}


function createVideo() {
    const ffmpeg = spawn('ffmpeg', ['-i', `${state.videoName}/image-%d.jpg`, '-vcodec', 'mpeg4', `${state.videoName}.avi`])
    ffmpeg.on('close', (code) => {
        console.log(`Video créer ${state.currentIndex} created with code : ${code}`);
        process.exit(0);
    })
    ffmpeg.stderr.on('data', (data) => {
        console.error(` Video création stderr: ${data}`);
    });

}


function startRecord() {
    setInterval(registerImage, state.intervalleImage);
    setTimeout(createVideo, state.recordTime)
}

fs.access(state.videoName)
    .then(() => {
        console.log("Dossier Timelapse trouvé")
        return fs.access(path);
    })
    .then(() => {
        return fs.readFile(path)
    })
    .then((readedStateBuffer) => {
        let readedState = JSON.parse(readedStateBuffer)
        console.log("Reprise du state ", readedState)
        state = readedState;
    })
    .catch(err => {
        console.log("Auncun timelapse en cours creation du dossier et du state ")
        fs.writeFile(path, JSON.stringify(state))
    })
    .then(() => {
        startRecord();
    })


