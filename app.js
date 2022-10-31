const {spawn} = require('node:child_process');
const fs = require('fs/promises');

let state = {
    currentIndex: 0,
    uri: process.env.URI || '',
    intervalleImage: process.env.INTERVAL || 10000,
    recordTime: process.env.RECORD_TIME || 3600000,
    videoName: process.env.VIDEO_NAME || 'defaultName',
    deleteFrame: true
}

let videoInCreation = false;

const path = state.videoName + '/state.json';

console.log(`Enregistrement d'un timelapse de ${state.recordTime} tout les ${state.intervalleImage}`)

function getNumberOfFrame() {
    return state.recordTime / state.intervalleImage;
}

function writeState() {
    fs.writeFile(path, JSON.stringify(state))
}

function registerImage() {
    if (!videoInCreation) {
        const ffmpeg = spawn('ffmpeg', ['-rtsp_transport', 'tcp', '-i', state.uri, '-ss', '00:00:01', '-f', 'image2', '-vframes', '1',
            `${state.videoName}/image-${state.currentIndex}.jpg`, '-v', 'error'])
        ffmpeg.on('close', (code) => {
            console.log(`Image ${state.currentIndex} created with code : ${code}`);
            if (code === 0) {
                state.currentIndex++
                writeState();
                if (state.currentIndex > getNumberOfFrame()) {
                    createVideo();
                }
            }
        })
        ffmpeg.stderr.on('data', (data) => {
            console.error(`stderr: ${data}`);
        });
    }
}


function closeApplication() {
    process.exit(0);
}

function deleteFrames() {
    return fs.readdir(`${state.videoName}`).then(files => {
        return Promise.all(files.filter(file => file.includes("image")).map(file => {
            return fs.rm(`${state.videoName}/${file}`).then(value => console.log(`File ${file} deleted`))
        }));
    });
}

function createVideo() {
    if (!videoInCreation) {
        videoInCreation = true

        console.log("Create video")
        const ffmpeg = spawn('ffmpeg', ['-i', `${state.videoName}/image-%d.jpg`, '-vcodec', 'mpeg4', `${state.videoName}/${state.videoName}.avi`])
        ffmpeg.on('close', (code) => {
            console.log(`Video créer ${state.currentIndex} created with code : ${code}`);
            if (state.deleteFrame) {
                deleteFrames().then(() => {
                    console.log("Supression des frames termine")
                    closeApplication();
                })
            } else {
                closeApplication();
            }
        })
        ffmpeg.stderr.on('data', (data) => {
            console.error(` Video création stderr: ${data}`);
        });
    }
}


function startRecord() {
    setInterval(registerImage, state.intervalleImage);
}

function checkExistingVideoOrCreateFile() {
    return fs.access(state.videoName)
        .catch(() => {
            return fs.mkdir(state.videoName, {recursive: true})
        })
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
            return fs.writeFile(path, JSON.stringify(state))
        });
}

checkExistingVideoOrCreateFile()
    .then(() => {
        console.log("Creation de " + getNumberOfFrame() + " frames")
        startRecord();
    })


