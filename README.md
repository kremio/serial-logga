# serial-logga

## Installation
```
npm install
```
## Usage
```
npm start
```
or
```
node index.js
```
or
```
./index.js
```

Then set the serial port, the communication baud rate, the logging frequency and the destination file by answering the prompt at each step.

## Notes
### Logging frequencies and values average
Everytime a line of data is available on the serial port, serial-logga will add it to a running average of all the values read since the last write to the log file.
For instance, if the device connected to the serial port is sending a line of data every 0.25 seconds and the the logging frequency is set to 1 second, the values logged will be an average of 3 to 4 values (depends on when the logging started and the variation in the triggering of the JavaScript interval event which drives the logging).

### Type of value supported
Only numerical value that match the regular expression pattern `/\d+\.\d+/` will be logged

### Log line format
value,unix timestamp 
