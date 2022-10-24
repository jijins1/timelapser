const {spawn} = require('node:child_process');
const {mkdir} = require('node:fs/promises');


let uri = process.env.URI || '';
let intervalleImage = process.env.INTERVAL || 10000;
let recordTime = process.env.RECORD_TIME || 3600000;
let videoName = process.env.VIDEO_NAME || 3600000;

let currentIndex = 0

console.log(`Enregistrement d'un timelapse de ${recordTime} tout les ${intervalleImage}`)

function registerImage() {
    const ffmpeg = spawn('ffmpeg', ['-i', uri, '-ss', '00:00:01', '-f', 'image2', '-vframes', '1',
        `${videoName}/image-${currentIndex}.jpg`, '-v', 'error'])
    ffmpeg.on('close', (code) => {
        console.log(`Image ${currentIndex} created with code : ${code}`);
        if (code === 0) {
            currentIndex++
        }
    })
    ffmpeg.stderr.on('data', (data) => {
        console.error(`stderr: ${data}`);
    });

}


function createVideo() {
    const ffmpeg = spawn('ffmpeg', ['-i', `${videoName}/image-%d.jpg`, '-vcodec', 'mpeg4', `${videoName}.avi`])
    ffmpeg.on('close', (code) => {
        console.log(`Video créer ${currentIndex} created with code : ${code}`);
        process.exit(0);
    })
    ffmpeg.stderr.on('data', (data) => {
        console.error(` Video création stderr: ${data}`);
    });

}

mkdir(videoName).then(() => console.log(`Dossier ${videoName} créer`))
    .catch((e) => console.log(`Erreur durant la creation du dossier`, e))
    .finally(() => {
        setInterval(registerImage, intervalleImage);
        setTimeout(createVideo, recordTime)
    })

