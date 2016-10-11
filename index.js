const Promise = require('bluebird')
const Prompt = Promise.promisifyAll( require('prompt') )
const fs = require('fs')
const SerialPort = Promise.promisifyAll( require('serialport') )

//Serial input parser
const Readline = new SerialPort.parsers.readline

const baudRates = [75, 110, 300, 1200, 2400, 4800, 9600, 19200, 38400, 57600, 115200]
const defaultSpeed = 6 // 9600 baud

Prompt.start()


const selectSerialPort = () => {
  let ports
  SerialPort.listAsync().then( (p) => {
    ports = p
    ports.forEach( (port, i) => {
      console.log(`[${i}]:\t${port.comName}, ${port.manufacturer}`)
    } )

    const serialPrompt = {
      name:'portNumber',
      description: 'Enter the number of the port you want to listen to',
      message: `Enter a number between 0 and ${ports.length - 1}`,
      type:'integer',
      required: true,
      conform: function (value) {
        return value >= 0 && value < ports.length
      }
    }


    Prompt.getAsync([serialPrompt]).then( (result) => {
      promptSpeed( (speed) => listenTo( ports[result.portNumber], speed ) )
    }).error( (err) => {
      console.log(err)
    })
  }).error( (err) => {
    console.log('Listing serial ports failed: ', err)
  })

}

const promptSpeed = (success) => {
  baudRates.forEach( (b, i) => {
    console.log(`[${i}]:\t${b} baud`)
  } )
  const speedPrompt = {
    name:'baudRate',
    description: `Select the baud rate (default [${defaultSpeed}] ${baudRates[defaultSpeed]})`,
    default: defaultSpeed,
    message: `Enter a number between 0 and ${baudRates.length - 1}`,
    type:'integer',
    required: true,
    conform: function (value) {
      return value >= 0 && value < baudRates.length
    }
  }
  Prompt.getAsync([speedPrompt]).then( (result) => {
    success( baudRates[ result.baudRate ] )
  } )

}

const listenTo = (port, speed) => {
  console.log(`Your choice: ${port.comName}, ${port.manufacturer} at ${speed} baud.`)
  port = new SerialPort(port.comName, {baudRate: speed}, () => {
    console.log('Port opened, starting to listen for input.')
    promptLog( port )
  })
}

const promptLog = (port) => {
  const frequencyPrompt = {
    name:'frequency',
    description:'Enter a time interval in milliseconds between samples (default 1 second)',
    default: 1000,
    type: 'integer',
    required: true,
    conform: function (value) {
      return value >= 0
    }
  }

  const filePrompt = {
    name:'fileName',
    description:'Enter the name of the file to log the data to',
    type: 'string',
    required: true
  }


  Prompt.getAsync([frequencyPrompt, filePrompt]).then( (result) => {
    let logFile = fs.createWriteStream(`${__dirname}/${result.fileName}`, {flags : 'w'});
    setInterval( () => log(logFile), result.frequency )
    //let parser = port.pipe( new Readline() )
    port.on( 'data', processData )

  } )

}

const valRegEx = /\d+\.\d+/
let lastValue = {v: 0, c:0, ts: -1}
let lastLogTs = -1

const processData = (dataBuffer) => {

  let val = dataBuffer.toString().match(valRegEx)
  if(val && val[0]){
    lastValue.ts = Math.floor(new Date() / 1000)
    lastValue.v += Number(val[0])
    lastValue.c++
  }
}

const log = (logFile) => {
  if( lastLogTs === lastValue.ts ){
    return
  }
  lastValue.v /= lastValue.c
  logFile.write(`${lastValue.v},${lastValue.ts}\n`)
  lastLogTs = lastValue.ts
  console.log( `${lastValue.v},${lastValue.ts}` )
  lastValue.v = 0
  lastValue.c = 0
}

selectSerialPort()
