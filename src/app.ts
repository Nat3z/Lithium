import express from 'express'
import fileUpload from 'express-fileupload'
import fs from 'fs'
import cors from 'cors'
import crypto from 'crypto'

export function calculateHash(file: string, type: string): string {
  const testfile = fs.readFileSync(file);
  var sha1sum = crypto.createHash('sha1').update(testfile).digest("hex");
  return sha1sum
}

let app = express()

app.use(fileUpload());
app.use(cors({
  origin: "*"
}))

if (!fs.existsSync(__dirname + "/resources")) {
  fs.mkdirSync(__dirname + "/resources")
}
// generate a random string that's 64 characters long
function generateRandomString() {
  let result = ''
  let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789=-!@#$%^&*()_+[]{}|;:,./<>?'
  let charactersLength = characters.length
  for (let i = 0; i < 64; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength))
  }
  return result
}

let signature = ''
if (fs.existsSync(__dirname + "/.signature")) {
  signature = fs.readFileSync(__dirname + "/.signature").toString()
  console.log("Signature loaded from file.")
}


app.get("/", (req, res) => {
  res.json({
    "version": "1.0.0",
    "hasSignature": signature != '',
  })
})

app.post("/generatesignature", (req, res) => {
  if (!fs.existsSync(__dirname + "/.signature")) {
    signature = generateRandomString()
    // create a file called .signature and write the signature to it
    fs.writeFileSync(__dirname + "/.signature", signature)
    console.log("Signature generated and saved to file.")
    res.json({ success: true, signature: signature, message: "Make sure that you save this signature somewhere." })
  }
  else {
    res.json({ success: false, message: "Signature already exists." })
  }
})



app.post("/deletesignature", (req, res) => {
  if (req.headers.authorization != signature) return res.status(401).json({ success: false, message: "Unauthorized" })
  if (fs.existsSync(__dirname + "/.signature")) {
    fs.unlinkSync(__dirname + "/.signature")
    console.log("Signature deleted.")
    res.json({ success: true, message: "Signature deleted." })
  }
  else {
    res.json({ success: false, message: "Signature does not exist." })
  }
})

app.post("/uploadpack", async (req, res) => {

  if (!req.files) {
    return res.status(400).send('No files were uploaded.');
  }


  if (req.headers.authorization != signature) {
    return res.status(401).json({ success: false, message: "Unauthorized" })
  }

  if (Array.isArray(req.files.file)) return
  
  let uploadedPack = req.files.file;
  await uploadedPack.mv(__dirname + "/resources/realm_pack.zip") 
  return res.json({
    "success": true
  })
})

app.get("/getpack", (req, res) => {
  // get file from the ./resources/realm_pack.zip 
  if (!fs.existsSync(__dirname + "/resources/realm_pack.zip")) return res.status(404).send("Resource Pack file not found.")
  return res.download(__dirname + "/resources/realm_pack.zip")
})

app.get("/doespackexist", (req, res) => {
  if (!fs.existsSync(__dirname + "/resources/realm_pack.zip")) return res.json({ "success": false })
  return res.json({ "success": true })
})

app.get("/gethash", (req, res) => {
  if (!fs.existsSync(__dirname + "/resources/realm_pack.zip")) return res.status(404).send("Resource Pack file not found.")
  return res.json({
    "success": true,
    "hash": calculateHash(__dirname + "/resources/realm_pack.zip", "sha1")
  })
})

app.listen(process.env.PORT || 8080, () => {
  console.log("✨ \x1b[37mApp is ready!")
  console.log("\x1b[44m LOCAL \x1b[0m http://localhost:8080/")
})
