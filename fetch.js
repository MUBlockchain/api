let fs = require('file-system')
let util = require('util')
const readFile = util.promisify(fs.readFile);

let request = require('./request') 
const API_BASE = 'http://localhost/3000'
async function sendImage() {
  let data = await readFile('./test-image.jpg')
  try{
    return request({ method: 'POST', url: API_BASE + '/api/image', body: data })
  }
  catch(err){
    console.log("Error", err.message)
  }
}
sendImage().then(console.log)