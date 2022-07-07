/* globals describe, it, beforeEach */
import assert from 'node:assert';
import stream from 'node:stream';
import duplexer, {DuplexWrapper} from './index.js';

describe('duplexer3', () => {
	let writable;
	let readable;

	beforeEach(() => {
		writable = new stream.Writable({objectMode: true});
		readable = new stream.Readable({objectMode: true});

		writable._write = function (input, encoding, done) {
			return done();
		};

		readable._read = function () {};
	});

	it('should interact with the writable stream properly for writing', done => {
		const duplex = duplexer(writable, readable);

		writable._write = function (input, _encoding, _done) {
			assert.strictEqual(input.toString(), 'well hello there');
			return done();
		};

		duplex.write('well hello there');
	});

	it('should interact with the readable stream properly for reading', done => {
		const duplex = duplexer(writable, readable);

		duplex.on('data', data => {
			assert.strictEqual(data.toString(), 'well hello there');

			return done();
		});

		readable.push('well hello there');
	});

	it('should end the writable stream, causing it to finish', done => {
		const duplex = duplexer(writable, readable);

		writable.once('finish', done);

		duplex.end();
	});

	it('should finish when the writable stream finishes', done => {
		const duplex = duplexer(writable, readable);

		duplex.once('finish', done);

		writable.end();
	});

	it('should end when the readable stream ends', done => {
		const duplex = duplexer(writable, readable);

		// Required to let "end" fire without reading
		duplex.resume();
		duplex.once('end', done);

		readable.push(null);
	});

	it('should bubble errors from the writable stream when no behaviour is specified', done => {
		const duplex = duplexer(writable, readable);

		const originalError = new Error('testing');

		duplex.on('error', error => {
			assert.strictEqual(error, originalError);

			return done();
		});

		writable.emit('error', originalError);
	});

	it('should bubble errors from the readable stream when no behaviour is specified', done => {
		const duplex = duplexer(writable, readable);

		const originalError = new Error('testing');

		duplex.on('error', error => {
			assert.strictEqual(error, originalError);

			return done();
		});

		readable.emit('error', originalError);
	});

	it('should bubble errors from the writable stream when bubbleErrors is true', done => {
		const duplex = duplexer({bubbleErrors: true}, writable, readable);

		const originalError = new Error('testing');

		duplex.on('error', error => {
			assert.strictEqual(error, originalError);

			return done();
		});

		writable.emit('error', originalError);
	});

	it('should bubble errors from the readable stream when bubbleErrors is true', done => {
		const duplex = duplexer({bubbleErrors: true}, writable, readable);

		const originalError = new Error('testing');

		duplex.on('error', error => {
			assert.strictEqual(error, originalError);

			return done();
		});

		readable.emit('error', originalError);
	});

	it('should not bubble errors from the writable stream when bubbleErrors is false', done => {
		const duplex = duplexer({bubbleErrors: false}, writable, readable);

		const timeout = setTimeout(done, 25);

		duplex.on('error', _error => {
			clearTimeout(timeout);
			return done(new Error('shouldn\'t bubble error'));
		});

		// Prevent uncaught error exception
		writable.on('error', () => {});

		writable.emit('error', new Error('testing'));
	});

	it('should not bubble errors from the readable stream when bubbleErrors is false', done => {
		const duplex = duplexer({bubbleErrors: false}, writable, readable);

		const timeout = setTimeout(done, 25);

		duplex.on('error', _error => {
			clearTimeout(timeout);
			return done(new Error('shouldn\'t bubble error'));
		});

		// Prevent uncaught error exception
		readable.on('error', () => {});

		readable.emit('error', new Error('testing'));
	});

	it('should export the DuplexWrapper constructor', () => {
		assert.equal(typeof DuplexWrapper, 'function');
	});

	it('should not force flowing-mode', done => {
		const writable = new stream.PassThrough();
		const readable = new stream.PassThrough();

		assert.equal(readable._readableState.flowing, null);

		const duplexStream = duplexer(writable, readable);
		duplexStream.end('aaa');

		assert.equal(readable._readableState.flowing, false);

		const transformStream = new stream.Transform({
			transform(chunk, encoding, cb) {
				this.push(String(chunk).toUpperCase());
				cb();
			},
		});
		writable.pipe(transformStream).pipe(readable);

		assert.equal(readable._readableState.flowing, false);

		setTimeout(() => {
			assert.equal(readable._readableState.flowing, false);

			let source = '';
			duplexStream.on('data', buffer => {
				source += String(buffer);
			});
			duplexStream.on('end', () => {
				assert.equal(source, 'AAA');

				done();
			});

			assert.equal(readable._readableState.flowing, false);
		});
	});
});
