// #########################    FUNCTIONS TO HANDLE ALL IMAGE PROCESSING   ###########################################
// ##
// ## PLEASE NOTE: as of today (20221020) moving this to snackabra.ts in the 0.5 ('typescript') branch
// ##              ... and starting to clean up as a TS set of utils

// TODO - can be optimized (asynchronized more) to return the hashes once calculated
// and then do all the encryption stuff.

import * as utils from "./utils";
import config from "../config";
import { encrypt, getImageKey } from "./crypto";
import { decrypt } from "./utils";
import ImageWorker from './ImageWorker.js';


export async function getStorePromises(sbImage, roomId) {
  const t3 = new Date().getTime();
  const previewStorePromise = storeImage(sbImage.previewImage, sbImage.previewId, sbImage.previewKey, 'p', roomId).then(_x => {
    const t5 = new Date().getTime();
    console.log(`#### previewStorePromise took ${t5 - t3} milliseconds (asynchronous)`);
    return _x;
  });
  const t4 = new Date().getTime();
  const fullStorePromise = storeImage(sbImage.fullImage, sbImage.fullId, sbImage.fullKey, 'f', roomId).then(_x => {
    const t5 = new Date().getTime();
    console.log(`#### fullStorePromise took ${t5 - t4} milliseconds (but asynchronous)`);
    return _x;
  });
  return {
    fullStorePromise: fullStorePromise,
    previewStorePromise: previewStorePromise
  };
}

export function processImage(sbImage) {
  const t0 = new Date().getTime();
  let promisesArray = [
    restrictPhoto(sbImage, 15), // Thumbnail
    restrictPhoto(sbImage, 2048), // Preview 2MB
    restrictPhoto(sbImage, 15360) // Full 15MB
  ]
  // let metadata = {}
  let results;
  return new Promise((resolve) => {
    Promise.all(promisesArray).then(r => {
      console.warn(r)
      results = r;
    }).finally(async () => {
      const previewImage = padImage(await results[1].arrayBuffer());
      const previewHash = await generateImageHash(previewImage);
      const fullImage = padImage(await results[2].arrayBuffer());
      const fullHash = await generateImageHash(fullImage);
      const t1 = new Date().getTime();
      console.warn(`#### image processing total ${t1 - t0} milliseconds (blocking)`);
      resolve({
        url: await getFileData(results[0], 'url'),
        previewImage: previewImage,
        fullImage: fullImage,
        fullId: fullHash.id,
        previewId: previewHash.id,
        fullKey: fullHash.key,
        previewKey: previewHash.key
      })
    })
  })
  // const t0 = new Date().getTime();
  // const url = await getFileData(await restrictPhoto(sbImage, 15), 'url');
  // const t1 = new Date().getTime();
  // console.warn(`#### url took total ${t1 - t0} milliseconds (blocking)`);
  // const t02 = new Date().getTime();
  // const previewImage = padImage(await (await restrictPhoto(sbImage, 2048)).arrayBuffer());
  // const t03 = new Date().getTime();
  // console.warn(`#### previewImage load total ${t03 - t02} milliseconds (blocking)`);
  // const t00 = new Date().getTime();
  // const previewHash = await generateImageHash(previewImage);
  // const t01 = new Date().getTime();
  // console.warn(`#### previewHash took total ${t01 - t00} milliseconds (blocking)`);
  // // only if the file is over 15 MB do we restrict the full file - 15360 here is 15360 KB which is 15 MB
  // console.log(sbImage.image.size)
  // const t2 = new Date().getTime();
  // console.warn(`#### fullImage load took total ${t2 - t1} milliseconds (blocking)`);
  // const fullHash = await generateImageHash(fullImage);
  // const t3 = new Date().getTime();
  // console.warn(`#### fullHash took total ${t3 - t2} milliseconds (blocking)`);
  // // return { full: { id: fullHash.id, key: fullHash.key }, preview: { id: previewHash.id, key: previewHash.key } }
  // return {
  //   url: url,
  //   previewImage: previewImage,
  //   fullImage: fullImage,
  //   fullId: fullHash.id,
  //   previewId: previewHash.id,
  //   fullKey: fullHash.key,
  //   previewKey: previewHash.key
  // };
}


async function uploadImage(storageToken, encrypt_data, type, image_id, data) {
  return await fetch(config.STORAGE_SERVER + "/storeData?type=" + type + "&key=" + encodeURIComponent(image_id),
    {
      method: "POST",
      body: utils.assemblePayload({
        iv: encrypt_data.iv,
        salt: encrypt_data.salt,
        image: data.content,
        storageToken: (new TextEncoder()).encode(storageToken),
        vid: window.crypto.getRandomValues(new Uint8Array(48))
      })
    });
}

export async function storeImage(image, image_id, keyData, type, roomId) {
  try {
    const storeReqResp = await (await fetch(config.STORAGE_SERVER + "/storeRequest?name=" + image_id)).arrayBuffer();
    const encrypt_data = utils.extractPayload(storeReqResp);
    const key = await getImageKey(keyData, encrypt_data.salt);
    let storageToken, verificationToken;
    const data = await encrypt(image, key, "arrayBuffer", encrypt_data.iv);
    const storageTokenReq = await (await fetch(config.ROOM_SERVER + roomId + '/storageRequest?size=' + data.content.byteLength)).json();
    if (storageTokenReq.hasOwnProperty('error')) {
      return { error: storageTokenReq.error }
    }
    storageToken = JSON.stringify(storageTokenReq);

    const resp = await uploadImage(storageToken, encrypt_data, type, image_id, data)
    const status = resp.status;
    const resp_json = await resp.json();

    if (status !== 200) {
      return { error: 'Error: storeImage() failed (' + resp_json.error + ')' };
    }

    verificationToken = resp_json.verification_token;
    return { verificationToken: verificationToken, id: resp_json.image_id, type: type };
  } catch (e) {
    console.error(e)
    return image_id;

  }

}


export async function generateImageHash(image) {
  try {
    const digest = await crypto.subtle.digest('SHA-512', image);
    const _id = digest.slice(0, 32);
    const _key = digest.slice(32);
    return {
      id: encodeURIComponent(utils.arrayBufferToBase64(_id)),
      key: encodeURIComponent(utils.arrayBufferToBase64(_key))
    };
  } catch (e) {
    console.log(e);
    return {};
  }
}

async function downloadImage(control_msg, image_id, cache) {
  const imageFetch = await (await fetch(config.STORAGE_SERVER + "/fetchData?id=" + encodeURIComponent(control_msg.id) + '&verification_token=' + control_msg.verificationToken[0].verificationToken)).arrayBuffer();
  let data = utils.extractPayload(imageFetch);
  document.cacheDb.setItem(`${image_id}_cache`, data)
  return data;
}


export async function retrieveData(message, controlMessages, cache) {
  const imageMetaData = message.imageMetaData;
  const image_id = imageMetaData.previewId;
  const control_msg = controlMessages.find(msg => msg.hasOwnProperty('id') && msg.id.startsWith(image_id));
  if (!control_msg) {
    return { 'error': 'Failed to fetch data - missing control message for that image' };
  }
  const cached = await document.cacheDb.getItem(`${image_id}_cache`);
  let data;
  if (cached === null) {
    data = await downloadImage(control_msg, image_id, cache);
  } else {
    console.log('Loading image data from cache')
    data = cached;
  }
  const iv = data.iv;
  const salt = data.salt;
  const image_key = await getImageKey(imageMetaData.previewKey, salt);
  const encrypted_image = data.image;
  const padded_img = await decrypt(image_key, { content: encrypted_image, iv: iv }, "arrayBuffer");
  const img = unpadData(padded_img.plaintext);
  if (img.error) {
    console.log('(Image error: ' + img.error + ')');
    throw new Error('Failed to fetch data - authentication or formatting error');
  }
  return { 'url': "data:image/jpeg;base64," + utils.arrayBufferToBase64(img) };
}


export async function getFileData(file, outputType) {
  try {
    let reader = new FileReader();
    if (file.size === 0) {
      return null;
    }
    outputType === 'url' ? reader.readAsDataURL(file) : reader.readAsArrayBuffer(file);
    return new Promise((resolve, reject) => {
      reader.onloadend = (event) => {
        let the_blob = reader.result;
        resolve(the_blob);
      };
    });
  } catch (e) {
    console.log(e);
    return null;
  }
}


// refactoring from using raw photo to using SBImage object
// change: imageType, qualityArgument both hardcoded

// helper
// maxSize: target (max) size in KB
// _c: full image on starting point canvas (eg sbImage.canvas)
// _b1: blob version (eg sbImage.blob)
export async function _restrictPhoto(maxSize, _c, _b1) {
  console.warn(maxSize)
  const t2 = new Date().getTime();
  const imageType = "image/jpeg";
  const qualityArgument = 0.92;
  let _size = _b1.size;
  if (_size <= maxSize) {
    console.log(`Starting size ${_size} is fine (below target size ${maxSize}`);
    return _b1;
  }
  console.log(`Starting size ${_size} too large (max is ${maxSize}) bytes.`)
  console.log(`Reduce size by scaling canvas - start size is W ${_c.width} x H ${_c.height}`)
  // compression wasn't enough, so let's resize until we're getting close

  let _old_size;
  let _old_c;

  while (_size > maxSize) {
    _old_c = _c;
    _c = scaleCanvas(_c, .3);
    _b1 = await new Promise((resolve) => {
      _c.toBlob(resolve, imageType, qualityArgument);
    });
    _size = _b1.size;
    _old_size = _size;
    _size = _b1.size;
    // workingDots();
    const t3 = new Date().getTime();
    console.log(`... reduced to W ${_c.width} x H ${_c.height} (to size ${_size}) ... total time ${t3 - t2} milliseconds`);

  }

  // we assume that within this width interval, storage is roughly prop to area,
  // with a little tuning downwards
  let _ratio = (maxSize / _old_size) * 0.95; // overshoot a bit
  let _maxIteration = 3;  // to be safe
  console.log("_old_c is:")
  console.log(_old_c);
  console.log(`... stepping back up to W ${_old_c.width} x H ${_old_c.height} and will then try scale ${_ratio.toFixed(4)}`);
  let _final_c;
  const t4 = new Date().getTime();
  let goodRatio = false
  do {
    _final_c = scaleCanvas(_old_c, Math.sqrt(_ratio) * 0.95); // always overshoot
    _b1 = await new Promise((resolve) => {
      _final_c.toBlob(resolve, imageType, qualityArgument);
      console.log(`(generating blob of requested type ${imageType})`);
    });
    // workingDots();
    console.log(`... fine-tuning to W ${_final_c.width} x H ${_final_c.height} (size ${_b1.size})`);
    _ratio *= (maxSize / _b1.size);
    const t5 = new Date().getTime();
    console.log(`... resulting _ratio is ${_ratio} ... total time here ${t5 - t4} milliseconds`);
    console.log(` ... we're within ${(Math.abs(_b1.size - maxSize) / maxSize)} of cap (${maxSize})`);
    goodRatio = ((Math.abs(_b1.size - maxSize) / maxSize) < .9 && (Math.abs(_b1.size - maxSize) / maxSize) > .8)
  } while ((((_b1.size >= maxSize) || ((Math.abs(_b1.size - maxSize) / maxSize) > 0.10)) && (--_maxIteration > 0)) && !goodRatio);  // we're pretty tolerant here

  return _b1;
}



export async function restrictPhoto(sbImage, maxSize) {
  console.log("################################################################");
  console.log("#################### inside restrictPhoto() ####################");
  console.log("################################################################");
  const t0 = new Date().getTime();
  // imageType default should be 'image/jpeg'
  // qualityArgument should be 0.92 for jpeg and 0.8 for png (MDN default)
  maxSize = maxSize * 1024; // KB
  // let _c = await readPhoto(photo);
  console.log(sbImage)
  let _c = await sbImage.img.then(() => sbImage.canvas);
  console.log("Got sbImage as:");
  console.log(sbImage);
  console.log("And got sbImage.canvas as:");
  console.log(_c);
  const t1 = new Date().getTime();
  console.log(`#### readPhoto took ${t1 - t0} milliseconds`);
  // let _b1 = await new Promise((resolve) => _c.blob.then((b) => resolve(b)));
  let _b1 = await sbImage.blob.then(() => sbImage.blob);
  console.log("got blob");
  console.log(_b1);

  // let _b1 = await new Promise((resolve) => {
  //   _c.toBlob(resolve, imageType, qualityArgument);
  // });
  const t2 = new Date().getTime();
  console.log(`#### getting photo into a blob took ${t2 - t1} milliseconds`);
  // workingDots();

  let _final_b1 = _restrictPhoto(maxSize, _c, _b1);

  // workingDots();
  console.log(`... ok looks like we're good now ... final size is ${_b1.size} (which is ${((_b1.size * 100) / maxSize).toFixed(2)}% of cap)`);
  // document.getElementById('the-original-image').width = _final_c.width;  // a bit of a hack
  const end = new Date().getTime();
  console.log(`#### restrictPhoto() took total ${end - t0} milliseconds`);
  return _final_b1;
}

export function scaleCanvas(canvas, scale) {
  var start = new Date().getTime();
  const scaledCanvas = document.createElement('canvas');
  scaledCanvas.width = canvas.width * scale;
  scaledCanvas.height = canvas.height * scale;
  // console.log(`#### scaledCanvas starting with W ${canvas.width} x H ${canvas.height}`);
  scaledCanvas
    .getContext('2d')
    .drawImage(canvas, 0, 0, scaledCanvas.width, scaledCanvas.height);
  // console.log(`#### scaledCanvas actual W ${scaledCanvas.width} x H ${scaledCanvas.height}`);
  var end = new Date().getTime();
  // console.log(`#### scaleCanvas() took ${end - start} milliseconds`);
  console.log(`#### scaledCanvas scale ${scale} to target W ${scaledCanvas.width} x H ${scaledCanvas.height} took ${end - start} milliseconds`);
  return scaledCanvas;
}


export function padImage(image_buffer) {
  let _sizes = [128, 256, 512, 1024, 2048, 4096];   // in KB
  _sizes = _sizes.map((size) => size * 1024);
  const image_size = image_buffer.byteLength;
  // console.log('BEFORE PADDING: ', image_size)
  let _target;
  if (image_size < _sizes[_sizes.length - 1]) {
    for (let i = 0; i < _sizes.length; i++) {
      if (image_size + 21 < _sizes[i]) {
        _target = _sizes[i];
        break;
      }
    }
  } else {
    _target = (Math.ceil(image_size / (1024 * 1024))) * 1024 * 1024;
    if (image_size + 21 >= _target) {
      _target += 1024;
    }
  }
  let _padding_array = [128];
  _target = _target - image_size - 21;
  // We will finally convert to Uint32Array where each element is 4 bytes
  // So we need (_target/4) - 6 array elements with value 0 (128 bits or 16 bytes or 4 elements to be left empty,
  // last 4 bytes or 1 element to represent the size and 1st element is 128 or 0x80)
  for (let i = 0; i < _target; i++) {
    _padding_array.push(0);
  }
  // _padding_array.push(image_size);
  const _padding = new Uint8Array(_padding_array).buffer;
  // console.log('Padding size: ', _padding.byteLength)
  let final_data = utils._appendBuffer(image_buffer, _padding);
  final_data = utils._appendBuffer(final_data, new Uint32Array([image_size]).buffer);
  // console.log('AFTER PADDING: ', final_data.byteLength)
  return final_data;
}

export function unpadData(data_buffer) {
  const _size = new Uint32Array(data_buffer.slice(-4))[0];
  return data_buffer.slice(0, _size);
}

let script_02 =
  `data:text/javascript,
    function fileToAB(file) {
      file.arrayBuffer().then((a) => postMessage(a, [a]));
    }
    onmessage = function(event){
        fileToAB(event.data);
    };
    `;

// code by Thomas Lochmatter, thomas.lochmatter@viereck.ch
// Returns an object with the width and height of the JPEG image
// stored in bytes, or null if the bytes do not represent a JPEG
// image.
function readJpegHeader(bytes) {
  // JPEG magick
  if (bytes[0] != 0xff) return;
  if (bytes[1] != 0xd8) return;
  // Go through all markers
  var pos = 2;
  var dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  while (pos + 4 < bytes.byteLength) {
    // Scan for the next start marker (if the image is corrupt, this marker may not be where it is expected)
    if (bytes[pos] != 0xff) {
      pos += 1;
      continue;
    }
    var type = bytes[pos + 1];
    // Short marker
    pos += 2;
    if (bytes[pos] == 0xff) continue;
    // SOFn marker
    var length = dv.getUint16(pos);
    if (pos + length > bytes.byteLength) return;
    if (length >= 7 && (type == 0xc0 || type == 0xc2)) {
      var data = {};
      data.progressive = type == 0xc2;
      data.bitDepth = bytes[pos + 2];
      data.height = dv.getUint16(pos + 3);
      data.width = dv.getUint16(pos + 5);
      data.components = bytes[pos + 7];
      return data;
    }
    // Other marker
    pos += length;
  }
  return;
}

export class SBImage {
  constructor(image) {
    this.image = image; // file

    var resolveAspectRatio;

    this.aspectRatio = new Promise((resolve) => {
      // block on getting width and height...
      resolveAspectRatio = resolve;
    });

    // Fetch the original image
    console.log("Fetching file:");
    console.log(image);
    this.imgURL = new Promise((resolve) => {
      new Promise(() => {
        const _self = this;
        const reader = image.stream().getReader();
        return new ReadableStream({
          start(controller) {
            var foundSize = false;
            return pump();
            function pump() {
              return reader.read().then(({ done, value }) => {
                // When no more data needs to be consumed, close the stream
                if (done) {
                  controller.close();
                  return;
                }
                // console.log("Got a chunk!");
                // console.log(value);
                // pull out size
                if (!foundSize) {
                  foundSize = true;
                  // console.log("$$$$$$$ found first chunk")
                  const h = readJpegHeader(value);
                  // _self.width = value[165] * 256 + value[166];
                  // _self.height = value[163] * 256 + value[164];
                  // var width = value[165] * 256 + value[166];
                  // var height = value[163] * 256 + value[164];

                  if (h) {
                    console.log("^^^^^^^^^^^^^^^^", h);
                    _self.width = h.width;
                    _self.height = h.height;
                    console.log(`got the size of the image!!  ${_self.width} x ${_self.height}`);
                    resolveAspectRatio(_self.width / _self.height);
                  } else {
                    console.log("PROBLEM ***** ... could not parse jpeg header");
                  }
                }
                // Enqueue the next data chunk into our target stream
                controller.enqueue(value);
                return pump();
              });
            }
          }
        })
      })
        // Create a new response out of the stream
        .then((stream) => {
          console.log('stream', stream)
          new Response(stream)
        })

        // Create an object URL for the response
        .then((response) => response.blob())
        .then((blob) => URL.createObjectURL(blob))
        // Update image
        .then((url) => {
          console.log("Finished getting 'url':");
          console.log(url);
          resolve(url);
        })
        .catch((err) => console.error(err));
    })

    this.img = new Promise((resolve) => {
      const reader = new FileReader();
      const img = document.createElement('img');
      reader.onload = (e) => {
        img.src = e.target.result;
        resolve(img);
      }
      reader.readAsDataURL(this.image);
    });

    // this.canvas = new Promise((resolve) => {
    //   this.img.then((img) => {
    // 	const canvas = document.createElement('canvas'); 
    // 	canvas.width = img.width;
    // 	canvas.height = img.height;
    // 	canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
    // 	console.log("resolved canvas object:");
    // 	console.log(canvas);
    // 	resolve(canvas);
    //   });
    // });

    // create a canvas and then wait for the correct size
    this.canvas = new Promise((resolve) => {
      this.aspectRatio.then((r) => {
        const canvas = document.createElement('canvas');
        canvas.width = this.width;
        canvas.height = this.height;
        this.img.then((img) =>
          canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height));
        // this will return right away with correctly-sized canvas
        resolve(canvas);
      });
    });



    // this.blob = new Promise((resolve) => {
    //   const imageType = "image/jpeg";
    //   const qualityArgument = 0.92;
    //   this.canvas.then((canvas) => canvas.toBlob(resolve, imageType, qualityArgument));
    // });

    this.blob = new Promise((resolve) => {
      // spin up worker
      let worker = new Worker(script_02);
      worker.onmessage = (event) => {
        console.log("Got blob from worker:");
        console.log(event.data);
        resolve(new Blob([event.data])); // convert arraybuffer to blob
      }
      worker.postMessage(image);
    });

    // this requests some worker to load the file into a sharedarraybuffer
    this.imageSAB = doImageTask(['loadSB', image], false);

    // // simple worker template
    // this.w = new Promise((resolve) => {
    //   // spin up worker
    //   let worker = new Worker(script_01);
    //   worker.onmessage = (event) => {
    // 	console.log(`Got result from worker: ${event.data}`);
    // 	resolve(event.data);
    //   }
    //   worker.postMessage(42); // kick it off
    // });

    // this.canvas = new Promise((resolve) => {
    //   const canvas = document.createElement('canvas');
    //   this.img.then((img) => {
    // 	canvas.width = img.width;
    // 	canvas.height = img.height;
    // 	canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
    // 	resolve(canvas);
    //   });
    // });

  }


  processImage() {
    return processImage(this)
  }

  loadToCanvas(canvas) {
    return new Promise((resolve) => {
      this.aspectRatio.then((r) => {
        console.log("~~~~~~~~~~~~~~~~ got WxH", this.width, this.height);
        canvas.width = this.width;
        canvas.height = this.height;
        this.imageSAB.then((imageSAB) => {
          if (OffscreenCanvas) {
            console.log("%%%%%%%%%%%%%%%% we are here");
            console.log(imageSAB);
            // const canvas = document.createElement('canvas'); // test to give it from caller
            // var ctx = canvas.getContext('2d');
            // var imageData = ctx.createImageData(400, 400);
            const offscreen = canvas.transferControlToOffscreen();
            // const ctx = offscreen.getContext('2d');
            // doImageTask(['testCanvas', imageData.data.buffer], [imageData.data.buffer]).then((m) => console.log(m));
            doImageTask(['testCanvas', offscreen, imageSAB], [offscreen]).then((m) => {
              console.log("**************** Returned message:", m);
              console.log("**************** offscreen:", canvas);
              console.log("**************** offscreen:", offscreen);
              resolve(canvas);
            });
          } else {
            console.log("**************** THIS feature only works with OffscreenCanvas");
            console.log("                 (TODO: make the code work as promise as fallback");
          }
        });
      });
    });
  }

}


// we need this so it can be packaged
export class BlobWorker extends Worker {
  constructor(worker, i) {
    const code = worker.toString();
    const blob = new Blob([`(${code})(${i})`]);
    return new Worker(URL.createObjectURL(blob));
  }
}

let image_workers = [];
let next_worker = 0;
let max_workers = window.navigator.hardwareConcurrency;

console.log(`setting up ${max_workers} image helper workers`);

// const IW_code = _restrictPhoto.toString();
// const IW_blob = new Blob([`${IW_code}`]);
// const IW_url = URL.createObjectURL(IW_blob);
// console.log("%%%%%%%%%%%%%%%% IW_code:", IW_code);

for (let i = 0; i < max_workers; i++) {
  let newWorker = {
    worker: new BlobWorker(ImageWorker, i),
    i: i, // index/number of worker
    broken: false // tracks if there's a problem
  };
  image_workers.push(newWorker);
}

function doImageTask(vars, transfer) {
  console.log("doImageTask() - vars are:");
  console.log(vars);
  var i = next_worker;
  next_worker = (next_worker + 1) % max_workers;
  var instance = image_workers[i].worker;
  return new Promise(function (resolve, reject) {
    // we pick one, rotating
    console.log(`Passing ${vars} on to ${next_worker}`);
    instance.onmessage = function (m) {
      console.log(`[${i}] finished finished ... returning with:`);
      console.log(m);
      resolve(m.data);
    }
    try {
      if (transfer) {
        instance.postMessage(vars, transfer);
      } else {
        instance.postMessage(vars);
      }
    } catch (error) {
      console.error(`Failed to send task to worker ${i}`);
      console.error(error);
      reject("failed");
    }
  });
}




// export function indexFile(ab) {
//   // first file it sees is done "locally"
//   if (!window.g_t_ndx) {
//     window.g_t_ndx = {}; // otherwise race condition
//     return new Promise(function (resolve, reject) {
//       var p = (new Blob([ab])).text();
//       p.then((s) => {
//         console.log("indexFile() - got the string (file)");
//         // console.log(s.slice(0, 200) + "...");
//         var t = s.match(/([^.!?]+[.!?]+)|([^.!?]+$)/g);
//         window.g_t = t;
//         console.log("array should be in g_t ... ");
//         var index = new Index();
//         t.forEach((item, i) => index.add(i, item));
//         window.g_t_ndx = index;
//         console.log("index should be in window.g_t_ndx");
//         resolve(index); // TODO - this needs to be same blob format as from web worker
//       });
//     });
//   } else {
//     // do first so there's no race condition
//     var i = next_worker;
//     next_worker = (next_worker + 1) % max_workers;
//     var instance = search_workers[i].worker;
//     return new Promise(function (resolve, reject) {
//       // we pick one, rotating
//       // var instance = new BlobWorker(IndexWorker);
//       if (ab.byteLength > 0) {
// 	console.log(`got a blob of size ${ab.byteLength} sending to worker ${next_worker}`);
// 	instance.onmessage = function(m) {
// 	  console.log(`[${i}] finished indexing ... returning buffer`);
// 	  // console.log(m);
// 	  resolve(m);
// 	}
// 	try {
// 	  instance.postMessage(ab, [ab]);
// 	} catch {
// 	  console.error(`Failed to send task to worker ${i}`);
// 	  reject("failed");
// 	}
//       } else {
// 	reject(`[${i}] did not get anything to work with`);
//       }
//     });
//   }
// }