# duplexer3

> Modern version of `duplexer2`

## Install

```sh
npm install duplexer3
```

## Usage

```js
import stream from 'node:stream';
import duplexer from 'duplexer3';

const writable = new stream.Writable({objectMode: true});
const readable = new stream.Readable({objectMode: true});

writable._write = function (input, encoding, done) {
	if (readable.push(input)) {
		done();
	} else {
		readable.once('drain', done);
	}
};

readable._read = function () {
	// Noop
};

// Simulate the readable thing closing after a bit
writable.once('finish', () => {
	setTimeout(() => {
		readable.push(null);
	}, 500);
});

const duplex = duplexer3(writable, readable);

duplex.on('data', data => {
	console.log('got data', JSON.stringify(data));
});

duplex.on('finish', () => {
	console.log('got finish event');
});

duplex.on('end', () => {
	console.log('got end event');
});

duplex.write('oh, hi there', () => {
	console.log('finished writing');
});

duplex.end(() => {
	console.log('finished ending');
});
```

```
got data 'oh, hi there'
finished writing
got finish event
finished ending
got end event
```

## API

### duplexer(options?, writableStream, readableStream)

#### options

Type: `object`

##### bubbleErrors

Type: `boolean`\
Default: `true`

Whether to bubble errors from the underlying readable/writable streams.
